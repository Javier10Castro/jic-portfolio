# Billing & Subscription Platform — Phase 9.2.0

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Billing Manager                              │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Core        │  │  Plans       │  │  Usage                     │ │
│  │─────────────│  │──────────────│  │────────────────────────────│ │
│  │ Subscriptions│  │ PlanRegistry │  │ Usage Tracker              │ │
│  │ Customers    │  │ PlanFeatures │  │ Usage Aggregator           │ │
│  │ Invoices     │  │ PlanLimits   │  │ Quota Calculator           │ │
│  │ Payments     │  │ PlanVersions │  │ Overage Calculator         │ │
│  │ Checkout     │  │ TrialManager │  │                            │ │
│  │ Usage Meter  │  │              │  │                            │ │
│  │ Pricing Eng  │  │              │  │                            │ │
│  │ Tax Engine   │  │              │  │                            │ │
│  │ Discount Eng │  │              │  │                            │ │
│  │ Credit Mgr   │  │              │  │                            │ │
│  │ Refund Mgr   │  │              │  │                            │ │
│  │ Webhook Proc │  │              │  │                            │ │
│  └─────────────┘  └──────────────┘  └────────────────────────────┘ │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Payments    │  │  Invoices    │  │  Customers                 │ │
│  │─────────────│  │──────────────│  │────────────────────────────│ │
│  │ BaseProvider │  │ Generator    │  │ Customer Portal            │ │
│  │ Stripe       │  │ PDF          │  │ Billing Profile            │ │
│  │ PayPal       │  │ Numbering    │  │ Payment Methods            │ │
│  │ Manual       │  │ Exporter     │  │ Addresses                  │ │
│  │ Mock         │  │              │  │                            │ │
│  └─────────────┘  └──────────────┘  └────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Analytics                                                   │   │
│  │  MRR · ARR · Churn · LTV · Cohort · Revenue Forecast         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Payment Flow

```
Customer → Checkout Session → Subscription Created
    ↓
Invoice Generated (draft → open)
    ↓
Payment Processed (via provider)
    ├── Success → Invoice paid → Receipt sent
    └── Failure → Invoice failed → Dunning → Retry
```

## Subscription Lifecycle

```
                ┌──────────┐
                │  Trial   │
                └────┬─────┘
                     │ convert / expire
                ┌────▼─────┐
         ┌──────┤  Active  ├──────┐
         │      └──────────┘      │
         ▼                        ▼
    ┌────────┐             ┌──────────┐
    │ Paused │             │ Past Due │
    └───┬────┘             └────┬─────┘
        │ resume                │ cancel
        ▼                        ▼
    ┌────────┐             ┌──────────┐
    │ Active │             │ Canceled │
    └────────┘             └──────────┘
```

## Invoice Lifecycle

```
Draft → Open → Paid (terminal)
             → Failed (terminal)
             → Void (terminal)
```

## API Catalog

All routes under `/api/v1/billing/`:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/plans` | List all plans |
| GET | `/plans/:id` | Get plan details |
| POST | `/subscriptions` | Create subscription |
| PATCH | `/subscriptions/:id` | Update/pause/resume subscription |
| DELETE | `/subscriptions/:id` | Cancel subscription |
| GET | `/subscriptions` | List subscriptions |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id` | Get invoice |
| POST | `/invoices/:id/pay` | Pay invoice |
| POST | `/checkout` | Create checkout session |
| POST | `/webhooks/:provider` | Process webhook |
| GET | `/usage` | Get usage metrics |
| GET | `/quotas` | Check quotas |
| GET | `/budgets` | Get budgets |
| POST | `/payment-methods` | Add payment method |
| DELETE | `/payment-methods/:id` | Remove payment method |
| GET | `/customers/me` | Get current customer |
| PATCH | `/customers/me` | Update current customer |

## Billing Report Example

