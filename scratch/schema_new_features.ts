import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('Creating convites table...');
    await sql`
      CREATE TABLE IF NOT EXISTS convites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token UUID UNIQUE NOT NULL,
        usado BOOLEAN DEFAULT false,
        expirado_em TIMESTAMP NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW(),
        tenant_id UUID REFERENCES tenants(id) NULL
      );
    `;

    console.log('Creating catalogo_itens table...');
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_tipo') THEN
          CREATE TYPE item_tipo AS ENUM ('servico', 'peca');
        END IF;
      END$$;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS catalogo_itens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        tipo item_tipo NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('Enabling RLS on catalogo_itens...');
    await sql`ALTER TABLE catalogo_itens ENABLE ROW LEVEL SECURITY;`;
    
    // Check if policy exists, if not create
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'catalogo_itens' AND policyname = 'tenant_isolation_catalogo'
        ) THEN
          CREATE POLICY tenant_isolation_catalogo ON catalogo_itens
            FOR ALL
            USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
        END IF;
      END$$;
    `;

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
