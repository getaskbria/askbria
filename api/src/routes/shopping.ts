import { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';
import { verifyToken, getHouseholdId } from '../lib/auth.js';

export async function shoppingRoutes(app: FastifyInstance) {

  // GET /shopping — list pending shopping items
  app.get('/shopping', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);

    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ items: data });
  });

  // POST /shopping — add item manually
  app.post('/shopping', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { item_name, quantity, unit } = request.body as any;

    if (!item_name?.trim()) return reply.code(400).send({ error: 'item_name is required' });

    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ household_id: householdId, item_name, quantity, unit, added_by: 'user', status: 'pending' } as any)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send({ item: data });
  });

  // PATCH /shopping/:id — mark bought / update
  app.patch('/shopping/:id', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { id } = request.params as { id: string };
    const patch = request.body as any;

    const { data, error } = await supabase
      .from('shopping_list')
      .update(patch)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ item: data });
  });

  // DELETE /shopping/:id
  app.delete('/shopping/:id', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(204).send();
  });
}
