function SearchBar({ placeholder, value, onChange }) {
  return `
    <div class="search-bar" role="search">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted);flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="search" placeholder="${placeholder || 'Search...'}" value="${value || ''}" aria-label="Search" />
    </div>
  `;
}

module.exports = { SearchBar };
