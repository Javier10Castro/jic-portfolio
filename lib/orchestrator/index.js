const crypto = require('crypto');
const path = require('path');
const nodeCwd = () => require('process').cwd();
const compiler = require('../compiler');
const plan = require('../plan');
const scaffold = require('../scaffold');
const decision = require('../decision');
const deployment = require('../deployment');

const PIPELINES = {
  raw_email:          ['compiler', 'plan', 'scaffold'],
  structured_prompt:  ['plan', 'scaffold'],
  json_brief:         ['scaffold'],
  existing_project:   [],
};

function sessionId() {
  return crypto.randomBytes(4).toString('hex');
}

function detectType(input) {
  if (!input || typeof input === 'object') return 'json_brief';

  const s = input.trim();

  if (s.startsWith('{') || s.startsWith('[')) return 'json_brief';

  const hasEmailHeaders = /^(Subject|From|To|Date):\s/m.test(s);
  if (hasEmailHeaders || s.length > 5000) return 'raw_email';

  if (/^##\s+\d+\.\s+\w+/m.test(s)) return 'structured_prompt';

  return 'raw_email';
}

function buildPipeline(inputType) {
  return PIPELINES[inputType] || [];
}

function extractProjectName(input) {
  if (typeof input === 'object' && input) return input.project_name || input.name || 'untitled-project';
  const m = input.match(/(?:^|\n)##\s+\d+\.\s*BUSINESS IDENTITY[\s\S]*?\*\*name\*{0,2}:\*\*\s*(.+)/im)
          || input.match(/(?:^|\n)name:\s*(.+)/im)
          || input.match(/project(?:\s*name)?[:\s]+(.+)/im);
  return m ? m[1].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'untitled-project';
}

function extractProjectType(input) {
  if (typeof input === 'object' && input) return input.project_type || 'website';
  return 'website';
}

function runStep(stepName, context) {
  const { input, outputDir, ir } = context;
  let result;

  switch (stepName) {
    case 'compiler':
      result = compiler.compile(input);
      context.compiled = result;
      break;

    case 'plan': {
      const source = context.compiled ? JSON.stringify(context.compiled) : input;
      result = plan.compile(source);
      context.ir = result;
      break;
    }

    case 'scaffold': {
      const name = extractProjectName(input);
      const type = extractProjectType(input);
      const prompt = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
      result = scaffold.scaffold({
        project_name: name,
        project_type: type,
        prompt_maestro_final: prompt,
      });
      context.projectPath = result.path;
      break;
    }

    default:
      result = { skipped: true, reason: `Unknown step: ${stepName}` };
  }

  return result;
}

function runDeployment(context, opts) {
  const projectPath = context.projectPath;
  if (!projectPath) return { skipped: true, reason: 'No project path to deploy' };
  if (opts.deploy === false) return { skipped: true, reason: 'Deployment disabled by option' };

  const name = extractProjectName(context.input);
  return deployment.deployFullPipeline(projectPath, {
    project_name: name,
    engine_version: 'v1.3.0',
  });
}

function process(opts) {
  const { input, type, projectName, projectType, deploy, outputDir } = opts || {};

  if (!input) throw new Error('input is required');

  const inputType = type || detectType(input);
  const pipeline = buildPipeline(inputType);
  const sid = sessionId();

  const context = {
    input,
    outputDir: outputDir || nodeCwd(),
    projectName: projectName || extractProjectName(input),
    projectType: projectType || extractProjectType(input),
    inputType,
    steps: [],
    errors: [],
    compiled: null,
    ir: null,
    projectPath: null,
  };

  for (const stepName of pipeline) {
    const entry = { name: stepName, status: 'pending', result: null };
    try {
      const result = runStep(stepName, context);
      entry.status = 'completed';
      entry.result = result;
    } catch (err) {
      entry.status = 'failed';
      entry.error = err.message || String(err);
      context.errors.push(`[${stepName}] ${entry.error}`);

      try {
        decision.registerDecision({
          id: `orchestrator-${sid}-${stepName}`,
          title: `Orchestrator: ${stepName} failed`,
          reason: err.message || 'Unknown error',
          impact: 'medium',
          modules_affected: [`lib/orchestrator/index.js`, `lib/${stepName}/index.js`],
          version: 'v1.3.0',
        });
      } catch (_) {}
    }
    context.steps.push(entry);
  }

  const hasErrors = context.errors.length > 0;

  if (inputType === 'existing_project' || deploy !== false) {
    if (context.projectPath || inputType === 'existing_project') {
      const depEntry = { name: 'deployment', status: 'pending', result: null };
      try {
        const depResult = runDeployment(context, { deploy });
        depEntry.status = depResult.skipped ? 'skipped' : (depResult.success ? 'completed' : 'failed');
        depEntry.result = depResult;
        if (!depResult.success && !depResult.skipped) {
          context.errors.push(`[deployment] ${depResult.error || 'Failed'}`);
        }
      } catch (err) {
        depEntry.status = 'failed';
        depEntry.error = err.message || String(err);
        context.errors.push(`[deployment] ${depEntry.error}`);
      }
      context.steps.push(depEntry);
    }
  }

  const failedSteps = context.steps.filter(s => s.status === 'failed');
  const skippedSteps = context.steps.filter(s => s.status === 'skipped');
  const completedSteps = context.steps.filter(s => s.status === 'completed');

  let finalStatus;
  if (failedSteps.length > 0 && completedSteps.length === 0) {
    finalStatus = 'failed';
  } else if (failedSteps.length > 0) {
    finalStatus = 'partial';
  } else {
    finalStatus = 'completed';
  }

  return {
    session_id: sid,
    input_type: inputType,
    status: finalStatus,
    pipeline,
    steps: context.steps,
    errors: context.errors,
    output: {
      project_path: context.projectPath,
      ir: context.ir,
      compiled: context.compiled,
    },
  };
}

module.exports = { process, detectType, buildPipeline };
