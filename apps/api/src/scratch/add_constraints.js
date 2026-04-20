import path from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function addConstraints() {
  try {
    console.log('Adding constraints...');
    
    // Add unique constraint on (tenant_id, nome) for categorias_movimentacao
    await sql`
      ALTER TABLE categorias_movimentacao 
      ADD CONSTRAINT categorias_movimentacao_tenant_nome_key UNIQUE (tenant_id, nome)
    `.catch(e => console.log('categorias_movimentacao constraint might already exist:', e.message));

    // Add unique constraint on (os_id) for contas_receber
    await sql`
      ALTER TABLE contas_receber
      ADD CONSTRAINT contas_receber_os_id_key UNIQUE (os_id)
    `.catch(e => console.log('contas_receber constraint might already exist:', e.message));

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

addConstraints();
