const filterBar = document.getElementById('filterBar');
const productGrid = document.getElementById('productGrid');
const emptyState = document.getElementById('emptyState');

let allProducts = [];

// Map category chip filters to the category_name values returned by the API
function renderProducts(filter) {
  const filtered = allProducts.filter(p =>
    filter === 'all' || p.category_name === filter
  );

  productGrid.innerHTML = filtered.map(p => `
    <article class="product-card" data-category="${p.category_name || ''}">
      <a href="product.html?id=${p.id}" class="product-thumb" style="background:#8A5FBF;">🛍️</a>
      <div class="product-body">
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <p class="product-vendor">${p.vendor_name}</p>
        <div class="product-footer">
          <span class="product-price">₦${Number(p.price).toLocaleString()}</span>
          <button class="btn-add" data-id="${p.id}">Add</button>
        </div>
      </div>
    </article>
  `).join('');

  emptyState.hidden = filtered.length !== 0;
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    renderProducts('all');
  } catch (err) {
    console.error('Failed to load products:', err);
    productGrid.innerHTML = '<p>Could not load products. Please try again later.</p>';
  }
}

if (filterBar && productGrid) {
  const chips = filterBar.querySelectorAll('.filter-chip');

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');

    renderProducts(chip.dataset.filter);
  });

  loadProducts();
}