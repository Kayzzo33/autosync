// ─────────────────────────────────────────────────────────────────────────────
// CRON — Revisão Diária de Veículos
// ─────────────────────────────────────────────────────────────────────────────
// ISOLADO: BullMQ só é usado quando ENABLE_BULLMQ=true.
// Em modo MVP, apenas faz a query no banco e loga — sem enfileirar jobs.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config';
import postgres from 'postgres';

const BULLMQ_ENABLED = process.env.ENABLE_BULLMQ === 'true';

const sql = postgres(process.env.DATABASE_URL!);

// Função principal de Revisão. Pode ser invocada manualmente ou pelo worker.
export async function runCronRevisaoDiaria() {
  console.log('[CRON] Iniciando varredura diária de Revisão (KM) às 09:00...');

  try {
    const veiculosVencidos = await sql`
      SELECT v.id as veiculo_id, v.tenant_id, v.modelo, c.telefone, c.nome 
      FROM veiculos v
      JOIN clientes c ON c.id = v.cliente_id
      WHERE v.km_atual >= v.km_proxima_revisao 
        AND v.km_proxima_revisao > 0
        AND NOT EXISTS (
           SELECT 1 FROM mensagens_enviadas m 
           WHERE m.tenant_id = v.tenant_id 
             AND tipo = 'revisao' 
             AND destinatario_oculto = (SUBSTRING(c.telefone, 1, 3) || '***' || SUBSTRING(c.telefone, LENGTH(c.telefone) - 3, 4))
             AND m.created_at > NOW() - INTERVAL '60 days'
        )
    `;

    console.log(`[CRON] Encontrados ${veiculosVencidos.length} veículos para notificação de revisão.`);

    if (!BULLMQ_ENABLED) {
      // MVP: apenas loga os veículos encontrados, sem enfileirar
      console.log('[CRON] BullMQ desativado — jobs NÃO enfileirados. Ative ENABLE_BULLMQ=true para envio automático.');
      for (const v of veiculosVencidos) {
        console.log(`  [CRON] Pendente: ${v.nome} (${v.modelo}) — ${v.telefone}`);
      }
      return;
    }

    // ── MODO PRODUÇÃO: BullMQ ativo ──────────────────────────────────────────
    const { Queue } = require('bullmq');
    const Redis = require('ioredis');

    const connection = new Redis({
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
      maxRetriesPerRequest: null,
    });

    const whatsappQueue = new Queue('whatsapp', { connection });

    for (const v of veiculosVencidos) {
      const mensagem = `Olá *${v.nome}*, seu *${v.modelo}* pode estar perto da revisão! 🔧 Que tal garantirmos a segurança da sua família prestando uma manutenção preventiva na nossa oficina?`;

      await whatsappQueue.add('notify-revisao', {
        tenantId: v.tenant_id,
        phone: v.telefone,
        message: mensagem,
        veiculoId: v.veiculo_id,
      });
    }

    await connection.quit();

  } catch (error) {
    console.error('[CRON] Falha ao rodar varredura de Revisão:', error);
  }
}

// Se rodado diretamente via CLI, testa a function:
if (require.main === module) {
  runCronRevisaoDiaria().then(() => {
    console.log('[CRON] Rotina manual de testes finalizada.');
    process.exit(0);
  });
}
