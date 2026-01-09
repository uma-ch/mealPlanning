import { Router } from 'express';
import pool from '../db/connection.js';
import { categorizeIngredient } from '../utils/categorizeIngredient.js';
import type { GenerateGroceryListRequest, AddManualItemRequest, UpdateGroceryItemRequest, GroceryListItem } from '@recipe-planner/shared';
import { z } from 'zod';
import { GroceryCategory } from '@recipe-planner/shared';
import { getRecipeIdsFromDateRange } from '../db/queries.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken as any);

// Validation schemas
const generateListSchema = z.object({
  recipeIds: z.array(z.string().uuid()).min(1),
});

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

const addManualItemSchema = z.object({
  ingredientText: z.string().min(1),
  category: z.nativeEnum(GroceryCategory),
});

const updateItemSchema = z.object({
  isChecked: z.boolean(),
});

// GET /api/grocery - Get active grocery list
router.get('/', async (req: AuthRequest, res) => {
  try {
    const householdId = req.user!.householdId;

    // Get active grocery list with items
    const result = await pool.query(
      `SELECT gl.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', gli.id,
                    'groceryListId', gli.grocery_list_id,
                    'recipeId', gli.recipe_id,
                    'ingredientText', gli.ingredient_text,
                    'category', gli.category,
                    'isChecked', gli.is_checked,
                    'checkedAt', gli.checked_at
                  ) ORDER BY gli.category, gli.created_at
                ) FILTER (WHERE gli.id IS NOT NULL),
                '[]'
              ) as items
       FROM grocery_lists gl
       LEFT JOIN grocery_list_items gli ON gl.id = gli.grocery_list_id
       WHERE gl.household_id = $1 AND gl.is_active = true
       GROUP BY gl.id
       LIMIT 1`,
      [householdId]
    );

    if (result.rows.length === 0) {
      return res.json({ groceryList: null });
    }

    const row = result.rows[0];
    const groceryList = {
      id: row.id,
      householdId: row.household_id,
      createdAt: row.created_at,
      isActive: row.is_active,
      items: row.items,
    };

    res.json({ groceryList });
  } catch (error) {
    console.error('Error fetching grocery list:', error);
    res.status(500).json({ error: 'Failed to fetch grocery list' });
  }
});

// POST /api/grocery/generate - Generate grocery list from recipes
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const validation = generateListSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error });
    }

    const data: GenerateGroceryListRequest = validation.data;
    const householdId = req.user!.householdId;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create active grocery list
      let groceryListId: string;
      const existingList = await client.query(
        'SELECT id FROM grocery_lists WHERE household_id = $1 AND is_active = true LIMIT 1',
        [householdId]
      );

      if (existingList.rows.length > 0) {
        // Use existing active list (append mode)
        groceryListId = existingList.rows[0].id;
      } else {
        // Create new grocery list if none exists
        const listResult = await client.query(
          'INSERT INTO grocery_lists (household_id, is_active) VALUES ($1, true) RETURNING id',
          [householdId]
        );
        groceryListId = listResult.rows[0].id;
      }

      // Fetch recipes
      const recipesResult = await client.query(
        'SELECT id, ingredients FROM recipes WHERE id = ANY($1::uuid[])',
        [data.recipeIds]
      );

      // Extract and categorize ingredients
      const items: Array<{ recipeId: string; text: string; category: GroceryCategory }> = [];

      for (const recipe of recipesResult.rows) {
        // Split ingredients by newline only
        const ingredientLines = recipe.ingredients.split('\n').map((line: string) => line.trim()).filter(Boolean);

        for (const line of ingredientLines) {
          const category = categorizeIngredient(line);
          items.push({
            recipeId: recipe.id,
            text: line,
            category,
          });
        }
      }

      // Bulk insert items
      if (items.length > 0) {
        const values: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        items.forEach(item => {
          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
          params.push(groceryListId, item.recipeId, item.text, item.category);
          paramIndex += 4;
        });

        await client.query(
          `INSERT INTO grocery_list_items (grocery_list_id, recipe_id, ingredient_text, category)
           VALUES ${values.join(', ')}`,
          params
        );
      }

      // Fetch the complete grocery list with items
      const result = await client.query(
        `SELECT gl.*,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', gli.id,
                      'groceryListId', gli.grocery_list_id,
                      'recipeId', gli.recipe_id,
                      'ingredientText', gli.ingredient_text,
                      'category', gli.category,
                      'isChecked', gli.is_checked,
                      'checkedAt', gli.checked_at
                    ) ORDER BY gli.category, gli.created_at
                  ) FILTER (WHERE gli.id IS NOT NULL),
                  '[]'
                ) as items
         FROM grocery_lists gl
         LEFT JOIN grocery_list_items gli ON gl.id = gli.grocery_list_id
         WHERE gl.id = $1
         GROUP BY gl.id`,
        [groceryListId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      const groceryList = {
        id: row.id,
        householdId: row.household_id,
        createdAt: row.created_at,
        isActive: row.is_active,
        items: row.items,
      };

      res.status(201).json({ groceryList });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating grocery list:', error);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
});

