import { Router } from 'express';

const router = Router();

// POST /api/extension/recipes - Save recipe from browser extension
router.post('/recipes', async (req, res) => {
  const { url: _url, title: _title, ingredients: _ingredients, instructions: _instructions, imageUrl: _imageUrl, rawHtml: _rawHtml } = req.body;
  // TODO: Save recipe from extension
  // Check for duplicates by URL
  // Store extracted data and raw HTML backup
  res.json({ message: 'Recipe saved from extension', recipeId: 'temp-id' });
});

export default router;
