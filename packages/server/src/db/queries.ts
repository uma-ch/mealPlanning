import pool from './connection.js';

// Example query functions - to be expanded

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

export async function createUser(email: string, householdId: string) {
  const result = await pool.query(
    'INSERT INTO users (email, household_id) VALUES ($1, $2) RETURNING *',
    [email, householdId]
  );
  return result.rows[0];
}

export async function findHouseholdById(id: string) {
  const result = await pool.query(
    'SELECT * FROM households WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function createHousehold(name: string, inviteCode: string) {
  const result = await pool.query(
    'INSERT INTO households (name, invite_code) VALUES ($1, $2) RETURNING *',
    [name, inviteCode]
  );
  return result.rows[0];
}

export async function findRecipesByHousehold(householdId: string) {
  const result = await pool.query(
    `SELECT r.*, array_agg(rt.tag) as tags
     FROM recipes r
     LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
     WHERE r.household_id = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [householdId]
  );
  return result.rows;
}

export async function checkRecipeUrlExists(url: string, householdId: string) {
  const result = await pool.query(
    'SELECT id FROM recipes WHERE source_url = $1 AND household_id = $2',
    [url, householdId]
  );
  return result.rows[0];
}

// Calendar query functions
export async function getCalendarEntries(
  householdId: string,
  startDate: string,
  endDate: string
) {
  const result = await pool.query(
    `SELECT ce.*,
            json_build_object(
              'id', r.id,
              'title', r.title,
              'ingredients', r.ingredients,
              'instructions', r.instructions,
              'imageUrl', r.image_url,
              'sourceUrl', r.source_url,
              'tags', COALESCE(
                (SELECT json_agg(rt.tag) FROM recipe_tags rt WHERE rt.recipe_id = r.id),
                '[]'
              )
            ) as recipe
     FROM calendar_entries ce
     LEFT JOIN recipes r ON ce.recipe_id = r.id
     WHERE ce.household_id = $1
       AND ce.date >= $2
       AND ce.date <= $3
     ORDER BY ce.date ASC`,
    [householdId, startDate, endDate]
  );
  return result.rows;
}

export async function getCalendarEntryByDate(
  householdId: string,
  date: string
) {
  const result = await pool.query(
    `SELECT ce.*,
            json_build_object(
              'id', r.id,
              'title', r.title,
              'ingredients', r.ingredients,
              'instructions', r.instructions,
              'imageUrl', r.image_url,
              'sourceUrl', r.source_url,
              'tags', COALESCE(
                (SELECT json_agg(rt.tag) FROM recipe_tags rt WHERE rt.recipe_id = r.id),
                '[]'
              )
            ) as recipe
     FROM calendar_entries ce
     LEFT JOIN recipes r ON ce.recipe_id = r.id
     WHERE ce.household_id = $1 AND ce.date = $2`,
    [householdId, date]
  );
  return result.rows[0];
}

export async function createCalendarEntry(
  householdId: string,
  recipeId: string,
  date: string
) {
  const result = await pool.query(
    `INSERT INTO calendar_entries (household_id, recipe_id, date)
     VALUES ($1, $2, $3)
     ON CONFLICT (household_id, date)
     DO UPDATE SET recipe_id = EXCLUDED.recipe_id
     RETURNING *`,
    [householdId, recipeId, date]
  );
  return result.rows[0];
}

export async function deleteCalendarEntry(id: string, householdId: string) {
  const result = await pool.query(
    'DELETE FROM calendar_entries WHERE id = $1 AND household_id = $2 RETURNING id',
    [id, householdId]
  );
  return result.rows[0];
}

export async function getRecipeIdsFromDateRange(
  householdId: string,
  startDate: string,
  endDate: string
) {
  const result = await pool.query(
    `SELECT DISTINCT recipe_id
     FROM calendar_entries
     WHERE household_id = $1
       AND date >= $2
       AND date <= $3
       AND recipe_id IS NOT NULL`,
    [householdId, startDate, endDate]
  );
  return result.rows.map(row => row.recipe_id);
}
