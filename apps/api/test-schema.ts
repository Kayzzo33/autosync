import { sql } from './src/lib/db.ts';

async function run() {
  try {
    const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='tenants'`;
    console.log(r);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
