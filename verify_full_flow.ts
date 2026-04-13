import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const API_URL = 'http://localhost:3333';

async function verifyCompleteFlow() {
  const credentials = { email: 'admin@autosync.com.br', password: 'admin123' };
  const randomSuffix = Math.floor(Math.random() * 10000);
  const testPhone = `119${String(randomSuffix).padStart(4, '0')}0000`;
  const testPlaca = `TST${randomSuffix.toString().padStart(4, '0')}`.substring(0, 7);

  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, credentials);
    const token = loginRes.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('--- STEP 1: Create Lead ---');
    const leadRes = await axios.post(`${API_URL}/comercial/leads`, {
      nome: `Flow Test ${randomSuffix}`,
      telefone: testPhone,
      origem: 'google'
    }, { headers });
    const leadId = leadRes.data.lead.id;
    console.log('Lead created:', leadId);

    console.log('--- STEP 2: Convert Lead to Client ---');
    await axios.patch(`${API_URL}/comercial/leads/${leadId}/status`, { status: 'convertido' }, { headers });
    const clientsRes = await axios.get(`${API_URL}/comercial/clientes`, { headers });
    const client = clientsRes.data.clientes.find((c: any) => c.nome === `Flow Test ${randomSuffix}`);
    const clientId = client.id;
    console.log('Client created:', clientId, '- Linked to Lead:', client.leadId === leadId);

    console.log('--- STEP 3: Add Vehicle ---');
    const vehicleRes = await axios.post(`${API_URL}/comercial/veiculos`, {
      cliente_id: clientId,
      placa: testPlaca,
      marca: 'TEST',
      modelo: 'FLOW MODEL',
      ano: 2024,
      km_atual: 1000
    }, { headers });
    const vehicleId = vehicleRes.data.veiculo.id;
    console.log('Vehicle created:', vehicleId);

    console.log('--- STEP 4: Open OS ---');
    const osRes = await axios.post(`${API_URL}/os`, {
      veiculo_id: vehicleId,
      descricao: 'Teste de Fluxo Completo Final',
      km_entrada: 1050
    }, { headers });
    const osId = osRes.data.os.id;
    console.log('OS Opened:', osId);

    console.log('--- STEP 5: Add Service and Piece ---');
    await axios.post(`${API_URL}/os/${osId}/servicos`, { descricao: 'Mao de Obra', quantidade: 1, valor_unit: 100 }, { headers });
    await axios.post(`${API_URL}/os/${osId}/pecas`, { descricao: 'Pastilha de Freio', quantidade: 2, valor_unit: 50 }, { headers });
    console.log('Items added (Total should be 200)');

    console.log('--- STEP 6: Finalize OS ---');
    // Using camelCase result? No, API PATCH for status uses snake_case in os.ts (statusSchema)
    await axios.patch(`${API_URL}/os/${osId}/status`, { status: 'fechada' }, { headers });
    console.log('OS Finalized');

    console.log('--- STEP 7: Verify Financial Generation ---');
    const financeRes = await axios.get(`${API_URL}/financeiro/contas`, { headers });
    const conta = financeRes.data.contas.find((c: any) => c.osNumero === osId);
    console.log('Bill to Receive created:', !!conta, '- Value:', conta?.valor);

    console.log('\n--- FLOW SUCCESSFUL! ---');

  } catch (err: any) {
    console.error('Flow failed at step:', err.response?.status, err.response?.data);
  } finally {
    process.exit();
  }
}

verifyCompleteFlow();