// POST /api/grocery/generate-from-calendar - Generate grocery list from calendar date range
router.post('/generate-from-calendar', async (req: AuthRequest, res) => {
  try {
    const validation = dateRangeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid date range',
        details: validation.error.errors,
      });
    }

    const { startDate, endDate } = validation.data;
    const householdId = req.user!.householdId;

    // Get recipe IDs from calendar date range
    const recipeIds = await getRecipeIdsFromDateRange(householdId, startDate, endDate);

    if (recipeIds.length === 0) {
      return res.status(400).json({
        error: 'No recipes found in selected date range',
      });
    }

    // Start transaction (reuse same logic as /generate)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create active grocery list
      let groceryListId: string;
      const existingList = await client.query(
        'SELECT id FROM grocery_lists WHERE household_id = $1 AND is_active = true LIMIT 1',
        [householdId]
      );

      if (existingList.rows.length > 0) {
        // Use existing active list (append mode)
        groceryListId = existingList.rows[0].id;
      } else {
        // Create new grocery list if none exists
        const listResult = await client.query(
          'INSERT INTO grocery_lists (household_id, is_active) VALUES ($1, true) RETURNING id',
          [householdId]
        );
        groceryListId = listResult.rows[0].id;
      }

      // Fetch recipes
      const recipesResult = await client.query(
        'SELECT id, ingredients FROM recipes WHERE id = ANY($1::uuid[])',
        [recipeIds]
      );

      // Extract and categorize ingredients
      const items: Array<{ recipeId: string; text: string; category: GroceryCategory }> = [];

      for (const recipe of recipesResult.rows) {
        // Split ingredients by newline only
        const ingredientLines = recipe.ingredients.split('\n').map((line: string) => line.trim()).filter(Boolean);

        for (const line of ingredientLines) {
          const category = categorizeIngredient(line);
          items.push({
            recipeId: recipe.id,
            text: line,
            category,
          });
        }
      }

      // Bulk insert items
      if (items.length > 0) {
        const values: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        items.forEach(item => {
          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
          params.push(groceryListId, item.recipeId, item.text, item.category);
          paramIndex += 4;
        });

        await client.query(
          `INSERT INTO grocery_list_items (grocery_list_id, recipe_id, ingredient_text, category)
           VALUES ${values.join(', ')}`,
          params
        );
      }

      // Fetch the complete grocery list with items
      const result = await client.query(
        `SELECT gl.*,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', gli.id,
                      'groceryListId', gli.grocery_list_id,
                      'recipeId', gli.recipe_id,
                      'ingredientText', gli.ingredient_text,
                      'category', gli.category,
                      'isChecked', gli.is_checked,
                      'checkedAt', gli.checked_at
                    ) ORDER BY gli.category, gli.created_at
                  ) FILTER (WHERE gli.id IS NOT NULL),
                  '[]'
                ) as items
         FROM grocery_lists gl
         LEFT JOIN grocery_list_items gli ON gl.id = gli.grocery_list_id
         WHERE gl.id = $1
         GROUP BY gl.id`,
        [groceryListId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      const groceryList = {
        id: row.id,
        householdId: row.household_id,
        createdAt: row.created_at,
        isActive: row.is_active,
        items: row.items,
      };

      res.status(201).json({ groceryList });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating grocery list from calendar:', error);
    res.status(500).json({ error: 'Failed to generate grocery list from calendar' });
  }
});

