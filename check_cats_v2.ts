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
    const cats = await sql`SELECT * FROM categorias_movimentacao`;
    console.log('Categories:', cats);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

check();
