import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';

// Garante o carregamento do .env na raiz do monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Conexão principal mestre (bypassa RLS).
export const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30, // segundos
  connect_timeout: 20, // segundos (Aumentado para conexões remotas instáveis)
  onnotice: () => {}, // Silencia notices para evitar poluição de logs
  timeout: 15, // Timeout global para queries
  ssl: 'require', // Obrigatório para Supabase fora de redes locais
  prepare: false, // OBRIGATÓRIO PARA PGBOUNCER TRANSACTION MODE
});

/**
 * Wrapper para executar queries com Row Level Security
 * Restrito ao tenantId com suporte a retry em erros de conexão.
 */
export async function withTenantRls<T>(
  tenantId: string,
  callback: (tenantSql: postgres.TransactionSql) => Promise<T>,
  retryCount = 0
): Promise<T> {
  if (!tenantId) {
    console.error('[DB ERROR] Tentativa de query RLS sem tenantId definido!');
    throw new Error('Tenant ID é obrigatório para esta operação.');
  }

  try {
    return await sql.begin(async (t) => {
      // Rebaixa autoridade no PostgreSQL para um usuário restrito
      await t`SET LOCAL ROLE authenticated`;
      
      // Configura a variável de sessão usada para filtrar os tenants nas policies
      await t`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      
      return await callback(t);
    }) as T;
  } catch (error: any) {
    // Lista de códigos de erro de comunicação/conexão do Postgres
    const connectionErrorCodes = ['08000', '08003', '08006', '57P01', 'ECONNRESET'];
    
    if (connectionErrorCodes.includes(error.code) && retryCount < 1) {
      console.warn(`[DB RETRY] Conexão instável detectada para tenant ${tenantId}. Tentando reconectar...`);
      return withTenantRls(tenantId, callback, retryCount + 1);
    }

    console.error(`[DB ERROR] Falha na execução da query para tenant ${tenantId}:`, error.message);
    throw error;
  }
}
