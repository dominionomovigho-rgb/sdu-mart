// Cart page logic: adjust quantity, remove items, recalculate totals.
// This works only on the items already in the page for now.
// Later, this will read/write the actual cart from the backend instead.

const cartItems = document.getElementById('cartItems');
const summarySubtotal = document.getElementById('summarySubtotal');
const summaryTotal = document.getElementById('summaryTotal');
const emptyCart = document.getElementById('emptyCart');

function formatNaira(amount) {
  return '₦' + amount.toLocaleString('en-NG');
}

function recalculateCart() {
  if (!cartItems) return;

  let subtotal = 0;
  const items = cartItems.querySelectorAll('.cart-item');

  items.forEach((item) => {
    const unitPrice = Number(item.querySelector('[data-unit-price]').dataset.unitPrice);
    const qty = Number(item.querySelector('[data-qty-value]').textContent);
    const lineTotal = unitPrice * qty;
    item.querySelector('.cart-item-price').textContent = formatNaira(lineTotal);
    subtotal += lineTotal;
  });

  if (summarySubtotal) summarySubtotal.textContent = formatNaira(subtotal);
  if (summaryTotal) summaryTotal.textContent = formatNaira(subtotal);

  if (emptyCart) {
    const hasItems = items.length > 0;
    emptyCart.hidden = hasItems;
    cartItems.closest('.cart-layout').style.display = hasItems ? '' : 'none';
  }
}

if (cartItems) {
  cartItems.addEventListener('click', (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;

    if (e.target.matches('[data-qty-plus]')) {
      const qtyEl = item.querySelector('[data-qty-value]');
      qtyEl.textContent = Number(qtyEl.textContent) + 1;
      recalculateCart();
    }

    if (e.target.matches('[data-qty-minus]')) {
      const qtyEl = item.querySelector('[data-qty-value]');
      const current = Number(qtyEl.textContent);
      if (current > 1) {
        qtyEl.textContent = current - 1;
        recalculateCart();
      }
    }

    if (e.target.matches('[data-remove]')) {
      item.remove();
      recalculateCart();
    }
  });

  recalculateCart();
}