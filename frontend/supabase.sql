-- Enable pgcrypto for gen_random_uuid if not already
create extension if not exists pgcrypto;

-- 1) profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','doctor','admin')),
  onboarded boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- 2) RLS
alter table public.profiles enable row level security;

-- Helper function: check role
create or replace function public.has_role(target_role text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = target_role
  );
$$;

-- Policies
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.has_role('admin'));

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

-- Admin can do anything via service key (bypasses RLS) or via explicit policy if needed.

-- 3) Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


