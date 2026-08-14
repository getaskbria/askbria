import { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';
import { verifyToken, getHouseholdId } from '../lib/auth.js';

export async function inventoryRoutes(app: FastifyInstance) {

  // GET /inventory — list all items
  app.get('/inventory', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('household_id', householdId)
      .order('category')
      .order('name');

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ items: data });
  });

  // GET /inventory/low — items below threshold
  app.get('/inventory/low', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('household_id', householdId)
      .filter('quantity', 'lte', 'low_threshold');

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ items: data });
  });

  // POST /inventory — add item manually
  app.post('/inventory', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const body = request.body as any;

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        household_id: householdId,
        name: body.name,
        category: body.category ?? 'General',
        quantity: body.quantity ?? 0,
        unit: body.unit ?? 'pcs',
        low_threshold: body.low_threshold ?? 2,
      } as any)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send(data);
  });

  // PATCH /inventory/:id — update quantity
  app.patch('/inventory/:id', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(body as any)
      .eq('id', id)
      .eq('household_id', householdId) // RLS-style safety check
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send(data);
  });

  // DELETE /inventory/:id
  app.delete('/inventory/:id', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(204).send();
  });

  // POST /inventory/parse-receipt — email receipt parsing
  app.post('/inventory/parse-receipt', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { email_text } = request.body as { email_text: string };

    if (!email_text) {
      return reply.code(400).send({ error: 'email_text is required' });
    }

    // Use Groq (fast model) to extract items from receipt email text
    const { groq, FAST_MODEL } = await import('../lib/groq.js');
    const response = await groq.chat.completions.create({
      model: FAST_MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Extract all grocery/household items from this receipt email. Return ONLY a JSON array like:
[{"name":"Whole Milk","quantity":1,"unit":"gallon"},{"name":"Eggs","quantity":12,"unit":"pcs"}]

Receipt email:
${email_text}`,
      }],
    });

    const text = response.choices[0]?.message?.content ?? '[]';
    let items: any[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      items = match ? JSON.parse(match[0]) : [];
    } catch { items = []; }

    // Upsert items into inventory
    for (const item of items) {
      await supabase.from('inventory_items').insert({
        household_id: householdId,
        name: item.name,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? 'pcs',
        category: 'General',
        low_threshold: 2,
      } as any);
    }

    return reply.send({ parsed: items.length, items });
  });
}
