import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls, sql } from '../lib/db';

const comercialRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  app.addHook('onRequest', app.verifyJwt);

  // ---------- LEADS ----------

  // Criar Lead
  app.post('/leads', async (req, reply) => {
    try {
      const { tenant_id, sub } = req.user;
      const bodySchema = z.object({
        nome: z.string().min(1, 'Nome é obrigatório'),
        telefone: z.string().min(1, 'Telefone é obrigatório'),
        origem: z.enum(['google', 'instagram', 'indicacao', 'organico', 'outro']).optional().default('organico'),
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_campaign: z.string().optional(),
      });

      const body = bodySchema.parse(req.body);

      const result = await withTenantRls(tenant_id, async (t) => {
        const inserted = await t`
          INSERT INTO leads (tenant_id, nome, telefone, canal_origem, utm_source, utm_medium, utm_campaign)
          VALUES (
            ${tenant_id}, ${body.nome}, ${body.telefone}, 
            ${body.origem}, ${body.utm_source || null}, ${body.utm_medium || null}, ${body.utm_campaign || null}
          )
          RETURNING *
        `;
        return inserted[0];
      });

      return reply.status(201).send({ lead: result });
    } catch (err: any) {
      req.log.error({ err, body: req.body }, 'Erro ao criar lead');
      return reply.status(err instanceof z.ZodError ? 400 : 500).send({ 
        error: err instanceof z.ZodError ? 'Dados inválidos' : (err.message || 'Erro interno ao criar lead'),
        details: err.errors
      });
    }
  });

  // Atualizar Lead (Conversão)
  app.patch('/leads/:id/status', async (req, reply) => {
    try {
      const { tenant_id } = req.user;
      const { id } = req.params as { id: string };
      
      const bodySchema = z.object({
        status: z.enum(['novo', 'em_contato', 'orcamento_feito', 'convertido', 'perdido']),
      });
      const { status } = bodySchema.parse(req.body);

      const result = await withTenantRls(tenant_id, async (t) => {
        const leads = await t`SELECT * FROM leads WHERE id = ${id}`;
        if (leads.length === 0) throw new Error('Lead não encontrado');
        const lead = leads[0];

        if (lead.status === status) return lead;

        await t`UPDATE leads SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;

        await t`UPDATE leads SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
        
        return { ...lead, status };
      });

      return reply.send({ message: 'Lead atualizado', lead: result });
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: err.message || 'Erro ao atualizar lead' });
    }
  });

  // Listar Leads
  app.get('/leads', async (req, reply) => {
    const { tenant_id } = req.user;
    const leads = await withTenantRls(tenant_id, async (t) => {
      return t`SELECT * FROM leads ORDER BY created_at DESC`;
    });
    return reply.send({ leads });
  });

  // Converter Lead em Cliente (Manual)
  app.post('/leads/:id/converter', async (req, reply) => {
    try {
      const { tenant_id } = req.user;
      const { id } = req.params as { id: string };

      const result = await withTenantRls(tenant_id, async (t) => {
        const leads = await t`SELECT * FROM leads WHERE id = ${id} AND tenant_id = ${tenant_id}`;
        if (leads.length === 0) throw new Error('Lead não encontrado');
        
        const lead = leads[0];
        if (lead.status === 'convertido') throw new Error('Este lead já foi convertido em cliente');

        const [cliente] = await t`
          INSERT INTO clientes (tenant_id, lead_id, nome, telefone, created_at)
          VALUES (${tenant_id}, ${id}, ${lead.nome}, ${lead.telefone}, NOW())
          RETURNING *
        `;

        await t`UPDATE leads SET status = 'convertido', updated_at = NOW() WHERE id = ${id}`;

        return cliente;
      });

      return reply.send({ message: 'Lead convertido com sucesso!', cliente: result });
    } catch (err: any) {
      req.log.error({ err, params: req.params }, 'Erro ao converter lead');
      return reply.status(500).send({ error: err.message || 'Erro ao converter lead' });
    }
  });

  // ---------- VEÍCULOS E CLIENTES ----------

  // Listar Clientes
  app.get('/clientes', async (req, reply) => {
    const { tenant_id } = req.user;
    const q = (req.query as any)?.q;

    const clientes = await withTenantRls(tenant_id, async (t) => {
      if (q) {
        const query = `%${q}%`;
        return t`SELECT * FROM clientes WHERE nome ILIKE ${query} OR telefone ILIKE ${query} ORDER BY created_at DESC LIMIT 50`;
      }
      return t`SELECT * FROM clientes ORDER BY created_at DESC`;
    });

    return reply.send({ clientes });
  });

  // Resumo CRM do Cliente
  app.get('/clientes/:id/resumo', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };

    const resumo = await withTenantRls(tenant_id, async (t) => {
      const stats = await t`
        SELECT 
          COALESCE(SUM(valor_total), 0) as total_gasto,
          COUNT(id) as total_visitas,
          MAX(created_at) as última_visita
        FROM ordens_servico
        WHERE veiculo_id IN (SELECT id FROM veiculos WHERE cliente_id = ${id})
          AND status = 'fechada'
          AND tenant_id = ${tenant_id}
      `;
      return stats[0];
    });

    return reply.send(resumo);
  });

  // Criar Cliente Diretamente
  app.post('/clientes', async (req, reply) => {
    try {
      const { tenant_id } = req.user;
      const bodySchema = z.object({
        nome: z.string().min(1, 'Nome é obrigatório'),
        telefone: z.string().min(1, 'Telefone é obrigatório'),
        email: z.string().email('Email inválido').optional().nullable(),
        cpf: z.string().optional().nullable(),
      });
      const body = bodySchema.parse(req.body);
      const result = await withTenantRls(tenant_id, async (t) => {
        const inserted = await t`
          INSERT INTO clientes (tenant_id, nome, telefone, email, cpf, created_at)
          VALUES (${tenant_id}, ${body.nome}, ${body.telefone}, ${body.email || null}, ${body.cpf || null}, NOW())
          RETURNING *
        `;
        return inserted[0];
      });
      return reply.status(201).send({ cliente: result });
    } catch (err: any) {
      req.log.error({ err, body: req.body }, 'Erro ao criar cliente');
      return reply.status(err instanceof z.ZodError ? 400 : 500).send({ 
        error: err instanceof z.ZodError ? 'Dados inválidos' : (err.message || 'Erro ao criar cliente') 
      });
    }
  });

  // Listar Veiculos (Geral ou por cliente)
  app.get('/veiculos', async (req, reply) => {
    const { tenant_id } = req.user;
    const { cliente_id } = req.query as { cliente_id?: string };
    
    const veiculos = await withTenantRls(tenant_id, async (t) => {
      if (cliente_id) {
        return t`
          SELECT v.*, c.nome as cliente_nome 
          FROM veiculos v 
          JOIN clientes c ON c.id = v.cliente_id 
          WHERE v.cliente_id = ${cliente_id} AND v.tenant_id = ${tenant_id}
          ORDER BY v.created_at DESC
        `;
      }

      return t`
        SELECT v.*, c.nome as cliente_nome 
        FROM veiculos v 
        JOIN clientes c ON c.id = v.cliente_id 
        WHERE v.tenant_id = ${tenant_id}
        ORDER BY v.created_at DESC
      `;
    });

    return reply.send({ veiculos });
  });

  app.post('/veiculos', async (req, reply) => {
    const { tenant_id } = req.user;
    const bodySchema = z.object({
      cliente_id: z.string().uuid(),
      placa: z.string(),
      marca: z.string(),
      modelo: z.string(),
      ano: z.number(),
      km_atual: z.number(),
    });

    const body = bodySchema.parse(req.body);
    const kmRevisao = body.km_atual + 5000;

    const result = await withTenantRls(tenant_id, async (t) => {
      const inserted = await t`
        INSERT INTO veiculos (tenant_id, cliente_id, placa, marca, modelo, ano, km_atual, km_proxima_revisao)
        VALUES (${tenant_id}, ${body.cliente_id}, ${body.placa}, ${body.marca}, ${body.modelo}, ${body.ano}, ${body.km_atual}, ${kmRevisao})
        RETURNING *
      `;
      return inserted[0];
    });

    return reply.status(201).send({ veiculo: result });
  });

  // Listar Veiculos de um Cliente (Friendly route for CRM)
  app.get('/veiculos/cliente/:clienteId', async (req, reply) => {
    const { tenant_id } = req.user;
    const { clienteId } = req.params as { clienteId: string };

    const veiculos = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT *, (km_atual + 5000) as km_proxima_revisao 
        FROM veiculos 
        WHERE cliente_id = ${clienteId} AND tenant_id = ${tenant_id}
        ORDER BY created_at DESC
      `;
    });

    return reply.send({ veiculos });
  });

  // Stats de Clientes para o Dashboard (Alias para compatibilidade)
  app.get('/stats', async (req, reply) => {
    const { tenant_id } = req.user;
    const stats = await withTenantRls(tenant_id, async (t) => {
      const totalClientes = await t`SELECT COUNT(*) as count FROM clientes WHERE tenant_id = ${tenant_id}`;
      const osAbertas = await t`SELECT COUNT(*) as count FROM ordens_servico WHERE tenant_id = ${tenant_id} AND status != 'fechada'`;
      const faturamento = await t`
        SELECT COALESCE(SUM(valor), 0) as total 
        FROM movimentacoes_financeiras 
        WHERE tenant_id = ${tenant_id} 
          AND tipo = 'entrada' 
          AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      const osEmAtraso = await t`
        SELECT COUNT(*) as count 
        FROM ordens_servico 
        WHERE tenant_id = ${tenant_id} 
          AND status != 'fechada' 
          AND created_at < (CURRENT_DATE - INTERVAL '3 days')
      `;

      return {
        total_clientes: Number(totalClientes[0].count),
        os_abertas: Number(osAbertas[0].count),
        faturamento_mes: Number(faturamento[0].total),
        os_em_atraso: Number(osEmAtraso[0].count)
      };
    });

    return reply.send(stats);
  });

  // Stats de Clientes para o Dashboard
  app.get('/clientes/stats', async (req, reply) => {
    const { tenant_id } = req.user;
    const stats = await withTenantRls(tenant_id, async (t) => {
      const totalClientes = await t`SELECT COUNT(*) as count FROM clientes WHERE tenant_id = ${tenant_id}`;
      const osAbertas = await t`SELECT COUNT(*) as count FROM ordens_servico WHERE tenant_id = ${tenant_id} AND status != 'fechada'`;
      const faturamento = await t`
        SELECT COALESCE(SUM(valor), 0) as total 
        FROM movimentacoes_financeiras 
        WHERE tenant_id = ${tenant_id} 
          AND tipo = 'entrada' 
          AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      const osEmAtraso = await t`
        SELECT COUNT(*) as count 
        FROM ordens_servico 
        WHERE tenant_id = ${tenant_id} 
          AND status != 'fechada' 
          AND created_at < (CURRENT_DATE - INTERVAL '3 days')
      `;

      return {
        total_clientes: Number(totalClientes[0].count),
        os_abertas: Number(osAbertas[0].count),
        faturamento_mes: Number(faturamento[0].total),
        os_em_atraso: Number(osEmAtraso[0].count)
      };
    });

    return reply.send(stats);
  });

  // Clientes sem retorno há mais de 90 dias
  app.get('/clientes/alertas', async (req, reply) => {
    const { tenant_id } = req.user;

    const alertas = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT c.id, c.nome, c.telefone, MAX(o.fechado_at) as ultima_visita
        FROM clientes c
        JOIN veiculos v ON v.cliente_id = c.id
        JOIN ordens_servico o ON o.veiculo_id = v.id
        WHERE c.tenant_id = ${tenant_id} 
          AND o.status = 'fechada'
        GROUP BY c.id, c.nome, c.telefone
        HAVING MAX(o.fechado_at) < (CURRENT_DATE - INTERVAL '90 days')
        ORDER BY ultima_visita ASC
        LIMIT 5
      `;
    });

    return reply.send({ alertas });
  });

};

export default comercialRoutes;
