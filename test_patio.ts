import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

async function testApi() {
  const credentials = { email: 'admin@autosync.com.br', password: 'admin123' };
  
  try {
    const loginRes = await axios.post('http://localhost:3333/auth/login', credentials);
    const token = loginRes.data.accessToken;
    const user = loginRes.data.user;

    const resTV = await axios.get(`http://localhost:3333/tv/ordens?tenant_id=${user.tenant_id}`);
    console.log(`\n--- /tv/ordens ---`);
    console.log('Result:', resTV.data.ordens.length, 'ordens');
    console.log(resTV.data.ordens);

    const resOS = await axios.get(`http://localhost:3333/os`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`\n--- /os ---`);
    console.log('Result:', resOS.data.ordens.length, 'ordens');
    console.log(resOS.data.ordens);

  } catch (err: any) {
    console.error('Fatal failure:', err.response?.status, err.response?.data || err.message);
  } finally {
    process.exit();
  }
}

testApi();
