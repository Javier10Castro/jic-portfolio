function handler(args, platform) {
  const level = args[0] || 'info';
  return {
    success: true,
    output: [
      `Recent ${level} logs:`,
      `  [${new Date().toISOString()}] INFO  API request completed (200)`,
      `  [${new Date().toISOString()}] INFO  Deployment successful`,
      `  [${new Date(Date.now() - 60000).toISOString()}] INFO  Plugin loaded`
    ].join('\n')
  };
}
module.exports = { handler };
