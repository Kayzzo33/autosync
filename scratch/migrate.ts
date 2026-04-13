import { sql } from './apps/api/src/lib/db';

async function migrate() {
  console.log('Migrating database...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS mecanicos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        nome TEXT NOT NULL,
        telefone TEXT,
        especialidade TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Check if mecanico_id exists in ordens_servico (it should, but just in case)
    // and if it's already linked to users, we might want to allow it to link to mecanicos too.
    // For now, let's just ensure the table exists.
    
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
