require('dotenv').config({ path: '../../.env' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function inspect() {
  try {
    console.log('--- COLUMNS ---');
    const columns = await sql`
      SELECT table_name, column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name IN ('leads', 'clientes', 'ordens_servico', 'movimentacoes_financeiras')
      ORDER BY table_name, ordinal_position
    `;
    console.table(columns);

    console.log('--- TRIGGERS ---');
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement 
      FROM information_schema.triggers
    `;
    console.table(triggers);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
