const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authentication');

const router = Router();

router.use(authenticate);

router.get('/home', dashboardController.home);
router.get('/stats', dashboardController.stats);
router.get('/activity', dashboardController.activity);

module.exports = router;
