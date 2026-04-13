import { Worker, Job, Queue } from 'bullmq';
import Redis from 'ioredis';
import 'dotenv/config';
import postgres from 'postgres';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const sql = postgres(process.env.DATABASE_URL!);

// Configs do WAHA
const WAHA_API_URL = process.env.WAHA_API_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

type WhatsAppJobData = {
  osId?: string;
  tenantId: string;
  veiculoId?: string;
  token?: string;
  phone?: string;
  message?: string;
  tipo_manual?: boolean;
};

// Realiza o envio via WAHA (ou Mock)
async function sendWhatsAppMessage(phone: string, text: string) {
  if (!WAHA_API_URL || !WAHA_API_KEY) {
    console.log(`[MOCK] WhatsApp para ${phone}: ${text.substring(0, 30)}...`);
    return { status: 'success', mock: true };
  }

  // WAHA usa chatId formato 5511999999999@c.us
  // Limpamos o número para garantir que tenha apenas dígitos
  const cleanPhone = phone.replace(/\D/g, '');
  const chatId = `${cleanPhone}@c.us`;

  const response = await fetch(`${WAHA_API_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': WAHA_API_KEY
    },
    body: JSON.stringify({
      chatId: chatId,
      text: text,
      session: WAHA_SESSION
    })
  });

  if (!response.ok) {
    throw new Error(`WAHA API Error: ${await response.text()}`);
  }

  return response.json();
}


async function logMensagemDB(tenantId: string, tipo: string, destinatario: string, status: string) {
  const oculto = destinatario.substring(0, 3) + '***' + destinatario.substring(destinatario.length - 4);
  await sql`
    INSERT INTO mensagens_enviadas (tenant_id, tipo, destinatario_oculto, status)
    VALUES (${tenantId}, ${tipo}, ${oculto}, ${status})
  `;
}

const worker = new Worker('whatsapp', async (job: Job<WhatsAppJobData>) => {
  if (job.name === 'trigger-cron-revisao') {
     const { runCronRevisaoDiaria } = require('./cron');
     await runCronRevisaoDiaria();
     return { status: 'ok', msg: 'Cron finished' };
  }

  const { tenantId, osId, token, phone, message } = job.data;
  console.log(`Processando job [${job.name}] para o Tenant ${tenantId}`);

  try {
    // 1. Validar configs de permissão do Tenant se não for mensagem manual
    const tenantsConfigs = await sql`
      SELECT conf_whatsapp_os_aberta, conf_whatsapp_os_pronta, conf_whatsapp_nps, conf_whatsapp_revisao 
      FROM tenants WHERE id = ${tenantId}
    `;
    if (tenantsConfigs.length === 0) throw new Error('Tenant não encontrado');
    const conf = tenantsConfigs[0];

    // Busca de Telefone
    let numeroDestino = phone || '';
    if (osId && !numeroDestino) {
      const resp = await sql`
        SELECT c.telefone, c.nome, v.placa, v.modelo 
        FROM ordens_servico o
        JOIN veiculos v ON v.id = o.veiculo_id
        JOIN clientes c ON c.id = v.cliente_id
        WHERE o.id = ${osId}
      `;
      if (resp.length > 0) {
        numeroDestino = resp[0].telefone;
        job.data.phone = numeroDestino; // Cache no objeto job
        
        // Substituindo variáveis magicamente
        job.data.message = `Olá ${resp[0].nome}, ` + (message || '');
        if(job.name === 'notify-aberta') {
          job.data.message = `Olá *${resp[0].nome}*, recebemos seu *${resp[0].placa} (${resp[0].modelo})*. Em breve te atualizamos! ⚙️🔧`;
        } else if (job.name === 'notify-pronta') {
          // Frontend Portal URL base pode vir do .env
          const portalBase = process.env.FRONTEND_URL || 'https://autosync.com.br';
          job.data.message = `Boas notícias *${resp[0].nome}*! Seu *${resp[0].placa}* está pronto!\n\nAcesse sua ordem de serviço e veja o detalhamento e valor:\n👉 ${portalBase}/os/${token}`;
        } else if (job.name === 'notify-nps') {
          job.data.message = `Olá *${resp[0].nome}*, como foi o serviço do *${resp[0].placa}*?\nDe 0 a 10, o quanto você recomendaria nossa oficina aos seus amigos?\n\n(Responda essa mensagem com a nota!)`;
        }
      }
    }

    if (!numeroDestino) throw new Error('Sem número de destino');

    // Validação de Permissão (Toggle do Tenant)
    if (job.name === 'notify-aberta' && !conf.conf_whatsapp_os_aberta) return { status: 'skipped (disabled)' };
    if (job.name === 'notify-pronta' && !conf.conf_whatsapp_os_pronta) return { status: 'skipped (disabled)' };
    if (job.name === 'notify-nps' && !conf.conf_whatsapp_nps) return { status: 'skipped (disabled)' };
    if (job.name === 'notify-revisao' && !conf.conf_whatsapp_revisao) return { status: 'skipped (disabled)' };

    // Disparar Action
    await sendWhatsAppMessage(numeroDestino, job.data.message!);

    // Log no DB (Apenas Status, Nunca o Texto da Mensagem) - LGPD
    const tipoAnotado = job.name.replace('notify-', '');
    await logMensagemDB(tenantId, tipoAnotado, numeroDestino, 'enviado');

    return { status: 'ok', sentTo: numeroDestino };
  } catch (err: any) {
    console.error(`Erro no Job ${job.name}:`, err.message);
    if (job.data.phone) {
       await logMensagemDB(tenantId, job.name.replace('notify-',''), job.data.phone, 'falha');
    }
    throw err;
  }
}, {
  connection,
  limiter: {
    max: 10,
    duration: 60000, 
    // Garante um máximo de 10 execuções globais na fila a cada 1 minuto para respeitar a instância do WAHA.
  }
});

worker.on('completed', job => {
  console.log(`Job [${job.id}] Finalizado! -> ${job.returnvalue.status}`);
});

worker.on('failed', (job, err) => {
  console.error(`Job [${job?.id}] Falhou! -> ${err.message}`);
});

// Auto-adiciona o cron na fila se não existir
const queue = new Queue('whatsapp', { connection });
queue.add('trigger-cron-revisao', { tenantId: 'SYSTEM' }, {
  repeat: { pattern: '0 9 * * *' } // Todo dia as 09:00am
}).then(() => console.log('Repeatable Cron registrado no Redis!'));

console.log('Worker de Mensageria (WhatsApp) Iniciado!');
