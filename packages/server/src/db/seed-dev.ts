import pool from './connection.js';

async function seedDev() {
  try {
    console.log('Seeding dev data...');

    // Create dev household
    await pool.query(
      `INSERT INTO households (id, name, invite_code)
       VALUES ('00000000-0000-0000-0000-000000000001', 'Dev Household', 'DEV-HOUSEHOLD')
       ON CONFLICT (id) DO NOTHING`
    );

    // Create dev user
    await pool.query(
      `INSERT INTO users (id, email, household_id)
       VALUES ('00000000-0000-0000-0000-000000000002', 'dev@example.com', '00000000-0000-0000-0000-000000000001')
       ON CONFLICT (id) DO NOTHING`
    );

    console.log('✓ Dev data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to seed dev data:', error);
    process.exit(1);
  }
}

seedDev();
