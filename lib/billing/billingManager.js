const { SubscriptionManager } = require('./subscriptionManager');
const { CustomerManager } = require('./customerManager');
const { InvoiceManager } = require('./invoiceManager');
const { PaymentManager } = require('./paymentManager');
const { CheckoutManager } = require('./checkoutManager');
const { UsageMeter } = require('./usageMeter');
const { PricingEngine } = require('./pricingEngine');
const { TaxEngine } = require('./taxEngine');
const { DiscountEngine } = require('./discountEngine');
const { CreditManager } = require('./creditManager');
const { RefundManager } = require('./refundManager');
const { WebhookProcessor } = require('./webhookProcessor');
const { BillingEvents, EVENTS } = require('./billingEvents');
const { BillingStorage } = require('./billingStorage');
const { PlanRegistry } = require('./plans/planRegistry');
const { PlanFeatures } = require('./plans/planFeatures');
const { PlanLimits } = require('./plans/planLimits');
const { PlanVersions } = require('./plans/planVersions');
const { TrialManager } = require('./plans/trialManager');
const { UsageTracker } = require('./usage/usageTracker');
const { UsageAggregator } = require('./usage/usageAggregator');
const { QuotaCalculator } = require('./usage/quotaCalculator');
const { OverageCalculator } = require('./usage/overageCalculator');
const { InvoiceGenerator } = require('./invoices/invoiceGenerator');
const { InvoicePdf } = require('./invoices/invoicePdf');
const { InvoiceNumbering } = require('./invoices/invoiceNumbering');
const { InvoiceExporter } = require('./invoices/invoiceExporter');
const { CustomerPortal } = require('./customers/customerPortal');
const { BillingProfile } = require('./customers/billingProfile');
const { PaymentMethods } = require('./customers/paymentMethods');
const { Addresses } = require('./customers/addresses');
const { MrrCalculator } = require('./analytics/mrrCalculator');
const { ArrCalculator } = require('./analytics/arrCalculator');
const { ChurnCalculator } = require('./analytics/churnCalculator');
const { LtvCalculator } = require('./analytics/ltvCalculator');
const { CohortAnalyzer } = require('./analytics/cohortAnalyzer');
const { RevenueForecast } = require('./analytics/revenueForecast');
const { MockProvider } = require('./payments/providers/mockProvider');

class BillingManager {
  constructor(options = {}) {
    this.storage = options.storage || new BillingStorage();
    this.events = options.events || new BillingEvents();
    this.subscriptions = options.subscriptions || new SubscriptionManager({ storage: this.storage, events: this.events });
    this.customers = options.customers || new CustomerManager({ storage: this.storage });
    this.invoices = options.invoices || new InvoiceManager({ storage: this.storage, events: this.events });
    this.payments = options.payments || new PaymentManager({ storage: this.storage, events: this.events });
    this.checkout = options.checkout || new CheckoutManager({ storage: this.storage, events: this.events });
    this.usage = options.usage || new UsageMeter({ storage: this.storage });
    this.pricing = options.pricing || new PricingEngine();
    this.tax = options.tax || new TaxEngine();
    this.discounts = options.discounts || new DiscountEngine();
    this.credits = options.credits || new CreditManager({ storage: this.storage, events: this.events });
    this.refunds = options.refunds || new RefundManager({ storage: this.storage, events: this.events });
    this.webhooks = options.webhooks || new WebhookProcessor({ storage: this.storage, events: this.events });
    this.plans = options.plans || new PlanRegistry();
    this.planFeatures = options.planFeatures || new PlanFeatures();
    this.planLimits = options.planLimits || new PlanLimits();
    this.planVersions = options.planVersions || new PlanVersions();
    this.trials = options.trials || new TrialManager({ storage: this.storage, events: this.events });
    this.usageTracker = options.usageTracker || new UsageTracker({ storage: this.storage });
    this.usageAggregator = options.usageAggregator || new UsageAggregator();
    this.quotaCalculator = options.quotaCalculator || new QuotaCalculator();
    this.overageCalculator = options.overageCalculator || new OverageCalculator();
    this.invoiceGenerator = options.invoiceGenerator || new InvoiceGenerator();
    this.invoicePdf = options.invoicePdf || new InvoicePdf();
    this.invoiceNumbering = options.invoiceNumbering || new InvoiceNumbering();
    this.invoiceExporter = options.invoiceExporter || new InvoiceExporter();
    this.customerPortal = options.customerPortal || new CustomerPortal();
    this.billingProfile = options.billingProfile || new BillingProfile({ storage: this.storage });
    this.paymentMethods = options.paymentMethods || new PaymentMethods({ storage: this.storage });
    this.addresses = options.addresses || new Addresses({ storage: this.storage });
    this.mrrCalc = options.mrrCalc || new MrrCalculator();
    this.arrCalc = options.arrCalc || new ArrCalculator();
    this.churnCalc = options.churnCalc || new ChurnCalculator();
    this.ltvCalc = options.ltvCalc || new LtvCalculator();
    this.cohortCalc = options.cohortCalc || new CohortAnalyzer();
    this.revenueForecast = options.revenueForecast || new RevenueForecast();

    if (!this.payments._providers || !Object.keys(this.payments._providers).length) {
      this.payments.registerProvider('mock', new MockProvider());
    }
  }

