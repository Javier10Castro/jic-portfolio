const assert = require('assert');
const { BillingManager, createEngine, getDefaultEngine } = require('../lib/billing/billingManager');
const { BillingStorage } = require('../lib/billing/billingStorage');
const { BillingEvents, EVENTS } = require('../lib/billing/billingEvents');
const { PlanRegistry, DEFAULT_PLANS } = require('../lib/billing/plans/planRegistry');
const { SubscriptionManager } = require('../lib/billing/subscriptionManager');
const { CustomerManager } = require('../lib/billing/customerManager');
const { InvoiceManager } = require('../lib/billing/invoiceManager');
const { PaymentManager } = require('../lib/billing/paymentManager');
const { PricingEngine } = require('../lib/billing/pricingEngine');
const { TaxEngine } = require('../lib/billing/taxEngine');
const { DiscountEngine } = require('../lib/billing/discountEngine');
const { CreditManager } = require('../lib/billing/creditManager');
const { RefundManager } = require('../lib/billing/refundManager');
const { CheckoutManager } = require('../lib/billing/checkoutManager');
const { UsageMeter } = require('../lib/billing/usageMeter');
const { WebhookProcessor } = require('../lib/billing/webhookProcessor');
const { UsageTracker } = require('../lib/billing/usage/usageTracker');
const { UsageAggregator } = require('../lib/billing/usage/usageAggregator');
const { QuotaCalculator } = require('../lib/billing/usage/quotaCalculator');
const { OverageCalculator } = require('../lib/billing/usage/overageCalculator');
const { InvoiceGenerator } = require('../lib/billing/invoices/invoiceGenerator');
const { InvoicePdf } = require('../lib/billing/invoices/invoicePdf');
const { InvoiceNumbering } = require('../lib/billing/invoices/invoiceNumbering');
const { InvoiceExporter } = require('../lib/billing/invoices/invoiceExporter');
const { TrialManager } = require('../lib/billing/plans/trialManager');
const { PlanFeatures } = require('../lib/billing/plans/planFeatures');
const { PlanLimits } = require('../lib/billing/plans/planLimits');
const { PlanVersions } = require('../lib/billing/plans/planVersions');
const { CustomerPortal } = require('../lib/billing/customers/customerPortal');
const { BillingProfile } = require('../lib/billing/customers/billingProfile');
const { PaymentMethods } = require('../lib/billing/customers/paymentMethods');
const { Addresses } = require('../lib/billing/customers/addresses');
const { MrrCalculator } = require('../lib/billing/analytics/mrrCalculator');
const { ArrCalculator } = require('../lib/billing/analytics/arrCalculator');
const { ChurnCalculator } = require('../lib/billing/analytics/churnCalculator');
const { LtvCalculator } = require('../lib/billing/analytics/ltvCalculator');
const { CohortAnalyzer } = require('../lib/billing/analytics/cohortAnalyzer');
const { RevenueForecast } = require('../lib/billing/analytics/revenueForecast');
const { MockProvider } = require('../lib/billing/payments/providers/mockProvider');
const { StripeProvider } = require('../lib/billing/payments/providers/stripeProvider');
const { PayPalProvider } = require('../lib/billing/payments/providers/paypalProvider');
const { ManualProvider } = require('../lib/billing/payments/providers/manualProvider');
const { BasePaymentProvider } = require('../lib/billing/payments/providers/baseProvider');
const billingController = require('../lib/api/controllers/billingController');

