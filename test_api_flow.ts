import axios from 'axios';
import postgres from 'postgres';
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
    console.log('Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n--- Testing GET /comercial/leads ---');
    try {
      const leadsRes = await axios.get('http://localhost:3333/comercial/leads', { headers });
      console.log('Leads fetched:', leadsRes.data.leads.length);
      console.log('First lead keys:', Object.keys(leadsRes.data.leads[0] || {}));
    } catch (e: any) {
      console.error('Leads failure:', e.response?.status, e.response?.data);
    }

    console.log('\n--- Testing GET /comercial/clientes ---');
    try {
      const clientesRes = await axios.get('http://localhost:3333/comercial/clientes', { headers });
      console.log('Clientes fetched:', clientesRes.data.clientes.length);
      console.log('First cliente keys:', Object.keys(clientesRes.data.clientes[0] || {}));
    } catch (e: any) {
      console.error('Clientes failure:', e.response?.status, e.response?.data);
    }

  } catch (err: any) {
    console.error('Fatal failure:', err.response?.status, err.response?.data);
  } finally {
    process.exit();
  }
}

testApi();
