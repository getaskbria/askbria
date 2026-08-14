/**
 * Bria — Supabase Database Types
 * Keep in sync with supabase/schema.sql
 * Re-generate with: npx supabase gen types typescript --local > lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole       = 'owner' | 'member';
export type StaffType      = 'cleaner' | 'nanny' | 'driver' | 'cook' | 'none';
export type TaskStatus     = 'pending' | 'assigned' | 'done';
export type ShoppingStatus = 'pending' | 'ordered' | 'done';
export type MessageRole    = 'user' | 'assistant';

// ── Row types ─────────────────────────────────────────────────────────────────

export interface Household {
  id:         string;
  name:       string;
  created_at: string;
}

export interface UserProfile {
  id:            string;
  household_id:  string;
  email:         string;
  full_name:     string | null;
  role:          UserRole;
  auth_provider: string;
  created_at:    string;
}

export interface HouseholdProfile {
  household_id:   string;
  adults:         number;
  kids:           number;
  pets:           number;
  has_cleaner:    boolean;
  staff_types:    string[];
  dietary:        string[];
  reminder_time:  string | null;
  updated_at:     string;
}

export interface ChatMessage {
  id:           string;
  household_id: string;
  user_id:      string;
  role:         MessageRole;
  content:      string;
  created_at:   string;
}

export interface InventoryItem {
  id:            string;
  household_id:  string;
  name:          string;
  category:      string;
  quantity:      number;
  unit:          string;
  low_threshold: number;
  last_updated:  string;
}

export interface ShoppingItem {
  id:           string;
  household_id: string;
  item_name:    string;
  quantity:     number | null;
  unit:         string | null;
  added_by:     'user' | 'bria';
  status:       ShoppingStatus;
  created_at:   string;
}

export interface Task {
  id:             string;
  household_id:   string;
  title:          string;
  notes:          string | null;
  assignee_id:    string | null;
  assignee_name:  string | null;
  due_date:       string | null;
  recurring:      string | null;
  status:         TaskStatus;
  created_by:     string;
  created_at:     string;
}

export interface StaffContact {
  id:             string;
  household_id:   string;
  name:           string;
  role:           string;
  contact_method: 'sms' | 'email' | 'whatsapp';
  contact_value:  string;
  created_at:     string;
}

// ── Insert types (omit auto-generated fields) ─────────────────────────────────

export type HouseholdInsert       = Omit<Household, 'id' | 'created_at'>;
export type UserProfileInsert     = Omit<UserProfile, 'created_at'>;
export type HouseholdProfileInsert = Omit<HouseholdProfile, 'updated_at'>;
export type ChatMessageInsert     = Omit<ChatMessage, 'id' | 'created_at'>;
export type InventoryItemInsert   = Omit<InventoryItem, 'id' | 'last_updated'>;
export type ShoppingItemInsert    = Omit<ShoppingItem, 'id' | 'created_at'>;
export type TaskInsert            = Omit<Task, 'id' | 'created_at'>;
export type StaffContactInsert    = Omit<StaffContact, 'id' | 'created_at'>;

// ── Database interface for supabase client ────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      households:         { Row: Household;        Insert: HouseholdInsert;        Update: Partial<HouseholdInsert> };
      users:              { Row: UserProfile;       Insert: UserProfileInsert;      Update: Partial<UserProfileInsert> };
      household_profiles: { Row: HouseholdProfile;  Insert: HouseholdProfileInsert; Update: Partial<HouseholdProfileInsert> };
      chat_messages:      { Row: ChatMessage;       Insert: ChatMessageInsert;      Update: never };
      inventory_items:    { Row: InventoryItem;     Insert: InventoryItemInsert;    Update: Partial<InventoryItemInsert> };
      shopping_list:      { Row: ShoppingItem;      Insert: ShoppingItemInsert;     Update: Partial<ShoppingItemInsert> };
      tasks:              { Row: Task;              Insert: TaskInsert;             Update: Partial<TaskInsert> };
      staff_contacts:     { Row: StaffContact;      Insert: StaffContactInsert;     Update: Partial<StaffContactInsert> };
    };
    Views:     Record<string, never>;
    Functions: Record<string, never>;
    Enums:     Record<string, never>;
  };
}
