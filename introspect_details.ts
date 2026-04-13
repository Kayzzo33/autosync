import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function checkDetails() {
  try {
    console.log('--- ENUMS ---');
    const enums = await sql`SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder`;
    console.log(enums);

    console.log('--- NOT NULL COLUMNS ---');
    const notNulls = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE is_nullable = 'NO' 
      AND table_schema = 'public'
      AND table_name IN ('contas_receber', 'movimentacoes_financeiras', 'conversion_events')
    `;
    console.log(notNulls);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkDetails();
