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