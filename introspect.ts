import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!, { transform: postgres.camel });

async function introspect() {
  try {
    const tables = [
      'contas_receber', 
      'categorias_movimentacao', 
      'conversion_events',
      'os_auditoria'
    ];
    for (const table of tables) {
      console.log(`--- TABLE: ${table} ---`);
      const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${table}`;
      if (columns.length === 0) {
        console.log('NOT FOUND');
      } else {
        console.log(columns.map(c => `${c.columnName} (${c.dataType})`).join(', '));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

introspect();
