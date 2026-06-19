const { Router } = require('express');
const agentController = require('../controllers/agentController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('projects', 'read'), agentController.listAgents);
router.get('/:id', authorize('projects', 'read'), agentController.getAgent);
router.post('/run', authorize('projects', 'create'), validate({
  body: { task: { required: true, type: 'object' } },
}), agentController.runWorkflow);
router.post('/review', authorize('projects', 'read'), agentController.reviewWorkflow);
router.get('/workflows', authorize('projects', 'read'), agentController.listWorkflows);
router.get('/metrics', authorize('projects', 'read'), agentController.getWorkflowMetrics);
router.post('/cancel', authorize('projects', 'update'), agentController.cancelWorkflow);

module.exports = router;
