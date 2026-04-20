import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { withTenantRls, sql } from '../lib/db';
import { whatsappQueue } from '../lib/queue';
import crypto from 'crypto';

// Endpoint Público para o Portal do Cliente
// Desviado do Hook por ter URL específica mapeada lá embaixo ou usando auth escape
const publicOsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/portal/:token', async (req, reply) => {
    const { token } = req.params as { token: string };

    const os = await sql`
      SELECT o.id, o.status, o.valor_total as valor_estimado,
             v.placa, v.modelo, v.marca,
             t.nome as oficina_nome
      FROM ordens_servico o
      JOIN veiculos v ON v.id = o.veiculo_id
      JOIN tenants t ON t.id = o.tenant_id
      WHERE o.public_token = ${token}
    `;

    if (os.length === 0) return reply.status(404).send({ error: 'Ordem de serviço não encontrada.' });

    // Em teoria poderiam ter as os_servicos também (não preenchemos ainda)
    const servicos = await sql`
      SELECT descricao as nome, valor, quantidade
      FROM os_servicos
      WHERE os_id = ${os[0].id}
    `;

    return reply.send({ ordem: { ...os[0], servicos } });
  });
};

const osRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  app.register(publicOsRoutes); // Registra sem Hook RLS!

  app.addHook('onRequest', app.verifyJwt);


  app.get('/veiculo/:placa', async (req, reply) => {
    return {
      placa: (req.params as any).placa.toUpperCase(),
      marca: 'TOYOTA',
      modelo: 'COROLLA XEI 2.0',
      ano: 2021
    };
  });

  app.get('/', async (req, reply) => {
    const { tenant_id, role, sub } = req.user;
    const { cliente_id } = req.query as { cliente_id?: string };

    const ordens = await withTenantRls(tenant_id, async (t) => {
      // Base condition
      let filter = sql`o.tenant_id = ${tenant_id}`;
      if (role === 'mecanico') {
        filter = sql`${filter} AND o.mecanico_id = ${sub}`;
      } else if (cliente_id) {
        filter = sql`${filter} AND v.cliente_id = ${cliente_id}`;
      }

      return t`
        SELECT o.*, 
               v.placa, v.modelo, v.marca,
               u.nome as mecanico_nome,
               (SELECT COALESCE(SUM(valor * quantidade), 0) FROM os_servicos WHERE os_id = o.id) + 
               (SELECT COALESCE(SUM(valor_unit * quantidade), 0) FROM os_pecas WHERE os_id = o.id) as total_geral
        FROM ordens_servico o
        JOIN veiculos v ON v.id = o.veiculo_id
        LEFT JOIN users u ON u.id = o.mecanico_id
        WHERE ${filter}
        ORDER BY o.created_at DESC
      `;
    });

    return reply.send({ ordens });
  });

  // Detalhe Completo da OS
  app.get('/:id', async (req, reply) => {
    const { tenant_id } = req.user;
    const q = (req.query as any)?.q;
    const { id } = req.params as { id: string };

    const os = await withTenantRls(tenant_id, async (t) => {
      const data = await t`
        SELECT o.*, 
               v.placa, v.modelo, v.marca, v.id as veiculo_id,
               c.nome as cliente_nome, c.telefone as cliente_telefone,
               COALESCE(m.nome, u.nome) as mecanico_nome,
               o.mecanico_id,
               ten.name as tenant_name
        FROM ordens_servico o
        JOIN veiculos v ON v.id = o.veiculo_id
        JOIN clientes c ON c.id = v.cliente_id
        JOIN tenants ten ON ten.id = o.tenant_id
        LEFT JOIN mecanicos m ON m.id = o.mecanico_id
        LEFT JOIN users u ON u.id = o.mecanico_id
        WHERE o.id = ${id} AND o.tenant_id = ${tenant_id}
      `;
      return data[0];
    });

    if (!os) return reply.status(404).send({ error: 'Ordem de serviço não encontrada.' });
    return reply.send({ os });
  });

  app.post('/', async (req, reply) => {
    try {
      const { tenant_id, sub } = req.user;
      const bodySchema = z.object({
        veiculo_id: z.string().uuid('Veículo inválido'),
        lead_id: z.string().uuid().optional().nullable(),
        mecanico_id: z.string().uuid().optional().nullable().or(z.literal('')),
        descricao: z.string().min(1, 'Descrição é obrigatória'),
        valor_total: z.number().default(0),
        km_entrada: z.number().default(0),
      });
      const body = bodySchema.parse(req.body);

      const os = await withTenantRls(tenant_id, async (t) => {
        const veiculos = await t`SELECT id FROM veiculos WHERE id = ${body.veiculo_id}`;
        if (veiculos.length === 0) {
          throw new Error('Veículo não encontrado ou não pertence a esta oficina');
        }

        const mecanicoReal = (body.mecanico_id === '' || !body.mecanico_id) ? sub : body.mecanico_id;

        const inserted = await t`
          INSERT INTO ordens_servico (tenant_id, veiculo_id, lead_id, mecanico_id, status, descricao, valor_total, km_entrada)
          VALUES (${tenant_id}, ${body.veiculo_id}, ${body.lead_id || null}, ${mecanicoReal}, 'aberta', ${body.descricao}, ${body.valor_total}, ${body.km_entrada})
          RETURNING id, public_token
        `;
        return inserted[0];
      });

      await whatsappQueue?.add('notify-aberta', { osId: os.id, tenant_id, veiculoId: body.veiculo_id });
      return reply.status(201).send({ message: 'OS Aberta com sucesso', os });
    } catch (err: any) {
      req.log.error({ err, body: req.body }, 'Erro ao abrir OS');
      return reply.status(err instanceof z.ZodError ? 400 : 500).send({ 
        error: err instanceof z.ZodError ? 'Dados inválidos' : (err.message || 'Erro ao abrir ordem de serviço') 
      });
    }
  });

  app.patch('/:id/status', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      
      const statusSchema = z.object({
        status: z.enum(['aberta','em_andamento','aguardando_peca','pronta','fechada'])
      });
      
      const parsed = statusSchema.parse(req.body);
      const { tenant_id, sub } = req.user;
      const { status } = parsed;

      const result = await withTenantRls(tenant_id, async (t) => {
        const osData = await t`
          SELECT o.id, o.status, o.valor_total, o.public_token, o.lead_id,
                 c.id as cliente_id, c.email, c.telefone, c.nome as cliente_nome,
                 v.id as veiculo_id
          FROM ordens_servico o
          JOIN veiculos v ON v.id = o.veiculo_id
          JOIN clientes c ON c.id = v.cliente_id
          WHERE o.id = ${id} AND o.tenant_id = ${tenant_id}
        `;
        if(osData.length === 0) throw new Error('Ordem de serviço não encontrada');
        const os = osData[0];

        const prevStatus = os.status;
        if (prevStatus === status) return os;

        if (status === 'fechada') {
          const servicosCount = await t`SELECT COUNT(id) FROM os_servicos WHERE os_id = ${id}`;
          const pecasCount = await t`SELECT COUNT(id) FROM os_pecas WHERE os_id = ${id}`;
          if ((Number(servicosCount[0].count) + Number(pecasCount[0].count)) === 0) {
            throw new Error('Não é possível finalizar uma O.S. sem serviços ou peças incluídas.');
          }

          await t`UPDATE ordens_servico SET status = 'fechada', fechado_at = NOW() WHERE id = ${id}`;
          
          if (os.lead_id) {
            const clientCheck = await t`SELECT id FROM clientes WHERE lead_id = ${os.lead_id} AND tenant_id = ${tenant_id}`;
            if (clientCheck.length === 0) {
              await t`
                INSERT INTO clientes (tenant_id, lead_id, nome, telefone, created_at)
                VALUES (${tenant_id}, ${os.lead_id}, ${os.cliente_nome}, ${os.cliente_telefone}, NOW())
              `;
              await t`UPDATE leads SET status = 'convertido', updated_at = NOW() WHERE id = ${os.lead_id}`;
            }
          }

          const [categoria] = await t`
            INSERT INTO categorias_movimentacao (tenant_id, nome, tipo)
            VALUES (${tenant_id}, 'Serviços Oficina', 'entrada')
            ON CONFLICT (tenant_id, nome) DO UPDATE SET nome = EXCLUDED.nome
            RETURNING id
          `;

          await t`
            INSERT INTO movimentacoes_financeiras (tenant_id, valor, tipo, categoria_id, data, os_id, descricao)
            VALUES (${tenant_id}, ${os.valor_total}, 'entrada', ${categoria.id}, CURRENT_DATE, ${id}, ${`OS #${id.split('-')[0]} — ${os.cliente_nome}`})
          `;

          await t`
            INSERT INTO contas_receber (tenant_id, os_id, valor, status)
            VALUES (${tenant_id}, ${id}, ${os.valor_total}, 'pendente')
            ON CONFLICT (os_id) DO UPDATE SET valor = EXCLUDED.valor
          `;
        } else if (status === 'em_andamento' && prevStatus === 'aberta') {
          await t`UPDATE ordens_servico SET status = ${status}, iniciado_at = NOW() WHERE id = ${id}`;
        } else {
          await t`UPDATE ordens_servico SET status = ${status} WHERE id = ${id}`;
        }

        await t`
          INSERT INTO os_auditoria (tenant_id, os_id, user_id, status_anterior, status_novo)
          VALUES (${tenant_id}, ${id}, ${sub}, ${prevStatus}, ${status})
        `;
        
        return os;
      });

      if (status === 'pronta' && result?.public_token) {
        await whatsappQueue?.add('notify-pronta', { osId: id, tenant_id, token: result.public_token });
      }

      if (status === 'fechada') {
        await whatsappQueue?.add('notify-nps', { osId: id, tenant_id }, { delay: 24 * 60 * 60 * 1000 });
      }

      return reply.send({ message: 'Status atualizado com sucesso' });
    } catch (err: any) {
      req.log.error({ err, params: req.params, body: req.body }, 'Erro ao atualizar status da OS');
      return reply.status(err instanceof z.ZodError ? 400 : 500).send({ 
        error: err instanceof z.ZodError ? 'Status ou dados inválidos' : (err.message || 'Erro ao atualizar status') 
      });
    }
  });

  // Fechar OS Completa (Lógica de negório ERP)
  app.patch('/:id/fechar', async (req, reply) => {
    try {
      const { tenant_id } = req.user;
      const { id } = req.params as { id: string };

      const bodySchema = z.object({
        km_saida: z.number().min(0, 'KM de saída deve ser um número positivo')
      });
      const { km_saida } = bodySchema.parse(req.body);

      const result = await withTenantRls(tenant_id, async (t) => {
        // 1. Buscar a OS e dados vinculados
        const osData = await t`
          SELECT o.*, v.id as veiculo_id, c.nome as cliente_nome, c.telefone as cliente_telefone
          FROM ordens_servico o
          JOIN veiculos v ON v.id = o.veiculo_id
          JOIN clientes c ON c.id = v.cliente_id
          WHERE o.id = ${id} AND o.tenant_id = ${tenant_id}
        `;
        if (osData.length === 0) throw new Error('O.S. não encontrada ou acesso negado.');
        const os = osData[0];

        if (os.status !== 'pronta' && os.status !== 'fechada') {
          throw new Error('A O.S. deve estar com status "pronta" para ser oficialmente fechada.');
        }

        // 2. Calcular Totais Reais
        const servicos = await t`SELECT COALESCE(SUM(valor * quantidade), 0) as total FROM os_servicos WHERE os_id = ${id}`;
        const pecas = await t`SELECT COALESCE(SUM(valor_unit * quantidade), 0) as total FROM os_pecas WHERE os_id = ${id}`;
        const total = (Number(servicos[0].total) || 0) + (Number(pecas[0].total) || 0);

        if (total <= 0) throw new Error('Não é possível fechar uma O.S. com valor total zero ou sem itens.');

        // 3. Atualizar OS
        await t`
          UPDATE ordens_servico 
          SET status = 'fechada', fechado_at = NOW(), km_saida = ${km_saida}, valor_total = ${total}
          WHERE id = ${id}
        `;

        // 4. Atualizar Veículo
        await t`UPDATE veiculos SET km_atual = ${km_saida} WHERE id = ${os.veiculo_id}`;

        // 4.1 Lead -> Cliente automatic conversion
        if (os.lead_id) {
          const clientCheck = await t`SELECT id FROM clientes WHERE lead_id = ${os.lead_id} AND tenant_id = ${tenant_id}`;
          if (clientCheck.length === 0) {
            await t`
              INSERT INTO clientes (tenant_id, lead_id, nome, telefone, created_at)
              VALUES (${tenant_id}, ${os.lead_id}, ${os.cliente_nome}, ${os.cliente_telefone}, NOW())
            `;
            await t`UPDATE leads SET status = 'convertido', updated_at = NOW() WHERE id = ${os.lead_id}`;
          }
        }

        // 5. Garantir Categoria
        const [categoria] = await t`
          INSERT INTO categorias_movimentacao (tenant_id, nome, tipo)
          VALUES (${tenant_id}, 'Serviços Oficina', 'entrada')
          ON CONFLICT (tenant_id, nome) DO UPDATE SET nome = EXCLUDED.nome
          RETURNING id
        `;

        // 6. Financeiro: Movimentação (Evita duplicidade se clicado duas vezes)
        const movCheck = await t`SELECT id FROM movimentacoes_financeiras WHERE os_id = ${id}`;
        if (movCheck.length === 0) {
          await t`
            INSERT INTO movimentacoes_financeiras (tenant_id, valor, tipo, descricao, data, os_id, categoria_id)
            VALUES (${tenant_id}, ${total}, 'entrada', ${`OS #${id.split('-')[0]} — ${os.cliente_nome}`}, NOW(), ${id}, ${categoria.id})
          `;
        } else {
          await t`
            UPDATE movimentacoes_financeiras 
            SET valor = ${total}, updated_at = NOW()
            WHERE os_id = ${id}
          `;
        }

        // 7. Financeiro: Contas a Receber
        await t`
          INSERT INTO contas_receber (tenant_id, os_id, valor, status)
          VALUES (${tenant_id}, ${id}, ${total}, 'pendente')
          ON CONFLICT (os_id) DO UPDATE SET valor = EXCLUDED.valor
        `;

        return os;
      });

      // Dispara NPS agendado para 24 horas DEPOIS do fechamento (delay em ms)
      await whatsappQueue?.add('notify-nps', { osId: id, tenant_id }, { delay: 24 * 60 * 60 * 1000 });

      return reply.send({ message: 'O.S. finalizada com sucesso!', total: result.valor_total });
    } catch (err: any) {
      req.log.error({ err, params: req.params, body: req.body }, 'Erro ao fechar OS');
      return reply.status(err instanceof z.ZodError ? 400 : 500).send({ 
        error: err instanceof z.ZodError ? 'Dados inválidos' : (err.message || 'Erro ao fechar ordem de serviço') 
      });
    }
  });

  // ========== ITENS DA OS (SERVIÇOS E PEÇAS) ==========

  // Adicionar Serviço
  app.post('/:id/servicos', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };
    // Aceita tanto `valor` quanto `valor_unit` para compatibilidade com o frontend
    const bodySchema = z.object({
      descricao: z.string().min(1),
      quantidade: z.number().default(1),
      valor: z.number().optional(),
      valor_unit: z.number().optional(),
    }).refine(d => (d.valor !== undefined || d.valor_unit !== undefined), {
      message: 'Informe o valor do serviço'
    });
    const body = bodySchema.parse(req.body);
    const valorFinal = body.valor_unit ?? body.valor ?? 0;

    const result = await withTenantRls(tenant_id, async (t) => {
      const inserted = await t`
        INSERT INTO os_servicos (tenant_id, os_id, descricao, quantidade, valor)
        VALUES (${tenant_id}, ${id}, ${body.descricao}, ${body.quantidade}, ${valorFinal})
        RETURNING *
      `;
      await t`UPDATE ordens_servico SET valor_total = valor_total + ${valorFinal * body.quantidade} WHERE id = ${id}`;
      return inserted[0];
    });

    return reply.status(201).send({ item: result });
  });

  // Trocar mecânico responsável pela OS
  app.patch('/:id/mecanico', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };
    const { mecanico_id } = z.object({ mecanico_id: z.string().uuid() }).parse(req.body);

    await withTenantRls(tenant_id, async (t) => {
      // Verifica que o mecânico pertence ao tenant
      const mec = await t`SELECT id FROM mecanicos WHERE id = ${mecanico_id} AND tenant_id = ${tenant_id} AND ativo = true`;
      if (mec.length === 0) throw new Error('Mecânico não encontrado ou inativo.');
      await t`UPDATE ordens_servico SET mecanico_id = ${mecanico_id} WHERE id = ${id} AND tenant_id = ${tenant_id}`;
    });

    return reply.send({ message: 'Mecânico atualizado com sucesso' });
  });

  // Adicionar Peça
  app.post('/:id/pecas', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };
    const bodySchema = z.object({
      descricao: z.string(),
      quantidade: z.number().default(1),
      valor_unit: z.number(),
    });
    const body = bodySchema.parse(req.body);

    const result = await withTenantRls(tenant_id, async (t) => {
      const inserted = await t`
        INSERT INTO os_pecas (tenant_id, os_id, descricao, quantidade, valor_unit)
        VALUES (${tenant_id}, ${id}, ${body.descricao}, ${body.quantidade}, ${body.valor_unit})
        RETURNING *
      `;
      // Atualizar o valor total da OS
      await t`UPDATE ordens_servico SET valor_total = valor_total + ${body.valor_unit * body.quantidade} WHERE id = ${id}`;
      return inserted[0];
    });

    return reply.status(201).send({ item: result });
  });

  // Listar Itens da OS
  app.get('/:id/itens', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id } = req.params as { id: string };

    const data = await withTenantRls(tenant_id, async (t) => {
      // Retorna o `id` para que o frontend consiga deletar os itens
      const servicos = await t`SELECT id, descricao, quantidade, valor FROM os_servicos WHERE os_id = ${id} ORDER BY created_at ASC`;
      const pecas = await t`SELECT id, descricao, quantidade, valor_unit FROM os_pecas WHERE os_id = ${id} ORDER BY created_at ASC`;
      return { servicos, pecas };
    });

    return reply.send(data);
  });

  // Remover Serviço
  app.delete('/:id/servicos/:itemId', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id, itemId } = req.params as { id: string, itemId: string };

    await withTenantRls(tenant_id, async (t) => {
      // Get item value to update total
      const item = await t`SELECT valor, quantidade FROM os_servicos WHERE id = ${itemId} AND os_id = ${id}`;
      if (item.length > 0) {
        const val = item[0].valor * item[0].quantidade;
        await t`DELETE FROM os_servicos WHERE id = ${itemId}`;
        await t`UPDATE ordens_servico SET valor_total = GREATEST(0, valor_total - ${val}) WHERE id = ${id}`;
      }
    });

    return reply.send({ message: 'Item removido' });
  });

  // Remover Peça
  app.delete('/:id/pecas/:itemId', async (req, reply) => {
    const { tenant_id } = req.user;
    const { id, itemId } = req.params as { id: string, itemId: string };

    await withTenantRls(tenant_id, async (t) => {
      const item = await t`SELECT valor_unit, quantidade FROM os_pecas WHERE id = ${itemId} AND os_id = ${id}`;
      if (item.length > 0) {
        const val = item[0].valor_unit * item[0].quantidade;
        await t`DELETE FROM os_pecas WHERE id = ${itemId}`;
        await t`UPDATE ordens_servico SET valor_total = GREATEST(0, valor_total - ${val}) WHERE id = ${id}`;
      }
    });

    return reply.send({ message: 'Item removido' });
  });

};

export default osRoutes;
