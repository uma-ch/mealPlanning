import { Router } from 'express';
import pool from '../db/connection.js';
import type { CreateRecipeRequest, UpdateRecipeRequest, Recipe, ImportRecipeRequest } from '@recipe-planner/shared';
import { z } from 'zod';
import { fetchRecipeFromUrl, RecipeImportError } from '../services/recipeImport.js';
import { pdfUpload } from '../middleware/upload.js';
import { extractRecipesFromPdf } from '../services/pdfRecipeImport.js';
import { unlink } from 'fs/promises';

const router = Router();

// Validation schemas
const createRecipeSchema = z.object({
  title: z.string().min(1).max(500),
  ingredients: z.string().min(1),
  instructions: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

const updateRecipeSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  ingredients: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

const importRecipeSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

// GET /api/recipes - Get all recipes for household
router.get('/', async (_req, res) => {
  try {
    // For now, using mock household ID from development auth
    const householdId = '00000000-0000-0000-0000-000000000001';

    const result = await pool.query(
      `SELECT r.*, COALESCE(json_agg(rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '[]') as tags
       FROM recipes r
       LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
       WHERE r.household_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [householdId]
    );

    const recipes = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      ingredients: row.ingredients,
      instructions: row.instructions,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      createdBy: row.created_by,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      wasModified: row.was_modified,
      rawHtmlBackup: row.raw_html_backup,
      householdId: row.household_id,
      tags: row.tags,
    }));

    res.json({ recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// POST /api/recipes - Create new recipe
router.post('/', async (req, res) => {
  try {
    const validation = createRecipeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error });
    }

    const data: CreateRecipeRequest = validation.data;
    const householdId = '00000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000002';

    const result = await pool.query(
      `INSERT INTO recipes (household_id, title, ingredients, instructions, source_url, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [householdId, data.title, data.ingredients, data.instructions, data.sourceUrl, data.imageUrl, userId]
    );

    const recipe = result.rows[0];

    // Insert tags if provided
    if (data.tags && data.tags.length > 0) {
      const tagValues = data.tags.map((_tag: string, idx: number) => `($1, $${idx + 2})`).join(', ');
      const tagParams = [recipe.id, ...data.tags];
      await pool.query(
        `INSERT INTO recipe_tags (recipe_id, tag) VALUES ${tagValues}`,
        tagParams
      );
    }

    // Fetch the complete recipe with tags
    const completeRecipe = await pool.query(
      `SELECT r.*, COALESCE(json_agg(rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '[]') as tags
       FROM recipes r
       LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
       WHERE r.id = $1
       GROUP BY r.id`,
      [recipe.id]
    );

    const recipeData = completeRecipe.rows[0];
    const recipeResponse: Recipe = {
      id: recipeData.id,
      title: recipeData.title,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      sourceUrl: recipeData.source_url,
      imageUrl: recipeData.image_url,
      createdBy: recipeData.created_by,
      createdAt: recipeData.created_at,
      modifiedAt: recipeData.modified_at,
      wasModified: recipeData.was_modified,
      rawHtmlBackup: recipeData.raw_html_backup,
      householdId: recipeData.household_id,
      tags: recipeData.tags,
    };

    res.status(201).json({ recipe: recipeResponse });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// GET /api/recipes/:id - Get recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const householdId = '00000000-0000-0000-0000-000000000001';

    const result = await pool.query(
      `SELECT r.*, COALESCE(json_agg(rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '[]') as tags
       FROM recipes r
       LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
       WHERE r.id = $1 AND r.household_id = $2
       GROUP BY r.id`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const row = result.rows[0];
    const recipe: Recipe = {
      id: row.id,
      title: row.title,
      ingredients: row.ingredients,
      instructions: row.instructions,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      createdBy: row.created_by,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      wasModified: row.was_modified,
      rawHtmlBackup: row.raw_html_backup,
      householdId: row.household_id,
      tags: row.tags,
    };

    res.json({ recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// PUT /api/recipes/:id - Update recipe
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateRecipeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error });
    }

    const data: UpdateRecipeRequest = validation.data;
    const householdId = '00000000-0000-0000-0000-000000000001';

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(data.title);
    }
    if (data.ingredients !== undefined) {
      updates.push(`ingredients = $${paramCounter++}`);
      values.push(data.ingredients);
    }
    if (data.instructions !== undefined) {
      updates.push(`instructions = $${paramCounter++}`);
      values.push(data.instructions);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCounter++}`);
      values.push(data.imageUrl);
    }

    if (updates.length > 0) {
      updates.push(`modified_at = CURRENT_TIMESTAMP`);
      updates.push(`was_modified = TRUE`);
      values.push(id, householdId);

      await pool.query(
        `UPDATE recipes SET ${updates.join(', ')}
         WHERE id = $${paramCounter} AND household_id = $${paramCounter + 1}`,
        values
      );
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      // Delete existing tags
      await pool.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

      // Insert new tags
      if (data.tags.length > 0) {
        const tagValues = data.tags.map((_tag: string, idx: number) => `($1, $${idx + 2})`).join(', ');
        const tagParams = [id, ...data.tags];
        await pool.query(
          `INSERT INTO recipe_tags (recipe_id, tag) VALUES ${tagValues}`,
          tagParams
        );
      }
    }

    // Fetch updated recipe
    const result = await pool.query(
      `SELECT r.*, COALESCE(json_agg(rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '[]') as tags
       FROM recipes r
       LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
       WHERE r.id = $1 AND r.household_id = $2
       GROUP BY r.id`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const row = result.rows[0];
    const recipe: Recipe = {
      id: row.id,
      title: row.title,
      ingredients: row.ingredients,
      instructions: row.instructions,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      createdBy: row.created_by,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      wasModified: row.was_modified,
      rawHtmlBackup: row.raw_html_backup,
      householdId: row.household_id,
      tags: row.tags,
    };

    res.json({ recipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE /api/recipes/:id - Delete recipe
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const householdId = '00000000-0000-0000-0000-000000000001';

    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 AND household_id = $2 RETURNING id',
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// POST /api/recipes/import-url - Import recipe from URL
router.post('/import-url', async (req, res) => {
  try {
    // Validate request
    const validation = importRecipeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error,
      });
    }

    const data: ImportRecipeRequest = validation.data;
    const householdId = '00000000-0000-0000-0000-000000000001';
    // Use null for created_by since we don't have real auth yet
    const userId = null;

    // Fetch and extract recipe from URL
    let importResult;
    try {
      importResult = await fetchRecipeFromUrl(data.url);
    } catch (error) {
      if (error instanceof RecipeImportError) {
        switch (error.code) {
          case 'INVALID_URL':
            return res.status(400).json({ error: error.message });
          case 'FETCH_FAILED':
            return res.status(404).json({ error: error.message });
          case 'NO_RECIPE_FOUND':
            return res.status(422).json({ error: error.message });
          case 'CLAUDE_API_ERROR':
            // Check if it's a configuration issue vs runtime issue
            if (error.message.includes('not configured')) {
              return res.status(503).json({ error: error.message });
            }
            if (error.message.includes('Too many requests')) {
              return res.status(429).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
      }
      throw error;
    }

    const { recipe: extractedRecipe, source } = importResult;

    // Validate extracted data has required fields
    if (!extractedRecipe.title || !extractedRecipe.ingredients || !extractedRecipe.instructions) {
      return res.status(422).json({
        error: 'Extracted recipe is missing required fields (title, ingredients, or instructions)',
      });
    }

    // Insert recipe into database
    const result = await pool.query(
      `INSERT INTO recipes (
        household_id,
        title,
        ingredients,
        instructions,
        source_url,
        image_url,
        raw_html_backup,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at, modified_at, was_modified`,
      [
        householdId,
        extractedRecipe.title,
        extractedRecipe.ingredients,
        extractedRecipe.instructions,
        data.url,
        extractedRecipe.imageUrl || null,
        extractedRecipe.rawHtml || null,
        userId,
      ]
    );

    const row = result.rows[0];

    // Insert tags if provided
    if (extractedRecipe.tags && extractedRecipe.tags.length > 0) {
      const tagValues = extractedRecipe.tags.map((_tag, index) =>
        `($1, $${index + 2})`
      ).join(', ');
      const tagParams = [row.id, ...extractedRecipe.tags];

      await pool.query(
        `INSERT INTO recipe_tags (recipe_id, tag) VALUES ${tagValues}`,
        tagParams
      );
    }

    // Fetch complete recipe with tags
    const fullRecipe = await pool.query(
      `SELECT r.*,
              COALESCE(
                json_agg(rt.tag) FILTER (WHERE rt.tag IS NOT NULL),
                '[]'
              ) as tags
       FROM recipes r
       LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
       WHERE r.id = $1
       GROUP BY r.id`,
      [row.id]
    );

    const recipeRow = fullRecipe.rows[0];
    const recipe: Recipe = {
      id: recipeRow.id,
      title: recipeRow.title,
      ingredients: recipeRow.ingredients,
      instructions: recipeRow.instructions,
      sourceUrl: recipeRow.source_url,
      imageUrl: recipeRow.image_url,
      createdBy: recipeRow.created_by,
      createdAt: recipeRow.created_at,
      modifiedAt: recipeRow.modified_at,
      wasModified: recipeRow.was_modified,
      rawHtmlBackup: recipeRow.raw_html_backup,
      householdId: recipeRow.household_id,
      tags: recipeRow.tags || [],
    };

    res.status(201).json({ recipe, source });
  } catch (error) {
    console.error('Error importing recipe:', error);
    res.status(500).json({ error: 'Failed to import recipe' });
  }
});

// POST /api/recipes/import-pdf - Import recipes from PDF
router.post('/import-pdf', pdfUpload.single('pdf'), async (req, res) => {
  let filePath: string | undefined;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    filePath = req.file.path;
    const householdId = '00000000-0000-0000-0000-000000000001';
    const userId = null; // No auth yet

    // Extract recipes from PDF
    let recipes;
    try {
      recipes = await extractRecipesFromPdf(filePath);
    } catch (error) {
      if (error instanceof RecipeImportError) {
        // Map error codes to HTTP status
        const statusMap: Record<string, number> = {
          'PDF_PARSE_ERROR': 422,
          'NO_RECIPE_FOUND': 422,
          'CLAUDE_API_ERROR': 500,
        };
        const status = statusMap[error.code] || 500;
        return res.status(status).json({ error: error.message });
      }
      throw error;
    }

    if (recipes.length === 0) {
      return res.status(422).json({
        error: 'No recipes found in PDF. Please ensure the PDF contains recipe text.'
      });
    }

    // Insert all recipes into database
    const insertedRecipes = [];
    const errors = [];

    for (const recipe of recipes) {
      try {
        // Insert recipe
        const result = await pool.query(
          `INSERT INTO recipes (
            household_id, title, ingredients, instructions,
            image_url, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [
            householdId,
            recipe.title,
            recipe.ingredients,
            recipe.instructions,
            recipe.imageUrl || null,
            userId,
          ]
        );

        const recipeId = result.rows[0].id;

        // Insert tags
        if (recipe.tags && recipe.tags.length > 0) {
          const tagValues = recipe.tags.map((_tag: string, idx: number) => `($1, $${idx + 2})`).join(', ');
          const tagParams = [recipeId, ...recipe.tags];
          await pool.query(
            `INSERT INTO recipe_tags (recipe_id, tag) VALUES ${tagValues}`,
            tagParams
          );
        }

        insertedRecipes.push({ id: recipeId, title: recipe.title });
      } catch (err: any) {
        errors.push({ title: recipe.title, error: err.message });
      }
    }

    // Return results
    res.status(201).json({
      success: true,
      totalExtracted: recipes.length,
      totalSaved: insertedRecipes.length,
      recipes: insertedRecipes,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error importing PDF:', error);
    res.status(500).json({ error: 'Failed to import recipes from PDF' });
  } finally {
    // Clean up uploaded file
    if (filePath) {
      try {
        await unlink(filePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }
  }
});

export default router;
