const { projectManager } = require('../../saas');
const { success, created } = require('../responses');
const { NotFoundError } = require('../errors');
const { paginate } = require('../responses/pagination');

function listProjects(req, res) {
  const all = projectManager.listProjects ? projectManager.listProjects() : (projectManager.getAll ? projectManager.getAll() : []);
  const { page, limit, offset } = paginate(req, all.length);
  const items = all.slice(offset, offset + limit);
  return success(res, items, {
    pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
  });
}

function getProject(req, res) {
  const proj = projectManager.getProject(req.params.id);
  if (!proj) throw new NotFoundError(`Project "${req.params.id}" not found`);
  return success(res, proj);
}

function createProject(req, res) {
  const { name, description, conversationId } = req.body;
  const result = projectManager.createProject({ name, description, conversationId, userId: req.user?.id });
  return created(res, result);
}

function updateProject(req, res) {
  const proj = projectManager.getProject(req.params.id);
  if (!proj) throw new NotFoundError(`Project "${req.params.id}" not found`);
  const updated = projectManager.updateProject(req.params.id, req.body);
  return success(res, updated);
}

function deleteProject(req, res) {
  const proj = projectManager.getProject(req.params.id);
  if (!proj) throw new NotFoundError(`Project "${req.params.id}" not found`);
  projectManager.deleteProject(req.params.id);
  return success(res, { deleted: true });
}

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };
