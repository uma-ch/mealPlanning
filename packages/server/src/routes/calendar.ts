import { Router } from 'express';
import pool from '../db/connection.js';
import type { CreateCalendarEntryRequest, CalendarEntry } from '@recipe-planner/shared';
import { z } from 'zod';
import {
  getCalendarEntries,
  getCalendarEntryByDate,
  createCalendarEntry as createCalendarEntryQuery,
  deleteCalendarEntry as deleteCalendarEntryQuery,
} from '../db/queries.js';

const router = Router();

// Validation schemas
const createEntrySchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

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

// POST /api/calendar - Add recipe to calendar
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

    // Verify recipe exists and belongs to household
    const recipeCheck = await pool.query(
      'SELECT id FROM recipes WHERE id = $1 AND household_id = $2',
      [data.recipeId, householdId]
    );

    if (recipeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Create or update calendar entry
    await createCalendarEntryQuery(
      householdId,
      data.recipeId,
      data.date
    );

    // Fetch full entry with recipe details
    const fullEntry = await getCalendarEntryByDate(householdId, data.date);

    const calendarEntry: CalendarEntry = {
      id: fullEntry.id,
      householdId: fullEntry.household_id,
      recipeId: fullEntry.recipe_id,
      date: fullEntry.date,
      createdAt: fullEntry.created_at,
      recipe: fullEntry.recipe,
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
