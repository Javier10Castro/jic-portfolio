const { Router } = require('express');
const apikeyController = require('../controllers/apikeyController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('apiKeys', 'read'), apikeyController.listApiKeys);
router.post('/', authorize('apiKeys', 'create'), validate({
  body: { name: { type: 'string', minLength: 1 } },
}), apikeyController.createApiKey);

router.post('/:id/revoke', authorize('apiKeys', 'revoke'), apikeyController.revokeApiKey);

module.exports = router;
