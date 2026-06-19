const { Router } = require('express');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.get('/providers', authenticate, aiController.listProviders);
router.post('/generate', authenticate, authorize('projects', 'create'), validate({
  body: { prompt: { required: true, type: 'string', minLength: 1 } },
}), aiController.generate);
router.post('/stream', authenticate, authorize('projects', 'create'), validate({
  body: { prompt: { required: true, type: 'string', minLength: 1 } },
}), aiController.streamHandler);
router.get('/health', authenticate, aiController.health);
router.get('/metrics', authenticate, aiController.metrics);

module.exports = router;
