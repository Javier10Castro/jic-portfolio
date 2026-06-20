class InvoicePdf {
  generatePdf(invoice, options = {}) {
    const lines = [];
    lines.push('='.repeat(50));
    lines.push(`INVOICE ${invoice.number || invoice.id}`);
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Customer: ${invoice.customerId}`);
    lines.push(`Date: ${new Date(invoice.createdAt || Date.now()).toISOString().split('T')[0]}`);
    lines.push(`Due Date: ${new Date(invoice.dueDate || Date.now()).toISOString().split('T')[0]}`);
    if (invoice.subscriptionId) lines.push(`Subscription: ${invoice.subscriptionId}`);
    lines.push('');
    lines.push('-'.repeat(50));
    lines.push('Line Items:');
    (invoice.items || invoice.lineItems || []).forEach(item => {
      const desc = item.description || item.name || 'Item';
      const amount = item.amount || 0;
      lines.push(`  ${desc.padEnd(35)} $${amount.toFixed(2)}`);
    });
    lines.push('-'.repeat(50));
    lines.push(`Subtotal: $${(invoice.subtotal || 0).toFixed(2)}`);
    if (invoice.discount) lines.push(`Discount: -$${invoice.discount.toFixed(2)}`);
    if (invoice.tax) lines.push(`Tax: $${invoice.tax.toFixed(2)}`);
    if (invoice.credits) lines.push(`Credits: -$${invoice.credits.toFixed(2)}`);
    lines.push(`TOTAL: $${(invoice.total || 0).toFixed(2)}`);
    lines.push('='.repeat(50));
    if (invoice.notes) { lines.push(''); lines.push(`Notes: ${invoice.notes}`); }
    return { content: lines.join('\n'), format: 'txt', generatedAt: Date.now() };
  }

  generateReceipt(payment, options = {}) {
    return this.generatePdf({
      number: `RCT-${payment.id}`,
      customerId: payment.customerId,
      items: [{ description: payment.description || 'Payment', amount: payment.amount }],
      subtotal: payment.amount, total: payment.amount,
      createdAt: payment.createdAt, status: 'paid'
    }, options);
  }
}

module.exports = { InvoicePdf };