```json
{
  "monthlyRevenue": 2900,
  "annualRevenue": 34800,
  "customers": 45,
  "subscriptions": 38,
  "activeTrials": 7,
  "failedPayments": 2,
  "outstandingInvoices": 3,
  "recommendations": [
    "High churn rate detected — review pricing and engagement",
    "Multiple payment failures — notify customers to update payment methods"
  ],
  "calculatedAt": 1718800000000
}
```

## Provider Abstraction

```js
const { StripeProvider } = require('./lib/billing/payments/providers/stripeProvider');
paymentManager.registerProvider('stripe', new StripeProvider({ apiKey: 'sk_live_...' }));
```

All providers extend `BasePaymentProvider` and implement:
- `charge(options)` → `{ success, transactionId, status }`
- `refund(transactionId, amount)` → `{ success, refundId }`
- `createCustomer(customerData)` → `{ success, customerId }`
- `getTransaction(transactionId)` → transaction or null
- `health()` → `{ status, provider }`

## Revenue Metrics

| Metric | Formula | Module |
|---|---|---|
| MRR | Sum of monthly subscription revenue | `mrrCalculator.js` |
| ARR | MRR × 12 (or sum of annual subscriptions) | `arrCalculator.js` |
| Churn Rate | Canceled subs / total subs in period | `churnCalculator.js` |
| Revenue Churn | Canceled MRR / total MRR at period start | `churnCalculator.js` |
| LTV | ARPA × (1 / churn rate) | `ltvCalculator.js` |
| Cohort Retention | % users retained per month after signup | `cohortAnalyzer.js` |
| Revenue Forecast | MRR × (1 + growth - churn)^months | `revenueForecast.js` |

## Subscription Plans

| Plan | Monthly | Yearly | Projects | Team | Features |
|---|---|---|---|---|---|
| Free | $0 | $0 | 1 | 1 | Basic analytics, email support |
| Starter | $29 | $290 | 10 | 5 | + API access, custom domain |
| Professional | $99 | $990 | 50 | 20 | + Priority support, team collab |
| Business | $299 | $2,990 | 200 | 100 | + Dedicated support, SSO, audit |
| Enterprise | Custom | Custom | Unlimited | Unlimited | All features |

## Webhook Processing

```
External Provider (Stripe/PayPal) → POST /api/v1/billing/webhooks/:provider
    ↓
WebhookProcessor.process(provider, event, payload)
    ↓
Registered handlers called (by provider:event or *)
    ↓
Event emitted (webhook.received, webhook.processed)
```

## Usage Billing

```
UsageMeter.track(customerId, metric, amount)
    ↓
UsageAggregator.aggregate() → total by granularity
    ↓
OverageCalculator.calculateOverage() → cost for metered features
    ↓
InvoiceGenerator.generateInvoice() → line items + total
```

## Integration

- **Security**: Billing customer ↔ Identity user mapping
- **Cost Engine**: Usage billing costs
- **Workflow Engine**: Billing workflows (invoicing, dunning)
- **AI Providers**: Track AI token usage for billing
- **API**: REST endpoints at `/api/v1/billing/`
- **Control Plane**: Billing dashboard with 5 tabs
- **Telemetry**: Revenue metrics and billing events
- **Event Bus**: 20+ billing event types
- **Agents**: Billing-related agent tasks

## Example Usage

```js
const { BillingManager } = require('./lib/billing');

const billing = new BillingManager();

// Create customer
const customer = billing.createCustomer({ email: 'client@example.com', name: 'Client' });

// Create subscription
const result = billing.createSubscription('professional', customer.id, { interval: 'monthly' });

// Track usage
billing.trackUsage(customer.id, 'api_calls', 500);

// Generate invoice
const invoice = billing.createInvoice({ customerId: customer.id, amount: 99 });

// Process payment
const payment = billing.processPayment({ amount: 99, customerId: customer.id });

// Generate report
const report = billing.generateReport();
```
