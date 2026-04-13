import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls, sql } from '../lib/db';

const tenantsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', app.verifyJwt);

  // Obter detalhes da oficina atual
  app.get('/me', async (req, reply) => {
    const { tenant_id } = req.user;

    const tenant = await withTenantRls(tenant_id, async (t) => {
      const result = await t`
        SELECT id, nome, subdominio, cnpj, telefone, endereco, whatsapp_templates, 
               conf_whatsapp_os_aberta, conf_whatsapp_os_pronta, conf_whatsapp_nps, conf_whatsapp_revisao,
               created_at 
        FROM tenants 
        WHERE id = ${tenant_id}
      `;
      return result[0];
    });

    if (!tenant) return reply.status(404).send({ error: 'Oficina não encontrada' });
    return reply.send({ tenant });
  });

  // Atualizar dados da oficina
  app.put('/me', async (req, reply) => {
    const { tenant_id } = req.user;
    
    const bodySchema = z.object({
      nome: z.string().min(1),
      cnpj: z.string().optional().nullable(),
      telefone: z.string().optional().nullable(),
      endereco: z.string().optional().nullable(),
    });

    const data = bodySchema.parse(req.body);

    const updated = await withTenantRls(tenant_id, async (t) => {
      const result = await t`
        UPDATE tenants 
        SET 
          nome = ${data.nome},
          cnpj = ${data.cnpj ?? null},
          telefone = ${data.telefone ?? null},
          endereco = ${data.endereco ?? null},
          updated_at = NOW()
        WHERE id = ${tenant_id}
        RETURNING *
      `;
      return result[0];
    });

    return reply.send({ message: 'Dados atualizados com sucesso', tenant: updated });
  });

  // Atualizar templates de WhatsApp
  app.put('/whatsapp', async (req, reply) => {
    const { tenant_id } = req.user;
    
    // Schema flexível para o JSONB
    const bodySchema = z.object({
      templates: z.record(z.string(), z.string())
    });

    const { templates } = bodySchema.parse(req.body);

    const updated = await withTenantRls(tenant_id, async (t) => {
      const result = await t`
        UPDATE tenants 
        SET whatsapp_templates = ${t.json(templates)}, updated_at = NOW()
        WHERE id = ${tenant_id}
        RETURNING whatsapp_templates
      `;
      return result[0];
    });

    return reply.send({ message: 'Templates de WhatsApp atualizados', templates: updated.whatsapp_templates });
  });

  // Atualizar Status das Automações (Toggles)
  app.patch('/whatsapp/status', async (req, reply) => {
    const { tenant_id } = req.user;
    
    const bodySchema = z.object({
      os_aberta: z.boolean().optional(),
      os_pronta: z.boolean().optional(),
      nps: z.boolean().optional(),
      revisao: z.boolean().optional(),
    });

    const data = bodySchema.parse(req.body);

    const updated = await withTenantRls(tenant_id, async (t) => {
      // Montamos o UPDATE dinamicamente apenas para o que foi enviado
      const result = await t`
        UPDATE tenants 
        SET 
          conf_whatsapp_os_aberta = COALESCE(${data.os_aberta ?? null}, conf_whatsapp_os_aberta),
          conf_whatsapp_os_pronta = COALESCE(${data.os_pronta ?? null}, conf_whatsapp_os_pronta),
          conf_whatsapp_nps = COALESCE(${data.nps ?? null}, conf_whatsapp_nps),
          conf_whatsapp_revisao = COALESCE(${data.revisao ?? null}, conf_whatsapp_revisao),
          updated_at = NOW()
        WHERE id = ${tenant_id}
        RETURNING conf_whatsapp_os_aberta, conf_whatsapp_os_pronta, conf_whatsapp_nps, conf_whatsapp_revisao
      `;
      return result[0];
    });

    return reply.send({ message: 'Configurações de automação atualizadas', configs: updated });
  });
};

export default tenantsRoutes;
