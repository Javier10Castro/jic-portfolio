class InvoiceGenerator {
  generateInvoice(subscription, options = {}) {
    const { plan, usage, tax, discount, credits } = options;
    const subtotal = plan ? (plan.price || 0) : 0;
    const usageCost = usage ? (usage.total || 0) : 0;
    const discountAmount = discount ? discount.discount || 0 : 0;
    const taxAmount = tax ? tax.amount || 0 : 0;
    const creditsApplied = credits ? credits.applied || 0 : 0;
    const totalBeforeCredits = subtotal + usageCost - discountAmount + taxAmount;
    const total = Math.max(0, totalBeforeCredits - creditsApplied);
    return {
      subscriptionId: subscription.id, customerId: subscription.customerId,
      planId: subscription.planId, planName: plan ? plan.name : 'Unknown',
      interval: subscription.interval,
      lineItems: [
        { description: `${plan ? plan.name : 'Plan'} - ${subscription.interval}`, amount: subtotal, type: 'plan' },
        ...(usageCost > 0 ? [{ description: 'Usage charges', amount: usageCost, type: 'usage' }] : []),
        ...(discountAmount > 0 ? [{ description: `Discount (${discount.coupon || 'coupon'})`, amount: -discountAmount, type: 'discount' }] : []),
        ...(taxAmount > 0 ? [{ description: `${tax.name || 'Tax'}`, amount: taxAmount, type: 'tax' }] : []),
        ...(creditsApplied > 0 ? [{ description: 'Credits applied', amount: -creditsApplied, type: 'credit' }] : [])
      ],
      subtotal, usageCost, discount: discountAmount, tax: taxAmount,
      credits: creditsApplied, total: Math.round(total * 100) / 100,
      currency: plan ? (plan.currency || 'usd') : 'usd'
    };
  }

  generateOneTimeInvoice(options = {}) {
    const { customerId, items, currency = 'usd', notes } = options;
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0) * (item.quantity || 1), 0);
    return {
      customerId, items, subtotal, total: subtotal,
      currency, notes: notes || '', type: 'one_time'
    };
  }
}

module.exports = { InvoiceGenerator };
