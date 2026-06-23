const { Router } = require('express');
const { streamEvents, getConnectedClients } = require('../controllers/eventsStreamController');
const { authenticate } = require('../middleware/authentication');

const router = Router();

router.use(authenticate);

router.get('/stream', streamEvents);
router.get('/clients', getConnectedClients);

module.exports = router;
