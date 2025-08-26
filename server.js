import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const users = {
  alice: { password: 'password', name: 'Alice (Opsteller)', role: 'opsteller' },
  bob: { password: 'password', name: 'Bob (Reviewer)', role: 'reviewer' },
  charlie: { password: 'password', name: 'Charlie (Admin)', role: 'admin' },
};

const sessions = new Map();

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = uuidv4();
  sessions.set(token, username);
  res.json({ token, user: { id: username, name: user.name, role: user.role } });
});

app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  const userId = sessions.get(token);
  if (!userId) return res.status(401).end();
  const user = users[userId];
  res.json({ user: { id: userId, name: user.name, role: user.role } });
});

app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  sessions.delete(token);
  res.status(204).end();
});

app.use(express.static('.'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
