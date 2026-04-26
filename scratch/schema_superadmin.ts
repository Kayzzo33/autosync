import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('Creating superadmin_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS superadmin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip VARCHAR(45) NOT NULL,
        acao VARCHAR(255) NOT NULL,
        tenant_afetado UUID REFERENCES tenants(id) NULL,
        detalhes JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
