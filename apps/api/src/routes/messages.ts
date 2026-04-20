import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls } from '../lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// Rota: /messages
// Gerencia o envio de mensagens estruturadas.
// MVP: apenas modo manual (wa.me). Modo API preparado mas não implementado.
// ─────────────────────────────────────────────────────────────────────────────

const messagesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);

  // ── GET /messages — lista mensagens do tenant ────────────────────────────
  app.get('/', async (req, reply) => {
    const { tenant_id } = req.user;
    const { client_id, status, limit } = req.query as {
      client_id?: string;
      status?: string;
      limit?: string;
    };

    const messages = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT m.*, c.nome as client_nome, c.telefone as client_telefone
        FROM messages m
        LEFT JOIN clientes c ON c.id = m.client_id
        WHERE m.tenant_id = ${tenant_id}
          ${client_id ? t`AND m.client_id = ${client_id}` : t``}
          ${status ? t`AND m.status = ${status}` : t``}
        ORDER BY m.created_at DESC
        LIMIT ${parseInt(limit || '50')}
      `;
    });

    return reply.send({ messages });
  });

  // ── POST /messages/send-manual — cria e retorna URL wa.me ────────────────
  // Body: { client_id, content }
  // Fluxo:
  //   1. Busca telefone do cliente
  //   2. Cria registro com status "sent_manual"
  //   3. Retorna { message, waUrl } → frontend abre em nova aba
  app.post('/send-manual', async (req, reply) => {
    const { tenant_id } = req.user;

    const bodySchema = z.object({
      client_id: z.string().uuid('client_id inválido'),
      content:   z.string().min(1, 'Conteúdo não pode estar vazio').max(4096),
    });

    const body = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      // 1. Busca o telefone do cliente
      const clientRows = await t`
        SELECT id, nome, telefone
        FROM clientes
        WHERE id = ${body.client_id} AND tenant_id = ${tenant_id}
      `;

      if (clientRows.length === 0) {
        const err = new Error('Cliente não encontrado.');
        (err as any).statusCode = 404;
        throw err;
      }

      const client = clientRows[0];

      if (!client.telefone) {
        const err = new Error('Cliente não possui telefone cadastrado.');
        (err as any).statusCode = 422;
        throw err;
      }

      // 2. Limpa o número (apenas dígitos) e monta a URL wa.me
      const cleanPhone = String(client.telefone).replace(/\D/g, '');
      const encodedText = encodeURIComponent(body.content);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

      // 3. Persiste a mensagem com status sent_manual
      const [message] = await t`
        INSERT INTO messages (tenant_id, client_id, content, channel, mode, status)
        VALUES (${tenant_id}, ${body.client_id}, ${body.content}, 'whatsapp', 'manual', 'sent_manual')
        RETURNING *
      `;

      return { message, waUrl, clientNome: client.nome };
    });

    return reply.status(201).send(result);
  });

  // ── POST /messages/queue — registra mensagem para envio via API (futuro) ─
  // Body: { client_id, content }
  // Modo API: status = "queued". NÃO implementa envio ainda.
  app.post('/queue', async (req, reply) => {
    const { tenant_id } = req.user;

    const bodySchema = z.object({
      client_id: z.string().uuid('client_id inválido'),
      content:   z.string().min(1).max(4096),
    });

    const body = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      // Valida cliente
      const clientRows = await t`
        SELECT id FROM clientes WHERE id = ${body.client_id} AND tenant_id = ${tenant_id}
      `;
      if (clientRows.length === 0) {
        const err = new Error('Cliente não encontrado.');
        (err as any).statusCode = 404;
        throw err;
      }

      // Persiste com status "queued" — envio real não implementado no MVP
      const [message] = await t`
        INSERT INTO messages (tenant_id, client_id, content, channel, mode, status)
        VALUES (${tenant_id}, ${body.client_id}, ${body.content}, 'whatsapp', 'api', 'queued')
        RETURNING *
      `;

      return { message };
    });

    return reply.status(201).send({
      ...result,
      note: 'Mensagem enfileirada. Envio via API não implementado no MVP.'
    });
  });
};

export default messagesRoutes;
