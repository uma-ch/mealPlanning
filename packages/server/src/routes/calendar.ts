import { Router } from 'express';
import pool from '../db/connection.js';
import type { CreateCalendarEntryRequest, CalendarEntry } from '@recipe-planner/shared';
import { z } from 'zod';
import {
  getCalendarEntries,
  deleteCalendarEntry as deleteCalendarEntryQuery,
} from '../db/queries.js';

const router = Router();

// Validation schemas
const createEntrySchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID').optional().nullable(),
  customText: z.string().min(1).max(200).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
}).refine(
  (data) => (data.recipeId && !data.customText) || (!data.recipeId && data.customText),
  { message: 'Must provide either recipeId or customText, but not both' }
);

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

// GET /api/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Get calendar entries for date range
router.get('/', async (req, res) => {
  try {
    const householdId = '00000000-0000-0000-0000-000000000001';

    // Validate query params
    const validation = dateRangeSchema.safeParse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid date range',
        details: validation.error.errors,
      });
    }

    const { startDate, endDate } = validation.data;

    const entries = await getCalendarEntries(householdId, startDate, endDate);

    // Transform to CalendarEntry type
    const calendarEntries: CalendarEntry[] = entries.map(row => ({
      id: row.id,
      householdId: row.household_id,
      recipeId: row.recipe_id,
      customText: row.custom_text,
      date: row.date,
      createdAt: row.created_at,
      recipe: row.recipe,
    }));

    res.json({ entries: calendarEntries });
  } catch (error) {
    console.error('Error fetching calendar entries:', error);
    res.status(500).json({ error: 'Failed to fetch calendar entries' });
  }
});

// POST /api/calendar - Add recipe or custom text to calendar
router.post('/', async (req, res) => {
  try {
    const validation = createEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const data: CreateCalendarEntryRequest = validation.data;
    const householdId = '00000000-0000-0000-0000-000000000001';

    // If recipe entry, verify recipe exists and belongs to household
    if (data.recipeId) {
      const recipeCheck = await pool.query(
        'SELECT id FROM recipes WHERE id = $1 AND household_id = $2',
        [data.recipeId, householdId]
      );

      if (recipeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
    }

    // Create or update calendar entry
    // Delete existing entry for this date first (since we have UNIQUE constraint on household_id, date)
    await pool.query(
      'DELETE FROM calendar_entries WHERE household_id = $1 AND date = $2',
      [householdId, data.date]
    );

    // Insert new entry
    const result = await pool.query(
      `INSERT INTO calendar_entries (household_id, recipe_id, custom_text, date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, household_id, recipe_id, custom_text, date, created_at`,
      [householdId, data.recipeId || null, data.customText || null, data.date]
    );

    const row = result.rows[0];

    // Fetch recipe details if this is a recipe entry
    let recipe = undefined;
    if (row.recipe_id) {
      const recipeResult = await pool.query(
        `SELECT r.*, COALESCE(json_agg(rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '[]') as tags
         FROM recipes r
         LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
         WHERE r.id = $1
         GROUP BY r.id`,
        [row.recipe_id]
      );
      if (recipeResult.rows.length > 0) {
        const recipeRow = recipeResult.rows[0];
        recipe = {
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
          tags: recipeRow.tags,
        };
      }
    }

    const calendarEntry: CalendarEntry = {
      id: row.id,
      householdId: row.household_id,
      recipeId: row.recipe_id,
      customText: row.custom_text,
      date: row.date,
      createdAt: row.created_at,
      recipe,
    };

    res.status(201).json({ entry: calendarEntry });
  } catch (error) {
    console.error('Error creating calendar entry:', error);
    res.status(500).json({ error: 'Failed to create calendar entry' });
  }
});

// DELETE /api/calendar/:id - Remove entry from calendar
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const householdId = '00000000-0000-0000-0000-000000000001';

    const result = await deleteCalendarEntryQuery(id, householdId);

    if (!result) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }

    res.json({ message: 'Entry removed successfully' });
  } catch (error) {
    console.error('Error deleting calendar entry:', error);
    res.status(500).json({ error: 'Failed to delete calendar entry' });
  }
});

export default router;
