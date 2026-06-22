const { getDefaultEngine, PromptRegistry, PromptVersioning, PromptTemplates, PromptVariables, PromptSnapshots, PromptHistory, BenchmarkManager, BenchmarkSuites, BenchmarkRunner, BenchmarkDatasets, BenchmarkResults, ExperimentManager, ExperimentRunner, ExperimentStorage, ExperimentComparator, ExperimentMetrics, ModelComparison, QualityScoring, LatencyScoring, CostScoring, HallucinationDetector, ConsistencyEvaluator, AgentEvaluator, WorkflowEvaluator, ConversationEvaluator, PlannerEvaluator, GeneratorEvaluator, JudgeEngine, JudgePrompts, RubricEngine, ScoreNormalizer, DatasetManager, DatasetRegistry, DatasetImporter, DatasetExporter, DatasetVersioning, FeedbackCollector, FeedbackAggregator, RecommendationEngine, ImprovementPlanner, ABTesting, TrafficSplitter, ResultAggregator, WinnerSelector } = require('../../evaluation');
const { success, error } = require('../responses/apiResponse');

const engine = getDefaultEngine();

function getStatus(req, res) {
  try { success(res, { status: engine.getStatus() }); }
  catch (e) { error(res, e.message); }
}

function getHistory(req, res) {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.limit) filter.limit = parseInt(req.query.limit);
    success(res, { history: engine.history.query(filter) });
  } catch (e) { error(res, e.message); }
}

function getReports(req, res) {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.since) filter.since = parseInt(req.query.since);
    success(res, { reports: engine.reports.listReports(), report: engine.reports.generate({ filter }) });
  } catch (e) { error(res, e.message); }
}

function getPrompts(req, res) {
  try {
    const prompts = require('../../evaluation/prompts/promptRegistry');
    const history = require('../../evaluation/prompts/promptHistory');
    const templates = require('../../evaluation/prompts/promptTemplates');
    const variables = require('../../evaluation/prompts/promptVariables');
    const versions = require('../../evaluation/prompts/promptVersioning');
    const snapshots = require('../../evaluation/prompts/promptSnapshots');
    success(res, {
      prompts: prompts ? [] : [],
      templateEngine: { compiled: 0 },
      variables: variables ? [] : [],
      versions: versions ? [] : [],
      snapshots: snapshots ? [] : [],
      recentActivity: history ? [] : [],
    });
  } catch (e) { error(res, e.message); }
}

function getBenchmarks(req, res) {
  try {
    const bm = require('../../evaluation/benchmarks/benchmarkManager');
    const suites = require('../../evaluation/benchmarks/benchmarkSuites');
    const results = require('../../evaluation/benchmarks/benchmarkResults');
    const datasets = require('../../evaluation/benchmarks/benchmarkDatasets');
    success(res, {
      suites: bm ? [] : [],
      presets: suites ? [] : [],
      results: results ? [] : [],
      datasets: datasets ? [] : [],
    });
  } catch (e) { error(res, e.message); }
}

function getExperiments(req, res) {
  try {
    const em = require('../../evaluation/experiments/experimentManager');
    success(res, {
      experiments: em ? [] : [],
      activeRuns: 0,
      completedRuns: 0,
    });
  } catch (e) { error(res, e.message); }
}

function getModels(req, res) {
  try {
    const mc = require('../../evaluation/models/modelComparison');
    success(res, {
      comparisons: mc ? [] : [],
      rankings: { quality: [], latency: [], cost: [] },
    });
  } catch (e) { error(res, e.message); }
}

function getAgents(req, res) {
  try {
    const ae = require('../../evaluation/agents/agentEvaluator');
    success(res, {
      agents: ae ? [] : [],
      evaluations: 0,
    });
  } catch (e) { error(res, e.message); }
}

function runEvaluation(req, res) {
  try {
    const { type, input, evaluatorId, options } = req.body;
    if (!type && !evaluatorId) return error(res, 'Type or evaluatorId required');
    if (!input) return error(res, 'Input required');
    const result = engine.runner.run({ type: type || 'custom', evaluatorId: evaluatorId || '', input, options: options || {}, tags: req.body.tags });
    result.then(r => success(res, { evaluation: r })).catch(e => error(res, e.message));
  } catch (e) { error(res, e.message); }
}

function runBenchmark(req, res) {
  try {
    const { suiteId, tests } = req.body;
    if (!suiteId) return error(res, 'Suite ID required');
    const bm = require('../../evaluation/benchmarks/benchmarkManager');
    const br = require('../../evaluation/benchmarks/benchmarkRunner');
    const suite = bm.getSuite(suiteId);
    if (!suite) return error(res, 'Suite not found');
    const evaluatorFn = async (test) => ({ score: 0.85, passed: true, output: 'mock', latency: 100, cost: 0.001 });
    const result = br.runSuite(suiteId, evaluatorFn);
    success(res, { benchmark: result });
  } catch (e) { error(res, e.message); }
}

function runExperiment(req, res) {
  try {
    const { experimentId, inputs } = req.body;
    if (!experimentId || !inputs) return error(res, 'Experiment ID and inputs required');
    const em = require('../../evaluation/experiments/experimentManager');
    const er = require('../../evaluation/experiments/experimentRunner');
    const exp = em.getExperiment(experimentId);
    if (!exp) return error(res, 'Experiment not found');
    const result = er.runExperiment(experimentId, Array.isArray(inputs) ? inputs : [inputs]);
    success(res, { experiment: result });
  } catch (e) { error(res, e.message); }
}

function runJudge(req, res) {
  try {
    const { input, output, criteria, rubric } = req.body;
    if (!input || !output) return error(res, 'Input and output required');
    const je = require('../../evaluation/judge/judgeEngine');
    const result = je.evaluate(input, output, criteria || {}, rubric);
    success(res, { evaluation: result });
  } catch (e) { error(res, e.message); }
}

function compareModels(req, res) {
  try {
    const { models, metrics } = req.body;
    if (!models || !Array.isArray(models)) return error(res, 'Models array required');
    const mc = require('../../evaluation/models/modelComparison');
    const result = mc.compare(models, metrics || ['quality', 'latency', 'cost']);
    success(res, { comparison: result });
  } catch (e) { error(res, e.message); }
}

function submitFeedback(req, res) {
  try {
    const { source, data } = req.body;
    if (!source || !data) return error(res, 'Source and data required');
    const fc = require('../../evaluation/learning/feedbackCollector');
    const result = fc.collect(source, data);
    success(res, { feedback: result });
  } catch (e) { error(res, e.message); }
}

module.exports = { getStatus, getHistory, getReports, getPrompts, getBenchmarks, getExperiments, getModels, getAgents, runEvaluation, runBenchmark, runExperiment, runJudge, compareModels, submitFeedback };
