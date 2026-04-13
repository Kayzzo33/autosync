require('dotenv').config({ path: '../../.env' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function checkTriggers() {
  try {
    const triggers = await sql`
      SELECT 
          tgname as trigger_name,
          relname as table_name,
          proname as function_name,
          prosrc as function_definition
      FROM pg_trigger
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
      JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
      JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
      WHERE pg_namespace.nspname = 'public'
    `;
    console.table(triggers);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTriggers();
