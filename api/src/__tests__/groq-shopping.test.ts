/**
 * Integration tests: Groq → shopping/grocery action output
 *
 * Goal: verify Bria reliably emits well-formed action JSON for
 * grocery and supply-related messages. Run with:
 *   npm test
 *
 * These hit the real Groq API — GROQ_API_KEY must be set in .env
 */

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import Groq from 'groq-sdk';
import { CHAT_MODEL, BRIA_SYSTEM_PROMPT } from '../lib/groq.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  adults: 2, kids: 1, pets: 0,
  has_cleaner: false,
  dietary: ['Gluten-free'],
};

async function ask(userMessage: string, profile = DEFAULT_PROFILE) {
  const res = await groq.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 512,
    temperature: 0.2, // low temp = consistent structured output
    messages: [
      { role: 'system', content: BRIA_SYSTEM_PROMPT(profile) },
      { role: 'user',   content: userMessage },
    ],
  });
  return res.choices[0]?.message?.content ?? '';
}

function extractAction(text: string) {
  // Find the start of an action JSON block — walk forward counting braces
  const start = text.indexOf('{"action"');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); }
  catch { return null; }
}

// ── Shopping list tests ───────────────────────────────────────────────────────

describe('add_to_shopping action', () => {
  it('adds items when user says they are out of something', async () => {
    const text = await ask("We're out of milk and bread, can you add them to the list?");
    console.log('\n[out of stock]\n', text);

    const action = extractAction(text);
    expect(action).not.toBeNull();
    expect(action.action).toBe('add_to_shopping');
    expect(Array.isArray(action.items)).toBe(true);
    expect(action.items.length).toBeGreaterThanOrEqual(2);
    expect(action.items.some((i: string) => /milk/i.test(i))).toBe(true);
    expect(action.items.some((i: string) => /bread/i.test(i))).toBe(true);
  }, 15000);

  it('adds items when user asks Bria to make a grocery list', async () => {
    const text = await ask("Can you make a grocery list for the week?");
    console.log('\n[grocery list]\n', text);

    const action = extractAction(text);
    expect(action).not.toBeNull();
    expect(action.action).toBe('add_to_shopping');
    expect(Array.isArray(action.items)).toBe(true);
    expect(action.items.length).toBeGreaterThanOrEqual(3);
  }, 15000);

  it('adds specific items from a conversational message', async () => {
    const text = await ask("Add eggs, olive oil, and dish soap to my shopping list");
    console.log('\n[specific items]\n', text);

    const action = extractAction(text);
    expect(action).not.toBeNull();
    expect(action.action).toBe('add_to_shopping');
    expect(action.items.some((i: string) => /egg/i.test(i))).toBe(true);
    expect(action.items.some((i: string) => /oil/i.test(i))).toBe(true);
    expect(action.items.some((i: string) => /soap/i.test(i))).toBe(true);
  }, 15000);

  it('respects dietary preferences in shopping suggestions', async () => {
    const text = await ask(
      "We need to restock the pantry. Add some essentials to the shopping list.",
      { ...DEFAULT_PROFILE, dietary: ['Vegan'] }
    );
    console.log('\n[dietary aware]\n', text);

    const action = extractAction(text);
    expect(action).not.toBeNull();
    expect(action.action).toBe('add_to_shopping');
    // Should not suggest meat/dairy
    const itemsStr = action.items.join(' ').toLowerCase();
    expect(itemsStr).not.toMatch(/\b(chicken|beef|pork|milk|cheese|butter)\b/);
  }, 15000);
});

// ── Inventory update tests ────────────────────────────────────────────────────

describe('update_inventory action', () => {
  it('updates inventory when user reports a purchase', async () => {
    const text = await ask("I just bought 2kg of rice and a dozen eggs");
    console.log('\n[purchased]\n', text);

    const action = extractAction(text);
    expect(action).not.toBeNull();
    expect(action.action).toBe('update_inventory');
    expect(Array.isArray(action.items)).toBe(true);
    expect(action.items.some((i: any) => /rice/i.test(i.name))).toBe(true);
    const rice = action.items.find((i: any) => /rice/i.test(i.name));
    expect(rice.quantity).toBe(2);
    expect(rice.unit).toMatch(/kg/i);
  }, 15000);

  it('includes name, quantity, and unit on every item', async () => {
    const text = await ask("I bought 3 bottles of olive oil and 500g of pasta");
    console.log('\n[item structure]\n', text);

    const action = extractAction(text);
    expect(action).not.toBeNull();
    expect(action.action).toBe('update_inventory');

    for (const item of action.items) {
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
      expect(typeof item.quantity).toBe('number');
      expect(typeof item.unit).toBe('string');
    }
  }, 15000);
});

// ── Scope boundary tests ──────────────────────────────────────────────────────

describe('scope boundaries', () => {
  it('handles Phase 2 feature gracefully without pretending it works', async () => {
    const text = await ask("Can you book a cleaner for me on Saturday?");
    console.log('\n[phase 2 - booking]\n', text);
    // Should acknowledge it's coming, not pretend to book
    expect(text.toLowerCase()).not.toMatch(/booked|confirmed|scheduled.*cleaner/i);
    expect(text.length).toBeGreaterThan(20);
  }, 15000);

  it('redirects medical questions back to household scope', async () => {
    const text = await ask("What medicine should I take for a headache?");
    console.log('\n[out of scope - medical]\n', text);
    expect(extractAction(text)).toBeNull();
    // Should not give medical advice
    expect(text.toLowerCase()).not.toMatch(/take \d+mg|ibuprofen|paracetamol|dosage/i);
  }, 15000);

  it('redirects general trivia back to household scope', async () => {
    const text = await ask("Who won the NBA finals last year?");
    console.log('\n[out of scope - trivia]\n', text);
    expect(extractAction(text)).toBeNull();
    expect(text.toLowerCase()).not.toMatch(/lakers|celtics|warriors|nba champion/i);
  }, 15000);

  it('stays engaged for cleaning advice (in scope)', async () => {
    const text = await ask("What's the best way to remove a red wine stain?");
    console.log('\n[in scope - cleaning tip]\n', text);
    expect(extractAction(text)).toBeNull();
    // Should give actual useful advice
    expect(text.length).toBeGreaterThan(60);
  }, 15000);

  it('acknowledges grocery delivery integrations as coming soon', async () => {
    const text = await ask("Can you order my groceries from Instacart?");
    console.log('\n[phase 2 - delivery]\n', text);
    expect(extractAction(text)).toBeNull();
    expect(text.toLowerCase()).toMatch(/soon|coming|phase|not yet|working on/i);
  }, 15000);
});

// ── No-action tests ───────────────────────────────────────────────────────────

describe('no spurious actions', () => {
  it('does NOT emit action JSON for general chat', async () => {
    const text = await ask("How often should I clean the bathroom?");
    console.log('\n[general chat]\n', text);

    const action = extractAction(text);
    expect(action).toBeNull();
  }, 15000);

  it('does NOT emit action JSON for a question about the shopping list', async () => {
    const text = await ask("What's on my shopping list?");
    console.log('\n[query only]\n', text);

    const action = extractAction(text);
    expect(action).toBeNull();
  }, 15000);
});
