import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls, sql } from '../lib/db';

const financeiroRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);
  // app.addHook('onRequest', app.verifyRole('admin', 'gerente')); // Optional: enable if desired

  // Resumo Financeiro
  app.get('/resumo', async (req, reply) => {
    const { tenant_id } = req.user;

    const data = await withTenantRls(tenant_id, async (t) => {
      // Faturamento do mês (Entradas convertidas em caixa)
      const fatResult = await t`
        SELECT SUM(valor) as total 
        FROM movimentacoes_financeiras 
        WHERE tenant_id = ${tenant_id} 
          AND tipo = 'entrada' 
          AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;

      // Total Recebido Geral (Todas as entradas)
      const totalRecebidoResult = await t`
        SELECT SUM(valor) as total 
        FROM movimentacoes_financeiras 
        WHERE tenant_id = ${tenant_id} 
          AND tipo = 'entrada'
      `;

      // Totais Contas_Receber
      const contasResult = await t`
        SELECT 
          SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) as total_recebido,
          SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_receber
        FROM contas_receber
        WHERE tenant_id = ${tenant_id}
      `;

      return {
        faturamento_mes: Number(fatResult[0].total || 0),
        total_recebido: Number(totalRecebidoResult[0].total || contasResult[0].total_recebido || 0),
        total_receber: Number(contasResult[0].total_receber || 0),
      };
    });

    return reply.send(data);
  });

  // Movimentações Paginadas
  app.get('/movimentacoes', async (req, reply) => {
    const { tenant_id } = req.user;
    const { limit = 20, offset = 0 } = req.query as { limit?: number, offset?: number };

    const movs = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT * FROM movimentacoes_financeiras 
        WHERE tenant_id = ${tenant_id} 
        ORDER BY data DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    });

    return reply.send({ movimentacoes: movs });
  });

  // Lançamento Manual
  app.post('/movimentacoes', async (req, reply) => {
    try {
      const { tenant_id } = req.user;
      const bodySchema = z.object({
        valor: z.number().positive('O valor deve ser positivo'),
        tipo: z.enum(['entrada', 'saida']),
        descricao: z.string().min(1, 'A descrição é obrigatória'),
        data: z.string().optional(),
      });

      const data = bodySchema.parse(req.body);

      const mov = await withTenantRls(tenant_id, async (t) => {
        // Garantir Categoria Padrão para Lançamentos Manuais
        const [categoria] = await t`
          INSERT INTO categorias_movimentacao (tenant_id, nome, tipo)
          VALUES (${tenant_id}, 'Lançamento Manual', ${data.tipo})
          ON CONFLICT (tenant_id, nome) DO UPDATE SET nome = EXCLUDED.nome
          RETURNING id
        `;

        const resp = await t`
          INSERT INTO movimentacoes_financeiras (tenant_id, valor, tipo, descricao, data, categoria_id)
          VALUES (${tenant_id}, ${data.valor}, ${data.tipo}, ${data.descricao}, ${data.data || sql`NOW()`}, ${categoria.id})
          RETURNING *
        `;
        return resp[0];
      });

      return reply.status(201).send({ message: 'Movimentação registrada', mov });
    } catch (err: any) {
      req.log.error({ err, body: req.body }, 'Erro ao registrar movimentação');
      return reply.status(err instanceof z.ZodError ? 400 : 500).send({ 
        error: err instanceof z.ZodError ? 'Dados inválidos' : (err.message || 'Erro ao registrar financeiro') 
      });
    }
  });

  // Contas a Receber (Pendentes)
  app.get('/contas-receber', async (req, reply) => {
    const { tenant_id } = req.user;
    const contas = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT c.*, o.id as os_numero, cl.nome as cliente_nome
        FROM contas_receber c
        JOIN ordens_servico o ON o.id = c.os_id
        JOIN veiculos v ON v.id = o.veiculo_id
        JOIN clientes cl ON cl.id = v.cliente_id
        WHERE c.tenant_id = ${tenant_id} AND c.status = 'pendente'
        ORDER BY c.created_at DESC
      `;
    });
    return reply.send({ contas });
  });

  // Pagar Conta (Baixa)
  app.patch('/contas-receber/:id/pagar', async (req, reply) => {
    try {
      const { tenant_id } = req.user;
      const { id } = req.params as { id: string };

      const conta = await withTenantRls(tenant_id, async (t) => {
        const resp = await t`
          UPDATE contas_receber 
          SET status = 'pago', pago_em = NOW()
          WHERE id = ${id} AND tenant_id = ${tenant_id}
          RETURNING *
        `;
        return resp[0];
      });

      if (!conta) return reply.status(404).send({ error: 'Conta não encontrada ou acesso negado' });
      return reply.send({ message: 'Pagamento recebido com sucesso!', conta });
    } catch (err: any) {
      req.log.error({ err, params: req.params }, 'Erro ao dar baixa em conta a receber');
      return reply.status(500).send({ error: err.message || 'Erro ao processar pagamento' });
    }
  });

};

export default financeiroRoutes;
