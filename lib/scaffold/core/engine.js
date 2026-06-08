const generators = require('../generators');
const { templates } = require('../templates/registry');

function run(definition) {
  const { project_name, project_type, prompt_maestro_final, designSystem } = definition;
  const projectPath = generators.createProjectDir(project_name);

  generators.createDirectories(projectPath);

  const data = { project_name, project_type, prompt_maestro_final, designSystem };

  const files = {
    'index.html': templates.html(data),
    'README.md': templates.readme(data),
    'AGENTS.md': templates.agents(data),
    'ARCHITECTURE.md': templates.architecture(data),
    'CHANGELOG.md': templates.changelog(),
    '.gitignore': templates.gitignore(data),
  };

  if (designSystem) {
    files['assets/design-system.json'] = templates.designSystemJson(data);
    files['assets/css/theme.css'] = templates.themeCss(data);
  }

  files['assets/css/style.css'] = templates.styleCss(data);
  files['assets/js/main.js'] = templates.mainJs(data);

  for (const [filePath, content] of Object.entries(files)) {
    generators.writeFile(projectPath, filePath, content);
  }

  return {
    path: projectPath,
    name: project_name,
    files: Object.keys(files)
  };
}

module.exports = { run };
