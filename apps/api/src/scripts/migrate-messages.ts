import path from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function run() {
  console.log('[Migration] Criando tabela messages...');

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      client_id   UUID        REFERENCES clientes(id) ON DELETE SET NULL,
      content     TEXT        NOT NULL,
      channel     TEXT        NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp')),
      mode        TEXT        NOT NULL DEFAULT 'manual'   CHECK (mode    IN ('manual', 'api')),
      status      TEXT        NOT NULL DEFAULT 'draft'    CHECK (status  IN ('draft', 'queued', 'sent_manual', 'sent_api', 'failed')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('[Migration] ✅ Tabela messages criada.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)
  `;
  console.log('[Migration] ✅ Índices criados.');

  await sql`ALTER TABLE messages ENABLE ROW LEVEL SECURITY`;

  // Recria a policy com segurança
  await sql`
    DROP POLICY IF EXISTS "messages_tenant_isolation" ON messages
  `;
  await sql`
    CREATE POLICY "messages_tenant_isolation"
      ON messages
      USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  `;
  console.log('[Migration] ✅ RLS ativado e policy criada.');

  // Trigger updated_at
  await sql`
    CREATE OR REPLACE FUNCTION update_messages_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;
  await sql`DROP TRIGGER IF EXISTS messages_updated_at ON messages`;
  await sql`
    CREATE TRIGGER messages_updated_at
      BEFORE UPDATE ON messages
      FOR EACH ROW EXECUTE FUNCTION update_messages_updated_at()
  `;
  console.log('[Migration] ✅ Trigger updated_at configurado.');

  console.log('[Migration] 🎉 Migration concluída com sucesso!');
  await sql.end();
}

run().catch((err) => {
  console.error('[Migration] ❌ Erro:', err.message);
  process.exit(1);
});
