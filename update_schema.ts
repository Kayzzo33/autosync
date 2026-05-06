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
    console.log('--- Updating tenants ---');
    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tutorial_concluido BOOLEAN DEFAULT false`;
    console.log('Success!');
  } catch (err) {
    console.error('Failed to update schema (likely permissions):', err);
  } finally {
    process.exit();
  }
}

updateSchema();
