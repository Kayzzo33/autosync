import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function updateSchema() {
  try {
    console.log('--- Updating os_servicos ---');
    await sql`ALTER TABLE os_servicos ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1`;
    console.log('Success!');
  } catch (err) {
    console.error('Failed to update schema (likely permissions):', err);
  } finally {
    process.exit();
  }
}

updateSchema();
