// Placeholder search handling — will be wired to the backend later.
const searchForm = document.querySelector('.search-bar');

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchForm.querySelector('input').value.trim();
    if (query) {
      console.log('Searching for:', query);
      // TODO: once the backend is ready, redirect to /shop?query=... or call the search API
    }
  });
}
// Update header based on login status
async function updateHeaderForAuth() {
  const loginLink = document.querySelector('a[href="login.html"]');
  const signupLink = document.querySelector('a[href="register.html"]');

  if (!loginLink || !signupLink) return;

  try {
    const res = await fetch('/api/me');
    if (!res.ok) return; // not logged in, leave header as-is

    const user = await res.json();

    loginLink.textContent = 'My Account';
    loginLink.removeAttribute('href');
    loginLink.style.cursor = 'default';

    signupLink.textContent = 'Log out';
    signupLink.href = '#';
    signupLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'index.html';
    });
  } catch (err) {
    console.error('Could not check login status:', err);
  }
}

updateHeaderForAuth();