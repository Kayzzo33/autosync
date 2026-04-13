import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('Applying migrations...');

    // 1. ordens_servico
    await sql`
      ALTER TABLE ordens_servico 
      ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id),
      ADD COLUMN IF NOT EXISTS km_saida INTEGER DEFAULT 0
    `;
    console.log('Modified ordens_servico');

    // 2. movimentacoes_financeiras
    await sql`
      ALTER TABLE movimentacoes_financeiras 
      ADD COLUMN IF NOT EXISTS os_id UUID REFERENCES ordens_servico(id),
      ADD COLUMN IF NOT EXISTS descricao TEXT
    `;
    console.log('Modified movimentacoes_financeiras');

    // 3. categorias_movimentacao (Missing unique constraint for ON CONFLICT)
    await sql`
      ALTER TABLE categorias_movimentacao 
      ADD CONSTRAINT categorias_movimentacao_tenant_nome_unique UNIQUE (tenant_id, nome)
    `;
    console.log('Modified categorias_movimentacao');

    console.log('Migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
