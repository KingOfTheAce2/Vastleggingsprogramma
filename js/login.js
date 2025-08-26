document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('currentUser', JSON.stringify(data.user));
      window.location.href = 'index.html';
    } catch (err) {
      alert('Login mislukt');
    }
  });
});
