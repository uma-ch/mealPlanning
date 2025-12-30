import { Router } from 'express';

const router = Router();

// POST /api/auth/magic-link - Send magic link to email
router.post('/magic-link', async (req, res) => {
  const { email: _email } = req.body;
  // TODO: Generate token and send email
  res.json({ message: 'Magic link sent' });
});

// POST /api/auth/verify - Verify magic link token
router.post('/verify', async (req, res) => {
  const { token: _token } = req.body;
  // TODO: Verify token and return user session
  res.json({ message: 'Token verified' });
});

// POST /api/auth/logout
router.post('/logout', async (_req, res) => {
  // TODO: Clear session
  res.json({ message: 'Logged out' });
});

export default router;
