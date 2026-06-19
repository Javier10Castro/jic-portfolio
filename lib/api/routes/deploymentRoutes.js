const { Router } = require('express');
const deploymentController = require('../controllers/deploymentController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.post('/', authorize('deployments', 'create'), validate({
  body: { buildPath: { type: 'string' } },
}), deploymentController.deploy);

router.get('/', authorize('deployments', 'read'), deploymentController.listDeployments);
router.get('/:id', authorize('deployments', 'read'), deploymentController.getDeployment);
router.post('/:id/rollback', authorize('deployments', 'rollback'), deploymentController.rollbackDeployment);

module.exports = router;
