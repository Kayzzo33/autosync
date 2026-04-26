import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sql } from '../lib/db';
import crypto from 'crypto';

// Rate limiting map
const rateLimiter = new Map<string, { count: number, blockedUntil: number }>();

const superadminRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  const getIp = (req: any) => req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  const checkRateLimit = (ip: string) => {
    const record = rateLimiter.get(ip) || { count: 0, blockedUntil: 0 };
    if (record.blockedUntil > Date.now()) {
      return false; // blocked
    }
    if (record.blockedUntil !== 0 && record.blockedUntil < Date.now()) {
       record.count = 0;
       record.blockedUntil = 0;
    }
    return true; // allowed
  };

  const registerFail = (ip: string) => {
    const record = rateLimiter.get(ip) || { count: 0, blockedUntil: 0 };
    record.count += 1;
    if (record.count >= 3) {
       record.blockedUntil = Date.now() + 60 * 60 * 1000; // block for 1 hour
    }
    rateLimiter.set(ip, record);
  };

  const registerSuccess = (ip: string) => {
    rateLimiter.delete(ip);
  };

  const logAudit = async (ip: string, acao: string, tenant_afetado: string | null = null, detalhes: any = {}) => {
     await sql`INSERT INTO superadmin_logs (ip, acao, tenant_afetado, detalhes) VALUES (${ip}, ${acao}, ${tenant_afetado}, ${detalhes})`;
  };

  app.post('/login', async (request, reply) => {
     const ip = getIp(request);
     if (!checkRateLimit(ip)) {
        return reply.status(403).send({ error: 'Acesso bloqueado' });
     }

     const loginSchema = z.object({
        email: z.string().email(),
        password: z.string()
     });

     try {
       const { email, password } = loginSchema.parse(request.body);
       if (email === process.env.SUPERADMIN_EMAIL && password === process.env.SUPERADMIN_PASSWORD) {
          registerSuccess(ip);
          await logAudit(ip, 'LOGIN_SUCCESS');

          const superToken = app.jwt.sign(
             { role: 'superadmin', sub: 'superadmin', tenant_id: 'superadmin' },
             { expiresIn: '8h' }
          );

          reply.setCookie('superToken', superToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60, // 8 hours
          });

          return reply.send({ success: true, token: superToken });
       } else {
          registerFail(ip);
          await logAudit(ip, 'LOGIN_FAIL');
          return reply.status(401).send({ error: 'Email ou senha inválidos' });
       }
     } catch (err: any) {
        return reply.status(400).send({ error: 'Formato inválido' });
     }
  });

  const verifySuperadmin = async (request: any, reply: any) => {
     try {
        const cookieToken = request.cookies.superToken;
        const headerKey = request.headers['x-admin-key'];

        if (!cookieToken || !headerKey || headerKey !== process.env.ADMIN_API_KEY) {
           return reply.status(404).send();
        }

        const decoded: any = app.jwt.verify(cookieToken);
        if (decoded.role !== 'superadmin') {
           return reply.status(404).send();
        }
     } catch (err) {
        return reply.status(404).send();
     }
  };

  app.get('/tenants', { preHandler: verifySuperadmin }, async (request, reply) => {
     const ip = getIp(request);
     await logAudit(ip, 'LIST_TENANTS');
     
     const tenants = await sql`
        SELECT t.id, t.nome, t.email as email_admin, t.created_at, t.ativo,
               (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_usuarios,
               (SELECT COUNT(*) FROM ordens_servico WHERE tenant_id = t.id) as total_os
        FROM tenants t
        ORDER BY t.created_at DESC
     `;
     return reply.send(tenants);
  });

  app.post('/convites', { preHandler: verifySuperadmin }, async (request, reply) => {
     const ip = getIp(request);
     
     const token = crypto.randomUUID();
     const expirado_em = new Date();
     expirado_em.setHours(expirado_em.getHours() + 48); // 48h validity

     await sql`
       INSERT INTO convites (token, expirado_em) VALUES (${token}, ${expirado_em})
     `;

     await logAudit(ip, 'GENERATE_INVITE', null, { token });

     const url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/cadastro?token=${token}`;
     return reply.send({ url, token });
  });

  app.patch('/tenants/:id/suspender', { preHandler: verifySuperadmin }, async (request, reply) => {
     const { id } = request.params as { id: string };
     const ip = getIp(request);

     const tenant = await sql`SELECT ativo FROM tenants WHERE id = ${id}`;
     if (!tenant.length) return reply.status(404).send();

     const novoStatus = !tenant[0].ativo;

     await sql`UPDATE tenants SET ativo = ${novoStatus} WHERE id = ${id}`;
     await logAudit(ip, 'TOGGLE_TENANT_STATUS', id, { status: novoStatus });

     return reply.send({ success: true, ativo: novoStatus });
  });

  app.get('/logs', { preHandler: verifySuperadmin }, async (request, reply) => {
     const ip = getIp(request);
     await logAudit(ip, 'LIST_LOGS');

     const logs = await sql`
        SELECT * FROM superadmin_logs ORDER BY created_at DESC LIMIT 100
     `;
     return reply.send(logs);
  });
};

export default superadminRoutes;
