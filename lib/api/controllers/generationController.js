const contentGenerator = require('../../content-generator');
const designStrategy = require('../../design-strategy');
const websiteBuilder = require('../../generator');
const planner = require('../../planner');
const { success } = require('../responses');
const { ValidationError } = require('../errors');

function generate(req, res) {
  const { prompt, type, options } = req.body;
  if (!prompt) throw new ValidationError('prompt is required');

  const plan = planner.planProject ? planner.planProject({ prompt }) : { prompt };
  const strategy = designStrategy.designStrategy ? designStrategy.designStrategy(plan) : { plan };
  const content = contentGenerator.generateContent(plan, strategy);
  const website = websiteBuilder.generateWebsite ? websiteBuilder.generateWebsite(content, plan, strategy) : { content, plan, strategy };

  return success(res, website);
}

function generateHtml(req, res) {
  const { prompt, options } = req.body;
  if (!prompt) throw new ValidationError('prompt is required');

  const plan = planner.planProject ? planner.planProject({ prompt }) : { prompt };
  const strategy = designStrategy.designStrategy ? designStrategy.designStrategy(plan) : { plan };
  const content = contentGenerator.generateContent(plan, strategy);
  const website = websiteBuilder.generateWebsite ? websiteBuilder.generateWebsite(content, plan, strategy) : { content, plan, strategy };

  const html = website.files?.['index.html'] || website.html || '<html><body><p>Generated</p></body></html>';
  return success(res, { html, files: website.files || {} });
}

function generateDesign(req, res) {
  const { blueprint, options } = req.body;
  if (!blueprint) throw new ValidationError('blueprint is required');
  const strategy = designStrategy.designStrategy ? designStrategy.designStrategy(blueprint) : { blueprint };
  return success(res, strategy);
}

function generateContent(req, res) {
  const { blueprint, strategy, options } = req.body;
  if (!blueprint) throw new ValidationError('blueprint is required');
  const content = contentGenerator.generateContent(blueprint, strategy || {});
  return success(res, content);
}

module.exports = { generate, generateHtml, generateDesign, generateContent };
