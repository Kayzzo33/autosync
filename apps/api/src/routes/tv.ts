import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { sql } from '../lib/db';

const tvRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  // Monitor de Pátio Público (TV) via Slug
  app.get('/public/patio/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };

    try {
      // 1. Encontrar Tenant pelo Slug (subdominio)
      const tenants = await sql`SELECT id FROM tenants WHERE subdominio = ${slug}`;
      if (tenants.length === 0) {
        return reply.status(404).send({ error: 'Oficina não encontrada' });
      }
      const tenant_id = tenants[0].id;

      // 2. Buscar O.S. ativas para o monitor
      // Apenas status operacionais, sem dados pessoais ou financeiros
      const ordens = await sql`
        SELECT o.id, o.status, o.created_at,
               v.placa, v.modelo, v.marca,
               u.nome as mecanico_nome
        FROM ordens_servico o
        JOIN veiculos v ON v.id = o.veiculo_id
        LEFT JOIN users u ON u.id = o.mecanico_id
        WHERE o.tenant_id = ${tenant_id} 
          AND o.status IN ('aberta', 'em_andamento', 'aguardando_peca', 'pronta')
        ORDER BY o.created_at DESC
      `;

      return reply.send({ ordens });
    } catch (err: any) {
      app.log.error(err, `[PUBLIC TV ERROR] Slug: ${slug}`);
      return reply.status(500).send({ error: 'Erro ao carregar monitor público' });
    }
  });
  
  // Monitor de Pátio Interno (Logado)
  app.get('/ordens', async (req, reply) => {
    const { tenant_id } = req.query as { tenant_id: string };

    if (!tenant_id) {
       return reply.status(400).send({ error: 'tenant_id é obrigatório' });
    }

    try {
      // Buscar O.S. ativas para o monitor interno
      // JOIN com veiculos para placa/modelo e clientes para nome
      const ordens = await sql`
        SELECT o.id, o.status, o.created_at,
               v.placa, v.modelo, v.marca,
               c.nome as cliente_nome,
               u.nome as mecanico_nome
        FROM ordens_servico o
        JOIN veiculos v ON v.id = o.veiculo_id
        JOIN clientes c ON c.id = v.cliente_id
        LEFT JOIN users u ON u.id = o.mecanico_id
        WHERE o.tenant_id = ${tenant_id} 
          AND o.status IN ('aberta', 'em_andamento', 'aguardando_peca', 'pronta')
        ORDER BY o.created_at DESC
      `;

      return reply.send({ ordens });
    } catch (err: any) {
      app.log.error(err, `[INTERNAL TV ERROR] Tenant: ${tenant_id}`);
      return reply.status(500).send({ error: 'Erro ao carregar monitor interno' });
    }
  });

};

export default tvRoutes;
