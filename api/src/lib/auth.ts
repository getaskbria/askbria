import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from './supabase.js';

/**
 * Verify the Bearer token from the request header.
 * Returns the user ID if valid, throws 401 if not.
 */
export async function verifyToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid authorization header' });
    throw new Error('Unauthorized');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    throw new Error('Unauthorized');
  }

  return user.id;
}

/**
 * Get the household_id for a given user.
 */
export async function getHouseholdId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', userId)
    .single();

  if (error || !data) throw new Error('Household not found');
  return data.household_id;
}
