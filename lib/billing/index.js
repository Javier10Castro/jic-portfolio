const { BillingManager, getDefaultEngine, createEngine } = require('./billingManager');
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

module.exports = {
  BillingManager, getDefaultEngine, createEngine,
  SubscriptionManager, CustomerManager, InvoiceManager,
  PaymentManager, CheckoutManager, UsageMeter,
  PricingEngine, TaxEngine, DiscountEngine,
  CreditManager, RefundManager, WebhookProcessor,
  BillingEvents, EVENTS, BillingStorage,
  PlanRegistry, PlanFeatures, PlanLimits, PlanVersions, TrialManager,
  UsageTracker, UsageAggregator, QuotaCalculator, OverageCalculator,
  InvoiceGenerator, InvoicePdf, InvoiceNumbering, InvoiceExporter,
  CustomerPortal, BillingProfile, PaymentMethods, Addresses,
  MrrCalculator, ArrCalculator, ChurnCalculator, LtvCalculator, CohortAnalyzer, RevenueForecast
};
