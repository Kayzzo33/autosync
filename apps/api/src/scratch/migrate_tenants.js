const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Applying migration...');
    await sql`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS cnpj TEXT,
      ADD COLUMN IF NOT EXISTS telefone TEXT,
      ADD COLUMN IF NOT EXISTS endereco TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_templates JSONB DEFAULT '{
        "os_aberta": "Olá *{{cliente_nome}}*, sua O.S. #{{os_numero}} foi aberta com sucesso!",
        "os_pronta": "Olá *{{cliente_nome}}*, seu veículo {{veiculo_modelo}} ({{veiculo_placa}}) está pronto!",
        "nps": "Olá *{{cliente_nome}}*, como foi sua experiência na nossa oficina?",
        "km_revisao": "Olá *{{cliente_nome}}*, seu veículo está próximo da revisão!"
      }'::jsonb
    `;
    console.log('Migration successful!');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
