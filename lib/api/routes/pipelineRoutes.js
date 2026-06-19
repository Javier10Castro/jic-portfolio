const { Router } = require('express');
const pipelineController = require('../controllers/pipelineController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.post('/run', authorize('projects', 'create'), validate({
  body: { conversationId: { type: 'string' } },
}), pipelineController.runPipeline);

router.post('/project/:id/run', authorize('projects', 'create'), pipelineController.runProjectPipelineHandler);

router.get('/:id', authorize('projects', 'read'), pipelineController.getPipeline);
router.get('/:id/status', authorize('projects', 'read'), pipelineController.getPipelineStatus);
router.post('/:id/cancel', authorize('projects', 'update'), pipelineController.cancelPipeline);
router.post('/:id/resume', authorize('projects', 'update'), pipelineController.resumePipeline);
router.post('/:id/retry', authorize('projects', 'update'), pipelineController.retryPipeline);

module.exports = router;
