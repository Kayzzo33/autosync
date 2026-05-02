import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sql, withTenantRls } from '../lib/db';

const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  // Login: Aumentado para 100 por 15 min em desenvolvimento para não bloquear o usuário.
  app.post('/login', {
    config: {
      rateLimit: {
        max: 100,
        timeWindow: 15 * 60 * 1000 // 15 minutos
      }
    }
  }, async (request, reply) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });

      const { email, password } = loginSchema.parse(request.body);
      app.log.info(`[LOGIN] Tentativa para: ${email}`);

      // Usando query bruta sem RLS (já que ainda não sabemos o tenant antes de testar a senha)
      // Nota: transform: postgres.camel converte tenant_id -> tenantId e senha_hash -> senhaHash
      const userResult = await sql`SELECT id, tenant_id, senha_hash, perfil, ativo FROM users WHERE email = ${email}`;

      if (userResult.length === 0) {
        app.log.warn(`[LOGIN] Tentativa falhou: Usuário não encontrado - ${email}`);
        return reply.status(401).send({ error: 'Email ou senha inválidos' });
      }

      const user = userResult[0];

      if (!user.ativo) {
        app.log.warn(`[LOGIN] Tentativa falhou: Usuário inativo - ${email}`);
        return reply.status(401).send({ error: 'Email ou senha inválidos' });
      }

      // Suporte para camelCase (vinda do transform) ou snake_case puro
      const hashParaTestar = user.senhaHash || user.senha_hash;
      
      if (!hashParaTestar) {
        app.log.error(`[LOGIN] Erro crítico: Usuário sem senha_hash no banco - ${email}`);
        return reply.status(401).send({ error: 'Email ou senha inválidos' });
      }

      const passValid = await bcrypt.compare(password, hashParaTestar);
      if (!passValid) {
        app.log.warn(`[LOGIN] Tentativa falhou: Senha incorreta - ${email}`);
        return reply.status(401).send({ error: 'Email ou senha inválidos' });
      }

      app.log.info(`[LOGIN] Credenciais válidas para ${email}. Gerando token...`);

      // JWT Access Token (15 minutos)
      const accessToken = app.jwt.sign(
        {
          sub: user.id,
          tenant_id: user.tenant_id,
          role: user.perfil,
        },
        { expiresIn: '7d' }
      );

      // Refresh Token
      const refreshToken = crypto.randomBytes(40).toString('hex');
      const rtExpiration = new Date();
      rtExpiration.setDate(rtExpiration.getDate() + 30); // 30 dias

      await sql`
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${refreshToken}, ${rtExpiration})
      `;

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 dias em seg
      });

      app.log.info(`[LOGIN] Sucesso: ${email}`);

      return reply.send({
        accessToken,
        user: {
          id: user.id,
          tenant_id: user.tenantId || user.tenant_id,
          role: user.perfil,
        }
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Formato de dados inválido', details: err.errors });
      }
      app.log.error('[LOGIN ERROR]', err);
      // Responder com 500 se for erro interno (banco, etc)
      return reply.status(500).send({ error: 'Erro interno no servidor de autenticação: ' + err.message });
    }
  });

  // Refresh
  app.post('/refresh', async (request, reply) => {
    const cookieToken = request.cookies.refreshToken;
    if (!cookieToken) {
      return reply.status(401).send({ error: 'Token não encontrado' });
    }

    const result = await sql`
      SELECT id, user_id, expires_at 
      FROM refresh_tokens 
      WHERE token = ${cookieToken}
    `;

    if (result.length === 0) {
      return reply.status(401).send({ error: 'Sessão inválida' });
    }

    const rt = result[0];

    // expires_at: snake_case (postgres.js sem transform camelCase)
    if (new Date() > new Date(rt.expires_at)) {
      await sql`DELETE FROM refresh_tokens WHERE id = ${rt.id}`;
      return reply.status(401).send({ error: 'Sessão expirada' });
    }

    // user_id: snake_case (postgres.js sem transform camelCase)
    const userResult = await sql`SELECT id, tenant_id, perfil FROM users WHERE id = ${rt.user_id} AND ativo = true`;
    if (userResult.length === 0) {
      return reply.status(401).send({ error: 'Usuário não existe ou inativo' });
    }

    const currUser = userResult[0];


    // Deletar o token antigo e gerar um novo (Rotate refresh token)
    await sql`DELETE FROM refresh_tokens WHERE id = ${rt.id}`;

    const newAccessToken = app.jwt.sign(
      {
        sub: currUser.id,
        tenant_id: currUser.tenant_id,
        role: currUser.perfil,
      },
      { expiresIn: '7d' }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRtExpiration = new Date();
    newRtExpiration.setDate(newRtExpiration.getDate() + 30);

    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${currUser.id}, ${newRefreshToken}, ${newRtExpiration})
    `;

    reply.setCookie('refreshToken', newRefreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.send({
      accessToken: newAccessToken,
    });
  });

  // Logout
  app.post('/logout', async (request, reply) => {
    const cookieToken = request.cookies.refreshToken;
    
    if (cookieToken) {
      await sql`DELETE FROM refresh_tokens WHERE token = ${cookieToken}`;
    }

    reply.clearCookie('refreshToken', { path: '/' });
    return reply.send({ message: 'Logout efetuado com sucesso' });
  });

  // GET Me (Protegido)
  app.get('/me', {
    onRequest: [app.verifyJwt]
  }, async (request, reply) => {
    // Note: Use matching key from sign() above
    const { sub, tenant_id } = request.user as any;
    
    app.log.info(`[AUTH/ME] Verificando token para User: ${sub}, Tenant: ${tenant_id}`);

    try {
      // Busca detalhes do Usuário + Tenant
      const data = await withTenantRls(tenant_id, async (t) => {
        const users = await t`
          SELECT u.id, u.nome, u.email, u.perfil as role, u.tenant_id,
                 ten.nome as tenant_nome, ten.subdominio as tenant_slug
          FROM users u
          JOIN tenants ten ON ten.id = u.tenant_id
          WHERE u.id = ${sub}
        `;
        return users[0];
      });

      if (!data) {
        app.log.warn(`[AUTH/ME] Nenhum dado retornado para o usuário ${sub} no tenant ${tenant_id}`);
        return reply.status(401).send({ error: 'Usuário não encontrado na sessão ativa.' });
      }

      return { user: data };
    } catch (err: any) {
      app.log.error(`[AUTH/ME ERROR] ${err.message}`);
      return reply.status(500).send({ error: 'Erro ao validar sua sessão.', details: err.message, stack: err.stack });
    }
  });

  // Validar Convite
  app.get('/validar-convite', async (request, reply) => {
    const { token } = request.query as { token?: string };
    if (!token) return reply.status(404).send();

    const invite = await sql`SELECT usado, expirado_em FROM convites WHERE token = ${token}`;
    if (invite.length === 0) return reply.status(404).send();

    if (invite[0].usado || new Date() > new Date(invite[0].expirado_em)) {
       return reply.status(404).send();
    }

    return reply.send({ valid: true });
  });

  // Cadastro via Convite
  app.post('/cadastro', async (request, reply) => {
    const schema = z.object({
      token: z.string().uuid(),
      nome_oficina: z.string().min(3),
      nome_usuario: z.string().min(3),
      email: z.string().email(),
      senha: z.string().min(6),
    });

    try {
      const { token, nome_oficina, nome_usuario, email, senha } = schema.parse(request.body);

      // 1. Validar token
      const invite = await sql`SELECT id, usado, expirado_em FROM convites WHERE token = ${token}`;
      if (invite.length === 0 || invite[0].usado || new Date() > new Date(invite[0].expirado_em)) {
         return reply.status(404).send({ error: 'Convite inválido' });
      }

      // Check email is unique globally
      const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
         return reply.status(400).send({ error: 'Email já está em uso' });
      }

      // 2. Transação (simulada) para criar tenant, user e marcar convite
      // Criar Tenant
      const tenantResult = await sql`
        INSERT INTO tenants (nome, subdominio) VALUES (${nome_oficina}, ${email.split('@')[0]}) RETURNING id
      `;
      const newTenantId = tenantResult[0].id;

      // Atualizar info no tenant como dono
      await sql`UPDATE tenants SET email_admin = ${email} WHERE id = ${newTenantId}`;

      // 3. Criar admin
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(senha, salt);
      
      const userResult = await sql`
        INSERT INTO users (tenant_id, nome, email, senha_hash, perfil, ativo)
        VALUES (${newTenantId}, ${nome_usuario}, ${email}, ${hash}, 'admin', true)
        RETURNING id
      `;
      const newUserId = userResult[0].id;

      // 4. Marcar token
      await sql`UPDATE convites SET usado = true, tenant_id = ${newTenantId} WHERE id = ${invite[0].id}`;

      // 5. Generate Auth Tokens
      const accessToken = app.jwt.sign(
        { sub: newUserId, tenant_id: newTenantId, role: 'admin' },
        { expiresIn: '7d' }
      );

      const refreshToken = crypto.randomBytes(40).toString('hex');
      const rtExpiration = new Date();
      rtExpiration.setDate(rtExpiration.getDate() + 30);

      await sql`
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (${newUserId}, ${refreshToken}, ${rtExpiration})
      `;

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
      });

      return reply.send({ accessToken });

    } catch (err: any) {
       app.log.error(err);
       return reply.status(400).send({ error: 'Erro no cadastro', details: err.message });
    }
  });

};

export default authRoutes;
