import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function test() {
  try {
    console.log('--- STARTING VERIFICATION ---');

    // 1. Check a tenant
    const tenants = await sql`SELECT id FROM tenants LIMIT 1`;
    if (tenants.length === 0) throw new Error('No tenants found');
    const tenantId = tenants[0].id;

    // 2. Check a vehicle
    const vehicles = await sql`SELECT id FROM veiculos WHERE tenant_id = ${tenantId} LIMIT 1`;
    if (vehicles.length === 0) throw new Error('No vehicles found for verification');
    const veiculoId = vehicles[0].id;

    // 3. Create a test OS
    console.log('Creating test OS...');
    const [os] = await sql`
      INSERT INTO ordens_servico (tenant_id, veiculo_id, status, descricao, valor_total, km_entrada)
      VALUES (${tenantId}, ${veiculoId}, 'aberta', 'TESTE DE ESTABILIDADE', 500, 1000)
      RETURNING id
    `;
    console.log(`OS created: ${os.id}`);

    // 4. Add a service (so it's not empty)
    await sql`
      INSERT INTO os_servicos (tenant_id, os_id, descricao, quantidade, valor)
      VALUES (${tenantId}, ${os.id}, 'Mão de Obra Teste', 1, 500)
    `;

    // 5. Simulate closing logic (Direct SQL to mimic os.ts logic)
    console.log('Closing OS and generating finance entry...');
    const kmSaida = 1050;
    
    // Mimic the logic in os.ts (Line 190-200)
    await sql.begin(async t => {
      await t`UPDATE ordens_servico SET status = 'fechada', fechado_at = NOW(), km_saida = ${kmSaida} WHERE id = ${os.id}`;
      
      const [categoria] = await t`
        INSERT INTO categorias_movimentacao (tenant_id, nome, tipo)
        VALUES (${tenantId}, 'Serviços Oficina', 'entrada')
        ON CONFLICT (tenant_id, nome) DO UPDATE SET nome = EXCLUDED.nome
        RETURNING id
      `;

      await t`
        INSERT INTO movimentacoes_financeiras (tenant_id, valor, tipo, descricao, data, os_id, categoria_id)
        VALUES (${tenantId}, 500, 'entrada', 'Teste OS Logic', CURRENT_DATE, ${os.id}, ${categoria.id})
      `;
    });

    // 6. Verify results
    const finance = await sql`SELECT * FROM movimentacoes_financeiras WHERE os_id = ${os.id}`;
    if (finance.length > 0) {
      console.log('✅ Success: Financeiro entry created with os_id!');
      console.log('Data:', finance[0]);
    } else {
      console.error('❌ Failure: Financeiro entry NOT created.');
    }

    const osUpdated = await sql`SELECT km_saida FROM ordens_servico WHERE id = ${os.id}`;
    if (osUpdated[0].km_saida === kmSaida) {
      console.log('✅ Success: km_saida updated correctly!');
    } else {
      console.error('❌ Failure: km_saida NOT updated.');
    }

    // Cleanup
    await sql`DELETE FROM os_servicos WHERE os_id = ${os.id}`;
    await sql`DELETE FROM movimentacoes_financeiras WHERE os_id = ${os.id}`;
    await sql`DELETE FROM ordens_servico WHERE id = ${os.id}`;
    console.log('Cleanup done.');

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    process.exit();
  }
}

test();
