function handler(args, platform) {
  const sub = args[0] || 'list';
  if (sub === 'list') return { success: true, output: 'Connected integrations:\n  - github (connected)\n  - slack (connected)\n  - vercel (disconnected)' };
  if (sub === 'connect') return { success: true, output: `Connected to '${args[1] || 'provider'}'.` };
  if (sub === 'disconnect') return { success: true, output: `Disconnected '${args[1] || 'provider'}'.` };
  return { success: true, output: 'Integration operation completed.' };
}
module.exports = { handler };