// PUT /api/grocery/items/:id - Update grocery list item
router.put('/items/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validation = updateItemSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error });
    }

    const data: UpdateGroceryItemRequest = validation.data;
    const checkedAt = data.isChecked ? new Date().toISOString() : null;

    const result = await pool.query(
      `UPDATE grocery_list_items
       SET is_checked = $1, checked_at = $2
       WHERE id = $3
       RETURNING id, grocery_list_id, recipe_id, ingredient_text, category, is_checked, checked_at`,
      [data.isChecked, checkedAt, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const row = result.rows[0];
    const item: GroceryListItem = {
      id: row.id,
      groceryListId: row.grocery_list_id,
      recipeId: row.recipe_id,
      ingredientText: row.ingredient_text,
      category: row.category,
      isChecked: row.is_checked,
      checkedAt: row.checked_at,
    };

    res.json({ item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// POST /api/grocery/items - Add manual item
router.post('/items', async (req: AuthRequest, res) => {
  try {
    const validation = addManualItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error });
    }

    const data: AddManualItemRequest = validation.data;
    const householdId = req.user!.householdId;

    // Get or create active grocery list
    let groceryListId: string;
    const listResult = await pool.query(
      'SELECT id FROM grocery_lists WHERE household_id = $1 AND is_active = true LIMIT 1',
      [householdId]
    );

    if (listResult.rows.length === 0) {
      // Create new grocery list if none exists
      const newListResult = await pool.query(
        'INSERT INTO grocery_lists (household_id, is_active) VALUES ($1, true) RETURNING id',
        [householdId]
      );
      groceryListId = newListResult.rows[0].id;
    } else {
      groceryListId = listResult.rows[0].id;
    }

    // Insert item
    const result = await pool.query(
      `INSERT INTO grocery_list_items (grocery_list_id, ingredient_text, category)
       VALUES ($1, $2, $3)
       RETURNING id, grocery_list_id, recipe_id, ingredient_text, category, is_checked, checked_at`,
      [groceryListId, data.ingredientText, data.category]
    );

    const row = result.rows[0];
    const item: GroceryListItem = {
      id: row.id,
      groceryListId: row.grocery_list_id,
      recipeId: row.recipe_id,
      ingredientText: row.ingredient_text,
      category: row.category,
      isChecked: row.is_checked,
      checkedAt: row.checked_at,
    };

    res.status(201).json({ item });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// DELETE /api/grocery - Clear/archive active grocery list
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const householdId = req.user!.householdId;

    await pool.query(
      'UPDATE grocery_lists SET is_active = false WHERE household_id = $1 AND is_active = true',
      [householdId]
    );

    res.json({ message: 'Grocery list cleared successfully' });
  } catch (error) {
    console.error('Error clearing grocery list:', error);
    res.status(500).json({ error: 'Failed to clear grocery list' });
  }
});

/**
 * PATCH /api/grocery/items/:id/category
 * Update the category of a grocery list item
 */
router.patch('/items/:id/category', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!category || !Object.values(GroceryCategory).includes(category as GroceryCategory)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const result = await pool.query(
      'UPDATE grocery_list_items SET category = $1 WHERE id = $2 RETURNING *',
      [category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error updating item category:', error);
    res.status(500).json({ error: 'Failed to update item category' });
  }
});

/**
 * DELETE /api/grocery/items/:id
 * Delete a specific grocery list item
 */
router.delete('/items/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM grocery_list_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
