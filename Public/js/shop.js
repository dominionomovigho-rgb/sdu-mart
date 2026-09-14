// Simple category filtering for the shop page.
// Later, this can be replaced with a real API call to fetch products by category.

const filterBar = document.getElementById('filterBar');
const productGrid = document.getElementById('productGrid');
const emptyState = document.getElementById('emptyState');

if (filterBar && productGrid) {
  const chips = filterBar.querySelectorAll('.filter-chip');
  const cards = productGrid.querySelectorAll('.product-card');

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');

    const filter = chip.dataset.filter;
    let visibleCount = 0;

    cards.forEach((card) => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.hidden = !matches;
      if (matches) visibleCount++;
    });

    emptyState.hidden = visibleCount !== 0;
  });
}