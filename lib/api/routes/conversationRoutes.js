const { Router } = require('express');
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('projects', 'read'), conversationController.listConversations);
router.post('/', authorize('projects', 'create'), validate({
  body: { title: { required: true, type: 'string', minLength: 1 } },
}), conversationController.createConversation);

router.get('/:id', authorize('projects', 'read'), conversationController.getConversation);
router.delete('/:id', authorize('projects', 'delete'), conversationController.deleteConversation);

router.post('/:id/messages', authorize('projects', 'update'), validate({
  body: { content: { required: true, type: 'string', minLength: 1 } },
}), conversationController.addMessage);

router.post('/:id/questions', authorize('projects', 'update'), conversationController.generateQuestions);
router.post('/:id/context', authorize('projects', 'update'), conversationController.buildContextHandler);

module.exports = router;
