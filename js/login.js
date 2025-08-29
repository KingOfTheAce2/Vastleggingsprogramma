document.addEventListener('DOMContentLoaded', () => {
  const fallbackUsers = {
    alice: { password: 'password', name: 'Alice (Opsteller)', role: 'opsteller' },
    bob: { password: 'password', name: 'Bob (Reviewer)', role: 'reviewer' },
    charlie: { password: 'password', name: 'Charlie (Admin)', role: 'admin' },
  };

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
      if (!res.ok) {
        alert('Login mislukt');
        return;
      }
      const data = await res.json();
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('currentUser', JSON.stringify(data.user));
      window.location.href = 'clients.html';
    } catch (err) {
      const user = fallbackUsers[username];
      if (user && user.password === password) {
        sessionStorage.setItem('token', 'local-token');
        sessionStorage.setItem(
          'currentUser',
          JSON.stringify({ id: username, name: user.name, role: user.role }),
        );
        window.location.href = 'clients.html';
      } else {
        alert('Login mislukt');
      }
    }
  });
});
