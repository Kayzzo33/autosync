import bcrypt from 'bcrypt';
import { sql } from '../lib/db';
import crypto from 'crypto';

async function seed() {
  console.log('🚀 Iniciando seed do administrador...');

  try {
    // 1. Criar Tenant padrão
    const tenantName = 'Oficina AutoSync';
    const subdominio = 'admin';
    
    let tenantId: string;
    
    const existingTenant = await sql`
      SELECT id FROM tenants WHERE subdominio = ${subdominio}
    `;

    if (existingTenant.length > 0) {
      tenantId = existingTenant[0].id;
      console.log('✅ Tenant já existe:', tenantId);
    } else {
      const [newTenant] = await sql`
        INSERT INTO tenants (id, nome, subdominio, plano, ativo)
        VALUES (${crypto.randomUUID()}, ${tenantName}, ${subdominio}, 'premium', true)
        RETURNING id
      `;
      tenantId = newTenant.id;
      console.log('🆕 Tenant criado:', tenantId);
    }

    // 2. Criar Usuário Admin
    const email = 'admin@autosync.com';
    const password = 'admin123';
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(password, saltRounds);

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      console.log('✅ Usuário admin já existe.');
    } else {
      await sql`
        INSERT INTO users (id, tenant_id, nome, email, senha_hash, perfil, ativo)
        VALUES (${crypto.randomUUID()}, ${tenantId}, 'Administrador', ${email}, ${senhaHash}, 'admin', true)
      `;
      console.log('🆕 Usuário admin criado com sucesso!');
      console.log('📧 Email:', email);
      console.log('🔑 Senha: admin123');
    }

  } catch (error) {
    console.error('❌ Erro no seed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
