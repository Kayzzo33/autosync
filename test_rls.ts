import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function testRls() {
  const tenantId = '46e73193-0c8b-48c7-a505-5e4216c93f0f';
  
  try {
    console.log('Testing RLS steps...');
    await sql.begin(async (t) => {
      console.log('1. Setting role authenticated');
      await t`SET LOCAL ROLE authenticated`;
      
      console.log('2. Setting app.current_tenant_id');
      await t`SET LOCAL app.current_tenant_id = ${tenantId}`;
      
      console.log('3. Running query on leads');
      const leads = await t`SELECT * FROM leads LIMIT 1`;
      console.log('Leads count:', leads.length);
    });
    console.log('Success!');
  } catch (err: any) {
    console.error('RLS Test Failed:', err.message);
    if (err.stack) console.log(err.stack);
  } finally {
    process.exit();
  }
}

testRls();
