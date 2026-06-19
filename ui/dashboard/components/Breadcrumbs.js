function Breadcrumbs({ items, homeHref }) {
  if (!items || !items.length) return '';
  const all = [{ label: 'Dashboard', href: homeHref || '#home' }, ...items];
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      ${all.map((c, i) => {
        if (i === all.length - 1) return `<span aria-current="page">${c.label}</span>`;
        return `<a href="${c.href || '#'}">${c.label}</a><span class="separator" aria-hidden="true">/</span>`;
      }).join('')}
    </nav>
  `;
}

module.exports = { Breadcrumbs };
