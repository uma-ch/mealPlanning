import { Router } from 'express';

const router = Router();

// POST /api/household - Create new household
router.post('/', async (req, res) => {
  // TODO: Create household and generate invite code
  res.json({ message: 'Household created' });
});

// POST /api/household/join - Join household with invite code
router.post('/join', async (req, res) => {
  const { inviteCode } = req.body;
  // TODO: Add user to household
  res.json({ message: 'Joined household' });
});

// GET /api/household/:id - Get household details
router.get('/:id', async (req, res) => {
  // TODO: Fetch household details
  res.json({ household: null });
});

export default router;
