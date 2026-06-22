const express = require('express');
const router = express.Router();
const c = require('../controllers/pluginController');

router.get('/', c.listPlugins);
router.get('/installed', c.getInstalledPlugins);
router.get('/marketplace', c.getMarketplaceListings);
router.get('/search', c.searchPlugins);
router.get('/categories', c.getCategories);
router.get('/:id', c.getPlugin);
router.post('/install', c.installPlugin);
router.post('/uninstall/:id', c.uninstallPlugin);
router.post('/update/:id', c.updatePlugin);
router.post('/enable/:id', c.enablePlugin);
router.post('/disable/:id', c.disablePlugin);
router.post('/reload/:id', c.reloadPlugin);

module.exports = router;
