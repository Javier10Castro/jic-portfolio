const { Router } = require('express');
const contextController = require('../controllers/contextController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');

const router = Router();

router.use(authenticate);

router.get('/:conversationId', authorize('projects', 'read'), contextController.getContext);
router.post('/:conversationId/rebuild', authorize('projects', 'update'), contextController.rebuildContext);

module.exports = router;
