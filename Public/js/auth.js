// Auth pages logic (login.html + register.html).
// Later, these forms will send data to the real login/register API endpoints.

const roleToggle = document.getElementById('roleToggle');
const vendorFields = document.getElementById('vendorFields');

if (roleToggle && vendorFields) {
  const roleButtons = roleToggle.querySelectorAll('.role-btn');

  roleToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.role-btn');
    if (!btn) return;

    roleButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    vendorFields.hidden = btn.dataset.role !== 'vendor';
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Login failed. Please try again.');
        return;
      }

      alert('Logged in successfully!');
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert('Could not reach the server. Please try again.');
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    // Figure out which role is currently active from the toggle buttons
    const activeRoleBtn = roleToggle ? roleToggle.querySelector('.role-btn.active') : null;
    data.role = activeRoleBtn ? activeRoleBtn.dataset.role : 'student';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Something went wrong. Please try again.');
        return;
      }

      alert('Account created successfully! You can now log in.');
      window.location.href = 'login.html';
    } catch (err) {
      console.error(err);
      alert('Could not reach the server. Please try again.');
    }
  });
}