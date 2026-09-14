// Checkout page logic: show the delivery address field only when
// "Hostel delivery" is selected, and handle the (placeholder) order submission.
// Later, submitting this form will send the order + address + payment method to the backend.

const checkoutForm = document.getElementById('checkoutForm');
const deliveryDetail = document.getElementById('deliveryDetail');

if (checkoutForm && deliveryDetail) {
  const fulfillmentInputs = checkoutForm.querySelectorAll('input[name="fulfillment"]');

  fulfillmentInputs.forEach((input) => {
    input.addEventListener('change', () => {
      deliveryDetail.hidden = input.value !== 'delivery' || !input.checked;
    });
  });

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(checkoutForm);
    const order = Object.fromEntries(formData.entries());
    console.log('Order placed (placeholder):', order);
    // TODO: send `order` to the backend once the orders API is ready
    alert('Order placed! (This is a placeholder — no order has actually been sent yet.)');
  });
}