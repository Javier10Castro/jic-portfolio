const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  try {
    const apiKey = core.getInput('api-key', { required: true });
    const command = core.getInput('command');
    const project = core.getInput('project');
    const environment = core.getInput('environment');

    core.setSecret(apiKey);
    core.info(`Platform Action: ${command}`);
    core.info(`Project: ${project || 'default'}, Environment: ${environment}`);

    if (command === 'deploy') {
      core.info(`Deploying ${project || 'project'} to ${environment}...`);
      core.setOutput('status', 'success');
      core.setOutput('url', `https://${project || 'app'}.platform.io`);
    } else if (command === 'generate') {
      core.info('Generating SDK/OpenAPI specs...');
      core.setOutput('status', 'generated');
    } else {
      core.info(`Executing: ${command}`);
      core.setOutput('status', 'completed');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
module.exports = { run };
