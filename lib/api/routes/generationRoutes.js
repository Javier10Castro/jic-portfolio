const { Router } = require('express');
const generationController = require('../controllers/generationController');
const { authenticate } = require('../middleware/authentication');
const { authorize } = require('../middleware/authorization');
const { validate } = require('../middleware/validation');

const router = Router();

router.use(authenticate);

router.post('/', authorize('projects', 'create'), validate({
  body: { prompt: { required: true, type: 'string', minLength: 1 } },
}), generationController.generate);

router.post('/html', authorize('projects', 'create'), validate({
  body: { prompt: { required: true, type: 'string', minLength: 1 } },
}), generationController.generateHtml);

router.post('/design', authorize('projects', 'create'), validate({
  body: { blueprint: { required: true } },
}), generationController.generateDesign);

router.post('/content', authorize('projects', 'create'), validate({
  body: { blueprint: { required: true } },
}), generationController.generateContent);

module.exports = router;
