const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const sql = postgres(process.env.DATABASE_URL);

async function probe() {
  try {
    const tables = await sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`;
    console.log('--- Tables ---');
    console.log(tables.map(t => t.tablename).join(', '));

    const users = await sql`SELECT id, email, tenant_id FROM users LIMIT 1`;
    console.log('--- Sample User ---');
    console.log(JSON.stringify(users[0]));
  } catch (err) {
    console.error('--- Error ---');
    console.error(err.message);
  } finally {
    process.exit();
  }
}

probe();
