import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function checkRLS() {
  try {
    console.log('--- TABLES WITH RLS ENABLED ---');
    const rlsTables = await sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log(rlsTables);

    console.log('--- POLICIES ---');
    const policies = await sql`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `;
    console.log(policies);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkRLS();
