const express = require('express');
const router = express.Router();
const c = require('../controllers/billingController');

router.get('/plans', c.listPlans);
router.get('/plans/:id', c.getPlan);
router.post('/subscriptions', c.createSubscription);
router.patch('/subscriptions/:id', c.updateSubscription);
router.delete('/subscriptions/:id', c.cancelSubscription);
router.get('/subscriptions', c.listSubscriptions);
router.get('/invoices', c.listInvoices);
router.get('/invoices/:id', c.getInvoice);
router.post('/invoices/:id/pay', c.payInvoice);
router.post('/checkout', c.createCheckout);
router.post('/webhooks/:provider', c.processWebhook);
router.get('/usage', c.getUsage);
router.get('/quotas', c.getQuotas);
router.get('/budgets', c.getBudgets);
router.post('/payment-methods', c.addPaymentMethod);
router.delete('/payment-methods/:id', c.removePaymentMethod);
router.get('/customers/me', c.getCustomer);
router.patch('/customers/me', c.updateCustomer);

module.exports = router;
