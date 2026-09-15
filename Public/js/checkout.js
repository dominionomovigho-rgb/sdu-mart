const checkoutForm = document.getElementById('checkoutForm');
const deliveryDetail = document.getElementById('deliveryDetail');
const summaryLineItems = document.getElementById('summaryLineItems');
const summarySubtotal = document.getElementById('summarySubtotal');
const summaryTotal = document.getElementById('summaryTotal');

function getCart() {
  return JSON.parse(localStorage.getItem('sduMartCart') || '[]');
}

function clearCart() {
  localStorage.removeItem('sduMartCart');
}

function formatNaira(amount) {
  return '₦' + amount.toLocaleString('en-NG');
}

let cartWithProducts = [];

async function checkLoginAndLoadCart() {
  // Make sure the user is logged in before letting them check out
  try {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) {
      alert('Please log in before checking out.');
      window.location.href = 'login.html';
      return;
    }
  } catch (err) {
    console.error(err);
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    window.location.href = 'shop.html';
    return;
  }

  try {
    const products = await Promise.all(
      cart.map(item => fetch(`/api/products/${item.productId}`).then(res => res.json()))
    );

    cartWithProducts = cart.map((item, i) => ({ ...item, product: products[i] }));
    renderSummary();
  } catch (err) {
    console.error('Failed to load cart for checkout:', err);
  }
}

function renderSummary() {
  let subtotal = 0;

  summaryLineItems.innerHTML = cartWithProducts.map(item => {
    const lineTotal = item.product.price * item.quantity;
    subtotal += lineTotal;
    return `
      <div class="summary-line-item">
        <span>${item.product.name} &times;${item.quantity}</span>
        <span>${formatNaira(lineTotal)}</span>
      </div>
    `;
  }).join('');

  summarySubtotal.textContent = formatNaira(subtotal);
  summaryTotal.textContent = formatNaira(subtotal);
}

if (checkoutForm && deliveryDetail) {
  const fulfillmentInputs = checkoutForm.querySelectorAll('input[name="fulfillment"]');

  fulfillmentInputs.forEach((input) => {
    input.addEventListener('change', () => {
      deliveryDetail.hidden = input.value !== 'delivery' || !input.checked;
    });
  });

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(checkoutForm);
    const orderInfo = Object.fromEntries(formData.entries());

    const items = cartWithProducts.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          deliveryMethod: orderInfo.fulfillment
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Could not place order. Please try again.');
        return;
      }

      clearCart();
      alert(`Order placed successfully! Order #${result.orderId} — Total: ${formatNaira(result.total)}`);
      window.location.href = 'shop.html';
    } catch (err) {
      console.error(err);
      alert('Could not reach the server. Please try again.');
    }
  });

  checkLoginAndLoadCart();
}