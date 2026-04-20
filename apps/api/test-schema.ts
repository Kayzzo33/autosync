import { sql } from './src/lib/db.ts';

async function run() {
  try {
    await sql.unsafe(`ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_mecanico_id_fkey`);
    console.log('Dropped FK successfully');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
