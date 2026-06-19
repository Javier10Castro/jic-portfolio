const { Router } = require('express');
const clusterController = require('../controllers/clusterController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('projects', 'read'), clusterController.getClusterHealthEndpoint);
router.get('/workers', authorize('projects', 'read'), clusterController.getWorkersEndpoint);
router.get('/queues', authorize('projects', 'read'), clusterController.getQueuesEndpoint);
router.get('/metrics', authorize('projects', 'read'), clusterController.getClusterMetricsEndpoint);
router.get('/leader', authorize('projects', 'read'), clusterController.getLeaderEndpoint);
router.post('/workers/register', authorize('projects', 'create'), validate({
  body: { type: { required: true, type: 'string' } },
}), clusterController.registerWorkerEndpoint);
router.post('/workers/remove', authorize('projects', 'create'), validate({
  body: { workerId: { required: true, type: 'string' } },
}), clusterController.removeWorkerEndpoint);
router.post('/dispatch', authorize('projects', 'create'), validate({
  body: { task: { required: true, type: 'object' } },
}), clusterController.dispatchEndpoint);

module.exports = router;
