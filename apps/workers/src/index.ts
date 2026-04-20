import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';

// Garante carregamento do .env da raiz do monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ─────────────────────────────────────────────────────────────────────────────
// MODO DE EXECUÇÃO
// Para ativar BullMQ + WAHA, defina ENABLE_BULLMQ=true no .env
// Em MVP, este valor é false e nenhuma conexão Redis é feita.
// ─────────────────────────────────────────────────────────────────────────────
const BULLMQ_ENABLED = process.env.ENABLE_BULLMQ === 'true';

console.log('=======================================================');
console.log('  AutoSync — Workers de Mensageria');
console.log('=======================================================');
console.log(`  Modo: ${BULLMQ_ENABLED ? 'BullMQ + WAHA (Ativo)' : 'MVP (BullMQ isolado)'}`);
console.log('=======================================================');

if (!BULLMQ_ENABLED) {
  // ──────────────────────────────────────────────────────────────────────────
  // MODO MVP — BullMQ e WAHA completamente isolados.
  // Nenhuma conexão Redis é aberta.
  // Envios são feitos via wa.me (redirecionamento manual) pelo frontend.
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Workers] BullMQ desativado (ENABLE_BULLMQ != true).');
  console.log('[Workers] Nenhuma conexão Redis será aberta.');
  console.log('[Workers] Para envio de mensagens use o modo manual (wa.me) no frontend.');
  console.log('[Workers] Processo em espera — workers em modo standby.');

  // Mantém o processo vivo sem crashar
  setInterval(() => {
    // no-op: apenas mantém o processo rodando para hot-reload funcionar em dev
  }, 60_000);

} else {
  // ──────────────────────────────────────────────────────────────────────────
  // MODO PRODUÇÃO — BullMQ + WAHA
  // Só ativo quando ENABLE_BULLMQ=true está explicitamente configurado.
  // TODO: Ativar quando WAHA/API oficial estiver pronta.
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Workers] Iniciando BullMQ Worker (WAHA mode)...');

  // Importações dinâmicas para garantir que não crasham em modo MVP
  const { Worker, Job, Queue } = require('bullmq');
  const Redis = require('ioredis');
  const postgres = require('postgres');

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

  // Realiza o envio via WAHA (ou Mock se não configurado)
  async function sendWhatsAppMessage(phone: string, text: string) {
    if (!WAHA_API_URL || !WAHA_API_KEY) {
      console.log(`[MOCK] WhatsApp para ${phone}: ${text.substring(0, 30)}...`);
      return { status: 'success', mock: true };
    }

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

  const worker = new Worker('whatsapp', async (job: any) => {
    if (job.name === 'trigger-cron-revisao') {
      const { runCronRevisaoDiaria } = require('./cron');
      await runCronRevisaoDiaria();
      return { status: 'ok', msg: 'Cron finished' };
    }

    const { tenantId, osId, token, phone, message } = job.data;
    console.log(`Processando job [${job.name}] para o Tenant ${tenantId}`);

    try {
      const tenantsConfigs = await sql`
        SELECT conf_whatsapp_os_aberta, conf_whatsapp_os_pronta, conf_whatsapp_nps, conf_whatsapp_revisao 
        FROM tenants WHERE id = ${tenantId}
      `;
      if (tenantsConfigs.length === 0) throw new Error('Tenant não encontrado');
      const conf = tenantsConfigs[0];

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
          job.data.phone = numeroDestino;
          job.data.message = `Olá ${resp[0].nome}, ` + (message || '');
          if (job.name === 'notify-aberta') {
            job.data.message = `Olá *${resp[0].nome}*, recebemos seu *${resp[0].placa} (${resp[0].modelo})*. Em breve te atualizamos! ⚙️🔧`;
          } else if (job.name === 'notify-pronta') {
            const portalBase = process.env.FRONTEND_URL || 'https://autosync.com.br';
            job.data.message = `Boas notícias *${resp[0].nome}*! Seu *${resp[0].placa}* está pronto!\n\nAcesse sua ordem de serviço e veja o detalhamento e valor:\n👉 ${portalBase}/os/${token}`;
          } else if (job.name === 'notify-nps') {
            job.data.message = `Olá *${resp[0].nome}*, como foi o serviço do *${resp[0].placa}*?\nDe 0 a 10, o quanto você recomendaria nossa oficina aos seus amigos?\n\n(Responda essa mensagem com a nota!)`;
          }
        }
      }

      if (!numeroDestino) throw new Error('Sem número de destino');

      if (job.name === 'notify-aberta' && !conf.conf_whatsapp_os_aberta) return { status: 'skipped (disabled)' };
      if (job.name === 'notify-pronta' && !conf.conf_whatsapp_os_pronta) return { status: 'skipped (disabled)' };
      if (job.name === 'notify-nps' && !conf.conf_whatsapp_nps) return { status: 'skipped (disabled)' };
      if (job.name === 'notify-revisao' && !conf.conf_whatsapp_revisao) return { status: 'skipped (disabled)' };

      await sendWhatsAppMessage(numeroDestino, job.data.message!);

      const tipoAnotado = job.name.replace('notify-', '');
      await logMensagemDB(tenantId, tipoAnotado, numeroDestino, 'enviado');

      return { status: 'ok', sentTo: numeroDestino };
    } catch (err: any) {
      console.error(`Erro no Job ${job.name}:`, err.message);
      if (job.data.phone) {
        await logMensagemDB(tenantId, job.name.replace('notify-', ''), job.data.phone, 'falha');
      }
      throw err;
    }
  }, {
    connection,
    limiter: {
      max: 10,
      duration: 60000,
    }
  });

  worker.on('completed', (job: any) => {
    console.log(`Job [${job.id}] Finalizado! -> ${job.returnvalue.status}`);
  });

  worker.on('failed', (job: any, err: Error) => {
    console.error(`Job [${job?.id}] Falhou! -> ${err.message}`);
  });

  // Auto-adiciona o cron na fila
  const queue = new Queue('whatsapp', { connection });
  queue.add('trigger-cron-revisao', { tenantId: 'SYSTEM' }, {
    repeat: { pattern: '0 9 * * *' }
  }).then(() => console.log('[Workers] Repeatable Cron registrado no Redis!'));

  console.log('[Workers] Worker de Mensageria (WhatsApp) Iniciado!');
}
