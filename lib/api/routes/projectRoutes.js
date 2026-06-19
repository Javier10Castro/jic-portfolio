const { Router } = require('express');
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('projects', 'read'), projectController.listProjects);
router.post('/', authorize('projects', 'create'), validate({
  body: { name: { required: true, type: 'string', minLength: 1 } },
}), projectController.createProject);

router.get('/:id', authorize('projects', 'read'), projectController.getProject);
router.patch('/:id', authorize('projects', 'update'), projectController.updateProject);
router.delete('/:id', authorize('projects', 'delete'), projectController.deleteProject);

module.exports = router;
