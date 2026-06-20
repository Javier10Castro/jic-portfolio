class InvoiceExporter {
  exportToCsv(invoices) {
    const headers = ['ID', 'Number', 'Customer', 'Subscription', 'Subtotal', 'Discount', 'Tax', 'Total', 'Currency', 'Status', 'Created', 'Due Date', 'Paid At'];
    const rows = invoices.map(inv => [
      inv.id, inv.number, inv.customerId, inv.subscriptionId || '',
      inv.subtotal || 0, inv.discount || 0, inv.tax || 0,
      inv.total || 0, inv.currency || 'usd', inv.status,
      inv.createdAt ? new Date(inv.createdAt).toISOString() : '',
      inv.dueDate ? new Date(inv.dueDate).toISOString() : '',
      inv.paidAt ? new Date(inv.paidAt).toISOString() : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return { content: csv, format: 'csv', filename: `invoices-export-${Date.now()}.csv`, count: invoices.length };
  }

  exportToJson(invoices) {
    return { content: JSON.stringify(invoices, null, 2), format: 'json', filename: `invoices-export-${Date.now()}.json`, count: invoices.length };
  }

  exportToPdf(invoices) {
    const lines = ['INVOICE EXPORT', '='.repeat(50), ''];
    invoices.forEach((inv, i) => {
      lines.push(`[${i + 1}] ${inv.number || inv.id}`);
      lines.push(`  Customer: ${inv.customerId}`);
      lines.push(`  Amount: $${(inv.total || 0).toFixed(2)} ${inv.currency || 'usd'}`);
      lines.push(`  Status: ${inv.status}`);
      lines.push(`  Date: ${inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : 'N/A'}`);
      lines.push('');
    });
    return { content: lines.join('\n'), format: 'txt', filename: `invoices-export-${Date.now()}.txt`, count: invoices.length };
  }
}

module.exports = { InvoiceExporter };
