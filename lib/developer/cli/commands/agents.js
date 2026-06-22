function handler(args, platform) {
  const sub = args[0] || 'list';
  if (sub === 'list') return { success: true, output: 'Agents:\n  - code-review (active)\n  - deploy-bot (idle)\n  - monitor (active)' };
  if (sub === 'run') return { success: true, output: `Agent '${args[1] || 'default'}' execution completed.` };
  return { success: true, output: 'Agent operation completed.' };
}
module.exports = { handler };
