import { Router } from 'express';

const router = Router();

// POST /api/household - Create new household
router.post('/', async (_req, res) => {
  // TODO: Create household and generate invite code
  res.json({ message: 'Household created' });
});

// POST /api/household/join - Join household with invite code
router.post('/join', async (req, res) => {
  const { inviteCode: _inviteCode } = req.body;
  // TODO: Add user to household
  res.json({ message: 'Joined household' });
});

// GET /api/household/:id - Get household details
router.get('/:id', async (_req, res) => {
  // TODO: Fetch household details
  res.json({ household: null });
});

export default router;
