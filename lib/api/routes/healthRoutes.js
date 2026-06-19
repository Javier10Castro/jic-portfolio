const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

router.get('/health', healthController.health);
router.get('/ready', healthController.ready);
router.get('/live', healthController.live);
router.get('/metrics', healthController.metrics);

module.exports = router;
