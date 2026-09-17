// Protect this page: only logged-in vendors should see it
async function checkVendorAccess() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) {
            alert('Please log in as a vendor to add products.');
            window.location.href = 'login.html';
            return;
        }
        const user = await res.json();
        if (user.role !== 'vendor') {
            alert('Only vendor accounts can add products.');
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error(err);
    }
}

checkVendorAccess();
const addProductForm = document.getElementById('addProductForm');
const categorySelect = document.getElementById('categorySelect');
const statusMessage = document.getElementById('statusMessage');

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        categorySelect.innerHTML = categories.map(c =>
            `<option value="${c.id}">${c.name}</option>`
        ).join('');
    } catch (err) {
        console.error('Failed to load categories:', err);
        categorySelect.innerHTML = '<option value="">Could not load categories</option>';
    }
}

if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addProductForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/vendor/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            statusMessage.hidden = false;

            if (!res.ok) {
                statusMessage.textContent = result.error || 'Could not add product.';
                return;
            }

            statusMessage.textContent = 'Product added successfully!';
            addProductForm.reset();
        } catch (err) {
            console.error(err);
            statusMessage.hidden = false;
            statusMessage.textContent = 'Could not reach the server. Please try again.';
        }
    });

    loadCategories();
}