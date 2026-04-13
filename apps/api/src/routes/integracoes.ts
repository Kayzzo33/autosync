import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { withTenantRls } from '../lib/db';

const integracoesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);
  app.addHook('onRequest', app.verifyRole('admin', 'gerente'));

  app.get('/', async (req, reply) => {
    const { tenant_id } = req.user;

    const integracoes = await withTenantRls(tenant_id, async (t) => {
      return t`
        SELECT id, nome, provedor, status, token, config_json, created_at 
        FROM integracoes
        ORDER BY nome ASC
      `;
    });

    // Se estiver vazio, retornamos as integrações placeholders
    // para preparar o terreno do front
    if (integracoes.length === 0) {
      return reply.send({
        integracoes: [
          { provedor: 'facebook_capi', nome: 'Facebook Conversions API', status: 'coming_soon' },
          { provedor: 'google_ads', nome: 'Google Ads API', status: 'coming_soon' },
          { provedor: 'email_marketing', nome: 'E-mail Marketing (ActiveCampaign)', status: 'coming_soon' }
        ]
      });
    }

    return reply.send({ integracoes });
  });

};

export default integracoesRoutes;
