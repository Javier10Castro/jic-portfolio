const { Router } = require('express');
const plannerController = require('../controllers/plannerController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.post('/generate', authorize('projects', 'create'), validate({
  body: { prompt: { type: 'string' }, conversationId: { type: 'string' } },
}), plannerController.generatePlan);

module.exports = router;
