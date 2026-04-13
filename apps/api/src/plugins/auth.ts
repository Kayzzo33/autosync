import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

// Augment Fastify types for JWT user payload and custom decorators
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      tenant_id: string;
      role: string;
    };
    user: {
      sub: string;
      tenantId: string;
      tenant_id: string; // Adicionado para retrocompatibilidade
      role: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyJwt: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyRole: (...allowedRoles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret_change_in_prod',
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  });

  fastify.register(fastifyCookie, {
    secret: 'cookie-secret-1234',
    hook: 'onRequest',
  });

  fastify.decorate('verifyJwt', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Não autorizado ou token expirado.' });
    }
  });

  fastify.decorate('verifyRole', function (...allowedRoles: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user || !request.user.role) {
        return reply.status(401).send({ error: 'Usuário não identificado.' });
      }

      if (!allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({ error: 'Permissões insuficientes.' });
      }
    };
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});
