const pendingVendorsList = document.getElementById('pendingVendorsList');

async function checkAdminAccess() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) {
            window.location.href = 'login.html';
            return false;
        }
        const user = await res.json();
        if (user.role !== 'admin') {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function loadPendingVendors() {
    try {
        const res = await fetch('/api/admin/pending-vendors');
        const vendors = await res.json();

        if (vendors.length === 0) {
            pendingVendorsList.innerHTML = '<p>No pending vendors right now.</p>';
            return;
        }

        pendingVendorsList.innerHTML = vendors.map(v => `
            <div class="auth-card" style="margin-bottom:16px;">
                <h3>${v.business_name}</h3>
                <p>${v.full_name} &middot; ${v.email}</p>
                <p>${v.category || ''} &middot; ${v.location || ''}</p>
                <button class="btn-solid" data-approve="${v.id}">Approve</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        pendingVendorsList.innerHTML = '<p>Could not load pending vendors.</p>';
    }
}

pendingVendorsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-approve]');
    if (!btn) return;

    const vendorId = btn.dataset.approve;
    btn.disabled = true;
    btn.textContent = 'Approving...';

    try {
        const res = await fetch(`/api/admin/approve-vendor/${vendorId}`, { method: 'POST' });
        if (!res.ok) {
            alert('Could not approve vendor.');
            btn.disabled = false;
            btn.textContent = 'Approve';
            return;
        }
        loadPendingVendors(); // refresh the list
    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
});

async function init() {
    const allowed = await checkAdminAccess();
    if (!allowed) return;
    loadPendingVendors();
}

init();