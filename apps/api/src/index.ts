import * as Sentry from '@sentry/node';

import path from 'path';
import dotenv from 'dotenv';

// Garante o carregamento do .env na raiz do monorepo
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// Inicialização Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Opção manual para capturar erros do Fastify
    ],
    beforeSend(event) {
      // Scrubbing PII
      if (event.request && event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
} else {
  console.log('[Sentry] DSN não encontrado. Rodando sem monitoramento de erros.');
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';

const app = Fastify({
  logger: true,
});

// Registrar Cookies
app.register(cookie);

// Segurança Hardened
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
});

app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3001',
  credentials: true,
});

// Validação de Variaveis de Ambiente Cruciais
const requiredEnvs = [
  'DATABASE_URL',
  'JWT_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];

requiredEnvs.forEach(env => {
  if (!process.env[env] || process.env[env] === 'undefined') {
    console.error(`CRITICAL: Variável de ambiente faltando: ${env}`);
    process.exit(1);
  }
});

// Diagnóstico de Conexão Upstash
console.log('--- Diagnóstico de Infraestrutura ---');
console.log(`[Config] Caminho .env: ${envPath}`);
console.log(`[Upstash] URL: ${process.env.UPSTASH_REDIS_REST_URL ? 'Detectada' : 'AUSENTE'}`);
console.log(`[Upstash] Token: ${process.env.UPSTASH_REDIS_REST_TOKEN ? 'Detectado' : 'AUSENTE'}`);
console.log(`[Redis TCP] URL: ${process.env.REDIS_URL ? 'Detectada (Produção)' : 'Ausente (Usando localhost)'}`);
console.log(`[Sentry] DSN: ${process.env.SENTRY_DSN ? 'Configurado' : 'Opcional (Desativado)'}`);
console.log('-------------------------------------');

// AGORA SIM - Importamos o restante que depende do process.env
import { rateLimitMiddleware } from './middlewares/rateLimit';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import osRoutes from './routes/os';
import tvRoutes from './routes/tv';
import comercialRoutes from './routes/comercial';
import financeiroRoutes from './routes/financeiro';
import pessoalRoutes from './routes/pessoal';
import integracoesRoutes from './routes/integracoes';
import dashboardRoutes from './routes/dashboard';
import mecanicosRoutes from './routes/mecanicos';
import tenantsRoutes from './routes/tenants';
import messagesRoutes from './routes/messages';
import superadminRoutes from './routes/superadmin';
import catalogoRoutes from './routes/catalogo';

if (process.env.JWT_SECRET!.length < 32) {
  console.log('WARNING: JWT_SECRET curto (<32 chars). Aceitável para dev, mas RECOMENDADO aumentar.');
}

// Tratamento de erro global integrado ao Sentry
app.setErrorHandler((error, request, reply) => {
  // Capturar erro 500 ou não tratados no Sentry
  if (!error.statusCode || error.statusCode >= 500) {
    Sentry.captureException(error);
  }

  // Lida com erros do rate limit nativamente (se vier do plugin antigo ou manual)
  if (error.statusCode === 429) {
    return reply.status(429).send({ error: 'Muitas requisições, tente novamente mais tarde.' });
  }

  app.log.error(error);

  reply.status(error.statusCode || 500).send({ 
    error: error.statusCode ? error.message : 'Erro interno do servidor.' 
  });
});

// Registrar Autenticação JWT e middlewares de Roles
app.register(authPlugin);

// Registrar rotas
// Registrar rotas com Rate Limit Protetivo
app.register(async (instance) => {
  instance.addHook('preHandler', (req, res) => rateLimitMiddleware(req, res, 'login'));
  instance.register(authRoutes, { prefix: '/auth' });
});

app.register(async (instance) => {
  instance.addHook('preHandler', rateLimitMiddleware); // Default: public
  instance.register(osRoutes, { prefix: '/os' });
  instance.register(tvRoutes, { prefix: '/tv' });
  instance.register(comercialRoutes, { prefix: '/comercial' });
  instance.register(financeiroRoutes, { prefix: '/financeiro' });
  instance.register(pessoalRoutes, { prefix: '/pessoal' });
  instance.register(integracoesRoutes, { prefix: '/integracoes' });
  instance.register(dashboardRoutes, { prefix: '/dashboard' });
  instance.register(mecanicosRoutes, { prefix: '/mecanicos' });
  instance.register(tenantsRoutes,   { prefix: '/tenants' });
  instance.register(messagesRoutes,  { prefix: '/messages' });
  instance.register(catalogoRoutes,  { prefix: '/catalogo' });
  
  // NOTE: rateLimitMiddleware has to be handled carefully in superadmin, 
  // but it's okay here since it's just public/default
  instance.register(superadminRoutes, { prefix: '/superadmin' });
});

// PROTEÇÃO POR ROTA: cada rota protegida usa onRequest: [app.verifyJwt]
// O hook global foi removido — causava verificação JWT dupla (global + por rota),
// gerando respostas inconsistentes (dados + erro simultâneos) quando o token expirava.

app.get('/health', async () => {
  return { status: "ok", timestamp: Date.now() };
});

const start = async () => {
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:3333`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
