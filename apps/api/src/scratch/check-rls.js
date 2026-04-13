const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const sql = postgres(process.env.DATABASE_URL);

async function checkRLS() {
  try {
    const policies = await sql`SELECT tablename, policyname, roles, cmd, qual FROM pg_policies`;
    console.log('--- RLS Policies ---');
    console.log(JSON.stringify(policies, null, 2));

    const roles = await sql`SELECT rolname FROM pg_roles WHERE rolname = 'authenticated'`;
    console.log('--- Roles ---');
    console.log(JSON.stringify(roles, null, 2));
  } catch (err) {
    console.error('--- Error ---');
    console.error(err.message);
  } finally {
    process.exit();
  }
}

checkRLS();
