// =========================================================================
// SCRIPT DE CRIAÇÃO DE ADMIN - AUTOSYNC (FIX HOISTING)
// =========================================================================

const path = require('path');
const fs = require('fs');

// 1. CARREGAR DOTENV NO INÍCIO DO ARQUIVO (3 níveis acima)
const envPath = path.resolve(__dirname, '../../../.env');

console.log('--- [AutoSync] Depuração de Ambiente ---');
console.log('➜ Procurando .env em:', envPath);

if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado!');
  require('dotenv').config({ path: envPath });
} else {
  console.error('❌ ERRO: Arquivo .env NÃO encontrado no caminho esperado.');
  console.log('Tentando carregar .env local por segurança...');
  require('dotenv').config();
}

// 2. SÓ IMPORTAR O RESTO DEPOIS QUE O AMBIENTE ESTIVER CARREGADO
const bcrypt = require('bcrypt');
const { sql } = require('../src/lib/db');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@autosync.com.br';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const tenantName = 'Oficina Matriz';

  console.log('--- [AutoSync] Configuração de Acesso Admin ---');
  
  const dbUrl = process.env.DATABASE_URL || 'NÃO DEFINIDA';
  console.log('➜ Database URL carregada:', dbUrl.includes('supabase') ? 'SUPABASE DETECTADO' : 'LOCAL/ERRO DETECTADO');

  try {
    // 1. Criar ou Obter Tenant Padrão
    let tenant = await sql`SELECT id FROM tenants LIMIT 1`;
    let tenantId;

    if (tenant.length === 0) {
      console.log('➜ Criando tenant padrão...');
      const newTenant = await sql`
        INSERT INTO tenants (nome, slug, ativo)
        VALUES (${tenantName}, 'matriz', true)
        RETURNING id
      `;
      tenantId = newTenant[0].id;
    } else {
      tenantId = tenant[0].id;
    }

    // 2. Verificar se usuário já existe na tabela PUBLIC.USERS
    const userExists = await sql`SELECT id FROM users WHERE email = ${email}`;
    
    // 3. Criar Senha Hash
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    if (userExists.length > 0) {
      console.log(`➜ Usuário ${email} já existe no banco. Atualizando senha e garantindo acesso...`);
      await sql`
        UPDATE users 
        SET senha_hash = ${hash}, ativo = true, perfil = 'admin', tenant_id = ${tenantId}
        WHERE email = ${email}
      `;
    } else {
      // 4. Inserir Usuário Admin
      console.log(`➜ Criando novo registro admin para: ${email}...`);
      await sql`
        INSERT INTO users (tenant_id, email, senha_hash, nome, perfil, ativo)
        VALUES (${tenantId}, ${email}, ${hash}, 'Administrador', 'admin', true)
      `;
    }

    console.log('--- ✅ Operação Concluída com Sucesso! ---');
    console.log(`Usuário: ${email}`);
    console.log(`Senha: ${password}`);
    console.log('----------------');

  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('DICA: O script não conseguiu conectar no banco.');
      console.error('Isso acontece se a DATABASE_URL for ignorada ou se a porta estiver errada.');
      console.error('Certifique-se que o Supabase está OK.');
    }
  } finally {
    process.exit(0);
  }
}

createAdmin();
