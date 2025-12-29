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
