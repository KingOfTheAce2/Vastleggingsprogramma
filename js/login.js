document.addEventListener('DOMContentLoaded', () => {
  const fallbackUsers = {
    jan: { password: 'password', name: 'Jan Jansen (Opsteller)', role: 'opsteller' },
    piet: { password: 'password', name: 'Piet de Boer (Reviewer)', role: 'reviewer' },
    klaas: { password: 'password', name: 'Klaas Visser (Admin)', role: 'admin' },
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

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        window.location.href = 'clients.html';
        return;
      }

      // Fallback to local demo users when API login fails
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
