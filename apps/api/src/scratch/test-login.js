const postgres = require('postgres');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const sql = postgres(process.env.DATABASE_URL);

async function testLogin() {
  const email = 'admin@autosync.com';
  const password = 'admin123';

  console.log(`Testing login for ${email}...`);

  try {
    const userResult = await sql`SELECT id, tenant_id, senha_hash, perfil, ativo FROM users WHERE email = ${email}`;
    
    if (userResult.length === 0) {
      console.log('FAIL: User not found');
      return;
    }

    const user = userResult[0];
    console.log('User found:', JSON.stringify({ id: user.id, tenant_id: user.tenant_id, active: user.ativo }));

    const passValid = await bcrypt.compare(password, user.senha_hash);
    if (!passValid) {
      console.log('FAIL: Password incorrect');
      
      // Check if maybe it's another password?
      // Some seeds use different emails.
      console.log('Hash in DB:', user.senha_hash);
    } else {
      console.log('SUCCESS: Credentials are correct');
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit();
  }
}

testLogin();
