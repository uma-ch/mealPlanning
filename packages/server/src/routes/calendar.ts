import { Router } from 'express';

const router = Router();

// GET /api/calendar - Get calendar entries
router.get('/', async (_req, res) => {
  // TODO: Fetch calendar entries
  res.json({ entries: [] });
});

// POST /api/calendar - Add recipe to calendar
router.post('/', async (_req, res) => {
  // TODO: Create calendar entry
  res.json({ message: 'Recipe added to calendar' });
});

// DELETE /api/calendar/:id - Remove entry from calendar
router.delete('/:id', async (_req, res) => {
  // TODO: Delete calendar entry
  res.json({ message: 'Entry removed' });
});

export default router;
