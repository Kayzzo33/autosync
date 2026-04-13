import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '../lib/redis';
import { FastifyRequest, FastifyReply } from 'fastify';

// Instâncias de Rate Limit
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '15 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

export const refreshRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
  prefix: 'ratelimit:refresh',
});

export const publicRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:public',
});

export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply, type: 'login' | 'refresh' | 'public' = 'public') {
  const ip = request.ip;
  
  // Bypass rate limit for localhost during development
  if (ip === '127.0.0.1' || ip === '::1') {
    return;
  }

  const identifier = `${type}:${ip}`;
  
  let ratelimit = publicRateLimit;
  if (type === 'login') ratelimit = loginRateLimit;
  if (type === 'refresh') ratelimit = refreshRateLimit;

  const { success, reset } = await ratelimit.limit(identifier);

  if (!success) {
    const now = Date.now();
    const retryAfter = Math.ceil((reset - now) / 60000);
    return reply.status(429).send({ 
      error: `Muitas tentativas. Tente novamente em ${retryAfter} minutos.` 
    });
  }
}
