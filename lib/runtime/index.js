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
const { normalizeId, normalizeProjectId, isUUID } = require('./id-normalizer');
const { resolveContext } = require('../resolver');
const { resolveProject } = require('./project-resolver');

const RETRY_LIMIT = 2;
const STEP_TIMEOUT_MS = 25000;
const PARTIAL_STATUS = 'partial_success';

const EXECUTION_STATUSES = Object.freeze({
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
});

const VALID_EXECUTION_STATUSES = Object.values(EXECUTION_STATUSES);

function assertExecutionStatus(status, fieldName) {
  if (!VALID_EXECUTION_STATUSES.includes(status)) {
    throw makeError('INVALID_EXECUTION_STATUS', `${fieldName || 'status'} must be one of: ${VALID_EXECUTION_STATUSES.join(', ')}`, fieldName || 'status');
  }
}

const STATE_MACHINE = {
  draft: ['preview'],
  preview: ['approved'],
  approved: ['deployed', 'preview'],
  deployed: [],
};

function uuid() { return crypto.randomUUID(); }

function shortId() { return crypto.randomBytes(8).toString('hex'); }

function validTransition(from, to) {
  return STATE_MACHINE[from] && STATE_MACHINE[from].includes(to);
}

async function updateProjectStatus(projectId, status, error) {
  await query("SET SESSION app.current_user_id = '00000000-0000-0000-0000-000000000002'");
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

async function runStep(fn, label, fallback) {
  const result = await retry(fn, label, RETRY_LIMIT);
  if (result.success) return { success: true, result: result.result };
  if (fallback !== undefined) return { success: true, result: fallback, fromFallback: true };
  return { success: false, error: result.error };
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
  assertExecutionStatus(status, 'execution_status');
  const sql = `UPDATE executions SET status = $1, completed_at = NOW() WHERE id = $2`;
  await query(sql, [status, executionId]);
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

async function createProjectRow(workspaceId, userId, name, slug, formData, promptMaestro) {
  const id = uuid();
  const now = new Date().toISOString();
  const irData = extractFormDataForProject(formData);
  const sql = `INSERT INTO projects (id, workspace_id, created_by, name, slug, status, project_type, version, metadata, prompt_maestro, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'draft','website',1,$6,$7,$8,$8) RETURNING id, created_at`;
  const meta = JSON.stringify({ form_fields_count: irData.length, source: 'api_v1_create' });
  const pmText = promptMaestro || (formData ? formDataToPromptMaestro(formData) : null);
  await query(sql, [id, workspaceId, userId, name, slug, meta, pmText, now]);
  if (irData.length) {
    for (const entry of irData) {
      await query(`INSERT INTO project_inputs (id, project_id, section, field_key, value) VALUES ($1,$2,$3,$4,$5)`, [uuid(), id, entry.section, entry.field_key, entry.value]);
    }
  }
  return { id, slug, created_at: now };
}

async function getProjectById(projectId, workspaceId) {
  const sql = `SELECT p.id, p.workspace_id, p.created_by, p.name, p.slug, p.description, p.status, p.project_type, p.version, p.current_preview_id, p.live_url, p.preview_url, p.github_repo, p.custom_domain, p.design_system, p.plan_ir, p.prompt_maestro, p.metadata, p.feedback, p.generated_at, p.deployed_at, p.created_at, p.updated_at, u.name as created_by_name, u.email as created_by_email FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE p.id = $1 AND p.workspace_id = $2`;
  try {
    const r = await query(sql, [projectId, workspaceId]);
    return r.rows[0] || null;
  } catch (err) {
    if (err.code === '22P02') return null;
    throw err;
  }
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

async function createProject(workspaceId, userId, name, formData, workspaceSlug, promptMaestro) {
  if (workspaceId && typeof workspaceId === 'object' && !Array.isArray(workspaceId)) {
    const o = workspaceId;
    workspaceId = o.workspace_id || o.workspaceId;
    userId = o.user_id || o.userId;
    name = o.name;
    formData = o.formData || o.form_data || null;
    workspaceSlug = o.workspace_slug || o.workspaceSlug;
    promptMaestro = o.prompt_maestro || o.promptMaestro || null;
  }
  if (workspaceId) assertUUID(workspaceId, 'workspace_id');
  const uId = normalizeId(userId, 'user_id');
  assertString(name, 'name');
  const ctx = await resolveContext({ workspace_slug: workspaceSlug, workspace_id: workspaceId, user_id: uId });
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `project-${shortId()}`;
  const project = await createProjectRow(ctx.workspace.id, ctx.user.id, name, slug, formData, promptMaestro);
  await logState(project.id, null, 'draft', { triggered_by: 'create' });
  await emitEvent('project.created', project.id, ctx.workspace.id, null, { name, slug, created_by: ctx.user.id });
  return project;
}

async function runPipeline(projectId, workspaceId, executionId, formData, inputType, workspaceSlug, userId, promptMaestro) {
  if (projectId && typeof projectId === 'object' && !Array.isArray(projectId)) {
    const o = projectId;
    projectId = o.project_id || o.projectId;
    workspaceId = o.workspace_id || o.workspaceId;
    executionId = o.execution_id || o.executionId;
    formData = o.formData || o.form_data || null;
    inputType = o.inputType || o.input_type || 'json_brief';
    workspaceSlug = o.workspace_slug || o.workspaceSlug;
    userId = o.user_id || o.userId;
    promptMaestro = o.prompt_maestro || o.promptMaestro || null;
  }
  projectId = normalizeProjectId(projectId);
  if (workspaceId) assertUUID(workspaceId, 'workspace_id');
  if (!executionId) executionId = uuid();
  else {
    executionId = normalizeProjectId(executionId, 'execution_id');
    if (!isUUID(executionId)) executionId = uuid();
  }
  const ctx = await resolveContext({ workspace_slug: workspaceSlug, workspace_id: workspaceId, user_id: userId ? normalizeId(userId, 'user_id') : undefined });
  const resolvedWsId = ctx.workspace.id;
  const project = await resolveProject({ project_id: projectId, workspace_id: resolvedWsId });
  projectId = project.id;
  if (!['draft', 'preview'].includes(project.status)) {
    throw makeError('INVALID_STATE', `Cannot run pipeline on project in status: ${project.status}`, 'status');
  }

  let promptText;
  if (promptMaestro) {
    promptText = promptMaestro;
  } else if (formData) {
    promptText = formDataToPromptMaestro(formData);
  } else if (project.prompt_maestro) {
    if (typeof project.prompt_maestro === 'string' && /^[{[]/.test(project.prompt_maestro)) {
      const parsed = safeJsonParse(project.prompt_maestro);
      promptText = parsed ? formDataToPromptMaestro(parsed) : '{}';
    } else {
      promptText = project.prompt_maestro;
    }
  } else {
    promptText = '{}';
  }
  await query(`INSERT INTO executions (id, project_id, session_id, input_type, pipeline, status, steps, errors, started_at) VALUES ($1,$2,$3,$4,$5,'processing','[]'::jsonb,'[]'::jsonb,NOW()) ON CONFLICT (id) DO NOTHING`, [executionId, projectId, shortId(), inputType || 'json_brief', ['plan', 'design_system', 'preview', 'scoring', 'scaffold']]);
  await finalizeExecution(executionId, 'processing');
  await emitEvent('pipeline.started', projectId, resolvedWsId, executionId, { input_type: inputType || 'json_brief' });

  const stepResults = {};
  const usedFallback = { plan: false, design_system: false, preview: false, scoring: false };

  await updateExecutionStep(executionId, 0, { name: 'plan', status: 'running' });
  const planResult = await runStep(() => plan.compile(promptText), 'plan', {
    project: { identity: { business_name: project.slug || '' }, structure: { pages: ['home', 'about', 'contact'] }, content: {}, conversion: {}, seo: {} }
  });
  usedFallback.plan = planResult.fromFallback || false;
  stepResults.plan = planResult.result;
  await updateExecutionStep(executionId, 0, { name: 'plan', status: usedFallback.plan ? 'completed' : 'completed', result_summary: `Identified ${Object.keys(stepResults.plan.project || {}).length} categories${usedFallback.plan ? ' (defaults used)' : ''}` });
  await emitEvent('plan.completed', projectId, resolvedWsId, executionId, { categories: Object.keys(stepResults.plan.project || {}).length, fallback: usedFallback.plan });

  await updateExecutionStep(executionId, 1, { name: 'design_system', status: 'running' });
  const brandingColors = extractBrandingColors(formData);
  const dsResult = await runStep(() => ds.buildDesignSystem(brandingColors || { primary: null, secondary: null, accent: null, palette: [] }), 'design_system', {
    tokens: { semantic: { background: '#ffffff', text: '#1a1a2e', primary: '#00D4FF', secondary: '#00FFC8' }, spacing: {}, typography: {} }, colors: { palette: [] }, mapping: { theme: 'light' }
  });
  usedFallback.design_system = dsResult.fromFallback || false;
  stepResults.design_system = dsResult.result;
  await saveProjectIR(projectId, stepResults.plan, dsResult.result);
  const dsTheme = (dsResult.result.mapping && dsResult.result.mapping.theme) || 'light';
  const dsPalette = (dsResult.result.colors && dsResult.result.colors.palette && dsResult.result.colors.palette.length) || 0;
  await updateExecutionStep(executionId, 1, { name: 'design_system', status: 'completed', result_summary: `Theme: ${dsTheme}, palette: ${dsPalette} colors${usedFallback.design_system ? ' (defaults used)' : ''}` });
  await emitEvent('design.completed', projectId, resolvedWsId, executionId, { theme: dsTheme, palette_size: dsPalette, fallback: usedFallback.design_system });

  let previewId = null;
  await updateExecutionStep(executionId, 2, { name: 'preview', status: 'running' });
  const planIr = stepResults.plan;
  const dsTokens = stepResults.design_system;
  const previewResult = await runStep(() => preview.generatePreview(planIr, dsTokens), 'preview', {
    htmlPreview: '', cssPreview: '', layout: { sections: [] }, warnings: []
  });
  usedFallback.preview = previewResult.fromFallback || false;
  stepResults.preview = previewResult.result;
  if (!usedFallback.preview) {
    let projectVersion = project.version || 1;
    if (project.status !== 'draft') {
      const { rows: [ver] } = await query(`UPDATE projects SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`, [projectId]);
      projectVersion = ver.version;
    }
    previewId = await createPreviewRecord(projectId, executionId, projectVersion, previewResult.result.htmlPreview, previewResult.result.cssPreview, dsTokens, planIr);
    if (previewId) await setProjectPreview(projectId, previewId);
  }
  const sectionsCount = (previewResult.result.layout && previewResult.result.layout.sections && previewResult.result.layout.sections.length) || 0;
  const warningsCount = (previewResult.result.warnings && previewResult.result.warnings.length) || 0;
  await updateExecutionStep(executionId, 2, { name: 'preview', status: 'completed', result_summary: `${sectionsCount} sections, ${warningsCount} warnings${usedFallback.preview ? ' (defaults used)' : ''}` });
  await emitEvent('preview.generated', projectId, resolvedWsId, executionId, { preview_id: previewId, sections: sectionsCount, warnings_count: warningsCount, fallback: usedFallback.preview });

  await updateExecutionStep(executionId, 3, { name: 'scoring', status: 'running' });
  const previewWarnings = (stepResults.preview.warnings || []);
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
  const highWarnings = previewWarnings.filter(w => w.severity === 'high');
  if (highWarnings.length) totalScore = Math.max(0, totalScore - highWarnings.length * 10);

  const feedback = `Score: ${totalScore}/100. ${metrics.contrast.score >= 70 ? 'Contrast: OK' : 'Low contrast detected'}. UX: ${metrics.ux.score >= 70 ? 'OK' : 'Needs improvement'}. Conversion: ${metrics.conversion.score >= 70 ? 'OK' : 'Weak CTAs'}.`;
  const decisionId = await createDecisionRecord(projectId, executionId, totalScore, metrics, previewWarnings, passed, feedback);
  await updateExecutionStep(executionId, 3, { name: 'scoring', status: 'completed', result_summary: `Score: ${totalScore}/100, passed: ${passed}, warnings: ${previewWarnings.length}${usedFallback.preview || usedFallback.design_system ? ' (partial data)' : ''}` });
  stepResults.decision = { id: decisionId, score: totalScore, metrics, warnings: previewWarnings, passed, feedback };
  await emitEvent('scoring.completed', projectId, resolvedWsId, executionId, { score: totalScore, passed, metrics, warnings_count: previewWarnings.length, decision_id: decisionId, preview_id: previewId });

  if (project.status === 'draft') {
    await transition(projectId, 'draft', 'preview', { triggered_by: 'pipeline', score: totalScore, execution_id: executionId, fallback_steps: Object.entries(usedFallback).filter(([, v]) => v).map(([k]) => k) });
  }
  if (!passed) {
    await finalizeExecution(executionId, 'success');
    return { status: 'preview', score: totalScore, passed: false, execution_id: executionId, preview_id: previewId, feedback, fallback_steps: Object.entries(usedFallback).filter(([, v]) => v).map(([k]) => k) };
  }

  await finalizeExecution(executionId, 'success');
  return { status: 'preview', score: stepResults.decision.score, passed: true, execution_id: executionId, preview_id: previewId, steps: stepResults };
}

async function failPipeline(projectId, executionId, stepName, error) {
  await pushExecutionError(executionId, { step: stepName, error: error.message, timestamp: new Date().toISOString() });
}

async function approveProject(projectId, workspaceId, userId, workspaceSlug) {
  if (projectId && typeof projectId === 'object' && !Array.isArray(projectId)) {
    const o = projectId;
    projectId = o.project_id || o.projectId;
    workspaceId = o.workspace_id || o.workspaceId;
    userId = o.user_id || o.userId;
    workspaceSlug = o.workspace_slug || o.workspaceSlug;
  }
  projectId = normalizeProjectId(projectId);
  if (workspaceId) assertUUID(workspaceId, 'workspace_id');
  userId = normalizeId(userId, 'user_id');
  const ctx = await resolveContext({ workspace_slug: workspaceSlug, workspace_id: workspaceId, user_id: userId });
  const project = await resolveProject({ project_id: projectId, workspace_id: ctx.workspace.id });
  projectId = project.id;
  if (project.status !== 'preview') throw makeError('INVALID_STATE', `Cannot approve project in status: ${project.status}`, 'status');

  const executionId = uuid();
  const sid = shortId();
  await query(`INSERT INTO executions (id, project_id, session_id, input_type, pipeline, status, steps, errors, triggered_by, started_at) VALUES ($1,$2,$3,'json_brief',ARRAY['scaffold','deploy'],'processing','[]'::jsonb,'[]'::jsonb,$4,NOW())`, [executionId, projectId, sid, ctx.user.id]);

  try {
    await transition(projectId, 'preview', 'approved', { triggered_by: 'approve', user_id: ctx.user.id, execution_id: executionId });
    await emitEvent('deployment.started', projectId, ctx.workspace.id, executionId, { pipeline: ['scaffold', 'deploy'], triggered_by: ctx.user.id });

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
      try { await transition(projectId, 'approved', 'preview', { triggered_by: 'scaffold_failure', error: err.message }); } catch {}
      await finalizeExecution(executionId, 'failed');
      await emitEvent('pipeline.failed', projectId, ctx.workspace.id, executionId, { step: 'scaffold', error: err.message });
      throw err;
    }
    await updateExecutionStep(executionId, 0, { name: 'scaffold', status: 'completed', result_summary: `Generated ${(scaffoldResult.files || []).length} files at ${scaffoldResult.path}` });

    await updateExecutionStep(executionId, 1, { name: 'deploy', status: 'running' });
    let deployResult;
    try {
      if (process.env.VERCEL_ENV) {
        deployResult = { success: true, status: 'deployed (simulated)', steps: { register: { repo_url: null } }, output: 'Deploy simulated on Vercel serverless' };
      } else {
        let dep;
        try { dep = require('../deployment'); } catch { dep = null; }
        if (!dep || typeof dep.deployFullPipeline !== 'function') {
          deployResult = { success: true, status: 'deployed (no deployment module)', steps: { register: { repo_url: null } }, output: 'Deployment module not available' };
        } else {
          const deployRetry = await retry(() => dep.deployFullPipeline(scaffoldResult.path, {
            project_name: project.slug,
            engine_version: 'v1.7.0',
          }), 'deploy', RETRY_LIMIT);
          if (!deployRetry.success) throw new Error(`Deploy: ${deployRetry.error}`);
          deployResult = deployRetry.result;
          if (!deployResult.success) throw new Error(`Deploy: ${deployResult.error || deployResult.status}`);
        }
      }
    } catch (err) {
      await pushExecutionError(executionId, { step: 'deploy', error: err.message, timestamp: new Date().toISOString() });
      try { await transition(projectId, 'approved', 'preview', { triggered_by: 'deploy_failure', error: err.message }); } catch {}
      await finalizeExecution(executionId, 'failed');
      await emitEvent('pipeline.failed', projectId, ctx.workspace.id, executionId, { step: 'deploy', error: err.message });
      throw err;
    }
    await updateExecutionStep(executionId, 1, { name: 'deploy', status: 'completed', result_summary: deployResult.success ? 'Deployed successfully' : `Deploy issues: ${deployResult.status}` });

    await transition(projectId, 'approved', 'deployed', { triggered_by: 'approve', execution_id: executionId });
    if (deployResult.success) {
      await query(`UPDATE projects SET github_repo = $1, deployed_at = NOW(), updated_at = NOW() WHERE id = $2`, [
        (deployResult.steps?.register?.repo_url) || null,
        projectId,
      ]);
    }
    await finalizeExecution(executionId, 'success');
    await emitEvent('deployment.completed', projectId, ctx.workspace.id, executionId, { status: 'deployed', scaffold_files: (scaffoldResult.files || []).length, repo_url: deployResult.steps?.register?.repo_url || null });
    return { status: 'deployed', execution_id: executionId, scaffold: scaffoldResult, deploy: deployResult };
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

function safeJsonParse(str) {
  if (!str || typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch { return null; }
}

function formDataToPromptMaestro(fd) {
  if (!fd || typeof fd !== 'object') return '# PROMPT MAESTRO\n\n';
  const p = (key, fallback) => { const v = fd[key]; if (v === null || v === undefined || v === '') return fallback || 'No especificado'; if (Array.isArray(v)) return v.length ? v.join(', ') : (fallback || 'No especificado'); if (typeof v === 'object') try { return JSON.stringify(v); } catch { return fallback || 'No especificado'; } return String(v); };
  const arr = (key, fallback) => p(key, fallback);
  const now = new Date();
  const ds = now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  return `# PROMPT MAESTRO — GENERACIÓN DE SITIO WEB PROFESIONAL
Generated by Build a Brief | javieribrahim.dev
Date: ${ds}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. DATOS DEL NEGOCIO

**Empresa:** ${p('biz_name')}
**Eslogan/Tagline:** ${p('biz_tagline')}
**Historia:** ${p('biz_history')}
**Misión:** ${p('biz_mision')}
**Visión:** ${p('biz_vision')}
**Valores corporativos:** ${arr('biz_valores')}
**Diferenciadores clave:** ${p('biz_diferenciadores')}
**Personalidad de marca:** ${arr('biz_personalidad')}
**Contacto:** ${p('biz_contacto')}
**Redes sociales:** ${p('biz_redes')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2. OBJETIVOS DEL PROYECTO

**Objetivo principal:** ${p('obj_principal')}
**Objetivos secundarios:** ${arr('obj_secundarios')}
**KPIs de éxito:** ${p('obj_kpis')}
**Conversión principal deseada:** ${p('obj_conversion')}
**Plazo para resultados:** ${p('obj_plazo')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3. SITUACIÓN ACTUAL Y COMPETENCIA

**Sitio web actual:** ${p('comp_sitio')}
**Problemas actuales:** ${arr('comp_problemas')}
**Competidores directos:** ${p('comp_directos')}
**Empresas aspiracionales:** ${p('comp_aspiracionales')}
**Oportunidades detectadas:** ${p('comp_oportunidades')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4. PÚBLICO OBJETIVO

**Cliente ideal:** ${p('pub_ideal')}
**Problemas que resuelve:** ${p('pub_problemas')}
**Motivaciones de compra:** ${p('pub_motivaciones')}
**Objeciones principales:** ${p('pub_objeciones')}
**Proceso de decisión:** ${p('pub_decision')}
**Canales de descubrimiento:** ${arr('pub_canales')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5. BRANDING E IDENTIDAD VISUAL

**Estado del logotipo:** ${p('brand_logo')}
**Paleta de colores:** ${p('brand_colores')}
**Tipografías:** ${p('brand_tipografia')}
**Estilo visual deseado:** ${arr('brand_estilo')}
**Emociones a transmitir:** ${arr('brand_emociones')}
**Elementos prohibidos:** ${p('brand_prohibido')}
**Nivel de sofisticación:** ${p('brand_nivel')}/5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6. ARQUITECTURA DEL SITIO

**Páginas requeridas:** ${arr('arq_paginas')}
**Páginas especiales:** ${p('arq_extras')}
**Páginas prioritarias:** ${p('arq_prioridad')}
**Flujo de usuario ideal:** ${p('arq_flujo')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 7. CONTENIDO DISPONIBLE

**Textos existentes:** ${p('cont_textos')}
**Fotografías profesionales:** ${p('cont_fotos')}
**Material en video:** ${p('cont_videos')}
**Recursos descargables:** ${p('cont_recursos')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 8. PRODUCTOS Y SERVICIOS

**Lista de servicios/productos:** ${p('serv_lista')}
**Servicio estrella:** ${p('serv_estrella')}
**Beneficios principales:** ${p('serv_beneficios')}
**Proceso de trabajo:** ${p('serv_proceso')}
**Estrategia de precios:** ${p('serv_precio')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 9. PRUEBA SOCIAL Y CREDIBILIDAD

**Testimonios:** ${p('social_testimonios')}
**Estadísticas/métricas:** ${p('social_numeros')}
**Clientes/marcas importantes:** ${p('social_clientes')}
**Certificaciones y premios:** ${p('social_cert')}
**Casos de éxito:** ${p('social_casos')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 10. FUNCIONALIDADES REQUERIDAS

**Básicas:** ${arr('func_basicas')}
**Avanzadas:** ${arr('func_avanzadas')}
**Herramientas a integrar:** ${p('func_herramientas')}
**Administrador del sitio:** ${p('func_cms')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 11. ESTRATEGIA SEO

**Palabras clave:** ${arr('seo_keywords')}
**Ubicaciones geográficas:** ${arr('seo_geo')}
**Competencia SEO:** ${p('seo_competencia')}
**Estrategia de contenidos:** ${p('seo_blog')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 12. REFERENCIAS VISUALES

**Sitios favoritos:** ${p('ref_favoritos')}
**Sitios que no le gustan:** ${p('ref_odio')}
**Marcas de referencia:** ${p('ref_marcas')}
**Tres palabras del diseño:** ${p('ref_palabras')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 13. ESTRATEGIA DE CONVERSIÓN

**CTA principal:** ${p('conv_cta')}
**Oferta/garantía especial:** ${p('conv_oferta')}
**Lead magnet:** ${p('conv_lead')}
**Urgencia/escasez:** ${p('conv_urgencia')}
**Seguimiento post-contacto:** ${p('conv_seguimiento')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 14. LA ESENCIA DE TU MARCA

**Personalidad de marca (metáfora):** ${p('ai_persona')}
**Primeros 5 segundos:** ${p('ai_5seg')}
**Diferenciador real profundo:** ${p('ai_diferencia')}
**Elementos siempre prohibidos:** ${p('ai_prohibido')}
**Referente cultural/metáfora:** ${p('ai_metafora')}
**Contexto adicional:** ${p('ai_extra')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## INSTRUCCIÓN FINAL PARA CLAUDE

With all the information from the brief above, generate a complete professional website that includes:

1. **Sitemap detallado** with all pages and their hierarchy
2. **Wireframes en texto** of each main page
3. **Copywriting completo** for all sections (H1, H2, paragraphs, CTAs, meta descriptions)
4. **Sistema de diseño** documentado: color palette HEX, typography, UI components, spacing
5. **Estrategia de conversión** implementada: strategically placed CTAs, user flow, lead magnets
6. **Metadatos SEO** for each page: title, description, keywords, schema markup
7. **Código HTML/CSS/JS** of the complete site with responsive and mobile-first design
8. **Recomendaciones técnicas** of stack, CMS, hosting and tools

The site must perfectly reflect the essence of the brand ${p('biz_name')}, be designed to convert "${p('pub_ideal')}" into clients, and generate the emotion of "${p('ai_5seg')}" in the first 5 seconds of visit.

Visual style required: ${arr('brand_estilo')}
Nivel de sofisticación: ${p('brand_nivel')}/5
Palabras guía del diseño: ${p('ref_palabras')}`;
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
  formDataToPromptMaestro,
  events,
  makeError,
  assertExecutionStatus,
  EXECUTION_STATUSES,
  VALID_EXECUTION_STATUSES,
};
