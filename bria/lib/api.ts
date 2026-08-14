import { supabase } from './supabase';
import { EventEmitter } from 'events';

// Cross-screen refresh bus — chat fires 'refresh', screens listen
export const refreshBus = new EventEmitter();

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Authenticated fetch — auto-attaches the Supabase JWT.
 */
async function authFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API error ${res.status}`);
  }

  return res.json();
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export const chatApi = {
  send:    (message: string)     => authFetch('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  history: ()                    => authFetch('/chat/history'),
};

// ── Inventory ─────────────────────────────────────────────────────────────────

export const inventoryApi = {
  list:          ()              => authFetch('/inventory'),
  low:           ()              => authFetch('/inventory/low'),
  add:           (item: any)     => authFetch('/inventory', { method: 'POST', body: JSON.stringify(item) }),
  update:        (id: string, patch: any) => authFetch(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:        (id: string)    => authFetch(`/inventory/${id}`, { method: 'DELETE' }),
  parseReceipt:  (emailText: string) => authFetch('/inventory/parse-receipt', { method: 'POST', body: JSON.stringify({ email_text: emailText }) }),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasksApi = {
  list:   ()             => authFetch('/tasks'),
  add:    (task: any)    => authFetch('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id: string, patch: any) => authFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string)   => authFetch(`/tasks/${id}`, { method: 'DELETE' }),
};

// ── Shopping ──────────────────────────────────────────────────────────────────

export const shoppingApi = {
  list:   ()             => authFetch('/shopping'),
  add:    (item: any)    => authFetch('/shopping', { method: 'POST', body: JSON.stringify(item) }),
  update: (id: string, patch: any) => authFetch(`/shopping/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string)   => authFetch(`/shopping/${id}`, { method: 'DELETE' }),
};
