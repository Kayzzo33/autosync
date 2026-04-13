import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { withTenantRls, sql } from '../lib/db';

const dashboardRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);

  app.get('/stats', async (req, reply) => {
    const { tenant_id } = req.user;

    const stats = await withTenantRls(tenant_id, async (t) => {
      // 1. Faturamento Mensal (Mês Atual)
      const faturamento = await t`
        SELECT COALESCE(SUM(valor), 0) as total
        FROM movimentacoes_financeiras
        WHERE tenant_id = ${tenant_id}
          AND tipo = 'entrada'
          AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;

      // 2. O.S. Abertas (status != 'fechada')
      const osAbertas = await t`
        SELECT COUNT(*) as total
        FROM ordens_servico
        WHERE tenant_id = ${tenant_id}
          AND status != 'fechada'
      `;

      // 3. Total Clientes
      const totalClientes = await t`
        SELECT COUNT(*) as total
        FROM clientes
        WHERE tenant_id = ${tenant_id}
      `;

      // 4. O.S. Em Atraso (status != 'fechada' AND created_at < 3 days ago)
      const osEmAtraso = await t`
        SELECT COUNT(*) as total
        FROM ordens_servico
        WHERE tenant_id = ${tenant_id}
          AND status != 'fechada'
          AND created_at < (CURRENT_DATE - INTERVAL '3 days')
      `;

      return {
        faturamento_mes: Number(faturamento[0].total),
        os_abertas: Number(osAbertas[0].total),
        total_clientes: Number(totalClientes[0].total),
        os_em_atraso: Number(osEmAtraso[0].total)
      };
    });

    return reply.send(stats);
  });
};

export default dashboardRoutes;