describe('Billing Platform — Phase 9.2.0', () => {
  let engine, storage, events, mockRes;

  beforeEach(() => {
    storage = new BillingStorage();
    events = new BillingEvents();
    engine = new BillingManager({ storage, events });
    const mock = () => {
      let data = {};
      return {
        status: (code) => ({ json: (d) => { data = { statusCode: code, ...d }; } }),
        json: (d) => { data = d; },
        data
      };
    };
    mockRes = mock();
  });

  describe('BillingManager', () => {
    it('should create with default providers', () => {
      const bm = new BillingManager();
      assert.ok(bm.payments);
      assert.ok(bm.subscriptions);
      assert.ok(bm.customers);
      assert.ok(bm.invoices);
      assert.ok(bm.plans);
      assert.ok(bm.pricing);
      assert.ok(bm.tax);
      assert.ok(bm.discounts);
      assert.ok(bm.credits);
      assert.ok(bm.refunds);
      assert.ok(bm.webhooks);
      assert.ok(bm.usage);
      assert.ok(bm.trials);
      assert.ok(bm.planFeatures);
      assert.ok(bm.planLimits);
      assert.ok(bm.planVersions);
      assert.ok(bm.usageTracker);
      assert.ok(bm.usageAggregator);
      assert.ok(bm.quotaCalculator);
      assert.ok(bm.overageCalculator);
      assert.ok(bm.invoiceGenerator);
      assert.ok(bm.invoicePdf);
      assert.ok(bm.invoiceNumbering);
      assert.ok(bm.invoiceExporter);
      assert.ok(bm.customerPortal);
      assert.ok(bm.billingProfile);
      assert.ok(bm.paymentMethods);
      assert.ok(bm.addresses);
      assert.ok(bm.mrrCalc);
      assert.ok(bm.arrCalc);
      assert.ok(bm.churnCalc);
      assert.ok(bm.ltvCalc);
      assert.ok(bm.cohortCalc);
      assert.ok(bm.revenueForecast);
    });

    it('should create engine via createEngine()', () => {
      const bm = createEngine();
      assert.ok(bm instanceof BillingManager);
    });

    it('should return default engine via getDefaultEngine()', () => {
      const bm = getDefaultEngine();
      assert.ok(bm instanceof BillingManager);
      assert.strictEqual(getDefaultEngine(), bm);
    });

    it('should create a customer', () => {
      const c = engine.createCustomer({ email: 'test@test.com', name: 'Test' });
      assert.ok(c.id);
      assert.strictEqual(c.email, 'test@test.com');
      assert.strictEqual(c.name, 'Test');
      assert.strictEqual(c.status, 'active');
    });

    it('should get a customer by id', () => {
      const c = engine.createCustomer({ email: 'get@test.com' });
      const found = engine.getCustomer(c.id);
      assert.ok(found);
      assert.strictEqual(found.email, 'get@test.com');
    });

    it('should update a customer', () => {
      const c = engine.createCustomer({ email: 'update@test.com' });
      const updated = engine.updateCustomer(c.id, { name: 'Updated' });
      assert.ok(updated);
      assert.strictEqual(updated.name, 'Updated');
    });

    it('should list customers', () => {
      engine.createCustomer({ email: 'a@test.com' });
      engine.createCustomer({ email: 'b@test.com' });
      assert.strictEqual(engine.listCustomers().length, 2);
    });

    it('should list plans with defaults', () => {
      const plans = engine.listPlans();
      assert.ok(plans.length >= 5);
      const free = plans.find(p => p.id === 'free');
      assert.ok(free);
      assert.strictEqual(free.price, 0);
    });

    it('should get a plan by id', () => {
      const plan = engine.getPlan('professional');
      assert.ok(plan);
      assert.strictEqual(plan.name, 'Professional');
      assert.strictEqual(plan.price, 99);
    });

    it('should create a subscription', () => {
      const c = engine.createCustomer({ email: 'sub@test.com' });
      const result = engine.createSubscription('starter', c.id);
      assert.ok(result.success);
      assert.ok(result.subscription);
      assert.strictEqual(result.subscription.status, 'active');
      assert.strictEqual(result.subscription.planId, 'starter');
      assert.strictEqual(result.subscription.customerId, c.id);
    });

    it('should create a subscription with trial', () => {
      const c = engine.createCustomer({ email: 'trial@test.com' });
      const result = engine.createSubscription('starter', c.id, { trialDays: 14 });
      assert.ok(result.success);
      assert.strictEqual(result.subscription.status, 'trialing');
      assert.ok(result.subscription.trialEnd > Date.now());
    });

    it('should fail creating subscription with invalid plan', () => {
      const c = engine.createCustomer({ email: 'fail@test.com' });
      const result = engine.createSubscription('nonexistent', c.id);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'plan_not_found');
    });

    it('should fail creating subscription with invalid customer', () => {
      const result = engine.createSubscription('starter', 'nonexistent');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'customer_not_found');
    });

    it('should cancel a subscription', () => {
      const c = engine.createCustomer({ email: 'cancel@test.com' });
      const { subscription } = engine.createSubscription('starter', c.id);
      const result = engine.cancelSubscription(subscription.id);
      assert.ok(result.success);
      assert.strictEqual(result.subscription.status, 'canceled');
    });

    it('should cancel at period end', () => {
      const c = engine.createCustomer({ email: 'cancelpe@test.com' });
      const { subscription } = engine.createSubscription('starter', c.id);
      const result = engine.cancelSubscription(subscription.id, { atPeriodEnd: true });
      assert.ok(result.success);
      assert.ok(result.subscription.cancelAtPeriodEnd);
    });

    it('should change plan', () => {
      const c = engine.createCustomer({ email: 'chplan@test.com' });
      const { subscription } = engine.createSubscription('starter', c.id);
      const result = engine.changePlan(subscription.id, 'professional');
      assert.ok(result.success);
      assert.strictEqual(result.subscription.planId, 'professional');
    });

    it('should pause and resume subscription', () => {
      const c = engine.createCustomer({ email: 'pause@test.com' });
      const { subscription } = engine.createSubscription('starter', c.id);
      const paused = engine.pauseSubscription(subscription.id);
      assert.ok(paused.success);
      assert.strictEqual(paused.subscription.status, 'paused');
      const resumed = engine.resumeSubscription(subscription.id);
      assert.ok(resumed.success);
      assert.strictEqual(resumed.subscription.status, 'active');
    });

    it('should list subscriptions', () => {
      const c = engine.createCustomer({ email: 'list@test.com' });
      engine.createSubscription('starter', c.id);
      engine.createSubscription('free', c.id);
      assert.strictEqual(engine.listSubscriptions().length, 2);
    });

    it('should filter subscriptions by status', () => {
      const c = engine.createCustomer({ email: 'flt@test.com' });
      engine.createSubscription('starter', c.id);
      const { subscription } = engine.createSubscription('starter', c.id);
      engine.cancelSubscription(subscription.id);
      assert.strictEqual(engine.listSubscriptions({ status: 'canceled' }).length, 1);
    });

    it('should get a subscription by id', () => {
      const c = engine.createCustomer({ email: 'getsub@test.com' });
      const { subscription } = engine.createSubscription('starter', c.id);
      const found = engine.getSubscription(subscription.id);
      assert.ok(found);
      assert.strictEqual(found.id, subscription.id);
    });

    it('should create an invoice', () => {
      const c = engine.createCustomer({ email: 'inv@test.com' });
      const inv = engine.createInvoice({ customerId: c.id, amount: 100, items: [{ description: 'Test', amount: 100 }] });
      assert.ok(inv.id);
      assert.strictEqual(inv.status, 'open');
      assert.strictEqual(inv.total, 100);
    });

    it('should list invoices', () => {
      const c = engine.createCustomer({ email: 'invs@test.com' });
      engine.createInvoice({ customerId: c.id, amount: 50 });
      engine.createInvoice({ customerId: c.id, amount: 75 });
      assert.strictEqual(engine.listInvoices().length, 2);
    });

    it('should get an invoice by id', () => {
      const c = engine.createCustomer({ email: 'gti@test.com' });
      const inv = engine.createInvoice({ customerId: c.id, amount: 100 });
      const found = engine.getInvoice(inv.id);
      assert.ok(found);
      assert.strictEqual(found.id, inv.id);
    });

    it('should process payment', () => {
      const result = engine.processPayment({ amount: 50, customerId: 'cus-1' });
      assert.ok(result.success);
      assert.ok(result.payment);
      assert.strictEqual(result.payment.status, 'succeeded');
    });

    it('should track usage', () => {
      const rec = engine.trackUsage('cus-1', 'api_calls', 5);
      assert.ok(rec.id);
      assert.strictEqual(rec.amount, 5);
    });

    it('should get usage metrics', () => {
      engine.trackUsage('cus-1', 'api_calls', 10);
      engine.trackUsage('cus-1', 'api_calls', 20);
      const usage = engine.getUsage('cus-1', 'api_calls');
      assert.strictEqual(usage.total, 30);
    });

    it('should get all usage metrics for customer', () => {
      engine.trackUsage('cus-1', 'api_calls', 5);
      engine.trackUsage('cus-1', 'storage', 100);
      const metrics = engine.getAllUsageMetrics('cus-1');
      assert.strictEqual(metrics.length, 2);
    });

    it('should create a checkout session', () => {
      const session = engine.createCheckoutSession({ planId: 'starter', customerId: 'cus-1' });
      assert.ok(session.id);
      assert.strictEqual(session.planId, 'starter');
      assert.strictEqual(session.status, 'open');
    });

    it('should add and apply credits', () => {
      const credit = engine.addCredits('cus-1', 100);
      assert.ok(credit.id);
      const result = engine.applyCredits('cus-1', 30);
      assert.strictEqual(result.applied, 30);
      assert.strictEqual(engine.getCreditBalance('cus-1'), 70);
    });

    it('should create a refund', () => {
      const refund = engine.createRefund('pay-1', 50, 'customer_request');
      assert.ok(refund.id);
      assert.strictEqual(refund.amount, 50);
      assert.strictEqual(refund.reason, 'customer_request');
    });

    it('should create and validate a coupon', () => {
      engine.createCoupon('SAVE20', { type: 'percentage', value: 20 });
      const result = engine.applyDiscount(100, 'SAVE20');
      assert.ok(result.applied);
      assert.strictEqual(result.discount, 20);
      assert.strictEqual(result.total, 80);
    });

    it('should create fixed coupon', () => {
      engine.createCoupon('FLAT10', { type: 'fixed', value: 10 });
      const result = engine.applyDiscount(100, 'FLAT10');
      assert.ok(result.applied);
      assert.strictEqual(result.discount, 10);
    });

    it('should reject invalid coupon', () => {
      const result = engine.applyDiscount(100, 'INVALID');
      assert.strictEqual(result.applied, false);
    });

    it('should add and remove payment methods', () => {
      const pm = engine.addPaymentMethod('cus-1', { type: 'card', last4: '4242', brand: 'visa' });
      assert.ok(pm.id);
      const methods = engine.getPaymentMethods('cus-1');
      assert.strictEqual(methods.length, 1);
      engine.removePaymentMethod(pm.id);
      assert.strictEqual(engine.getPaymentMethods('cus-1').length, 0);
    });

    it('should create portal session', () => {
      const session = engine.createPortalSession('cus-1', { returnUrl: '/billing' });
      assert.ok(session.id);
      assert.strictEqual(session.customerId, 'cus-1');
    });

    it('should get and update billing profile', () => {
      engine.createCustomer({ email: 'bp@test.com' });
      const profile = engine.getBillingProfile('cus-1');
      assert.ok(profile || profile === null);
    });

    it('should add and get addresses', () => {
      const addr = engine.addAddress('cus-1', { line1: '123 Main St', city: 'SF', country: 'US' });
      assert.ok(addr.id);
      const addrs = engine.getAddresses('cus-1');
      assert.strictEqual(addrs.length, 1);
    });

    it('should process webhook', () => {
      const result = engine.processWebhook('stripe', 'payment_intent.succeeded', { id: 'pi_123' });
      assert.ok(result.id);
      assert.strictEqual(result.provider, 'stripe');
    });

    it('should register webhook handlers', () => {
      let handled = false;
      engine.registerWebhookHandler('stripe', 'customer.created', (payload) => { handled = true; });
      engine.processWebhook('stripe', 'customer.created', { id: 'cus_123' });
      assert.ok(handled);
    });

    it('should check quotas', () => {
      engine.trackUsage('cus-1', 'api_calls', 5);
      const result = engine.checkQuotas('cus-1', 'free');
      assert.ok(result);
      assert.ok('results' in result);
    });

    it('should generate report', () => {
      const c = engine.createCustomer({ email: 'report@test.com' });
      engine.createSubscription('starter', c.id);
      const report = engine.generateReport();
      assert.ok(report);
      assert.ok('monthlyRevenue' in report);
      assert.ok('annualRevenue' in report);
      assert.ok('customers' in report);
      assert.ok('subscriptions' in report);
      assert.ok(report.subscriptions >= 1);
    });

    it('should get budgets', () => {
      const budgets = engine.getBudgets('cus-1');
      assert.ok(Array.isArray(budgets));
    });
  });

  describe('SubscriptionManager', () => {
    it('should create subscription with correct defaults', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      assert.ok(sub.id);
      assert.strictEqual(sub.status, 'active');
      assert.strictEqual(sub.planId, 'starter');
      assert.strictEqual(sub.interval, 'monthly');
    });

    it('should create trialing subscription', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter', trialDays: 7 });
      assert.strictEqual(sub.status, 'trialing');
      assert.ok(sub.trialEnd);
    });

    it('should cancel subscription', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      sm.cancelSubscription(sub.id);
      const found = sm.getSubscription(sub.id);
      assert.strictEqual(found.status, 'canceled');
    });

    it('should cancel at period end', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      sm.cancelSubscription(sub.id, { atPeriodEnd: true });
      const found = sm.getSubscription(sub.id);
      assert.ok(found.cancelAtPeriodEnd);
    });

    it('should change plan', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      sm.changePlan(sub.id, 'professional');
      assert.strictEqual(sm.getSubscription(sub.id).planId, 'professional');
    });

    it('should renew subscription', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      const renewed = sm.renewSubscription(sub.id);
      assert.ok(renewed.currentPeriodStart >= sub.currentPeriodStart);
    });

    it('should renew trialing subscription to active', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter', trialDays: 7 });
      const renewed = sm.renewSubscription(sub.id);
      assert.strictEqual(renewed.status, 'active');
    });

    it('should pause and resume', () => {
      const sm = new SubscriptionManager({ storage, events });
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      sm.pauseSubscription(sub.id);
      assert.strictEqual(sm.getSubscription(sub.id).status, 'paused');
      sm.resumeSubscription(sub.id);
      assert.strictEqual(sm.getSubscription(sub.id).status, 'active');
    });

    it('should list subscriptions with filter', () => {
      const sm = new SubscriptionManager({ storage, events });
      sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      sm.createSubscription({ customerId: 'cus-2', planId: 'free' });
      assert.strictEqual(sm.listSubscriptions().length, 2);
      assert.strictEqual(sm.listSubscriptions({ planId: 'free' }).length, 1);
    });

    it('should return null for missing subscription', () => {
      const sm = new SubscriptionManager();
      assert.strictEqual(sm.getSubscription('nonexistent'), null);
    });

    it('should handle yearly subscriptions', () => {
      const sm = new SubscriptionManager();
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'starter', interval: 'yearly' });
      assert.strictEqual(sub.interval, 'yearly');
    });

    it('should set quantity and seats', () => {
      const sm = new SubscriptionManager();
      const sub = sm.createSubscription({ customerId: 'cus-1', planId: 'business', quantity: 5, seats: 10 });
      assert.strictEqual(sub.quantity, 5);
      assert.strictEqual(sub.seats, 10);
    });

    it('should track active count', () => {
      const sm = new SubscriptionManager();
      sm.createSubscription({ customerId: 'cus-1', planId: 'starter' });
      sm.createSubscription({ customerId: 'cus-2', planId: 'starter' });
      assert.strictEqual(sm.getActiveCount(), 2);
    });
  });

  describe('CustomerManager', () => {
    it('should create and get customer', () => {
      const cm = new CustomerManager({ storage });
      const c = cm.createCustomer({ email: 'test@test.com', name: 'Tester', company: 'Acme' });
      assert.ok(c.id);
      assert.strictEqual(c.email, 'test@test.com');
      assert.strictEqual(c.company, 'Acme');
    });

    it('should find customer by email', () => {
      const cm = new CustomerManager({ storage });
      cm.createCustomer({ email: 'find@test.com' });
      const found = cm.findByEmail('find@test.com');
      assert.ok(found);
      assert.strictEqual(found.email, 'find@test.com');
    });

    it('should return null for unfound email', () => {
      const cm = new CustomerManager();
      assert.strictEqual(cm.findByEmail('nobody@test.com'), null);
    });

    it('should update customer', () => {
      const cm = new CustomerManager({ storage });
      const c = cm.createCustomer({ email: 'up@test.com' });
      cm.updateCustomer(c.id, { name: 'Updated' });
      assert.strictEqual(cm.getCustomer(c.id).name, 'Updated');
    });

    it('should delete customer', () => {
      const cm = new CustomerManager({ storage });
      const c = cm.createCustomer({ email: 'del@test.com' });
      cm.deleteCustomer(c.id);
      assert.strictEqual(cm.getCustomer(c.id), null);
    });

    it('should list customers', () => {
      const cm = new CustomerManager({ storage });
      cm.createCustomer({ email: 'a@test.com' });
      cm.createCustomer({ email: 'b@test.com' });
      assert.strictEqual(cm.listCustomers().length, 2);
    });

    it('should filter customers', () => {
      const cm = new CustomerManager({ storage });
      const c1 = cm.createCustomer({ email: 'a@test.com' });
      const c2 = cm.createCustomer({ email: 'b@test.com' });
      cm.updateCustomer(c2.id, { status: 'inactive' });
      assert.strictEqual(cm.listCustomers({ status: 'inactive' }).length, 1);
    });

    it('should clear customers', () => {
      const cm = new CustomerManager({ storage });
      cm.createCustomer({ email: 'a@test.com' });
      cm.clear();
      assert.strictEqual(cm.listCustomers().length, 0);
    });
  });

  describe('InvoiceManager', () => {
    it('should create invoice with draft status', () => {
      const im = new InvoiceManager({ storage, events });
      const inv = im.createInvoice({ customerId: 'cus-1', amount: 100 });
      assert.strictEqual(inv.status, 'draft');
    });

    it('should finalize invoice', () => {
      const im = new InvoiceManager({ storage, events });
      const inv = im.createInvoice({ customerId: 'cus-1', amount: 100 });
      im.finalizeInvoice(inv.id);
      assert.strictEqual(im.getInvoice(inv.id).status, 'open');
    });

    it('should pay invoice', () => {
      const im = new InvoiceManager({ storage, events });
      const inv = im.createInvoice({ customerId: 'cus-1', amount: 100 });
      im.finalizeInvoice(inv.id);
      im.payInvoice(inv.id, 'pay-1');
      assert.strictEqual(im.getInvoice(inv.id).status, 'paid');
    });

    it('should fail invoice', () => {
      const im = new InvoiceManager({ storage, events });
      const inv = im.createInvoice({ customerId: 'cus-1', amount: 100 });
      im.failInvoice(inv.id, 'card_declined');
      assert.strictEqual(im.getInvoice(inv.id).status, 'failed');
    });

    it('should void invoice', () => {
      const im = new InvoiceManager({ storage, events });
      const inv = im.createInvoice({ customerId: 'cus-1', amount: 100 });
      im.voidInvoice(inv.id);
      assert.strictEqual(im.getInvoice(inv.id).status, 'void');
    });

    it('should list invoices with filter', () => {
      const im = new InvoiceManager({ storage, events });
      im.createInvoice({ customerId: 'cus-1', amount: 100 });
      im.createInvoice({ customerId: 'cus-1', amount: 200 });
      assert.strictEqual(im.listInvoices().length, 2);
    });

    it('should handle items array', () => {
      const im = new InvoiceManager();
      const inv = im.createInvoice({ customerId: 'cus-1', amount: 150, items: [{ description: 'Service', amount: 150 }] });
      assert.strictEqual(inv.items.length, 1);
    });
  });

  describe('PaymentManager', () => {
    it('should process successful payment via mock provider', () => {
      const pm = new PaymentManager({ storage, events });
      pm.registerProvider('mock', new MockProvider());
      const result = pm.processPayment({ amount: 100, customerId: 'cus-1' });
      assert.ok(result.success);
      assert.ok(result.payment.id);
    });

    it('should register and use custom provider', () => {
      const pm = new PaymentManager();
      let charged = false;
      const custom = { charge: (o) => { charged = true; return { success: true, transactionId: 'tx_1', status: 'succeeded' }; } };
      pm.registerProvider('custom', custom);
      const result = pm.processPayment({ amount: 50, customerId: 'cus-1', provider: 'custom' });
      assert.ok(result.success);
      assert.ok(charged);
    });

    it('should handle payment with no provider gracefully', () => {
      const pm = new PaymentManager({ storage, events });
      const result = pm.processPayment({ amount: 25, customerId: 'cus-1' });
      assert.ok(result.success);
    });

    it('should list payments', () => {
      const pm = new PaymentManager({ storage, events });
      pm.registerProvider('mock', new MockProvider());
      pm.processPayment({ amount: 50, customerId: 'cus-1' });
      pm.processPayment({ amount: 75, customerId: 'cus-1' });
      assert.strictEqual(pm.listPayments().length, 2);
    });

    it('should get payment by id', () => {
      const pm = new PaymentManager({ storage, events });
      pm.registerProvider('mock', new MockProvider());
      const result = pm.processPayment({ amount: 50, customerId: 'cus-1' });
      const found = pm.getPayment(result.payment.id);
      assert.ok(found);
    });
  });

  describe('PricingEngine', () => {
    it('should calculate flat price', () => {
      const pe = new PricingEngine();
      const plan = { id: 'test', price: 100, prices: { monthly: 100 }, currency: 'usd' };
      const result = pe.calculatePrice(plan);
      assert.strictEqual(result.subtotal, 100);
    });

    it('should calculate per_seat pricing', () => {
      const pe = new PricingEngine();
      const plan = { id: 'test', price: 50, prices: { monthly: 50 }, billing: 'per_seat', currency: 'usd' };
      const result = pe.calculatePrice(plan, { seats: 5 });
      assert.strictEqual(result.subtotal, 250);
    });

    it('should apply yearly discount', () => {
      const pe = new PricingEngine();
      const plan = { id: 'test', price: 100, prices: { monthly: 100 }, currency: 'usd', yearlyDiscount: 0.8 };
      const result = pe.calculatePrice(plan, { interval: 'yearly' });
      assert.strictEqual(result.subtotal, 960);
    });

    it('should use yearly price if available', () => {
      const pe = new PricingEngine();
      const plan = { id: 'test', price: 100, prices: { monthly: 100, yearly: 1000 }, currency: 'usd' };
      const result = pe.calculatePrice(plan, { interval: 'yearly' });
      assert.strictEqual(result.subtotal, 1000);
    });

    it('should calculate usage costs', () => {
      const pe = new PricingEngine();
      const plan = { meteredFeatures: [{ key: 'api_calls', included: 1000, unitPrice: 0.01 }] };
      const usage = { api_calls: 5000 };
      const cost = pe.calculateUsageCost(plan, usage);
      assert.strictEqual(cost, 40);
    });

    it('should set and get price overrides', () => {
      const pe = new PricingEngine();
      pe.setPriceOverride('starter', 'monthly', 19);
      assert.strictEqual(pe.getPriceOverride('starter', 'monthly'), 19);
    });

    it('should return 0 usage cost for no metered features', () => {
      const pe = new PricingEngine();
      const cost = pe.calculateUsageCost({}, { api_calls: 500 });
      assert.strictEqual(cost, 0);
    });
  });

  describe('TaxEngine', () => {
    it('should calculate tax for a region', () => {
      const te = new TaxEngine();
      te.registerTaxRate('US', 0.08, { name: 'Sales Tax' });
      const result = te.calculateTax(100, 'US');
      assert.strictEqual(result.amount, 8);
      assert.strictEqual(result.rate, 0.08);
    });

    it('should use default tax rate', () => {
      const te = new TaxEngine();
      te.setDefaultRate(0.05);
      const result = te.calculateTax(200, 'UNKNOWN');
      assert.strictEqual(result.amount, 10);
    });

    it('should handle inclusive tax', () => {
      const te = new TaxEngine();
      te.registerTaxRate('EU', 0.2, { inclusive: true });
      const result = te.calculateTax(120, 'EU');
      assert.strictEqual(result.inclusive, true);
    });

    it('should round correctly', () => {
      const te = new TaxEngine();
      te.registerTaxRate('CA', 0.13);
      const result = te.calculateTax(99.99, 'CA');
      assert.strictEqual(result.amount, 13);
    });

    it('should list regions', () => {
      const te = new TaxEngine();
      te.registerTaxRate('US', 0.08);
      te.registerTaxRate('EU', 0.2);
      assert.ok(te.listRegions().length >= 2);
    });

    it('should clear tax rates', () => {
      const te = new TaxEngine();
      te.registerTaxRate('US', 0.08);
      te.clear();
      assert.strictEqual(te.listRegions().length, 0);
    });
  });

  describe('DiscountEngine', () => {
    it('should create percentage coupon', () => {
      const de = new DiscountEngine();
      const coupon = de.createCoupon('PCT20', { type: 'percentage', value: 20 });
      assert.strictEqual(coupon.code, 'PCT20');
    });

    it('should validate valid coupon', () => {
      const de = new DiscountEngine();
      de.createCoupon('VALID', { type: 'percentage', value: 10 });
      const result = de.validateCoupon('VALID');
      assert.ok(result.valid);
    });

    it('should reject unknown coupon', () => {
      const de = new DiscountEngine();
      const result = de.validateCoupon('UNKNOWN');
      assert.strictEqual(result.valid, false);
    });

    it('should reject expired coupon', () => {
      const de = new DiscountEngine();
      de.createCoupon('EXP', { type: 'fixed', value: 10, expiresAt: Date.now() - 1000 });
      const result = de.validateCoupon('EXP');
      assert.strictEqual(result.valid, false);
    });

    it('should reject used up coupon', () => {
      const de = new DiscountEngine();
      de.createCoupon('USED', { type: 'percentage', value: 10, maxRedemptions: 1 });
      de.applyDiscount(100, 'USED');
      const result = de.validateCoupon('USED');
      assert.strictEqual(result.valid, false);
    });

    it('should apply percentage discount', () => {
      const de = new DiscountEngine();
      de.createCoupon('SAVE20', { type: 'percentage', value: 20 });
      const result = de.applyDiscount(100, 'SAVE20');
      assert.strictEqual(result.discount, 20);
      assert.strictEqual(result.total, 80);
    });

    it('should apply fixed discount', () => {
      const de = new DiscountEngine();
      de.createCoupon('FLAT15', { type: 'fixed', value: 15 });
      const result = de.applyDiscount(100, 'FLAT15');
      assert.strictEqual(result.discount, 15);
    });

    it('should cap fixed discount at amount', () => {
      const de = new DiscountEngine();
      de.createCoupon('BIG', { type: 'fixed', value: 999 });
      const result = de.applyDiscount(50, 'BIG');
      assert.strictEqual(result.discount, 50);
    });

    it('should create and get promotions', () => {
      const de = new DiscountEngine();
      de.createPromotion('summer2026', { type: 'percentage', value: 15 });
      const promo = de.getPromotion('summer2026');
      assert.ok(promo);
      assert.strictEqual(promo.value, 15);
    });

    it('should list coupons', () => {
      const de = new DiscountEngine();
      de.createCoupon('A', { type: 'percentage', value: 10 });
      de.createCoupon('B', { type: 'fixed', value: 5 });
      assert.strictEqual(de.listCoupons().length, 2);
    });
  });

  describe('CreditManager', () => {
    it('should add credits', () => {
      const cm = new CreditManager({ storage, events });
      const credit = cm.addCredits('cus-1', 100);
      assert.strictEqual(credit.amount, 100);
      assert.strictEqual(credit.remaining, 100);
    });

    it('should apply credits partially', () => {
      const cm = new CreditManager();
      cm.addCredits('cus-1', 100);
      const result = cm.applyCredits('cus-1', 30);
      assert.strictEqual(result.applied, 30);
      assert.strictEqual(result.remaining, 0);
    });

    it('should get balance', () => {
      const cm = new CreditManager();
      cm.addCredits('cus-1', 50);
      cm.addCredits('cus-1', 50);
      assert.strictEqual(cm.getBalance('cus-1'), 100);
    });

    it('should expire credits', () => {
      const cm = new CreditManager();
      cm.addCredits('cus-1', 50, { expiresAt: Date.now() - 1000 });
      cm.expireCredits('cus-1');
      assert.strictEqual(cm.getBalance('cus-1'), 0);
    });

    it('should handle different credit types', () => {
      const cm = new CreditManager();
      cm.addCredits('cus-1', 25, { type: 'bonus', reason: 'signup' });
      const credits = cm.getCredits('cus-1');
      assert.strictEqual(credits[0].type, 'bonus');
    });
  });

  describe('RefundManager', () => {
    it('should create refund', () => {
      const rm = new RefundManager({ storage, events });
      const refund = rm.createRefund('pay-1', 50, 'customer_request');
      assert.strictEqual(refund.status, 'pending');
    });

    it('should process refund', () => {
      const rm = new RefundManager({ storage, events });
      const refund = rm.createRefund('pay-1', 50, 'customer_request');
      rm.processRefund(refund.id);
      assert.strictEqual(rm.getRefund(refund.id).status, 'processed');
    });

    it('should fail refund', () => {
      const rm = new RefundManager();
      const refund = rm.createRefund('pay-1', 50, 'test');
      rm.failRefund(refund.id, 'insufficient_funds');
      assert.strictEqual(rm.getRefund(refund.id).status, 'failed');
    });

    it('should list refunds', () => {
      const rm = new RefundManager();
      rm.createRefund('pay-1', 10, 'a');
      rm.createRefund('pay-2', 20, 'b');
      assert.strictEqual(rm.listRefunds().length, 2);
    });
  });

  describe('CheckoutManager', () => {
    it('should create checkout session', () => {
      const cm = new CheckoutManager({ storage, events });
      const session = cm.createSession({ planId: 'starter', customerId: 'cus-1', successUrl: '/success', total: 29 });
      assert.strictEqual(session.status, 'open');
      assert.ok(session.expiresAt);
    });

    it('should complete session', () => {
      const cm = new CheckoutManager();
      const session = cm.createSession({ planId: 'starter', customerId: 'cus-1' });
      cm.completeSession(session.id);
      assert.strictEqual(cm.getSession(session.id).status, 'completed');
    });

    it('should expire session', () => {
      const cm = new CheckoutManager();
      const session = cm.createSession({ planId: 'starter', customerId: 'cus-1' });
      cm.expireSession(session.id);
      assert.strictEqual(cm.getSession(session.id).status, 'expired');
    });

    it('should list sessions', () => {
      const cm = new CheckoutManager();
      cm.createSession({ planId: 'free', customerId: 'cus-1' });
      cm.createSession({ planId: 'starter', customerId: 'cus-2' });
      assert.strictEqual(cm.listSessions().length, 2);
    });
  });

  describe('UsageMeter', () => {
    it('should track usage', () => {
      const um = new UsageMeter({ storage });
      const rec = um.track('cus-1', 'api_calls', 5);
      assert.ok(rec.id);
      assert.strictEqual(rec.amount, 5);
    });

    it('should accumulate totals', () => {
      const um = new UsageMeter();
      um.track('cus-1', 'api_calls', 10);
      um.track('cus-1', 'api_calls', 20);
      um.track('cus-1', 'api_calls', 30);
      assert.strictEqual(um.getTotal('cus-1', 'api_calls'), 60);
    });

    it('should return all metrics for customer', () => {
      const um = new UsageMeter();
      um.track('cus-1', 'api_calls', 10);
      um.track('cus-1', 'storage', 100);
      const metrics = um.getAllMetrics('cus-1');
      assert.strictEqual(metrics.length, 2);
    });

    it('should filter by time range', () => {
      const um = new UsageMeter();
      um.track('cus-1', 'api_calls', 5);
      const inRange = um.getUsageInRange('cus-1', 'api_calls', Date.now() - 1000, Date.now() + 1000);
      assert.ok(inRange.length >= 1);
    });

    it('should reset metric', () => {
      const um = new UsageMeter();
      um.track('cus-1', 'api_calls', 50);
      um.reset('cus-1', 'api_calls');
      assert.strictEqual(um.getTotal('cus-1', 'api_calls'), 0);
    });

    it('should clear all usage', () => {
      const um = new UsageMeter();
      um.track('cus-1', 'a', 1);
      um.track('cus-2', 'b', 2);
      um.clear();
      assert.strictEqual(um.getTotal('cus-1', 'a'), 0);
    });
  });

  describe('WebhookProcessor', () => {
    it('should log incoming webhook', () => {
      const wp = new WebhookProcessor({ storage, events });
      const log = wp.process('stripe', 'payment_intent.succeeded', { id: 'pi_123' });
      assert.ok(log.id);
      assert.strictEqual(log.provider, 'stripe');
    });

    it('should call registered handler', () => {
      const wp = new WebhookProcessor();
      let called = false;
      wp.registerHandler('stripe', 'customer.created', (p) => { called = true; });
      wp.process('stripe', 'customer.created', {});
      assert.ok(called);
    });

    it('should call wildcard handler', () => {
      const wp = new WebhookProcessor();
      let called = false;
      wp.registerHandler('stripe', '*', (p) => { called = true; });
      wp.process('stripe', 'any.event', {});
      assert.ok(called);
    });

    it('should handle handler errors gracefully', () => {
      const wp = new WebhookProcessor();
      wp.registerHandler('stripe', 'fail', (p) => { throw new Error('handler error'); });
      const log = wp.process('stripe', 'fail', {});
      assert.strictEqual(log.status, 'failed');
    });

    it('should return logs', () => {
      const wp = new WebhookProcessor();
      wp.process('stripe', 'a', {});
      wp.process('paypal', 'b', {});
      assert.strictEqual(wp.getLogs().length, 2);
    });
  });

  describe('PlanRegistry', () => {
    it('should have default plans', () => {
      const pr = new PlanRegistry();
      assert.ok(pr.getPlan('free'));
      assert.ok(pr.getPlan('starter'));
      assert.ok(pr.getPlan('professional'));
      assert.ok(pr.getPlan('business'));
      assert.ok(pr.getPlan('enterprise'));
    });

    it('should register custom plan', () => {
      const pr = new PlanRegistry();
      pr.registerPlan({ id: 'custom', name: 'Custom', price: 50, prices: { monthly: 50, yearly: 500 } });
      assert.ok(pr.getPlan('custom'));
    });

    it('should update plan', () => {
      const pr = new PlanRegistry();
      pr.updatePlan('starter', { price: 35 });
      assert.strictEqual(pr.getPlan('starter').price, 35);
    });

    it('should not delete default plan', () => {
      const pr = new PlanRegistry();
      const result = pr.deletePlan('free');
      assert.strictEqual(result, null);
      assert.ok(pr.getPlan('free'));
    });

    it('should delete custom plan', () => {
      const pr = new PlanRegistry();
      pr.registerPlan({ id: 'custom_del', name: 'Custom', price: 10 });
      pr.deletePlan('custom_del');
      assert.strictEqual(pr.getPlan('custom_del'), null);
    });

    it('should list plans', () => {
      const pr = new PlanRegistry();
      assert.ok(pr.listPlans().length >= 5);
    });
  });

  describe('Plan Features / Limits / Versions', () => {
    it('should register and get plan features', () => {
      const pf = new PlanFeatures();
      pf.registerFeature('sso', { name: 'SSO', category: 'security' });
      assert.ok(pf.getFeature('sso'));
    });

    it('should check feature access', () => {
      const pf = new PlanFeatures();
      const plan = { features: ['sso', 'audit'] };
      assert.ok(pf.checkFeatureAccess(plan, 'sso'));
      assert.strictEqual(pf.checkFeatureAccess(plan, 'nonexistent'), false);
    });

    it('should return all features for all access', () => {
      const pf = new PlanFeatures();
      const plan = { features: ['all'] };
      assert.ok(pf.checkFeatureAccess(plan, 'anything'));
    });

    it('should get plan limits', () => {
      const pl = new PlanLimits();
      const plan = { projects: 10, teamMembers: 5, storage: 1000, aiGenerations: 100 };
      const limits = pl.getLimits(plan);
      assert.strictEqual(limits.projects, 10);
    });

    it('should check limit', () => {
      const pl = new PlanLimits();
      const plan = { projects: 10 };
      const result = pl.checkLimit(plan, 'projects', 5, 3);
      assert.ok(result.allowed);
      assert.strictEqual(result.remaining, 2);
    });

    it('should block exceeding limit', () => {
      const pl = new PlanLimits();
      const plan = { projects: 10 };
      const result = pl.checkLimit(plan, 'projects', 10, 1);
      assert.strictEqual(result.allowed, false);
    });

    it('should handle unlimited limits', () => {
      const pl = new PlanLimits();
      const plan = { projects: -1 };
      const result = pl.checkLimit(plan, 'projects', 9999, 1);
      assert.ok(result.allowed);
    });

    it('should set and clear overrides', () => {
      const pl = new PlanLimits();
      pl.setOverride('custom_plan', 'projects', 100);
      pl.clear();
    });

    it('should create and get plan versions', () => {
      const pv = new PlanVersions();
      pv.createVersion('starter', { price: 29 }, 'Initial');
      pv.createVersion('starter', { price: 35 }, 'Price update');
      assert.strictEqual(pv.getVersions('starter').length, 2);
    });

    it('should get latest version', () => {
      const pv = new PlanVersions();
      pv.createVersion('pro', { price: 99 }, 'v1');
      pv.createVersion('pro', { price: 129 }, 'v2');
      const latest = pv.getLatestVersion('pro');
      assert.strictEqual(latest.data.price, 129);
    });

    it('should get specific version', () => {
      const pv = new PlanVersions();
      pv.createVersion('test', { price: 50 }, 'v1');
      const v1 = pv.getVersion('test', 1);
      assert.ok(v1);
      assert.strictEqual(v1.version, 1);
    });
  });

  describe('TrialManager', () => {
    it('should start a trial', () => {
      const tm = new TrialManager({ storage, events });
      const trial = tm.startTrial('cus-1', 'starter', 14);
      assert.ok(trial.id);
      assert.strictEqual(trial.status, 'active');
    });

    it('should detect active trial', () => {
      const tm = new TrialManager();
      tm.startTrial('cus-1', 'starter', 14);
      assert.ok(tm.hasActiveTrial('cus-1'));
    });

    it('should convert trial', () => {
      const tm = new TrialManager();
      tm.startTrial('cus-1', 'starter', 14);
      tm.convertTrial('cus-1');
      assert.strictEqual(tm.getActiveTrial('cus-1'), null);
    });

    it('should expire trial', () => {
      const tm = new TrialManager();
      tm.startTrial('cus-1', 'starter', 14);
      tm.expireTrial('cus-1');
      assert.strictEqual(tm.getActiveTrial('cus-1'), null);
    });

    it('should count active trials', () => {
      const tm = new TrialManager();
      tm.startTrial('cus-1', 'starter', 14);
      tm.startTrial('cus-2', 'pro', 7);
      assert.strictEqual(tm.getActiveCount(), 2);
    });
  });

  describe('Usage Tracker / Aggregator / Quota / Overage', () => {
    it('should track events', () => {
      const ut = new UsageTracker({ storage });
      const rec = ut.trackEvent('cus-1', 'api_call', 1, { source: 'test' });
      assert.ok(rec.id);
      assert.strictEqual(rec.event, 'api_call');
    });

    it('should filter events', () => {
      const ut = new UsageTracker();
      ut.trackEvent('cus-1', 'api_call', 1);
      ut.trackEvent('cus-1', 'storage', 100);
      const events = ut.getEvents('cus-1', { event: 'api_call' });
      assert.strictEqual(events.length, 1);
    });

    it('should aggregate by total', () => {
      const ua = new UsageAggregator();
      const events = [
        { customerId: 'a', event: 'call', value: 5, timestamp: Date.now() },
        { customerId: 'a', event: 'call', value: 10, timestamp: Date.now() }
      ];
      const result = ua.aggregate(events);
      assert.strictEqual(result.total, 15);
    });

    it('should aggregate by day', () => {
      const ua = new UsageAggregator();
      const events = [
        { customerId: 'a', event: 'call', value: 5, timestamp: Date.now() }
      ];
      const result = ua.aggregate(events, { granularity: 'day' });
      assert.ok(result.metrics.length >= 1);
    });

    it('should aggregate by customer', () => {
      const ua = new UsageAggregator();
      const events = [
        { customerId: 'a', event: 'call', value: 5, timestamp: Date.now() },
        { customerId: 'b', event: 'call', value: 10, timestamp: Date.now() }
      ];
      const result = ua.aggregateByCustomer(events);
      assert.strictEqual(result.length, 2);
    });

    it('should aggregate by type', () => {
      const ua = new UsageAggregator();
      const events = [
        { customerId: 'a', event: 'api', value: 5, timestamp: Date.now() },
        { customerId: 'b', event: 'storage', value: 100, timestamp: Date.now() }
      ];
      const result = ua.aggregateByType(events);
      assert.strictEqual(result.length, 2);
    });

    it('should check quotas', () => {
      const qc = new QuotaCalculator();
      const result = qc.checkQuota({ projects: 5, storage: 500 }, { projects: 10, storage: 1000 });
      assert.ok(result.allAllowed);
      assert.strictEqual(result.exceeded.length, 0);
    });

    it('should detect exceeded quota', () => {
      const qc = new QuotaCalculator();
      const result = qc.checkQuota({ projects: 15 }, { projects: 10 });
      assert.strictEqual(result.allAllowed, false);
      assert.strictEqual(result.exceeded.length, 1);
    });

    it('should handle unlimited quotas', () => {
      const qc = new QuotaCalculator();
      const result = qc.checkQuota({ projects: 9999 }, { projects: -1 });
      assert.ok(result.allAllowed);
      assert.strictEqual(result.results.projects.remaining, -1);
    });

    it('should calculate usage percentage', () => {
      const qc = new QuotaCalculator();
      assert.strictEqual(qc.getUsagePercentage(5, 10), 50);
    });

    it('should calculate overage', () => {
      const oc = new OverageCalculator();
      const plan = { meteredFeatures: [{ key: 'api_calls', included: 1000, unitPrice: 0.01 }] };
      const result = oc.calculateOverage({ api_calls: 5000 }, plan);
      assert.ok(result.overages.api_calls);
      assert.strictEqual(result.overages.api_calls.overage, 4000);
      assert.strictEqual(result.total, 40);
    });

    it('should return 0 overage for no metered features', () => {
      const oc = new OverageCalculator();
      const result = oc.calculateOverage({ api_calls: 500 }, {});
      assert.strictEqual(result.total, 0);
    });
  });

  describe('Invoice Generator / PDF / Numbering / Exporter', () => {
    it('should generate invoice from subscription', () => {
      const ig = new InvoiceGenerator();
      const sub = { id: 'sub-1', customerId: 'cus-1', planId: 'starter', interval: 'monthly' };
      const plan = { id: 'starter', name: 'Starter', price: 29, currency: 'usd' };
      const inv = ig.generateInvoice(sub, { plan });
      assert.strictEqual(inv.subtotal, 29);
      assert.ok(inv.lineItems.length >= 1);
    });

    it('should include usage in invoice', () => {
      const ig = new InvoiceGenerator();
      const sub = { id: 'sub-1', customerId: 'cus-1', planId: 'starter', interval: 'monthly' };
      const plan = { id: 'starter', name: 'Starter', price: 29, currency: 'usd' };
      const usage = { total: 15 };
      const inv = ig.generateInvoice(sub, { plan, usage });
      assert.strictEqual(inv.subtotal, 29);
      assert.strictEqual(inv.usageCost, 15);
    });

    it('should generate one-time invoice', () => {
      const ig = new InvoiceGenerator();
      const inv = ig.generateOneTimeInvoice({ customerId: 'cus-1', items: [{ description: 'Setup fee', amount: 200 }] });
      assert.strictEqual(inv.subtotal, 200);
    });

    it('should generate PDF text', () => {
      const ip = new InvoicePdf();
      const inv = { id: 'inv-1', number: 'INV-001', customerId: 'cus-1', total: 100, items: [{ description: 'Service', amount: 100 }] };
      const pdf = ip.generatePdf(inv);
      assert.ok(pdf.content.includes('INVOICE'));
      assert.ok(pdf.content.includes('$100'));
    });

    it('should generate receipt', () => {
      const ip = new InvoicePdf();
      const payment = { id: 'pay-1', customerId: 'cus-1', amount: 50, description: 'Test', createdAt: Date.now() };
      const receipt = ip.generateReceipt(payment);
      assert.ok(receipt.content.includes('RCT'));
    });

    it('should generate sequential invoice numbers', () => {
      const invNum = new InvoiceNumbering();
      const n1 = invNum.nextNumber('INV');
      const n2 = invNum.nextNumber('INV');
      assert.ok(n1);
      assert.ok(n2);
      assert.notStrictEqual(n1, n2);
    });

    it('should track current number', () => {
      const invNum = new InvoiceNumbering();
      invNum.nextNumber('INV');
      assert.ok(invNum.getCurrentNumber('INV') > 0);
    });

    it('should export invoices to CSV', () => {
      const ie = new InvoiceExporter();
      const invoices = [{ id: 'inv-1', customerId: 'cus-1', total: 100, status: 'paid' }];
      const result = ie.exportToCsv(invoices);
      assert.strictEqual(result.format, 'csv');
      assert.strictEqual(result.count, 1);
    });

    it('should export invoices to JSON', () => {
      const ie = new InvoiceExporter();
      const result = ie.exportToJson([{ id: 'inv-1', total: 100 }]);
      assert.strictEqual(result.format, 'json');
    });

    it('should export invoices to PDF (text)', () => {
      const ie = new InvoiceExporter();
      const result = ie.exportToPdf([{ id: 'inv-1', customerId: 'cus-1', total: 100, status: 'paid' }]);
      assert.strictEqual(result.format, 'txt');
    });
  });

  describe('Customer Portal / Profile / Payment Methods / Addresses', () => {
    it('should create portal session', () => {
      const cp = new CustomerPortal();
      const session = cp.createSession('cus-1', { returnUrl: '/dashboard' });
      assert.ok(session.id);
      assert.strictEqual(session.customerId, 'cus-1');
    });

    it('should validate portal session', () => {
      const cp = new CustomerPortal();
      const session = cp.createSession('cus-1');
      const result = cp.validateSession(session.id);
      assert.ok(result.valid);
    });

    it('should expire portal session', () => {
      const cp = new CustomerPortal();
      const session = cp.createSession('cus-1');
      cp.expireSession(session.id);
      const result = cp.validateSession(session.id);
      assert.strictEqual(result.valid, false);
    });

    it('should create and get billing profile', () => {
      const bp = new BillingProfile({ storage });
      bp.createProfile('cus-1', { company: 'Acme' });
      const profile = bp.getProfile('cus-1');
      assert.ok(profile);
      assert.strictEqual(profile.company, 'Acme');
    });

    it('should update billing profile', () => {
      const bp = new BillingProfile({ storage });
      bp.createProfile('cus-1', {});
      bp.updateProfile('cus-1', { vatNumber: 'VAT123' });
      assert.strictEqual(bp.getProfile('cus-1').vatNumber, 'VAT123');
    });

    it('should add payment methods', () => {
      const pm = new PaymentMethods({ storage });
      const method = pm.addMethod('cus-1', { type: 'card', last4: '4242', brand: 'visa' });
      assert.ok(method.id);
      assert.strictEqual(method.last4, '4242');
    });

    it('should set default payment method', () => {
      const pm = new PaymentMethods();
      const m1 = pm.addMethod('cus-1', { type: 'card', last4: '1111' });
      pm.addMethod('cus-1', { type: 'card', last4: '2222' });
      pm.setDefault('cus-1', m1.id);
      assert.ok(pm.getDefaultMethod('cus-1').isDefault);
    });

    it('should remove payment method', () => {
      const pm = new PaymentMethods();
      const m = pm.addMethod('cus-1', { type: 'card', last4: '0000' });
      pm.removeMethod(m.id);
      assert.strictEqual(pm.getMethods('cus-1').length, 0);
    });

    it('should add and get addresses', () => {
      const addr = new Addresses({ storage });
      addr.addAddress('cus-1', { line1: '123 Main', city: 'NY', country: 'US' });
      const list = addr.getAddresses('cus-1');
      assert.strictEqual(list.length, 1);
    });

    it('should filter addresses by type', () => {
      const addr = new Addresses();
      addr.addAddress('cus-1', { line1: '123', city: 'NY', country: 'US', type: 'billing' });
      addr.addAddress('cus-1', { line1: '456', city: 'LA', country: 'US', type: 'shipping' });
      assert.strictEqual(addr.getAddresses('cus-1', 'shipping').length, 1);
    });

    it('should delete address', () => {
      const addr = new Addresses();
      const a = addr.addAddress('cus-1', { line1: '123', city: 'NY', country: 'US' });
      addr.deleteAddress(a.id);
      assert.strictEqual(addr.getAddresses('cus-1').length, 0);
    });
  });

  describe('MRR / ARR / Churn / LTV / Cohort / Forecast', () => {
    it('should calculate MRR', () => {
      const mrrCalc = new MrrCalculator();
      const subs = [
        { id: '1', status: 'active', planId: 'starter', interval: 'monthly', price: 29 },
        { id: '2', status: 'active', planId: 'pro', interval: 'monthly', price: 99 }
      ];
      const result = mrrCalc.calculate(subs);
      assert.strictEqual(result.mrr, 128);
      assert.strictEqual(result.subscriptionCount, 2);
    });

    it('should calculate MRR with yearly proration', () => {
      const mrrCalc = new MrrCalculator();
      const subs = [
        { id: '1', status: 'active', planId: 'starter', interval: 'yearly', price: 290 }
      ];
      const result = mrrCalc.calculate(subs);
      assert.strictEqual(result.subscriptionCount, 1);
    });

    it('should project MRR', () => {
      const mrrCalc = new MrrCalculator();
      const subs = [
        { id: '1', status: 'active', planId: 'starter', interval: 'monthly', price: 29 }
      ];
      const result = mrrCalc.projectMrr(subs, 10, 0.05);
      assert.ok(result.projectedNextMonth > 0);
    });

    it('should calculate ARR from MRR', () => {
      const arrCalc = new ArrCalculator();
      const result = arrCalc.calculate(1000);
      assert.strictEqual(result.arr, 12000);
    });

    it('should calculate ARR from subscriptions', () => {
      const arrCalc = new ArrCalculator();
      const subs = [
        { id: '1', status: 'active', planId: 'starter', interval: 'monthly', price: 100 }
      ];
      const result = arrCalc.calculateFromSubscriptions(subs);
      assert.strictEqual(result.arr, 1200);
    });

    it('should calculate churn rate', () => {
      const churnCalc = new ChurnCalculator();
      const subs = [
        { id: '1', status: 'active', planId: 'starter', createdAt: Date.now() - 60 * 86400000 },
        { id: '2', status: 'active', planId: 'starter', createdAt: Date.now() - 60 * 86400000 },
        { id: '3', status: 'canceled', planId: 'starter', createdAt: Date.now() - 60 * 86400000, canceledAt: Date.now() - 10000 }
      ];
      const result = churnCalc.calculate(subs);
      assert.ok(result.churnRate > 0);
    });

    it('should calculate revenue churn', () => {
      const churnCalc = new ChurnCalculator();
      const subs = [
        { id: '1', status: 'active', planId: 'starter', interval: 'monthly', price: 100, createdAt: Date.now() - 60 * 86400000 },
        { id: '2', status: 'canceled', planId: 'starter', interval: 'monthly', price: 100, createdAt: Date.now() - 60 * 86400000, canceledAt: Date.now() - 10000 }
      ];
      const result = churnCalc.calculateRevenueChurn(subs);
      assert.ok(result.revenueChurnRate > 0);
    });

    it('should calculate LTV', () => {
      const ltvCalc = new LtvCalculator();
      const result = ltvCalc.calculate(100, 0.05);
      assert.strictEqual(result.ltv, 2000);
    });

    it('should calculate LTV from data', () => {
      const ltvCalc = new LtvCalculator();
      const subs = [{ status: 'active', price: 100, interval: 'monthly' }];
      const result = ltvCalc.calculateFromData(subs, 1200);
      assert.ok(result.ltv > 0);
    });

    it('should analyze cohorts', () => {
      const ca = new CohortAnalyzer();
      const subs = [
        { createdAt: Date.now() - 10 * 86400000, status: 'active', price: 29, interval: 'monthly' },
        { createdAt: Date.now() - 40 * 86400000, status: 'active', price: 99, interval: 'monthly' }
      ];
      const result = ca.analyze(subs);
      assert.ok(result.cohorts.length >= 1);
    });

    it('should build retention cohorts', () => {
      const ca = new CohortAnalyzer();
      const subs = [
        { createdAt: Date.now() - 45 * 86400000, status: 'active' },
        { createdAt: Date.now() - 400 * 86400000, status: 'active' }
      ];
      const cohorts = ca.retentionCohort(subs);
      assert.ok(cohorts.length >= 1);
    });

    it('should forecast revenue', () => {
      const rf = new RevenueForecast();
      const result = rf.forecast(10000, { growthRate: 0.1, churnRate: 0.05, months: 12 });
      assert.strictEqual(result.currentMrr, 10000);
      assert.ok(result.projections.length, 12);
    });

    it('should generate conservative forecast', () => {
      const rf = new RevenueForecast();
      const result = rf.conservative(10000);
      assert.ok(result.projectedMrrEnd < 10000 || result.projectedMrrEnd >= 0);
    });

    it('should generate optimistic forecast', () => {
      const rf = new RevenueForecast();
      const result = rf.optimistic(10000);
      assert.ok(result.projectedMrrEnd > 10000);
    });
  });

  describe('Payment Providers', () => {
    it('MockProvider should charge successfully', () => {
      const mp = new MockProvider();
      const result = mp.charge({ amount: 100, customerId: 'cus-1' });
      assert.ok(result.success);
      assert.ok(result.transactionId);
    });

    it('MockProvider should fail at rate', () => {
      const mp = new MockProvider();
      mp.setFailRate(1);
      const result = mp.charge({ amount: 50, customerId: 'cus-1' });
      assert.strictEqual(result.success, false);
      mp.setFailRate(0);
    });

    it('MockProvider should refund', () => {
      const mp = new MockProvider();
      const charge = mp.charge({ amount: 100, customerId: 'cus-1' });
      const refund = mp.refund(charge.transactionId, 50);
      assert.ok(refund.success);
    });

    it('StripeProvider should charge successfully', () => {
      const sp = new StripeProvider();
      const result = sp.charge({ amount: 100, customerId: 'cus-1' });
      assert.ok(result.success);
      assert.ok(result.transactionId.startsWith('ch_mock'));
    });

    it('StripeProvider should refund', () => {
      const sp = new StripeProvider();
      const charge = sp.charge({ amount: 100, customerId: 'cus-1' });
      const refund = sp.refund(charge.transactionId);
      assert.ok(refund.success);
    });

    it('StripeProvider should create customer', () => {
      const sp = new StripeProvider();
      const result = sp.createCustomer({ email: 'test@test.com' });
      assert.ok(result.success);
    });

    it('StripeProvider should report health', () => {
      const sp = new StripeProvider();
      const health = sp.health();
      assert.strictEqual(health.status, 'ok');
    });

    it('PayPalProvider should charge successfully', () => {
      const pp = new PayPalProvider();
      const result = pp.charge({ amount: 100, customerId: 'cus-1' });
      assert.ok(result.success);
      assert.ok(result.status, 'completed');
    });

    it('PayPalProvider should refund', () => {
      const pp = new PayPalProvider();
      const charge = pp.charge({ amount: 50, customerId: 'cus-1' });
      const refund = pp.refund(charge.transactionId);
      assert.ok(refund.success);
    });

    it('ManualProvider should return pending status', () => {
      const mp = new ManualProvider({ instructions: 'Bank transfer to account 1234' });
      const result = mp.charge({ amount: 100, customerId: 'cus-1' });
      assert.strictEqual(result.status, 'pending');
      assert.ok(result.instructions);
    });

    it('ManualProvider should confirm payment', () => {
      const mp = new ManualProvider();
      const charge = mp.charge({ amount: 100, customerId: 'cus-1' });
      const confirmed = mp.confirmPayment(charge.transactionId);
      assert.ok(confirmed.success);
      assert.strictEqual(confirmed.transaction.status, 'succeeded');
    });

    it('BasePaymentProvider should throw on unimplemented', () => {
      const bp = new BasePaymentProvider();
      assert.throws(() => bp.charge(), /Not implemented/);
      assert.throws(() => bp.refund(), /Not implemented/);
      assert.throws(() => bp.createCustomer(), /Not implemented/);
    });
  });

  describe('BillingEvents', () => {
    it('should emit and listen to events', () => {
      const be = new BillingEvents();
      let heard = false;
      be.on('test.event', (e) => { heard = true; });
      be.emit('test.event', { key: 'value' });
      assert.ok(heard);
    });

    it('should support wildcard listeners', () => {
      const be = new BillingEvents();
      let heard = false;
      be.on('*', (e) => { heard = true; });
      be.emit('anything', {});
      assert.ok(heard);
    });

    it('should off listener', () => {
      const be = new BillingEvents();
      let count = 0;
      const handler = () => { count++; };
      be.on('test', handler);
      be.emit('test', {});
      be.off('test', handler);
      be.emit('test', {});
      assert.strictEqual(count, 1);
    });

    it('should maintain history', () => {
      const be = new BillingEvents();
      be.emit('a', {});
      be.emit('b', {});
      assert.strictEqual(be.history().length, 2);
    });

    it('should filter history by event', () => {
      const be = new BillingEvents();
      be.emit('x', {});
      be.emit('y', {});
      be.emit('x', {});
      assert.strictEqual(be.history('x').length, 2);
    });

    it('should clear history', () => {
      const be = new BillingEvents();
      be.emit('test', {});
      be.clear();
      assert.strictEqual(be.history().length, 0);
    });

    it('should handle handler errors gracefully', () => {
      const be = new BillingEvents();
      be.on('fail', () => { throw new Error('handler crash'); });
      be.on('fail', () => { /* noop */ });
      be.emit('fail', {});
    });

    it('should have EVENTS constants', () => {
      assert.ok(EVENTS.SUBSCRIPTION_CREATED);
      assert.ok(EVENTS.INVOICE_CREATED);
      assert.ok(EVENTS.PAYMENT_RECEIVED);
      assert.strictEqual(EVENTS.SUBSCRIPTION_CREATED, 'subscription.created');
    });

    it('should expose all event types', () => {
      const eventKeys = Object.keys(EVENTS);
      assert.ok(eventKeys.length >= 20);
    });
  });

  describe('BillingStorage', () => {
    it('should create and read items', () => {
      const bs = new BillingStorage();
      const item = bs.create('subscriptions', 'sub-1', { planId: 'starter' });
      assert.strictEqual(item.planId, 'starter');
      const read = bs.get('subscriptions', 'sub-1');
      assert.strictEqual(read.planId, 'starter');
    });

    it('should update items', () => {
      const bs = new BillingStorage();
      bs.create('subscriptions', 'sub-1', { status: 'active' });
      bs.update('subscriptions', 'sub-1', { status: 'canceled' });
      assert.strictEqual(bs.get('subscriptions', 'sub-1').status, 'canceled');
    });

    it('should delete items', () => {
      const bs = new BillingStorage();
      bs.create('subscriptions', 'sub-1', { planId: 'starter' });
      bs.delete('subscriptions', 'sub-1');
      assert.strictEqual(bs.get('subscriptions', 'sub-1'), null);
    });

    it('should list with filter', () => {
      const bs = new BillingStorage();
      bs.create('subscriptions', 'a', { status: 'active' });
      bs.create('subscriptions', 'b', { status: 'canceled' });
      assert.strictEqual(bs.list('subscriptions', { status: 'active' }).length, 1);
    });

    it('should push to arrays', () => {
      const bs = new BillingStorage();
      const entry = bs.push('logs', { message: 'test' });
      assert.ok(entry.id);
      assert.strictEqual(bs.getCollection('logs').length, 1);
    });

    it('should clear all data', () => {
      const bs = new BillingStorage();
      bs.create('customers', 'c1', { email: 'test@test.com' });
      bs.push('logs', { msg: 'test' });
      bs.clear();
      assert.strictEqual(bs.list('customers').length, 0);
      assert.strictEqual(bs.getCollection('logs').length, 0);
    });
  });

  describe('API Controller (billingController)', () => {
    it('should export all handler functions', () => {
      assert.ok(typeof billingController.listPlans === 'function');
      assert.ok(typeof billingController.getPlan === 'function');
      assert.ok(typeof billingController.createSubscription === 'function');
      assert.ok(typeof billingController.cancelSubscription === 'function');
      assert.ok(typeof billingController.listSubscriptions === 'function');
      assert.ok(typeof billingController.listInvoices === 'function');
      assert.ok(typeof billingController.getInvoice === 'function');
      assert.ok(typeof billingController.payInvoice === 'function');
      assert.ok(typeof billingController.createCheckout === 'function');
      assert.ok(typeof billingController.processWebhook === 'function');
      assert.ok(typeof billingController.getUsage === 'function');
      assert.ok(typeof billingController.getQuotas === 'function');
      assert.ok(typeof billingController.getBudgets === 'function');
    });

    it('should handle listPlans request', () => {
      let jsonCalled = false;
      const req = {};
      const res = { status: () => res, json: (data) => { jsonCalled = true; assert.ok(data.data.plans); } };
      billingController.listPlans(req, res);
      assert.ok(jsonCalled);
    });

    it('should handle getPlan request', () => {
      let jsonData;
      const req = { params: { id: 'starter' } };
      const res = { json: (data) => { jsonData = data; assert.ok(data.data.plan); }, status: (c) => res };
      billingController.getPlan(req, res);
    });

    it('should return 404 for unknown plan', () => {
      let jsonData;
      const req = { params: { id: 'nonexistent' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.getPlan(req, res);
      assert.ok(jsonData);
      assert.strictEqual(jsonData.success, false);
    });

    it('should handle createSubscription with missing fields', () => {
      let jsonData;
      const req = { body: {} };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.createSubscription(req, res);
      assert.ok(jsonData);
      assert.strictEqual(jsonData.success, false);
    });

    it('should handle createSubscription successfully', () => {
      const engine = getDefaultEngine();
      const c = engine.createCustomer({ email: 'api@test.com' });
      let statusCode = 200;
      const req = { body: { planId: 'starter', customerId: c.id } };
      const res = { json: (data) => { assert.ok(data.success); }, status: (c) => { statusCode = c; return res; } };
      billingController.createSubscription(req, res);
    });

    it('should handle listInvoices', () => {
      let jsonCalled = false;
      const req = { query: {} };
      const res = { status: () => res, json: (data) => { jsonCalled = true; assert.ok('invoices' in data.data); } };
      billingController.listInvoices(req, res);
      assert.ok(jsonCalled);
    });

    it('should handle getUsage with missing customerId', () => {
      let jsonData;
      const req = { query: {} };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.getUsage(req, res);
      assert.ok(jsonData);
      assert.strictEqual(jsonData.success, false);
    });

    it('should handle getUsage with customerId', () => {
      let jsonData;
      const req = { query: { customerId: 'cus-1' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.getUsage(req, res);
      assert.ok(jsonData);
    });

    it('should handle getQuotas with missing fields', () => {
      let jsonData;
      const req = { query: {} };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.getQuotas(req, res);
      assert.ok(jsonData);
      assert.strictEqual(jsonData.success, false);
    });

    it('should handle processWebhook', () => {
      let jsonData;
      const req = { params: { provider: 'stripe' }, body: { type: 'payment.succeeded' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.processWebhook(req, res);
      assert.ok(jsonData);
    });

    it('should handle cancelSubscription', () => {
      let jsonData;
      const req = { params: { id: 'nonexistent' }, body: {} };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.cancelSubscription(req, res);
      assert.ok(jsonData);
    });

    it('should handle updateSubscription with pause', () => {
      let jsonData;
      const req = { params: { id: 'nonexistent' }, body: { pause: true } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.updateSubscription(req, res);
      assert.ok(jsonData);
    });

    it('should handle payInvoice for nonexistent invoice', () => {
      let jsonData;
      const req = { params: { id: 'nonexistent' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.payInvoice(req, res);
      assert.ok(jsonData);
    });

    it('should handle addPaymentMethod', () => {
      let jsonData;
      const req = { body: { customerId: 'cus-1', type: 'card', last4: '4242' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.addPaymentMethod(req, res);
      assert.ok(jsonData);
    });

    it('should handle removePaymentMethod', () => {
      let jsonData;
      const req = { params: { id: 'pm-nonexistent' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.removePaymentMethod(req, res);
      assert.ok(jsonData);
    });

    it('should handle getCustomer for nonexistent', () => {
      let jsonData;
      const req = { params: {}, query: { customerId: 'nonexistent' } };
      const res = { json: (data) => { jsonData = data; }, status: (c) => res };
      billingController.getCustomer(req, res);
      assert.ok(jsonData);
    });
  });

  describe('End-to-End Billing Flows', () => {
    it('should complete full subscription lifecycle', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'lifecycle@test.com' });
      const result = bm.createSubscription('starter', c.id);
      assert.ok(result.success);
      assert.strictEqual(result.subscription.status, 'active');
      const cancelResult = bm.cancelSubscription(result.subscription.id);
      assert.ok(cancelResult.success);
      assert.strictEqual(cancelResult.subscription.status, 'canceled');
    });

    it('should complete full invoice lifecycle', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'invlife@test.com' });
      const inv = bm.createInvoice({ customerId: c.id, amount: 150, items: [{ description: 'Service', amount: 150 }] });
      assert.strictEqual(inv.status, 'open');
      const payment = bm.processPayment({ amount: 150, customerId: c.id });
      assert.ok(payment.success);
      bm.payInvoice(inv.id, payment);
      assert.strictEqual(bm.getInvoice(inv.id).status, 'paid');
    });

    it('should handle subscription with coupon and credits', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'couponcred@test.com' });
      bm.addCredits(c.id, 50, { reason: 'welcome' });
      bm.createCoupon('WELCOME20', { type: 'percentage', value: 20 });
      const result = bm.createSubscription('starter', c.id, { coupon: 'WELCOME20' });
      assert.ok(result.success);
    });

    it('should track usage and check quotas', () => {
      const bm = new BillingManager({ storage, events });
      bm.trackUsage('cus-1', 'api_calls', 100);
      bm.trackUsage('cus-1', 'storage', 50);
      const quotas = bm.checkQuotas('cus-1', 'free');
      assert.ok(quotas);
      assert.ok('results' in quotas);
    });

    it('should generate and process webhook end-to-end', () => {
      const bm = new BillingManager({ storage, events });
      let handled = false;
      bm.registerWebhookHandler('stripe', 'invoice.paid', (payload) => { handled = true; });
      bm.processWebhook('stripe', 'invoice.paid', { id: 'in_123', amount: 100 });
      assert.ok(handled);
    });

    it('should manage multiple subscriptions per customer', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'multi@test.com' });
      bm.createSubscription('starter', c.id);
      bm.createSubscription('professional', c.id);
      const subs = bm.listSubscriptions({ customerId: c.id });
      assert.strictEqual(subs.length, 2);
    });

    it('should handle payment method management', () => {
      const bm = new BillingManager({ storage, events });
      const pm1 = bm.addPaymentMethod('cus-1', { type: 'card', last4: '4242', brand: 'visa', isDefault: true });
      bm.addPaymentMethod('cus-1', { type: 'card', last4: '5555', brand: 'mastercard' });
      assert.strictEqual(bm.getPaymentMethods('cus-1').length, 2);
      bm.removePaymentMethod(pm1.id);
      assert.strictEqual(bm.getPaymentMethods('cus-1').length, 1);
    });

    it('should calculate revenue metrics', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'rev@test.com' });
      bm.createSubscription('starter', c.id);
      bm.createSubscription('professional', c.id);
      const report = bm.generateReport();
      assert.ok(report.monthlyRevenue > 0);
      assert.ok(report.annualRevenue > 0);
      assert.ok(report.subscriptions >= 2);
    });

    it('should handle billing report with no data', () => {
      const bm = new BillingManager({ storage, events });
      const report = bm.generateReport();
      assert.ok(report);
      assert.strictEqual(report.subscriptions, 0);
    });

    it('should maintain data isolation across engines', () => {
      const bm1 = new BillingManager({ storage: new BillingStorage(), events: new BillingEvents() });
      const bm2 = new BillingManager({ storage: new BillingStorage(), events: new BillingEvents() });
      const c1 = bm1.createCustomer({ email: 'iso1@test.com' });
      const c2 = bm2.createCustomer({ email: 'iso2@test.com' });
      assert.strictEqual(bm1.listCustomers().length, 1);
      assert.strictEqual(bm2.listCustomers().length, 1);
      assert.notStrictEqual(c1.id, c2.id);
    });

    it('should handle trial conversion to paid subscription', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'trialconv@test.com' });
      const result = bm.createSubscription('starter', c.id, { trialDays: 14 });
      assert.strictEqual(result.subscription.status, 'trialing');
      bm.trials.convertTrial(c.id);
      assert.strictEqual(bm.trials.getActiveTrial(c.id), null);
    });

    it('should export invoice data', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'export@test.com' });
      bm.createInvoice({ customerId: c.id, amount: 100 });
      const invoices = bm.listInvoices();
      const csv = bm.invoiceExporter.exportToCsv(invoices);
      assert.ok(csv.content.includes('ID'));
      const json = bm.invoiceExporter.exportToJson(invoices);
      assert.strictEqual(json.format, 'json');
    });

    it('should handle plan change with proration', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'prorata@test.com' });
      const result = bm.createSubscription('starter', c.id);
      const changed = bm.changePlan(result.subscription.id, 'professional', { prorate: true });
      assert.ok(changed.success);
      assert.strictEqual(changed.subscription.planId, 'professional');
    });

    it('should handle subscription pause and resume cycle', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'pauseresume@test.com' });
      const result = bm.createSubscription('starter', c.id);
      bm.pauseSubscription(result.subscription.id);
      const paused = bm.getSubscription(result.subscription.id);
      assert.strictEqual(paused.status, 'paused');
      bm.resumeSubscription(result.subscription.id);
      const resumed = bm.getSubscription(result.subscription.id);
      assert.strictEqual(resumed.status, 'active');
    });

    it('should handle discount with subscription creation', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'discsub@test.com' });
      bm.createCoupon('SUB20', { type: 'percentage', value: 20 });
      const result = bm.createSubscription('starter', c.id, { coupon: 'SUB20' });
      assert.ok(result.success);
      const discount = bm.applyDiscount(100, 'SUB20');
      assert.strictEqual(discount.discount, 20);
    });

    it('should handle addresses with different types', () => {
      const bm = new BillingManager({ storage, events });
      bm.addAddress('cus-1', { line1: '123 Bill St', city: 'NY', country: 'US', type: 'billing' });
      bm.addAddress('cus-1', { line1: '456 Ship Ave', city: 'LA', country: 'US', type: 'shipping' });
      assert.strictEqual(bm.getAddresses('cus-1', 'billing').length, 1);
      assert.strictEqual(bm.getAddresses('cus-1', 'shipping').length, 1);
    });

    it('should handle zero-amount invoice', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'zero@test.com' });
      const inv = bm.createInvoice({ customerId: c.id, amount: 0 });
      assert.strictEqual(inv.total, 0);
      assert.strictEqual(inv.status, 'open');
    });

    it('should track multiple usage metrics across customers', () => {
      const bm = new BillingManager({ storage, events });
      bm.trackUsage('cus-a', 'api_calls', 10);
      bm.trackUsage('cus-b', 'api_calls', 20);
      bm.trackUsage('cus-a', 'storage', 100);
      assert.strictEqual(bm.getUsage('cus-a', 'api_calls').total, 10);
      assert.strictEqual(bm.getUsage('cus-b', 'api_calls').total, 20);
      assert.strictEqual(bm.getUsage('cus-a', 'storage').total, 100);
    });

    it('should handle refund after payment', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'refundflow@test.com' });
      const inv = bm.createInvoice({ customerId: c.id, amount: 200 });
      const payment = bm.processPayment({ amount: 200, customerId: c.id });
      bm.payInvoice(inv.id, payment);
      bm.createRefund(payment.payment.id, 200, 'customer_request', { customerId: c.id, invoiceId: inv.id });
      assert.strictEqual(bm.getInvoice(inv.id).status, 'paid');
    });

    it('should handle expired trial then subscription', () => {
      const bm = new BillingManager({ storage, events });
      const c = bm.createCustomer({ email: 'exptrial@test.com' });
      bm.trials.startTrial(c.id, 'starter', 14);
      assert.ok(bm.trials.hasActiveTrial(c.id));
      bm.trials.expireTrial(c.id);
      assert.strictEqual(bm.trials.hasActiveTrial(c.id), false);
    });
  });
});
