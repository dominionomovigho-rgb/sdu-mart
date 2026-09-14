// Quantity selector and add-to-cart feedback for the product details page.
// Later, "Add to cart" will send the product id + quantity to the backend/cart API.

const qtyValue = document.getElementById('qtyValue');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const addToCartBtn = document.getElementById('addToCartBtn');
const addConfirm = document.getElementById('addConfirm');

let quantity = 1;

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

if (addToCartBtn && addConfirm) {
  addToCartBtn.addEventListener('click', () => {
    console.log('Added to cart:', { quantity });
    // TODO: replace with a real call to the cart API once the backend is ready
    addConfirm.hidden = false;
    setTimeout(() => {
      addConfirm.hidden = true;
    }, 2000);
  });
}