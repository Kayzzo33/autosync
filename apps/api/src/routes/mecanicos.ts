import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls } from '../lib/db';

const mecanicosRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);

  // Listar Mecânicos do Tenant
  app.get('/', async (req, reply) => {
    const { tenant_id } = req.user;
    
    const mecanicos = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT * FROM mecanicos 
        WHERE tenant_id = ${tenant_id} 
        ORDER BY nome ASC
      `;
    });
    
    return reply.send({ mecanicos });
  });

  // Criar Mecânico
  app.post('/', async (req, reply) => {
    const { tenant_id } = req.user;
    
    const bodySchema = z.object({
      nome: z.string().min(1),
      telefone: z.string().optional().nullable(),
      especialidade: z.string().optional().nullable(),
    });

    const body = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      const inserted = await t`
        INSERT INTO mecanicos (tenant_id, nome, telefone, especialidade)
        VALUES (${tenant_id}, ${body.nome}, ${body.telefone || null}, ${body.especialidade || null})
        RETURNING *
      `;
      return inserted[0];
    });

    return reply.status(201).send({ mecanico: result });
  });

  // Atualizar Mecânico
  app.put('/:id', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };

    const bodySchema = z.object({
      nome: z.string().optional(),
      telefone: z.string().optional().nullable(),
      especialidade: z.string().optional().nullable(),
      ativo: z.boolean().optional(),
    });

    const body = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      // Helper for dynamic updates could be used, but for simplicity:
      const updated = await t`
        UPDATE mecanicos 
        SET 
          nome = COALESCE(${body.nome || null}, nome),
          telefone = COALESCE(${body.telefone || null}, telefone),
          especialidade = COALESCE(${body.especialidade || null}, especialidade),
          ativo = COALESCE(${body.ativo ?? null}, ativo)
        WHERE id = ${id} AND tenant_id = ${tenant_id}
        RETURNING *
      `;
      return updated[0];
    });

    if (!result) return reply.status(404).send({ error: 'Mecânico não encontrado' });
    return reply.send({ mecanico: result });
  });

  // Ativar/Desativar Mecânico (PATCH rápido)
  app.patch('/:id/ativo', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };
    
    const bodySchema = z.object({
      ativo: z.boolean()
    });
    const { ativo } = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      const updated = await t`
        UPDATE mecanicos SET ativo = ${ativo} 
        WHERE id = ${id} AND tenant_id = ${tenant_id}
        RETURNING *
      `;
      return updated[0];
    });

    if (!result) return reply.status(404).send({ error: 'Mecânico não encontrado' });
    return reply.send({ message: `Mecânico ${ativo ? 'ativado' : 'desativado'}`, mecanico: result });
  });
};

export default mecanicosRoutes;
