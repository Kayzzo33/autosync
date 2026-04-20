// ─────────────────────────────────────────────────────────────────────────────
// WAHA / BullMQ — ISOLADO PARA MVP
// ─────────────────────────────────────────────────────────────────────────────
// Este módulo está completamente isolado do fluxo principal.
// Nenhuma rota da API deve importar daqui até que ENABLE_BULLMQ=true seja 
// configurado e um Redis esteja disponível.
//
// Para ativar: defina ENABLE_BULLMQ=true no .env e suba o Redis.
// ─────────────────────────────────────────────────────────────────────────────

const BULLMQ_ENABLED = process.env.ENABLE_BULLMQ === 'true';

let whatsappQueue: any = null;

if (BULLMQ_ENABLED) {
  const { Queue } = require('bullmq');
  const IORedis = require('ioredis');

  const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
  });

  whatsappQueue = new Queue('whatsapp', { connection });
  console.log('[Queue] BullMQ whatsappQueue inicializado.');
} else {
  console.log('[Queue] BullMQ desativado (ENABLE_BULLMQ != true). whatsappQueue = null.');
}

export { whatsappQueue };
