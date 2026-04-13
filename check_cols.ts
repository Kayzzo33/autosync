import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function check() {
  const tables = ['movimentacoes_financeiras', 'ordens_servico', 'contas_receber', 'clientes', 'leads'];
  try {
    for (const table of tables) {
      console.log(`--- Table: ${table} ---`);
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
        ORDER BY ordinal_position
      `;
      console.table(columns);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

check();
