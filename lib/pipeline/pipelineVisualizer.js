function visualize(pipelineRun) {
  const stages = pipelineRun?.stages || [];
  if (!stages.length) return 'No stages to visualize';

  const lines = ['┌─────────────────────────────────────────────┐'];
  lines.push('│         Pipeline Execution Graph              │');
  lines.push('└─────────────────────────────────────────────┘');

  let maxNameLen = 0;
  for (const s of stages) {
    const label = _stageLabel(s.name);
    if (label.length > maxNameLen) maxNameLen = label.length;
  }

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const label = _stageLabel(s.name).padEnd(maxNameLen);
    const statusIcon = s.status === 'completed' ? '✅' : s.status === 'running' ? '▶️' : s.status === 'failed' ? '❌' : s.status === 'skipped' ? '⏭️' : '⏳';
    const duration = s.duration ? `${(s.duration / 1000).toFixed(1)}s`.padStart(8) : '       ';
    const marker = i === stages.length - 1 ? '└──' : '├──';
    lines.push(`${mark} ${statusIcon} ${label} ${duration}`);
    if (i < stages.length - 1) {
      lines.push(`│${' '.repeat(maxNameLen + 6)}│`);
    }
  }

  return lines.join('\n');
}

function visualizeCompact(pipelineRun) {
  const stages = pipelineRun?.stages || [];
  if (!stages.length) return '(empty)';

  return stages.map((s, i) => {
    const label = _stageLabel(s.name);
    const icon = s.status === 'completed' ? '✔' : s.status === 'running' ? '▶' : s.status === 'failed' ? '✖' : s.status === 'skipped' ? '○' : '◌';
    return `  ${icon} ${label}`;
  }).join('\n    ↓\n');
}

function _stageLabel(name) {
  const map = {
    conversation_engine: 'Conversation Engine',
    intent_detection: 'Intent Detection',
    question_generator: 'Question Generator',
    context_builder: 'Context Builder',
    planner: 'Planner',
    design_strategy: 'Design Strategy',
    content_generator: 'Content Generator',
    website_builder: 'Website Builder',
    post_processing: 'Post Processing',
    deployment_engine: 'Deployment Engine',
    dashboard_refresh: 'Dashboard Refresh',
  };
  return map[name] || name;
}

module.exports = { visualize, visualizeCompact };
