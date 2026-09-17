const myProductsList = document.getElementById('myProductsList');
const myOrdersList = document.getElementById('myOrdersList');

function formatNaira(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
}

async function checkVendorAccess() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) {
            window.location.href = 'login.html';
            return false;
        }
        const user = await res.json();
        if (user.role !== 'vendor') {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function loadMyProducts() {
    try {
        const res = await fetch('/api/vendor/my-products');
        const products = await res.json();

        if (products.length === 0) {
            myProductsList.innerHTML = '<p>You haven\'t added any products yet.</p>';
            return;
        }

        myProductsList.innerHTML = `
            <table style="width:100%; border-collapse: collapse;">
                <tr><th style="text-align:left;">Name</th><th>Price</th><th>Stock</th></tr>
                ${products.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${formatNaira(p.price)}</td>
                        <td>${p.stock_quantity}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    } catch (err) {
        console.error(err);
        myProductsList.innerHTML = '<p>Could not load your products.</p>';
    }
}

async function loadMyOrders() {
    try {
        const res = await fetch('/api/vendor/my-orders');
        const orders = await res.json();

        if (orders.length === 0) {
            myOrdersList.innerHTML = '<p>No orders yet.</p>';
            return;
        }

        myOrdersList.innerHTML = `
            <table style="width:100%; border-collapse: collapse;">
                <tr><th style="text-align:left;">Order #</th><th>Product</th><th>Qty</th><th>Price</th><th>Customer</th><th>Status</th></tr>
                ${orders.map(o => `
                    <tr>
                        <td>${o.order_id}</td>
                        <td>${o.product_name}</td>
                        <td>${o.quantity}</td>
                        <td>${formatNaira(o.price_at_purchase)}</td>
                        <td>${o.customer_name}</td>
                        <td>${o.status}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    } catch (err) {
        console.error(err);
        myOrdersList.innerHTML = '<p>Could not load your orders.</p>';
    }
}

async function init() {
    const allowed = await checkVendorAccess();
    if (!allowed) return;

    loadMyProducts();
    loadMyOrders();
}

init();