  createCustomer(data) { return this.customers.createCustomer(data); }
  getCustomer(id) { return this.customers.getCustomer(id); }
  updateCustomer(id, data) { return this.customers.updateCustomer(id, data); }
  listCustomers(filter) { return this.customers.listCustomers(filter); }

  getPlan(id) { return this.plans.getPlan(id); }
  listPlans(filter) { return this.plans.listPlans(filter); }

  createSubscription(planId, customerId, options = {}) {
    const plan = this.plans.getPlan(planId);
    if (!plan) return { success: false, error: 'plan_not_found' };
    const customer = this.customers.getCustomer(customerId);
    if (!customer) return { success: false, error: 'customer_not_found' };
    const sub = this.subscriptions.createSubscription({ planId, customerId, price: plan.price, prices: plan.prices, ...options });
    if (sub.status === 'trialing') {
      this.trials.startTrial(customerId, planId, options.trialDays || 14);
    }
    const price = this.pricing.calculatePrice(plan, { interval: options.interval || 'monthly', quantity: options.quantity, seats: options.seats });
    const invoiceData = this.invoiceGenerator.generateInvoice(sub, { plan });
    const invoice = this.invoices.createInvoice({ customerId, subscriptionId: sub.id, items: invoiceData.lineItems, amount: invoiceData.total, currency: plan.currency || 'usd' });
    this.invoices.finalizeInvoice(invoice.id);
    return { success: true, subscription: sub, invoice, price };
  }

  cancelSubscription(id, options = {}) {
    const sub = this.subscriptions.cancelSubscription(id, options);
    if (!sub) return { success: false, error: 'subscription_not_found' };
    return { success: true, subscription: sub };
  }

  changePlan(subscriptionId, newPlanId, options = {}) {
    const sub = this.subscriptions.getSubscription(subscriptionId);
    if (!sub) return { success: false, error: 'subscription_not_found' };
    const plan = this.plans.getPlan(newPlanId);
    if (!plan) return { success: false, error: 'plan_not_found' };
    const updated = this.subscriptions.changePlan(subscriptionId, newPlanId, options);
    return { success: true, subscription: updated };
  }

  pauseSubscription(id, options = {}) {
    const sub = this.subscriptions.pauseSubscription(id, options);
    return sub ? { success: true, subscription: sub } : { success: false, error: 'subscription_not_found' };
  }

  resumeSubscription(id) {
    const sub = this.subscriptions.resumeSubscription(id);
    return sub ? { success: true, subscription: sub } : { success: false, error: 'subscription_not_found' };
  }

  getSubscription(id) { return this.subscriptions.getSubscription(id); }
  listSubscriptions(filter) { return this.subscriptions.listSubscriptions(filter); }

  createCheckoutSession(options) {
    return this.checkout.createSession(options);
  }

  processPayment(options) { return this.payments.processPayment(options); }

  createInvoice(options) {
    const invoice = this.invoices.createInvoice(options);
    if (options.finalize !== false) this.invoices.finalizeInvoice(invoice.id);
    return invoice;
  }

  payInvoice(invoiceId, paymentResult) { return this.invoices.payInvoice(invoiceId, paymentResult?.payment?.id); }
  getInvoice(id) { return this.invoices.getInvoice(id); }
  listInvoices(filter) { return this.invoices.listInvoices(filter); }

  trackUsage(customerId, metric, amount, options) { return this.usage.track(customerId, metric, amount, options); }
  getUsage(customerId, metric) { return this.usage.getUsage(customerId, metric); }
  getAllUsageMetrics(customerId) { return this.usage.getAllMetrics(customerId); }

