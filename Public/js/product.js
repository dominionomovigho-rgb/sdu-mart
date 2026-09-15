const qtyValue = document.getElementById('qtyValue');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const addToCartBtn = document.getElementById('addToCartBtn');
const addConfirm = document.getElementById('addConfirm');

const productImage = document.getElementById('productImage');
const productVendor = document.getElementById('productVendor');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const productDesc = document.getElementById('productDesc');

const moreSection = document.getElementById('moreFromVendorSection');
const moreTitle = document.getElementById('moreFromVendorTitle');
const moreGrid = document.getElementById('moreFromVendorGrid');

let quantity = 1;
let currentProduct = null;

// Get product id from the URL, e.g. product.html?id=3
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

async function loadProduct() {
  if (!productId) {
    productName.textContent = 'Product not found';
    return;
  }

  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) {
      productName.textContent = 'Product not found';
      return;
    }
    currentProduct = await res.json();

    document.title = `${currentProduct.name} — SDU Mart`;
    productName.textContent = currentProduct.name;
    productVendor.textContent = `${currentProduct.vendor_name} · ${currentProduct.vendor_location || 'SDU campus'}`;
    productPrice.textContent = `₦${Number(currentProduct.price).toLocaleString()}`;
    productDesc.textContent = currentProduct.description || 'No description provided.';

    loadMoreFromVendor(currentProduct.vendor_id, currentProduct.vendor_name);
  } catch (err) {
    console.error('Failed to load product:', err);
    productName.textContent = 'Could not load product';
  }
}

async function loadMoreFromVendor(vendorId, vendorName) {
  try {
    const res = await fetch(`/api/vendors/${vendorId}/products?exclude=${productId}`);
    const products = await res.json();

    if (products.length === 0) return;

    moreTitle.textContent = `More from ${vendorName}`;
    moreGrid.innerHTML = products.map(p => `
      <article class="product-card">
        <a href="product.html?id=${p.id}" class="product-thumb" style="background:#8A5FBF;">🛍️</a>
        <div class="product-body">
          <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
          <p class="product-vendor">${vendorName}</p>
          <div class="product-footer">
            <span class="product-price">₦${Number(p.price).toLocaleString()}</span>
            <button class="btn-add" data-id="${p.id}">Add</button>
          </div>
        </div>
      </article>
    `).join('');

    moreSection.hidden = false;
  } catch (err) {
    console.error('Failed to load related products:', err);
  }
}

if (qtyMinus && qtyPlus && qtyValue) {
  qtyMinus.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyValue.textContent = quantity;
    }
  });

  qtyPlus.addEventListener('click', () => {
    quantity++;
    qtyValue.textContent = quantity;
  });
}

function getCart() {
  return JSON.parse(localStorage.getItem('sduMartCart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('sduMartCart', JSON.stringify(cart));
}

if (addToCartBtn && addConfirm) {
  addToCartBtn.addEventListener('click', () => {
    const cart = getCart();
    const existing = cart.find(item => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    saveCart(cart);

    addConfirm.hidden = false;
    setTimeout(() => {
      addConfirm.hidden = true;
    }, 2000);
  });
}

loadProduct();