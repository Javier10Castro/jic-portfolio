const crypto = require('crypto');
require('./bootstrap')();
const { query } = require('../db');
const plan = require('../plan');
const ds = require('../design-system');
const preview = require('../preview');
const scaffold = require('../scaffold');
const decision = require('../decision');
const events = require('../events');
const { makeError, assertRequired, assertString, assertUUID } = require('./validators');

const RETRY_LIMIT = 3;
const STEP_TIMEOUT_MS = 120000;

const STATE_MACHINE = {
  draft: ['processing', 'cancelled'],
  processing: ['preview', 'failed'],
  preview: ['approved', 'failed', 'draft'],
  approved: ['deploying', 'failed'],
  deploying: ['deployed', 'failed'],
  deployed: ['deploying'],
  failed: ['draft', 'processing'],
  cancelled: ['draft'],
};

function uuid() { return crypto.randomUUID(); }

function shortId() { return crypto.randomBytes(8).toString('hex'); }

function validTransition(from, to) {
  return STATE_MACHINE[from] && STATE_MACHINE[from].includes(to);
}

async function updateProjectStatus(projectId, status, error) {
  const sql = `UPDATE projects SET status = $1, updated_at = NOW()${error ? ', metadata = jsonb_set(COALESCE(metadata,\'{}\'),\'{last_error}\',to_jsonb($2::text))' : ''} WHERE id = $1 RETURNING id, status, updated_at`;
  if (error) {
    await query(`UPDATE projects SET status = $1, metadata = jsonb_set(COALESCE(metadata,'{}'),'{last_error}',to_jsonb($2::text)), updated_at = NOW() WHERE id = $3`, [status, error, projectId]);
  } else {
    await query(`UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2`, [status, projectId]);
  }
}

async function logState(projectId, fromStatus, toStatus, metadata) {
  const sql = `INSERT INTO project_states (id, project_id, from_status, to_status, metadata, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`;
  await query(sql, [uuid(), projectId, fromStatus, toStatus, JSON.stringify(metadata || {})]);
}

async function transition(projectId, fromStatus, toStatus, metadata) {
  if (!validTransition(fromStatus, toStatus)) {
    throw new Error(`Invalid state transition: ${fromStatus} → ${toStatus}`);
  }
  await updateProjectStatus(projectId, toStatus);
  await logState(projectId, fromStatus, toStatus, metadata);
}

function extractBrandingColors(formData) {
  if (!formData) return null;
  if (formData.branding_colors) {
    try {
      const bc = typeof formData.branding_colors === 'string' ? JSON.parse(formData.branding_colors) : formData.branding_colors;
      if (bc && bc.primary) return bc;
    } catch {}
  }
  if (formData.brand_colores) {
    const hex = formData.brand_colores.match(/#[0-9a-fA-F]{6}/g);
    if (hex && hex.length) {
      return { primary: hex[0], secondary: hex[1] || null, accent: hex[2] || null, palette: hex.slice(1) };
    }
  }
  return null;
}

function extractFormDataForProject(formData) {
  const entries = [];
  if (!formData || typeof formData !== 'object') return entries;
  for (const [key, value] of Object.entries(formData)) {
    if (value === null || value === undefined || value === '') continue;
    const sec = detectSection(key);
    const val = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value);
    entries.push({ field_key: key, section: sec, value: val });
  }
  return entries;
}

