import pool from './connection.js';

/**
 * Migration script to associate existing data with a specific user
 * This creates a user account and transfers all existing data to their household
 */
async function migrateExistingData() {
  const email = 'uma.chingunde@gmail.com';
  const oldHouseholdId = '00000000-0000-0000-0000-000000000001';

  try {
    console.log('Starting data migration...\n');

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, household_id FROM users WHERE email = $1',
      [email]
    );

    let userId: string;
    let newHouseholdId: string;

    if (existingUser.rows.length > 0) {
      console.log('✓ User already exists');
      userId = existingUser.rows[0].id;
      newHouseholdId = existingUser.rows[0].household_id;
      console.log(`  User ID: ${userId}`);
      console.log(`  Household ID: ${newHouseholdId}`);
    } else {
      console.log('Creating new user and household...');

      // Create household
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const householdResult = await pool.query(
        `INSERT INTO households (name, invite_code)
         VALUES ($1, $2)
         RETURNING id`,
        [`${email}'s Household`, inviteCode]
      );
      newHouseholdId = householdResult.rows[0].id;
      console.log(`✓ Created household: ${newHouseholdId}`);

      // Create user
      const userResult = await pool.query(
        `INSERT INTO users (email, household_id)
         VALUES ($1, $2)
         RETURNING id`,
        [email, newHouseholdId]
      );
      userId = userResult.rows[0].id;
      console.log(`✓ Created user: ${userId}`);
    }

    // Check if old household exists
    const oldHousehold = await pool.query(
      'SELECT id FROM households WHERE id = $1',
      [oldHouseholdId]
    );

    if (oldHousehold.rows.length === 0) {
      console.log('\n✓ No existing data to migrate (old household not found)');
      console.log('\nMigration complete!');
      return;
    }

    console.log('\nMigrating existing data...');

    // Count existing data
    const recipesCount = await pool.query(
      'SELECT COUNT(*) FROM recipes WHERE household_id = $1',
      [oldHouseholdId]
    );
    const calendarCount = await pool.query(
      'SELECT COUNT(*) FROM calendar_entries WHERE household_id = $1',
      [oldHouseholdId]
    );
    const groceryCount = await pool.query(
      'SELECT COUNT(*) FROM grocery_lists WHERE household_id = $1',
      [oldHouseholdId]
    );

    console.log(`\nFound:`);
    console.log(`  - ${recipesCount.rows[0].count} recipes`);
    console.log(`  - ${calendarCount.rows[0].count} calendar entries`);
    console.log(`  - ${groceryCount.rows[0].count} grocery lists`);

    if (recipesCount.rows[0].count === '0' &&
        calendarCount.rows[0].count === '0' &&
        groceryCount.rows[0].count === '0') {
      console.log('\n✓ No data to migrate');
      console.log('\nMigration complete!');
      return;
    }

    // Migrate data
    await pool.query('BEGIN');

    try {
      // Update recipes
      await pool.query(
        'UPDATE recipes SET household_id = $1, created_by = $2 WHERE household_id = $3',
        [newHouseholdId, userId, oldHouseholdId]
      );
      console.log(`✓ Migrated recipes`);

      // Update calendar entries
      await pool.query(
        'UPDATE calendar_entries SET household_id = $1 WHERE household_id = $2',
        [newHouseholdId, oldHouseholdId]
      );
      console.log(`✓ Migrated calendar entries`);

      // Update grocery lists
      await pool.query(
        'UPDATE grocery_lists SET household_id = $1 WHERE household_id = $2',
        [newHouseholdId, oldHouseholdId]
      );
      console.log(`✓ Migrated grocery lists`);

      await pool.query('COMMIT');
      console.log('\n✅ Migration successful!');
      console.log(`\nAll data is now associated with: ${email}`);
      console.log(`Household ID: ${newHouseholdId}`);

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrateExistingData();