  checkQuotas(customerId, planId) {
    const plan = this.plans.getPlan(planId);
    if (!plan) return { allowed: false, error: 'plan_not_found' };
    const limits = this.planLimits.getLimits(plan);
    const metrics = this.usage.getAllMetrics(customerId);
    const usageMap = {};
    metrics.forEach(m => { usageMap[m.metric] = m.total; });
    const usageCtx = { projects: usageMap.projects || 0, teamMembers: usageMap.team_members || 0, storage: usageMap.storage || 0, aiGenerations: usageMap.ai_generations || 0 };
    return this.quotaCalculator.checkQuota(usageCtx, limits);
  }

  getBudgets(customerId) { return []; }

  applyCredits(customerId, amount) { return this.credits.applyCredits(customerId, amount); }
  addCredits(customerId, amount, options) { return this.credits.addCredits(customerId, amount, options); }
  getCreditBalance(customerId) { return this.credits.getBalance(customerId); }

  createRefund(paymentId, amount, reason, options) { return this.refunds.createRefund(paymentId, amount, reason, options); }

  createCoupon(code, config) { return this.discounts.createCoupon(code, config); }
  applyDiscount(amount, code, options) { return this.discounts.applyDiscount(amount, code, options); }
  validateCoupon(code, options) { return this.discounts.validateCoupon(code, options); }

  addPaymentMethod(customerId, data) { return this.paymentMethods.addMethod(customerId, data); }
  removePaymentMethod(id) { return this.paymentMethods.removeMethod(id); }
  getPaymentMethods(customerId) { return this.paymentMethods.getMethods(customerId); }

  createPortalSession(customerId, options) { return this.customerPortal.createSession(customerId, options); }
  getBillingProfile(customerId) { return this.billingProfile.getProfile(customerId); }
  updateBillingProfile(customerId, data) { return this.billingProfile.updateProfile(customerId, data); }

  addAddress(customerId, data) { return this.addresses.addAddress(customerId, data); }
  getAddresses(customerId, type) { return this.addresses.getAddresses(customerId, type); }

  processWebhook(provider, event, payload, options) { return this.webhooks.process(provider, event, payload, options); }
  registerWebhookHandler(provider, event, handler) { this.webhooks.registerHandler(provider, event, handler); }

  generateReport() {
    const customers = this.customers.listCustomers();
    const subscriptions = this.subscriptions.listSubscriptions();
    const invoices = this.invoices.listInvoices();
    const payments = this.payments.listPayments();
    const mrrData = this.mrrCalc.calculate(subscriptions);
    const arrData = this.arrCalc.calculate(mrrData.mrr);
    const churnData = this.churnCalc.calculate(subscriptions);
    const ltvData = this.ltvCalc.calculateFromData(subscriptions);
    const activeTrials = this.trials.getActiveCount();
    const failedPayments = payments.filter(p => p.status === 'failed' || p.status === 'failed').length;
    const outstanding = invoices.filter(i => i.status === 'open' || i.status === 'failed').length;
    return {
      monthlyRevenue: mrrData.mrr,
      annualRevenue: arrData.arr,
      customers: customers.length,
      subscriptions: subscriptions.filter(s => s.status === 'active').length,
      activeTrials,
      failedPayments,
      outstandingInvoices: outstanding,
      usage: this.trials.getActiveCount(),
      recommendations: this._generateRecommendations({ mrr: mrrData, churn: churnData, ltv: ltvData, failedPayments, outstanding }),
      calculatedAt: Date.now()
    };
  }

  _generateRecommendations(metrics) {
    const recs = [];
    if (metrics.churn && metrics.churn.churnRate > 10) recs.push('High churn rate detected — review pricing and engagement');
    if (metrics.failedPayments > 5) recs.push('Multiple payment failures — notify customers to update payment methods');
    if (metrics.outstanding > 10) recs.push('Many outstanding invoices — consider automated dunning');
    if (metrics.ltv && metrics.ltv.ltv < 100) recs.push('Low LTV — focus on retention and upsell strategies');
    return recs;
  }
}

let _defaultEngine = null;

function getDefaultEngine(options = {}) {
  if (!_defaultEngine) _defaultEngine = new BillingManager(options);
  return _defaultEngine;
}

function createEngine(options = {}) { return new BillingManager(options); }

module.exports = { BillingManager, getDefaultEngine, createEngine };
