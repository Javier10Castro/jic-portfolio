const generators = require('../generators');
const { templates } = require('../templates/registry');

function run(definition) {
  const { project_name, project_type, prompt_maestro_final } = definition;
  const projectPath = generators.createProjectDir(project_name);

  generators.createDirectories(projectPath);

  const files = {
    'index.html': templates.html({ project_name, project_type, prompt_maestro_final }),
    'README.md': templates.readme({ project_name, project_type }),
    'AGENTS.md': templates.agents({ project_name }),
    'ARCHITECTURE.md': templates.architecture({ project_name, project_type }),
    'CHANGELOG.md': templates.changelog(),
    '.gitignore': templates.gitignore({ project_type })
  };

  for (const [filePath, content] of Object.entries(files)) {
    generators.writeFile(projectPath, filePath, content);
  }

  generators.createAssetPlaceholders(projectPath);

  return {
    path: projectPath,
    name: project_name,
    files: Object.keys(files)
  };
}

module.exports = { run };