function detectSection(fieldKey) {
  const map = { biz: 'business', obj: 'goals', comp: 'competition', pub: 'audience', brand: 'branding', arq: 'site', cont: 'content', serv: 'services', social: 'social_proof', func: 'functionality', seo: 'seo', ref: 'references', conv: 'conversion', ai: 'essence' };
  for (const [prefix, section] of Object.entries(map)) {
    if (fieldKey.startsWith(prefix + '_') || fieldKey === prefix) return section;
  }
  return 'other';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function retry(fn, label, limit) {
  for (let attempt = 1; attempt <= limit; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${STEP_TIMEOUT_MS}ms`)), STEP_TIMEOUT_MS)),
      ]);
      return { success: true, result, attempts: attempt };
    } catch (err) {
      if (attempt === limit) return { success: false, error: err.message, attempts: attempt };
      await sleep(Math.min(1000 * Math.pow(2, attempt - 1), 8000));
    }
  }
  return { success: false, error: 'Max retries exceeded', attempts: limit };
}

async function updateExecutionStep(executionId, stepIndex, stepData) {
  const sql = `UPDATE executions SET steps = jsonb_set(COALESCE(steps,'[]'::jsonb), ARRAY[$1::text], $2::jsonb) WHERE id = $3`;
  await query(sql, [String(stepIndex), JSON.stringify(stepData), executionId]);
}

async function pushExecutionError(executionId, errorEntry) {
  const sql = `UPDATE executions SET errors = COALESCE(errors,'[]'::jsonb) || $1::jsonb, status = 'failed', completed_at = NOW() WHERE id = $2`;
  await query(sql, [JSON.stringify([errorEntry]), executionId]);
}

async function finalizeExecution(executionId, status) {
  const sql = `UPDATE executions SET status = $1, completed_at = NOW() WHERE id = $2`;
  await query(sql, [status, executionId]);
}

async function createExecution(projectId, formData, inputType) {
  const id = uuid();
  const sid = shortId();
  const sql = `INSERT INTO executions (id, project_id, session_id, input_type, pipeline, status, steps, errors, triggered_by, started_at) VALUES ($1,$2,$3,$4,$5,'processing','[]'::jsonb,'[]'::jsonb,NULL,NOW()) RETURNING id`;
  await query(sql, [id, projectId, sid, inputType || 'json_brief', ['plan', 'design_system', 'preview', 'scoring', 'scaffold']]);
  return { id, session_id: sid };
}

async function createPreviewRecord(projectId, executionId, version, htmlContent, cssContent, dsSnapshot, irSnapshot) {
  const id = uuid();
  const sql = `INSERT INTO previews (id, project_id, version, html_content, css_content, design_system_snapshot, plan_ir_snapshot, is_current, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW()) RETURNING id`;
  await query(sql, [id, projectId, version, htmlContent, cssContent, JSON.stringify(dsSnapshot), JSON.stringify(irSnapshot)]);
  await query(`UPDATE previews SET is_current = FALSE WHERE project_id = $1 AND id != $2`, [projectId, id]);
  return id;
}

async function createDecisionRecord(projectId, executionId, score, metrics, warnings, passed, feedback) {
  const id = uuid();
  const sql = `INSERT INTO decisions (id, project_id, execution_id, decision_type, score, metrics, warnings, passed, feedback, created_at) VALUES ($1,$2,$3,'scoring',$4,$5,$6,$7,$8,NOW()) RETURNING id`;
  await query(sql, [id, projectId, executionId, score, JSON.stringify(metrics), JSON.stringify(warnings), passed, feedback || null]);
  return id;
}

async function saveProjectIR(projectId, planIr, designSystem) {
  await query(`UPDATE projects SET plan_ir = $1::jsonb, design_system = $2::jsonb, updated_at = NOW() WHERE id = $3`, [JSON.stringify(planIr), JSON.stringify(designSystem), projectId]);
}

async function setProjectPreview(projectId, previewId) {
  await query(`UPDATE projects SET current_preview_id = $1, updated_at = NOW() WHERE id = $2`, [previewId, projectId]);
}

async function createProjectRow(workspaceId, userId, name, slug, formData) {
  const id = uuid();
  const now = new Date().toISOString();
  const irData = extractFormDataForProject(formData);
  const sql = `INSERT INTO projects (id, workspace_id, created_by, name, slug, status, project_type, version, metadata, prompt_maestro, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'draft','website',1,$6,$7,$8,$8) RETURNING id, created_at`;
  const meta = JSON.stringify({ form_fields_count: irData.length, source: 'api_v1_create' });
  await query(sql, [id, workspaceId, userId, name, slug, meta, formData ? JSON.stringify(formData) : null, now]);
  if (irData.length) {
    for (const entry of irData) {
      await query(`INSERT INTO project_inputs (id, project_id, section, field_key, value) VALUES ($1,$2,$3,$4,$5)`, [uuid(), id, entry.section, entry.field_key, entry.value]);
    }
  }
  return { id, slug, created_at: now };
}

async function getProjectById(projectId, workspaceId) {
  const sql = `SELECT p.id, p.workspace_id, p.created_by, p.name, p.slug, p.description, p.status, p.project_type, p.version, p.current_preview_id, p.live_url, p.preview_url, p.github_repo, p.custom_domain, p.design_system, p.plan_ir, p.prompt_maestro, p.metadata, p.feedback, p.generated_at, p.deployed_at, p.created_at, p.updated_at, u.name as created_by_name, u.email as created_by_email FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE p.id = $1 AND p.workspace_id = $2`;
  const r = await query(sql, [projectId, workspaceId]);
  return r.rows[0] || null;
}

async function listWorkspaceProjects(workspaceId, limit, offset) {
  const sql = `SELECT id, name, slug, status, project_type, version, live_url, preview_url, created_at, updated_at, generated_at, deployed_at FROM projects WHERE workspace_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`;
  const r = await query(sql, [workspaceId, limit || 50, offset || 0]);
  return r.rows;
}

async function getProjectInputs(projectId) {
  const r = await query(`SELECT section, field_key, value FROM project_inputs WHERE project_id = $1 ORDER BY id`, [projectId]);
  return r.rows;
}

async function getExecutionById(executionId, workspaceId) {
  const sql = `SELECT e.id, e.project_id, e.session_id, e.input_type, e.pipeline, e.status, e.steps, e.errors, e.duration_ms, e.started_at, e.completed_at, p.workspace_id FROM executions e JOIN projects p ON p.id = e.project_id WHERE e.id = $1 AND p.workspace_id = $2`;
  const r = await query(sql, [executionId, workspaceId]);
  return r.rows[0] || null;
}

async function getProjectPreviews(projectId, workspaceId) {
  const sql = `SELECT pr.id, pr.version, pr.decision_score, pr.is_approved, pr.is_current, pr.created_at FROM previews pr JOIN projects p ON p.id = pr.project_id WHERE pr.project_id = $1 AND p.workspace_id = $2 ORDER BY pr.version DESC`;
  const r = await query(sql, [projectId, workspaceId]);
  return r.rows;
}

async function getPreviewById(previewId, workspaceId) {
  const sql = `SELECT pr.id, pr.project_id, pr.version, pr.html_content, pr.css_content, pr.design_system_snapshot, pr.plan_ir_snapshot, pr.decision_score, pr.is_approved, pr.is_current, pr.created_at FROM previews pr JOIN projects p ON p.id = pr.project_id WHERE pr.id = $1 AND p.workspace_id = $2`;
  const r = await query(sql, [previewId, workspaceId]);
  return r.rows[0] || null;
}

async function getDecisionsForProject(projectId, workspaceId) {
  const sql = `SELECT d.id, d.execution_id, d.decision_type, d.score, d.metrics, d.warnings, d.passed, d.feedback, d.created_at FROM decisions d JOIN projects p ON p.id = d.project_id WHERE d.project_id = $1 AND p.workspace_id = $2 ORDER BY d.created_at DESC`;
  const r = await query(sql, [projectId, workspaceId]);
  return r.rows;
}

async function getProjectStates(projectId, workspaceId) {
  const sql = `SELECT s.id, s.from_status, s.to_status, s.metadata, s.created_at FROM project_states s JOIN projects p ON p.id = s.project_id WHERE s.project_id = $1 AND p.workspace_id = $2 ORDER BY s.created_at DESC`;
  const r = await query(sql, [projectId, workspaceId]);
  return r.rows;
}

async function emitEvent(event, projectId, workspaceId, executionId, extra) {
  try { await events.emit(event, { project_id: projectId, workspace_id: workspaceId, execution_id: executionId, ...extra }); } catch {}
}

async function createProject(workspaceId, userId, name, formData) {
  assertUUID(workspaceId, 'workspace_id');
  assertUUID(userId, 'user_id');
  assertString(name, 'name');
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `project-${shortId()}`;
  const project = await createProjectRow(workspaceId, userId, name, slug, formData);
  await logState(project.id, null, 'draft', { triggered_by: 'create' });
  await emitEvent('project.created', project.id, workspaceId, null, { name, slug, created_by: userId });
  return project;
}

async function runPipeline(projectId, workspaceId, executionId, formData, inputType) {
  assertUUID(projectId, 'project_id');
  assertUUID(workspaceId, 'workspace_id');
  assertUUID(executionId, 'execution_id');
  const project = await getProjectById(projectId, workspaceId);
  if (!project) throw makeError('NOT_FOUND', 'Project not found', 'project_id');
  if (project.status === 'processing') throw makeError('CONFLICT', 'Project is already processing', 'status');

  const promptText = formData ? JSON.stringify(formData) : project.prompt_maestro || '{}';

  await transition(projectId, project.status, 'processing', { triggered_by: 'pipeline', execution_id: executionId });
  await finalizeExecution(executionId, 'processing');
  await emitEvent('pipeline.started', projectId, workspaceId, executionId, { input_type: inputType || 'json_brief' });

  const stepResults = {};

  try {
    await updateExecutionStep(executionId, 0, { name: 'plan', status: 'running' });
    const planResult = await retry(() => {
      const ir = plan.compile(promptText);
      return ir;
    }, 'plan', RETRY_LIMIT);
    if (!planResult.success) throw new Error(`Plan Engine: ${planResult.error}`);
    stepResults.plan = planResult.result;
    await updateExecutionStep(executionId, 0, { name: 'plan', status: 'completed', result_summary: `Identified ${Object.keys(planResult.result.project || {}).length} categories` });
    await emitEvent('plan.completed', projectId, workspaceId, executionId, { categories: Object.keys(planResult.result.project || {}).length, ir: planResult.result });
  } catch (err) {
    await failPipeline(projectId, executionId, 'plan', err);
    await emitEvent('pipeline.failed', projectId, workspaceId, executionId, { step: 'plan', error: err.message });
    throw err;
  }

  try {
    await updateExecutionStep(executionId, 1, { name: 'design_system', status: 'running' });
    const brandingColors = extractBrandingColors(formData);
    const dsResult = await retry(() => {
      return ds.buildDesignSystem(brandingColors || { primary: null, secondary: null, accent: null, palette: [] });
    }, 'design_system', RETRY_LIMIT);
    if (!dsResult.success) throw new Error(`Design System: ${dsResult.error}`);
    stepResults.design_system = dsResult.result;
    await saveProjectIR(projectId, stepResults.plan, dsResult.result);
    await updateExecutionStep(executionId, 1, { name: 'design_system', status: 'completed', result_summary: `Theme: ${dsResult.result.mapping.theme}, palette: ${dsResult.result.colors.palette.length} colors` });
    await emitEvent('design.completed', projectId, workspaceId, executionId, { theme: dsResult.result.mapping.theme, palette_size: dsResult.result.colors.palette.length, design_system: dsResult.result });
  } catch (err) {
    await failPipeline(projectId, executionId, 'design_system', err);
    await emitEvent('pipeline.failed', projectId, workspaceId, executionId, { step: 'design_system', error: err.message });
    throw err;
  }

  let previewId = null;
  try {
    await updateExecutionStep(executionId, 2, { name: 'preview', status: 'running' });
    const planIr = stepResults.plan;
    const dsTokens = stepResults.design_system;
    const previewResult = await retry(() => {
      return preview.generatePreview(planIr, dsTokens);
    }, 'preview', RETRY_LIMIT);
    if (!previewResult.success) throw new Error(`Preview Engine: ${previewResult.error}`);
    stepResults.preview = previewResult.result;
    const projectVersion = project.version || 1;
    previewId = await createPreviewRecord(
      projectId, executionId, projectVersion,
      previewResult.result.htmlPreview,
      previewResult.result.cssPreview,
      dsTokens,
      planIr
    );
    await setProjectPreview(projectId, previewId);
    await updateExecutionStep(executionId, 2, { name: 'preview', status: 'completed', result_summary: `${previewResult.result.layout.sections.length} sections, ${previewResult.result.warnings.length} warnings` });
    await emitEvent('preview.generated', projectId, workspaceId, executionId, { preview_id: previewId, sections: previewResult.result.layout.sections.length, warnings_count: previewResult.result.warnings.length, warnings: previewResult.result.warnings });
  } catch (err) {
    await failPipeline(projectId, executionId, 'preview', err);
    await emitEvent('pipeline.failed', projectId, workspaceId, executionId, { step: 'preview', error: err.message });
    throw err;
  }

  try {
    await updateExecutionStep(executionId, 3, { name: 'scoring', status: 'running' });
    const warnings = stepResults.preview.warnings || [];
    const metrics = {
      contrast: { score: evaluateContrast(stepResults.design_system), weight: 0.25 },
      ux: { score: evaluateUX(stepResults.plan, stepResults.preview), weight: 0.25 },
      conversion: { score: evaluateConversion(stepResults.plan), weight: 0.20 },
      clarity: { score: evaluateClarity(stepResults.plan), weight: 0.15 },
      seo: { score: evaluateSEO(stepResults.plan), weight: 0.15 },
    };
    let totalScore = 0;
    for (const m of Object.values(metrics)) totalScore += m.score * m.weight;
    totalScore = Math.round(totalScore * 100) / 100;
    const passed = totalScore >= 50;
    const highWarnings = warnings.filter(w => w.severity === 'high');
    if (highWarnings.length) totalScore = Math.max(0, totalScore - highWarnings.length * 10);

    const feedback = `Score: ${totalScore}/100. ${metrics.contrast.score >= 70 ? 'Contrast: OK' : 'Low contrast detected'}. UX: ${metrics.ux.score >= 70 ? 'OK' : 'Needs improvement'}. Conversion: ${metrics.conversion.score >= 70 ? 'OK' : 'Weak CTAs'}.`;
    const decisionId = await createDecisionRecord(projectId, executionId, totalScore, metrics, warnings, passed, feedback);
    await updateExecutionStep(executionId, 3, { name: 'scoring', status: 'completed', result_summary: `Score: ${totalScore}/100, passed: ${passed}, warnings: ${warnings.length}` });
    stepResults.decision = { id: decisionId, score: totalScore, metrics, warnings, passed, feedback };
    await emitEvent('scoring.completed', projectId, workspaceId, executionId, { score: totalScore, passed, metrics, warnings_count: warnings.length, decision_id: decisionId, preview_id: previewId });

    if (passed) {
      await transition(projectId, 'processing', 'preview', { triggered_by: 'pipeline', score: totalScore, execution_id: executionId });
    } else {
      await transition(projectId, 'processing', 'preview', { triggered_by: 'pipeline', score: totalScore, auto_reject: true, execution_id: executionId });
      await finalizeExecution(executionId, 'completed');
      return { status: 'preview', score: totalScore, passed: false, execution_id: executionId, preview_id: previewId, feedback };
    }
  } catch (err) {
    await failPipeline(projectId, executionId, 'scoring', err);
    await emitEvent('pipeline.failed', projectId, workspaceId, executionId, { step: 'scoring', error: err.message });
    throw err;
  }

  await finalizeExecution(executionId, 'completed');
  return { status: 'preview', score: stepResults.decision.score, passed: true, execution_id: executionId, preview_id: previewId, steps: stepResults };
}

async function failPipeline(projectId, executionId, stepName, error) {
  await pushExecutionError(executionId, { step: stepName, error: error.message, timestamp: new Date().toISOString() });
  try {
    const project = await query(`SELECT status FROM projects WHERE id = $1`, [projectId]);
    const currentStatus = project.rows[0]?.status || 'processing';
    await transition(projectId, currentStatus, 'failed', { triggered_by: 'pipeline', error: error.message, step: stepName });
  } catch (stateErr) {
    console.error('[runtime] Failed to transition to failed state:', stateErr.message);
  }
}

async function approveProject(projectId, workspaceId, userId) {
  assertUUID(projectId, 'project_id');
  assertUUID(workspaceId, 'workspace_id');
  assertUUID(userId, 'user_id');
  const project = await getProjectById(projectId, workspaceId);
  if (!project) throw makeError('NOT_FOUND', 'Project not found', 'project_id');
  if (project.status !== 'preview') throw makeError('INVALID_STATE', `Cannot approve project in status: ${project.status}`, 'status');

  const executionId = uuid();
  const sid = shortId();
  await query(`INSERT INTO executions (id, project_id, session_id, input_type, pipeline, status, steps, errors, triggered_by, started_at) VALUES ($1,$2,$3,'json_brief',ARRAY['scaffold','deploy'],'processing','[]'::jsonb,'[]'::jsonb,$4,NOW())`, [executionId, projectId, sid, userId]);

  try {
    await transition(projectId, 'preview', 'approved', { triggered_by: 'approve', user_id: userId, execution_id: executionId });
    await emitEvent('deployment.started', projectId, workspaceId, executionId, { pipeline: ['scaffold', 'deploy'], triggered_by: userId });

    await updateExecutionStep(executionId, 0, { name: 'scaffold', status: 'running' });
    let scaffoldResult;
    try {
      const scaffoldRetry = await retry(() => {
        const promptText = project.prompt_maestro || '';
        const bc = project.design_system ? { designSystem: project.design_system } : {};
        return scaffold.scaffold({
          project_name: project.slug,
          project_type: project.project_type || 'website',
          prompt_maestro_final: promptText,
          ...bc,
        });
      }, 'scaffold', RETRY_LIMIT);
      if (!scaffoldRetry.success) throw new Error(`Scaffold: ${scaffoldRetry.error}`);
      scaffoldResult = scaffoldRetry.result;
    } catch (err) {
      await pushExecutionError(executionId, { step: 'scaffold', error: err.message, timestamp: new Date().toISOString() });
      await transition(projectId, 'approved', 'failed', { triggered_by: 'pipeline', error: err.message });
      await finalizeExecution(executionId, 'failed');
      await emitEvent('pipeline.failed', projectId, workspaceId, executionId, { step: 'scaffold', error: err.message });
      throw err;
    }
    await updateExecutionStep(executionId, 0, { name: 'scaffold', status: 'completed', result_summary: `Generated ${(scaffoldResult.files || []).length} files at ${scaffoldResult.path}` });

    await transition(projectId, 'approved', 'deploying', { triggered_by: 'approve', execution_id: executionId });

    await updateExecutionStep(executionId, 1, { name: 'deploy', status: 'running' });
    let deployResult;
    try {
      const deployRetry = await retry(() => {
        const dep = require('../deployment');
        return dep.deployFullPipeline(scaffoldResult.path, {
          project_name: project.slug,
          engine_version: 'v1.7.0',
        });
      }, 'deploy', RETRY_LIMIT);
      if (!deployRetry.success) throw new Error(`Deploy: ${deployRetry.error}`);
      deployResult = deployRetry.result;
    } catch (err) {
      await pushExecutionError(executionId, { step: 'deploy', error: err.message, timestamp: new Date().toISOString() });
      await transition(projectId, 'deploying', 'failed', { triggered_by: 'pipeline', error: err.message });
      await finalizeExecution(executionId, 'failed');
      await emitEvent('pipeline.failed', projectId, workspaceId, executionId, { step: 'deploy', error: err.message });
      throw err;
    }
    await updateExecutionStep(executionId, 1, { name: 'deploy', status: 'completed', result_summary: deployResult.success ? 'Deployed successfully' : `Deploy issues: ${deployResult.status}` });

    const finalStatus = deployResult.success ? 'deployed' : 'deploying';
    await transition(projectId, 'deploying', finalStatus, { triggered_by: 'approve', execution_id: executionId });
    if (deployResult.success) {
      await query(`UPDATE projects SET github_repo = $1, deployed_at = NOW(), updated_at = NOW() WHERE id = $2`, [
        (deployResult.steps?.register?.repo_url) || null,
        projectId,
      ]);
    }
    await finalizeExecution(executionId, finalStatus === 'deployed' ? 'completed' : 'partial');
    await emitEvent('deployment.completed', projectId, workspaceId, executionId, { status: finalStatus, scaffold_files: (scaffoldResult.files || []).length, repo_url: deployResult.steps?.register?.repo_url || null });
    return { status: finalStatus, execution_id: executionId, scaffold: scaffoldResult, deploy: deployResult };
  } catch (err) {
    await finalizeExecution(executionId, 'failed');
    throw err;
  }
}

function evaluateContrast(dsResult) {
  if (!dsResult || !dsResult.tokens || !dsResult.tokens.semantic) return 50;
  const sem = dsResult.tokens.semantic;
  let score = 70;
  if (sem.background && sem.text) {
    try {
      const cr = previewContrastRatio(sem.background, sem.text);
      if (cr >= 7) score += 15;
      else if (cr >= 4.5) score += 5;
      else if (cr >= 3) score -= 10;
      else score -= 25;
    } catch { score -= 10; }
  }
  if (sem.primary) score += 5;
  if (dsResult.colors && dsResult.colors.palette && dsResult.colors.palette.length > 6) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function evaluateUX(planIr, previewResult) {
  if (!planIr || !planIr.project) return 50;
  const identity = planIr.project.identity || {};
  const structure = planIr.project.structure || {};
  let score = 60;
  if (identity.business_name) score += 10;
  if (identity.tagline || identity.mission) score += 5;
  if (structure.pages && structure.pages.length > 0) score += Math.min(15, structure.pages.length * 3);
  if (structure.main_conversion) score += 5;
  if (previewResult && previewResult.layout) {
    const sections = previewResult.layout.sections || [];
    if (sections.some(s => s.type === 'hero')) score += 5;
    if (sections.some(s => s.type === 'contact')) score += 5;
  }
  return Math.min(100, score);
}

function evaluateConversion(planIr) {
  if (!planIr || !planIr.project) return 50;
  const conversion = planIr.project.conversion || {};
  const identity = planIr.project.identity || {};
  let score = 50;
  if (conversion.main_cta) score += 15;
  if (conversion.lead_magnet) score += 10;
  if (conversion.follow_up) score += 5;
  if (identity.main_goal) score += 10;
  if (structureHasCTA(planIr)) score += 10;
  return Math.min(100, score);
}

function evaluateClarity(planIr) {
  if (!planIr || !planIr.project) return 50;
  const identity = planIr.project.identity || {};
  const content = planIr.project.content || {};
  let score = 50;
  if (identity.business_name) score += 10;
  if (identity.tagline) score += 10;
  if (identity.mission || identity.story) score += 10;
  if (content.service_list || content.flagship_service) score += 10;
  if (content.ideal_client) score += 5;
  if (identity.values && identity.values.length) score += 5;
  return Math.min(100, score);
}

function evaluateSEO(planIr) {
  if (!planIr || !planIr.project) return 50;
  const seo = planIr.project.seo || {};
  const structure = planIr.project.structure || {};
  let score = 50;
  if (seo.keywords && seo.keywords.length >= 3) score += 15;
  else if (seo.keywords && seo.keywords.length > 0) score += 5;
  if (seo.locations && seo.locations.length) score += 10;
  if (seo.content_strategy) score += 10;
  if (structure.pages && structure.pages.length >= 3) score += 10;
  if (seo.kpis) score += 5;
  return Math.min(100, score);
}

function structureHasCTA(planIr) {
  const structure = planIr.project.structure || {};
  if (structure.main_conversion) return true;
  const conversion = planIr.project.conversion || {};
  if (conversion.main_cta) return true;
  return false;
}

function previewContrastRatio(hex1, hex2) {
  function luminance(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  const l1 = luminance(hex1), l2 = luminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function extractRuntimeState(project, inputs, previews, states, decisions) {
  return {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      status: project.status,
      version: project.version,
      live_url: project.live_url,
      preview_url: project.preview_url,
      github_repo: project.github_repo,
      custom_domain: project.custom_domain,
      created_at: project.created_at,
      updated_at: project.updated_at,
      generated_at: project.generated_at,
      deployed_at: project.deployed_at,
    },
    design_system: project.design_system,
    plan_ir: project.plan_ir,
    prompt_maestro: project.prompt_maestro,
    current_preview_id: project.current_preview_id,
    form_inputs: inputs,
    previews: previews.map(p => ({
      id: p.id,
      version: p.version,
      score: p.decision_score,
      is_current: p.is_current,
      is_approved: p.is_approved,
      created_at: p.created_at,
    })),
    state_history: states.map(s => ({
      from: s.from_status,
      to: s.to_status,
      metadata: s.metadata,
      at: s.created_at,
    })),
    decisions: decisions.map(d => ({
      id: d.id,
      type: d.decision_type,
      score: d.score,
      metrics: d.metrics,
      warnings: d.warnings,
      passed: d.passed,
      feedback: d.feedback,
      created_at: d.created_at,
    })),
  };
}

module.exports = {
  createProject,
  runPipeline,
  approveProject,
  getProjectById,
  getProjectInputs,
  listWorkspaceProjects,
  getExecutionById,
  getProjectPreviews,
  getPreviewById,
  getDecisionsForProject,
  getProjectStates,
  extractRuntimeState,
  events,
  makeError,
};
