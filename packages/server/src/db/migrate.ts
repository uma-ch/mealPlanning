import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running database migration...');

    // In production, __dirname is dist/db, so we need to go to src/db for schema.sql
    // In development, __dirname is src/db, so schema.sql is in the same directory
    let schemaPath = join(__dirname, 'schema.sql');

    // If running from dist (production), adjust path to src
    if (__dirname.includes('/dist/')) {
      schemaPath = join(__dirname, '../../src/db/schema.sql');
    }

    const schema = readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
