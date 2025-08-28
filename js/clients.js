document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  const list = document.getElementById('client-list');
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-name]');
    if (!btn) return;
    sessionStorage.setItem('selectedClient', btn.dataset.name);
    sessionStorage.setItem('selectedProgram', btn.dataset.program);
    window.location.href = 'index.html';
  });
});
