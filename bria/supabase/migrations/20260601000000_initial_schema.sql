-- ─────────────────────────────────────────────
-- Bria by Brighthouse — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── HOUSEHOLDS ───────────────────────────────
create table households (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null default 'My Home',
  created_at  timestamptz not null default now()
);

-- ─── USERS ────────────────────────────────────
create type user_role as enum ('owner', 'member');

create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid not null references households(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          user_role not null default 'owner',
  auth_provider text not null default 'email',
  created_at    timestamptz not null default now()
);

-- ─── HOUSEHOLD PROFILES ───────────────────────
create table household_profiles (
  household_id   uuid primary key references households(id) on delete cascade,
  adults         int not null default 1,
  kids           int not null default 0,
  pets           int not null default 0,
  has_cleaner    boolean not null default false,
  staff_types    text[] not null default '{}',
  dietary        text[] not null default '{}',
  reminder_time  text,           -- HH:MM e.g. '08:00'
  updated_at     timestamptz not null default now()
);

-- ─── CHAT MESSAGES ────────────────────────────
create type message_role as enum ('user', 'assistant');

create table chat_messages (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          message_role not null,
  content       text not null,
  created_at    timestamptz not null default now()
);

create index chat_messages_household_idx on chat_messages(household_id, created_at desc);

-- ─── INVENTORY ITEMS ──────────────────────────
create table inventory_items (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  category      text not null default 'General',
  quantity      numeric not null default 0,
  unit          text not null default 'pcs',
  low_threshold numeric not null default 2,
  last_updated  timestamptz not null default now()
);

create index inventory_household_idx on inventory_items(household_id);

-- ─── SHOPPING LIST ────────────────────────────
create type shopping_status as enum ('pending', 'ordered', 'done');

create table shopping_list (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  item_name     text not null,
  quantity      numeric,
  unit          text,
  added_by      text not null default 'user',  -- 'user' | 'bria'
  status        shopping_status not null default 'pending',
  created_at    timestamptz not null default now()
);

create index shopping_household_idx on shopping_list(household_id, status);

-- ─── TASKS ────────────────────────────────────
create type task_status as enum ('pending', 'assigned', 'done');

create table tasks (
  id             uuid primary key default uuid_generate_v4(),
  household_id   uuid not null references households(id) on delete cascade,
  title          text not null,
  notes          text,
  assignee_id    uuid references auth.users(id) on delete set null,
  assignee_name  text,
  due_date       date,
  recurring      text,   -- 'daily' | 'weekly' | 'monthly' | null
  status         task_status not null default 'pending',
  created_by     uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create index tasks_household_idx on tasks(household_id, status);

-- ─── STAFF CONTACTS ───────────────────────────
create table staff_contacts (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references households(id) on delete cascade,
  name            text not null,
  role            text not null,
  contact_method  text not null default 'sms',  -- 'sms' | 'email' | 'whatsapp'
  contact_value   text not null,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Every user can only access their own household's data.
-- ─────────────────────────────────────────────

alter table households        enable row level security;
alter table users              enable row level security;
alter table household_profiles enable row level security;
alter table chat_messages      enable row level security;
alter table inventory_items    enable row level security;
alter table shopping_list      enable row level security;
alter table tasks              enable row level security;
alter table staff_contacts     enable row level security;

-- Helper function: get the household_id for the current user
create or replace function my_household_id()
returns uuid language sql stable
as $$
  select household_id from users where id = auth.uid() limit 1;
$$;

-- Policies — households
create policy "Users can view their own household"
  on households for select
  using (id = my_household_id());

create policy "Owner can update their household"
  on households for update
  using (id = my_household_id());

-- Policies — users
create policy "Users can view household members"
  on users for select
  using (household_id = my_household_id());

create policy "Users can update their own profile"
  on users for update
  using (id = auth.uid());

-- Policies — household_profiles
create policy "Users can view their household profile"
  on household_profiles for select
  using (household_id = my_household_id());

create policy "Users can upsert their household profile"
  on household_profiles for all
  using (household_id = my_household_id());

-- Policies — chat_messages
create policy "Users can view household chat"
  on chat_messages for select
  using (household_id = my_household_id());

create policy "Users can insert chat messages"
  on chat_messages for insert
  with check (household_id = my_household_id());

-- Policies — inventory_items
create policy "Users can manage household inventory"
  on inventory_items for all
  using (household_id = my_household_id());

-- Policies — shopping_list
create policy "Users can manage household shopping list"
  on shopping_list for all
  using (household_id = my_household_id());

-- Policies — tasks
create policy "Users can manage household tasks"
  on tasks for all
  using (household_id = my_household_id());

-- Policies — staff_contacts
create policy "Users can manage household staff contacts"
  on staff_contacts for all
  using (household_id = my_household_id());

-- ─────────────────────────────────────────────
-- TRIGGER: auto-update inventory last_updated
-- ─────────────────────────────────────────────
create or replace function update_inventory_timestamp()
returns trigger language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

create trigger inventory_updated
  before update on inventory_items
  for each row execute function update_inventory_timestamp();

-- ─────────────────────────────────────────────
-- TRIGGER: auto-update household_profiles updated_at
-- ─────────────────────────────────────────────
create or replace function update_profile_timestamp()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profile_updated
  before update on household_profiles
  for each row execute function update_profile_timestamp();
