function handler(args, platform) {
  const project = args[0] || 'current';
  return { success: true, output: `Deploying '${project}'...\nDeployment complete. URL: https://${project}.platform.io` };
}
module.exports = { handler };
