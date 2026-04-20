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

    const headers = { Authorization: `Bearer ${token}` };

    const routes = [
      '/comercial/clientes/alertas',
      '/os?limit=5',
      '/comercial/clientes'
    ];

    for (const route of routes) {
      console.log(`\n--- Testing GET ${route} ---`);
      try {
        const res = await axios.get(`http://localhost:3333${route}`, { headers });
        console.log(`Success! Data keys:`, Object.keys(res.data));
      } catch (e: any) {
        console.error(`Failure on ${route}:`, e.response?.status, e.response?.data || e.message);
      }
    }

  } catch (err: any) {
    console.error('Fatal failure:', err.response?.status, err.response?.data || err.message);
  } finally {
    process.exit();
  }
}

testApi();
