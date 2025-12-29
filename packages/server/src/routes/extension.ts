import { Router } from 'express';

const router = Router();

// POST /api/extension/recipes - Save recipe from browser extension
router.post('/recipes', async (req, res) => {
  const { url, title, ingredients, instructions, imageUrl, rawHtml } = req.body;
  // TODO: Save recipe from extension
  // Check for duplicates by URL
  // Store extracted data and raw HTML backup
  res.json({ message: 'Recipe saved from extension', recipeId: 'temp-id' });
});

export default router;
