const cartItems = document.getElementById('cartItems');
const summarySubtotal = document.getElementById('summarySubtotal');
const summaryTotal = document.getElementById('summaryTotal');
const emptyCart = document.getElementById('emptyCart');

function formatNaira(amount) {
  return '₦' + amount.toLocaleString('en-NG');
}

function getCart() {
  return JSON.parse(localStorage.getItem('sduMartCart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('sduMartCart', JSON.stringify(cart));
}

async function loadCart() {
  const cart = getCart();

  if (cart.length === 0) {
    renderEmpty();
    return;
  }

  try {
    // Fetch full product details for each cart item
    const products = await Promise.all(
      cart.map(item =>
        fetch(`/api/products/${item.productId}`).then(res => res.json())
      )
    );

    renderCart(cart, products);
  } catch (err) {
    console.error('Failed to load cart:', err);
  }
}

function renderEmpty() {
  cartItems.innerHTML = '';
  emptyCart.hidden = false;
  cartItems.closest('.cart-layout').style.display = 'none';
}

function renderCart(cart, products) {
  let subtotal = 0;

  cartItems.innerHTML = cart.map((item, index) => {
    const product = products[index];
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;

    return `
      <article class="cart-item" data-product-id="${item.productId}">
        <div class="cart-item-thumb" style="background:#8A5FBF;">🛍️</div>
        <div class="cart-item-info">
          <h3>${product.name}</h3>
          <p class="cart-item-vendor">${product.vendor_name}</p>
          <button class="remove-link" data-remove>Remove</button>
        </div>
        <div class="cart-item-qty">
          <button type="button" data-qty-minus aria-label="Decrease quantity">&minus;</button>
          <span data-qty-value>${item.quantity}</span>
          <button type="button" data-qty-plus aria-label="Increase quantity">&plus;</button>
        </div>
        <div class="cart-item-price" data-unit-price="${product.price}">${formatNaira(lineTotal)}</div>
      </article>
    `;
  }).join('');

  emptyCart.hidden = true;
  cartItems.closest('.cart-layout').style.display = '';

  summarySubtotal.textContent = formatNaira(subtotal);
  summaryTotal.textContent = formatNaira(subtotal);
}

function updateQuantityInStorage(productId, newQuantity) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity = newQuantity;
    saveCart(cart);
  }
}

function removeFromStorage(productId) {
  const cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
}

if (cartItems) {
  cartItems.addEventListener('click', (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;

    const productId = item.dataset.productId;

    if (e.target.matches('[data-qty-plus]')) {
      const qtyEl = item.querySelector('[data-qty-value]');
      const newQty = Number(qtyEl.textContent) + 1;
      qtyEl.textContent = newQty;
      updateQuantityInStorage(productId, newQty);
      loadCart();
    }

    if (e.target.matches('[data-qty-minus]')) {
      const qtyEl = item.querySelector('[data-qty-value]');
      const current = Number(qtyEl.textContent);
      if (current > 1) {
        updateQuantityInStorage(productId, current - 1);
        loadCart();
      }
    }

    if (e.target.matches('[data-remove]')) {
      removeFromStorage(productId);
      loadCart();
    }
  });

  loadCart();
}