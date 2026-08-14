import { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';
import { verifyToken, getHouseholdId } from '../lib/auth.js';

export async function taskRoutes(app: FastifyInstance) {

  // GET /tasks
  app.get('/tasks', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ tasks: data });
  });

  // POST /tasks
  app.post('/tasks', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const body = request.body as any;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        household_id: householdId,
        title: body.title,
        notes: body.notes ?? null,
        assignee_name: body.assignee_name ?? null,
        due_date: body.due_date ?? null,
        recurring: body.recurring ?? null,
        status: 'pending',
        created_by: userId,
      } as any)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send(data);
  });

  // PATCH /tasks/:id
  app.patch('/tasks/:id', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const { data, error } = await supabase
      .from('tasks')
      .update(body as any)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send(data);
  });

  // DELETE /tasks/:id
  app.delete('/tasks/:id', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('household_id', householdId);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(204).send();
  });
}
