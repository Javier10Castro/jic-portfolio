const { getDefaultEngine } = require('../../billing');
const { success, created, error } = require('../responses/apiResponse');

function _getEngine() { return getDefaultEngine(); }

function listPlans(req, res) {
  try {
    const plans = _getEngine().listPlans();
    success(res, { plans });
  } catch (e) { error(res, e.message); }
}

function getPlan(req, res) {
  try {
    const plan = _getEngine().getPlan(req.params.id);
    if (!plan) return error(res, 'Plan not found', 404);
    success(res, { plan });
  } catch (e) { error(res, e.message); }
}

function createSubscription(req, res) {
  try {
    const { planId, customerId, interval, trialDays, coupon, quantity, seats, metadata } = req.body;
    const result = _getEngine().createSubscription(planId, customerId, { interval, trialDays, coupon, quantity, seats, metadata });
    if (!result.success) return error(res, result.error, 400);
    created(res, result);
  } catch (e) { error(res, e.message); }
}

function updateSubscription(req, res) {
  try {
    const { planId, interval, quantity, seats, metadata } = req.body;
    const engine = _getEngine();
    let result;
    if (planId) {
      result = engine.changePlan(req.params.id, planId, { prorate: req.body.prorate });
    }
    if (req.body.pause) {
      result = engine.pauseSubscription(req.params.id, { resumeAt: req.body.resumeAt });
    } else if (req.body.resume) {
      result = engine.resumeSubscription(req.params.id);
    }
    if (!result || !result.success) return error(res, 'Subscription not found', 404);
    success(res, result);
  } catch (e) { error(res, e.message); }
}

function cancelSubscription(req, res) {
  try {
    const result = _getEngine().cancelSubscription(req.params.id, { atPeriodEnd: req.body.atPeriodEnd !== false });
    if (!result.success) return error(res, result.error, 404);
    success(res, result);
  } catch (e) { error(res, e.message); }
}

function listSubscriptions(req, res) {
  try {
    const filter = req.query.status ? { status: req.query.status } : undefined;
    const subscriptions = _getEngine().listSubscriptions(filter);
    success(res, { subscriptions });
  } catch (e) { error(res, e.message); }
}

function listInvoices(req, res) {
  try {
    const filter = req.query.status ? { status: req.query.status } : undefined;
    const invoices = _getEngine().listInvoices(filter);
    success(res, { invoices });
  } catch (e) { error(res, e.message); }
}

function getInvoice(req, res) {
  try {
    const invoice = _getEngine().getInvoice(req.params.id);
    if (!invoice) return error(res, 'Invoice not found', 404);
    success(res, { invoice });
  } catch (e) { error(res, e.message); }
}

function payInvoice(req, res) {
  try {
    const engine = _getEngine();
    const invoice = engine.getInvoice(req.params.id);
    if (!invoice) return error(res, 'Invoice not found', 404);
    const payment = engine.processPayment({ amount: invoice.total, currency: invoice.currency, customerId: invoice.customerId, description: `Payment for invoice ${invoice.number}` });
    if (!payment.success) return error(res, payment.error, 400);
    const result = engine.payInvoice(req.params.id, payment);
    success(res, { invoice: result, payment: payment.payment });
  } catch (e) { error(res, e.message); }
}

function createCheckout(req, res) {
  try {
    const session = _getEngine().createCheckoutSession(req.body);
    created(res, { session });
  } catch (e) { error(res, e.message); }
}

function processWebhook(req, res) {
  try {
    const provider = req.params.provider || 'stripe';
    const event = req.body.type || req.body.event || 'unknown';
    const result = _getEngine().processWebhook(provider, event, req.body);
    success(res, { received: true, result });
  } catch (e) { error(res, e.message); }
}

function getUsage(req, res) {
  try {
    const customerId = req.query.customerId;
    if (!customerId) return error(res, 'customerId required', 400);
    const metrics = _getEngine().getAllUsageMetrics(customerId);
    const usage = {};
    metrics.forEach(m => { usage[m.metric] = m.total; });
    success(res, { customerId, usage, metrics });
  } catch (e) { error(res, e.message); }
}

function getQuotas(req, res) {
  try {
    const { customerId, planId } = req.query;
    if (!customerId || !planId) return error(res, 'customerId and planId required', 400);
    const result = _getEngine().checkQuotas(customerId, planId);
    success(res, result);
  } catch (e) { error(res, e.message); }
}

function getBudgets(req, res) {
  try {
    const budgets = _getEngine().getBudgets(req.query.customerId);
    success(res, { budgets });
  } catch (e) { error(res, e.message); }
}

function addPaymentMethod(req, res) {
  try {
    const method = _getEngine().addPaymentMethod(req.body.customerId, req.body);
    created(res, { method });
  } catch (e) { error(res, e.message); }
}

function removePaymentMethod(req, res) {
  try {
    _getEngine().removePaymentMethod(req.params.id);
    success(res, { removed: true });
  } catch (e) { error(res, e.message); }
}

function getCustomer(req, res) {
  try {
    const customer = _getEngine().getCustomer(req.params.id || req.query.customerId);
    if (!customer) return error(res, 'Customer not found', 404);
    success(res, { customer });
  } catch (e) { error(res, e.message); }
}

function updateCustomer(req, res) {
  try {
    const customer = _getEngine().updateCustomer(req.params.id, req.body);
    if (!customer) return error(res, 'Customer not found', 404);
    success(res, { customer });
  } catch (e) { error(res, e.message); }
}

module.exports = { listPlans, getPlan, createSubscription, updateSubscription, cancelSubscription, listSubscriptions, listInvoices, getInvoice, payInvoice, createCheckout, processWebhook, getUsage, getQuotas, getBudgets, addPaymentMethod, removePaymentMethod, getCustomer, updateCustomer };
