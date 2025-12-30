import { Router } from 'express';

const router = Router();

// GET /api/recipes - Get all recipes for household
router.get('/', async (_req, res) => {
  // TODO: Fetch recipes from database
  res.json({ recipes: [] });
});

// POST /api/recipes - Create new recipe
router.post('/', async (_req, res) => {
  // TODO: Create recipe in database
  res.json({ message: 'Recipe created' });
});

// GET /api/recipes/:id - Get recipe by ID
router.get('/:id', async (_req, res) => {
  // TODO: Fetch recipe from database
  res.json({ recipe: null });
});

// PUT /api/recipes/:id - Update recipe
router.put('/:id', async (_req, res) => {
  // TODO: Update recipe in database
  res.json({ message: 'Recipe updated' });
});

// DELETE /api/recipes/:id - Delete recipe
router.delete('/:id', async (_req, res) => {
  // TODO: Delete recipe from database
  res.json({ message: 'Recipe deleted' });
});

export default router;
