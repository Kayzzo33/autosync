import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls } from '../lib/db';

const catalogoRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  app.addHook('onRequest', app.verifyJwt);

  app.get('/', async (request, reply) => {
    const { tenant_id } = request.user as any;
    const { tipo } = request.query as { tipo?: string };

    const itens = await withTenantRls(tenant_id, async (sql) => {
      if (tipo === 'servico' || tipo === 'peca') {
        return sql`SELECT * FROM catalogo_itens WHERE tipo = ${tipo} ORDER BY nome ASC`;
      }
      return sql`SELECT * FROM catalogo_itens ORDER BY nome ASC`;
    });

    return reply.send(itens);
  });

  app.post('/', async (request, reply) => {
    const { tenant_id } = request.user as any;
    
    const schema = z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      preco_padrao: z.number().min(0),
      tipo: z.enum(['servico', 'peca'])
    });

    try {
      const data = schema.parse(request.body);

      const newItem = await withTenantRls(tenant_id, async (sql) => {
         const result = await sql`
           INSERT INTO catalogo_itens (tenant_id, nome, descricao, preco_padrao, tipo)
           VALUES (${tenant_id}, ${data.nome}, ${data.descricao || null}, ${data.preco_padrao}, ${data.tipo})
           RETURNING *
         `;
         return result[0];
      });

      return reply.status(201).send(newItem);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Erro ao criar item', details: err.message });
    }
  });

  app.put('/:id', async (request, reply) => {
    const { tenant_id } = request.user as any;
    const { id } = request.params as { id: string };

    const schema = z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      preco_padrao: z.number().min(0),
      tipo: z.enum(['servico', 'peca'])
    });

    try {
      const data = schema.parse(request.body);

      const updated = await withTenantRls(tenant_id, async (sql) => {
         const result = await sql`
           UPDATE catalogo_itens 
           SET nome = ${data.nome}, descricao = ${data.descricao || null}, 
               preco_padrao = ${data.preco_padrao}, tipo = ${data.tipo}
           WHERE id = ${id}
           RETURNING *
         `;
         return result[0];
      });

      if (!updated) return reply.status(404).send({ error: 'Item não encontrado' });
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Erro ao atualizar item', details: err.message });
    }
  });

  app.patch('/:id/ativo', async (request, reply) => {
    const { tenant_id } = request.user as any;
    const { id } = request.params as { id: string };
    
    const schema = z.object({
      ativo: z.boolean()
    });

    try {
      const { ativo } = schema.parse(request.body);

      const updated = await withTenantRls(tenant_id, async (sql) => {
         const result = await sql`
           UPDATE catalogo_itens SET ativo = ${ativo} WHERE id = ${id} RETURNING *
         `;
         return result[0];
      });

      if (!updated) return reply.status(404).send({ error: 'Item não encontrado' });
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Erro ao alterar status', details: err.message });
    }
  });

};

export default catalogoRoutes;
