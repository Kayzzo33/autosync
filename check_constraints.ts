import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function check() {
  try {
    const constraints = await sql`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'categorias_movimentacao'
    `;
    console.log('Constraints for categorias_movimentacao:');
    console.table(constraints);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
