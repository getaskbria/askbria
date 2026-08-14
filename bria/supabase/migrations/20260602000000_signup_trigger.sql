-- Auto-create household + user profile on new auth signup
-- Runs as postgres (security definer), so it bypasses RLS

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_household_id uuid;
begin
  -- 1. Create household
  insert into households (name)
  values ('My Home')
  returning id into v_household_id;

  -- 2. Create user row
  insert into users (id, household_id, email, full_name, role)
  values (
    new.id,
    v_household_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'owner'
  );

  -- 3. Seed empty household profile
  insert into household_profiles (household_id)
  values (v_household_id);

  return new;
end;
$$;

-- Drop existing trigger if any, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
