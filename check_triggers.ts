import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function checkTriggers() {
  try {
    console.log('--- Database Triggers ---');
    const triggers = await sql`
      SELECT 
        event_object_table AS table_name, 
        trigger_name, 
        event_manipulation AS event, 
        action_statement AS action, 
        action_timing AS timing
      FROM information_schema.triggers
      WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog')
    `;
    console.table(triggers);

    console.log('\n--- Constraints ---');
    const constraints = await sql`
      SELECT 
        table_name, 
        constraint_name, 
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
    `;
    console.table(constraints);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkTriggers();
