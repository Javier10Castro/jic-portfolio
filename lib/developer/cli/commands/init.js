function handler(args, platform) {
  const name = args[0] || 'my-project';
  return { success: true, output: `Initialized project '${name}' with default configuration.` };
}
module.exports = { handler };
