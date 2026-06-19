const { Router } = require('express');
const workspaceController = require('../controllers/workspaceController');
const { authenticate } = require('../middleware/authentication');

const router = Router();

router.use(authenticate);

router.get('/', workspaceController.getWorkspace);
router.patch('/', workspaceController.updateWorkspace);

module.exports = router;
