import { Queue } from 'bullmq';
import Redis from 'ioredis';
import 'dotenv/config';
import postgres from 'postgres';

const redisHost = process.env.REDIS_HOST!;
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || '';

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
});

const sql = postgres(process.env.DATABASE_URL!);
const whatsappQueue = new Queue('whatsapp', { connection });

// Função principal de Revisão. Pode ser invocada manualmente ou rodar sozinha.
export async function runCronRevisaoDiaria() {
  console.log('[CRON] Iniciando varredura diária de Revisão (KM) às 09:00...');

  try {
    // Busca veículos cuja quilometragem estimada/atual seja maior ou igual à de revisão, 
    // E que NÃO receberam mensagem de revisão nos últimos 60 dias (para não spammar).
    
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

    for (const v of veiculosVencidos) {
      // Disparamos enfileirando no BullMQ. Ele respeitará a limitação de Rate Limit automaticamente!
      const mensagem = `Olá *${v.nome}*, seu *${v.modelo}* pode estar perto da revisão! 🔧 Que tal garantirmos a segurança da sua família prestando uma manutenção preventiva na nossa oficina?`;

      await whatsappQueue.add('notify-revisao', {
        tenantId: v.tenant_id,
        phone: v.telefone,
        message: mensagem,
        veiculoId: v.veiculo_id,
      });
    }

  } catch(error) {
    console.error('[CRON] Falha ao rodar varredura de Revisão:', error);
  }
}

// Se o arquivo for rodado diretamente via CLI, testa a function:
if (require.main === module) {
  runCronRevisaoDiaria().then(() => {
    console.log('[CRON] Rotina manual de testes finalizada.');
    process.exit(0);
  });
}
