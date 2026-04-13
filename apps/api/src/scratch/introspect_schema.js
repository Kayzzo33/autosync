const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

async function introspect() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const tables = ['tenants', 'users', 'configuracoes_whatsapp'];
    
    for (const table of tables) {
      console.log(`\n--- TABLE: ${table} ---`);
      const cols = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      if (cols.length === 0) {
        console.log('Not found');
      } else {
        console.table(cols);
      }
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

introspect();
