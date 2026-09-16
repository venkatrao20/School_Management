import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaFiles = [
  'academics/backend/db/schema.sql',
  'notifications/schema.mysql.sql',
  'school_transport/schema.mysql.sql',
];

async function migrate() {
  for (const relativePath of schemaFiles) {
    const schema = await fs.readFile(path.join(rootDirectory, relativePath), 'utf8');
    const statements = schema
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const [index, statement] of statements.entries()) {
      try {
        await pool.query(statement);
      } catch (error) {
        throw new Error(`${relativePath} statement ${index + 1} failed: ${error.message}`);
      }
    }
    console.log(`Applied ${relativePath}`);
  }
}

migrate()
  .then(async () => {
    await pool.end();
    console.log('MySQL schema migration complete.');
  })
  .catch(async (error) => {
    console.error('MySQL schema migration failed:', error.message);
    await pool.end();
    process.exitCode = 1;
  });