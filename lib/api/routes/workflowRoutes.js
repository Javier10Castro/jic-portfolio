const { Router } = require('express');
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('projects', 'read'), workflowController.listWorkflows);
router.get('/definitions', authorize('projects', 'read'), workflowController.listDefinitions);
router.get('/:id', authorize('projects', 'read'), workflowController.getWorkflow);
router.post('/', authorize('projects', 'create'), validate({
  body: { definitionId: { required: true, type: 'string' } },
}), workflowController.createWorkflow);
router.post('/:id/pause', authorize('projects', 'update'), workflowController.pauseWorkflow);
router.post('/:id/resume', authorize('projects', 'update'), workflowController.resumeWorkflow);
router.post('/:id/cancel', authorize('projects', 'update'), workflowController.cancelWorkflow);
router.post('/:id/retry', authorize('projects', 'update'), workflowController.retryWorkflow);
router.get('/:id/graph', authorize('projects', 'read'), workflowController.getWorkflowGraph);
router.get('/:id/events', authorize('projects', 'read'), workflowController.getWorkflowEvents);
router.get('/:id/checkpoints', authorize('projects', 'read'), workflowController.getWorkflowCheckpoints);

module.exports = router;
