import { Router } from 'express';

const router = Router();

// GET /api/grocery - Get active grocery list
router.get('/', async (_req, res) => {
  // TODO: Fetch active grocery list
  res.json({ groceryList: null });
});

// POST /api/grocery/generate - Generate grocery list from recipes
router.post('/generate', async (req, res) => {
  const { recipeIds: _recipeIds } = req.body;
  // TODO: Generate grocery list
  res.json({ message: 'Grocery list generated' });
});

// PUT /api/grocery/items/:id - Update item (check/uncheck)
router.put('/items/:id', async (_req, res) => {
  // TODO: Update grocery item
  res.json({ message: 'Item updated' });
});

// POST /api/grocery/items - Add manual item
router.post('/items', async (_req, res) => {
  // TODO: Add manual item to grocery list
  res.json({ message: 'Item added' });
});

export default router;
