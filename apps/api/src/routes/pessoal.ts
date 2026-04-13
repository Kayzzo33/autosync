import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls, sql } from '../lib/db';
import bcrypt from 'bcrypt';

const pessoalRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);
  app.addHook('onRequest', app.verifyRole('admin', 'gerente')); // RBAC RIGOROSO

  // ========== GESTÃO DE MECÂNICOS ==========
  app.get('/mecanicos', async (req, reply) => {
    const { tenant_id } = req.user;
    const mecanicos = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT id, nome, email, ativo, comissao_percentual, especialidades
        FROM users
        WHERE perfil = 'mecanico'
        ORDER BY nome ASC
      `;
    });
    return reply.send({ mecanicos });
  });

  app.patch('/mecanicos/:id', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };

    const bodySchema = z.object({
      comissao_percentual: z.number().min(0).max(100).optional(),
      ativo: z.boolean().optional(),
      especialidades: z.array(z.string()).optional(),
    });
    const parsed = bodySchema.parse(req.body);

    const updated = await withTenantRls(tenant_id, async (t) => {
      // Dynamic update helper trick
      if (parsed.comissao_percentual !== undefined) {
         await t`UPDATE users SET comissao_percentual = ${parsed.comissao_percentual} WHERE id = ${id}`;
      }
      if (parsed.ativo !== undefined) {
         await t`UPDATE users SET ativo = ${parsed.ativo} WHERE id = ${id}`;
      }
      if (parsed.especialidades !== undefined) {
         await t`UPDATE users SET especialidades = ${JSON.stringify(parsed.especialidades)}::jsonb WHERE id = ${id}`;
      }
      return t`SELECT id, nome, ativo, comissao_percentual, especialidades FROM users WHERE id = ${id}`;
    });

    return reply.send({ message: 'Mecânico atualizado', mecanico: updated[0] });
  });

  // ========== COMISSÕES ==========
  app.get('/comissoes', async (req, reply) => {
    const { tenant_id } = req.user;
    
    // Calcula as comissões do mẽs corrente: valor * (percentual / 100)
    const comissoes = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT 
          u.id as mecanico_id,
          u.nome as mecanico_nome,
          u.comissao_percentual,
          COUNT(o.id) as total_os_fechadas,
          SUM(o.valor_total) as soma_valor_os,
          SUM(o.valor_total * (u.comissao_percentual / 100)) as comissao_gerada
        FROM users u
        JOIN ordens_servico o ON o.mecanico_id = u.id
        WHERE o.status = 'fechada' 
          AND extract(month from o.fechado_at) = extract(month from current_date)
          AND u.perfil = 'mecanico'
        GROUP BY u.id, u.nome, u.comissao_percentual
        ORDER BY comissao_gerada DESC
      `;
    });

    return reply.send({ comissoes });
  });

  // ========== PRODUTIVIDADE E TEMPO ==========
  app.get('/produtividade', async (req, reply) => {
    const { tenant_id } = req.user;

    const produtividade = await withTenantRls(tenant_id, async (t) => {
      // Extrai o 'epoch' da diferença: fechado_at - iniciado_at
      // para calcular a média em horas trabalhadas por OS.
      return t`
        SELECT 
          u.id as mecanico_id,
          u.nome as mecanico_nome,
          COUNT(o.id) as total_concluidas,
          AVG(EXTRACT(EPOCH FROM (o.fechado_at - o.iniciado_at)) / 3600)::numeric(10,2) as tempo_medio_horas
        FROM users u
        JOIN ordens_servico o ON o.mecanico_id = u.id
        WHERE o.status = 'fechada' 
          AND o.iniciado_at IS NOT NULL
          AND extract(month from o.fechado_at) = extract(month from current_date)
          AND u.perfil = 'mecanico'
        GROUP BY u.id, u.nome
        ORDER BY total_concluidas DESC, tempo_medio_horas ASC
      `;
    });

    return reply.send({ produtividade });
  });

  // ========== GESTÃO DE USUÁRIOS ==========

  // Listar Usuários do Tenant
  app.get('/usuarios', async (req, reply) => {
    const { tenant_id } = req.user;

    const users = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT id, nome, email, perfil, ativo, created_at 
        FROM users 
        WHERE tenant_id = ${tenant_id} 
        ORDER BY nome ASC
      `;
    });

    return reply.send({ users });
  });

  // Criar Usuário
  app.post('/usuarios', async (req, reply) => {
    const { tenant_id } = req.user;
    
    const bodySchema = z.object({
      nome: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      perfil: z.enum(['admin', 'gerente', 'atendente', 'mecanico']),
    });

    const body = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      // Verificar se email já existe (Global check)
      const existing = await sql`SELECT id FROM users WHERE email = ${body.email}`;
      if (existing.length > 0) {
        throw new Error('Este e-mail já está sendo utilizado.');
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(body.password, salt);

      const inserted = await t`
        INSERT INTO users (tenant_id, nome, email, senha_hash, perfil, ativo)
        VALUES (${tenant_id}, ${body.nome}, ${body.email}, ${hash}, ${body.perfil}, true)
        RETURNING id, nome, email, perfil, ativo
      `;
      return inserted[0];
    });

    return reply.status(201).send({ message: 'Usuário criado com sucesso', user: result });
  });

  // Toggle Status Usuário
  app.patch('/usuarios/:id/ativo', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };
    
    const bodySchema = z.object({
      ativo: z.boolean(),
    });

    const { ativo } = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      const updated = await t`
        UPDATE users 
        SET ativo = ${ativo}, updated_at = NOW() 
        WHERE id = ${id} AND tenant_id = ${tenant_id}
        RETURNING id, ativo
      `;
      return updated[0];
    });

    if (!result) return reply.status(404).send({ error: 'Usuário não encontrado' });
    return reply.send({ message: 'Status atualizado', user: result });
  });

};

export default pessoalRoutes;
