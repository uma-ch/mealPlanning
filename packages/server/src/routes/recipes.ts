import { Router } from 'express';
import pool from '../db/connection.js';
import type { CreateRecipeRequest, UpdateRecipeRequest, Recipe } from '@recipe-planner/shared';
import { z } from 'zod';

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

export default router;
