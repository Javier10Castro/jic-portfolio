const { Router } = require('express');
const telemetryController = require('../controllers/telemetryController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.get('/metrics', authorize('projects', 'read'), telemetryController.getMetricsEndpoint);
router.get('/traces', authorize('projects', 'read'), telemetryController.getTracesEndpoint);
router.get('/logs', authorize('projects', 'read'), telemetryController.getLogsEndpoint);
router.get('/health', authorize('projects', 'read'), telemetryController.getHealthEndpoint);
router.get('/analytics', authorize('projects', 'read'), telemetryController.getAnalyticsEndpoint);
router.get('/alerts', authorize('projects', 'read'), telemetryController.getAlertsEndpoint);
router.post('/alerts', authorize('projects', 'create'), validate({
  body: { name: { required: true, type: 'string' } },
}), telemetryController.createAlertEndpoint);
router.get('/diagnostics', authorize('projects', 'read'), telemetryController.getDiagnosticsEndpoint);

module.exports = router;
