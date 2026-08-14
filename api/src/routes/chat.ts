import { FastifyInstance } from 'fastify';
import { groq, CHAT_MODEL, BRIA_SYSTEM_PROMPT } from '../lib/groq.js';
import { supabase } from '../lib/supabase.js';
import { verifyToken, getHouseholdId } from '../lib/auth.js';

export async function chatRoutes(app: FastifyInstance) {

  // POST /chat — send a message to Bria
  app.post('/chat', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);
    const { message } = request.body as { message: string };

    if (!message?.trim()) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    // Fetch household profile for context
    const { data: profile } = await supabase
      .from('household_profiles')
      .select('*')
      .eq('household_id', householdId)
      .single();

    // Fetch last 20 messages for context window
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(20);

    const messages = (history ?? [])
      .reverse()
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    messages.push({ role: 'user', content: message });

    // Save user message
    await supabase.from('chat_messages').insert({
      household_id: householdId,
      user_id: userId,
      role: 'user',
      content: message,
    } as any);

    // Call Groq
    const response = await groq.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: BRIA_SYSTEM_PROMPT(profile ?? {
          adults: 1, kids: 0, pets: 0, has_cleaner: false, dietary: [],
        })},
        ...messages,
      ],
    });

    const assistantText = response.choices[0]?.message?.content ?? '';

    // Save assistant message
    await supabase.from('chat_messages').insert({
      household_id: householdId,
      user_id: userId,
      role: 'assistant',
      content: assistantText,
    } as any);

    // Parse and execute any actions Bria returned
    await executeActions(assistantText, householdId, userId);

    return reply.send({ message: assistantText });
  });

  // GET /chat/history — fetch recent messages
  app.get('/chat/history', async (request, reply) => {
    const userId = await verifyToken(request, reply);
    const householdId = await getHouseholdId(userId);

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ messages: data });
  });
}

/**
 * Parse action JSON blocks from Bria's response and execute them.
 * Format: {"action":"update_inventory","items":[...]}
 */
async function executeActions(text: string, householdId: string, userId: string) {
  const jsonMatch = text.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
  if (!jsonMatch) return;

  let action: any;
  try { action = JSON.parse(jsonMatch[0]); }
  catch { return; }

  switch (action.action) {

    case 'update_inventory':
      for (const item of action.items ?? []) {
        // Upsert by name within household
        const { data: existing } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('household_id', householdId)
          .ilike('name', item.name)
          .single();

        if (existing) {
          await supabase
            .from('inventory_items')
            .update({ quantity: item.quantity, unit: item.unit ?? existing } as any)
            .eq('id', existing.id);
        } else {
          await supabase.from('inventory_items').insert({
            household_id: householdId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit ?? 'pcs',
            category: 'General',
            low_threshold: 2,
          } as any);
        }
      }
      break;

    case 'create_task':
      await supabase.from('tasks').insert({
        household_id: householdId,
        title: action.title,
        due_date: action.due_date ?? null,
        status: 'pending',
        created_by: userId,
      } as any);
      break;

    case 'add_to_shopping':
      for (const itemName of action.items ?? []) {
        await supabase.from('shopping_list').insert({
          household_id: householdId,
          item_name: itemName,
          added_by: 'bria',
          status: 'pending',
        } as any);
      }
      break;
  }
}
