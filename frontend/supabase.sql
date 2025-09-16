-- Enable pgcrypto for gen_random_uuid if not already
create extension if not exists pgcrypto;

-- 1) profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','doctor','admin')),
  onboarded boolean not null default false,
  name text,
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
  insert into public.profiles (id, role, onboarded, name) 
  values (
    new.id, 
    'client', 
    false,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) Patient profiles table (extends profiles for client role users)
create table if not exists public.patient_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  case_id text unique, -- unique case identifier for search
  full_name text not null,
  email text,
  phone text,
  age integer,
  gender text check (gender in ('male', 'female', 'other')),
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_history text[],
  current_medications text[],
  allergies text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 5) Doctor-patient relationships table
create table if not exists public.doctor_patient_relationships (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive', 'completed')),
  assigned_at timestamp with time zone not null default now(),
  notes text,
  unique(doctor_id, patient_id)
);

-- 6) Therapy sessions table
create table if not exists public.therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  case_id text references public.patient_profiles(case_id),
  session_type text not null default 'therapy',
  injury_type text,
  session_data jsonb, -- store video analysis, exercises, etc.
  ai_analysis text,
  doctor_notes text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'completed')),
  urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high')),
  session_date timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 7) RLS for new tables
alter table public.patient_profiles enable row level security;
alter table public.doctor_patient_relationships enable row level security;
alter table public.therapy_sessions enable row level security;

-- 8) Policies for patient_profiles
drop policy if exists "patients can read own profile" on public.patient_profiles;
create policy "patients can read own profile" on public.patient_profiles
  for select using (id = auth.uid());

drop policy if exists "patients can update own profile" on public.patient_profiles;
create policy "patients can update own profile" on public.patient_profiles
  for update using (id = auth.uid());

drop policy if exists "doctors can read their patients profiles" on public.patient_profiles;
create policy "doctors can read their patients profiles" on public.patient_profiles
  for select using (
    public.has_role('doctor') and
    exists (
      select 1 from public.doctor_patient_relationships dpr
      where dpr.patient_id = patient_profiles.id
      and dpr.doctor_id = auth.uid()
      and dpr.status = 'active'
    )
  );

-- Allow doctors to search all patients (for assignment purposes)
drop policy if exists "doctors can search all patients" on public.patient_profiles;
create policy "doctors can search all patients" on public.patient_profiles
  for select using (public.has_role('doctor'));

drop policy if exists "patients can create own profile" on public.patient_profiles;
create policy "patients can create own profile" on public.patient_profiles
  for insert with check (id = auth.uid());

-- 9) Policies for doctor_patient_relationships
drop policy if exists "doctors can manage their relationships" on public.doctor_patient_relationships;
create policy "doctors can manage their relationships" on public.doctor_patient_relationships
  for all using (doctor_id = auth.uid() and public.has_role('doctor'));

drop policy if exists "patients can see their relationships" on public.doctor_patient_relationships;
create policy "patients can see their relationships" on public.doctor_patient_relationships
  for select using (patient_id = auth.uid());

-- 10) Policies for therapy_sessions
drop policy if exists "patients can read own sessions" on public.therapy_sessions;
create policy "patients can read own sessions" on public.therapy_sessions
  for select using (patient_id = auth.uid());

drop policy if exists "patients can create own sessions" on public.therapy_sessions;
create policy "patients can create own sessions" on public.therapy_sessions
  for insert with check (patient_id = auth.uid());

drop policy if exists "doctors can read their patients sessions" on public.therapy_sessions;
create policy "doctors can read their patients sessions" on public.therapy_sessions
  for select using (
    public.has_role('doctor') and (
      doctor_id = auth.uid() or
      exists (
        select 1 from public.doctor_patient_relationships dpr 
        where dpr.patient_id = therapy_sessions.patient_id 
        and dpr.doctor_id = auth.uid() 
        and dpr.status = 'active'
      )
    )
  );

drop policy if exists "doctors can update their patients sessions" on public.therapy_sessions;
create policy "doctors can update their patients sessions" on public.therapy_sessions
  for update using (
    public.has_role('doctor') and (
      doctor_id = auth.uid() or
      exists (
        select 1 from public.doctor_patient_relationships dpr 
        where dpr.patient_id = therapy_sessions.patient_id 
        and dpr.doctor_id = auth.uid() 
        and dpr.status = 'active'
      )
    )
  );

-- 11) Indexes for performance
create index if not exists idx_patient_profiles_case_id on public.patient_profiles(case_id);
create index if not exists idx_patient_profiles_full_name on public.patient_profiles(full_name);
create index if not exists idx_doctor_patient_relationships_doctor_id on public.doctor_patient_relationships(doctor_id);
create index if not exists idx_doctor_patient_relationships_patient_id on public.doctor_patient_relationships(patient_id);
create index if not exists idx_therapy_sessions_patient_id on public.therapy_sessions(patient_id);
create index if not exists idx_therapy_sessions_doctor_id on public.therapy_sessions(doctor_id);
create index if not exists idx_therapy_sessions_case_id on public.therapy_sessions(case_id);
create index if not exists idx_therapy_sessions_status on public.therapy_sessions(status);

-- 12) Function to auto-generate case_id for patients
create or replace function public.generate_case_id()
returns text language plpgsql as $$
begin
  return 'P-' || lpad(nextval('case_id_sequence')::text, 6, '0');
end;
$$;

-- Create sequence for case IDs
create sequence if not exists case_id_sequence start 1;

-- 13) Trigger to auto-generate case_id when patient profile is created
create or replace function public.handle_new_patient_profile()
returns trigger language plpgsql security definer as $$
begin
  if new.case_id is null then
    new.case_id := public.generate_case_id();
  end if;
  return new;
end;
$$;

drop trigger if exists on_patient_profile_created on public.patient_profiles;
create trigger on_patient_profile_created
  before insert on public.patient_profiles
  for each row execute procedure public.handle_new_patient_profile();

-- 14) Function to search patients (for doctors)
create or replace function public.search_patients(
  search_term text default '',
  doctor_id_param uuid default null
)
returns table (
  id uuid,
  case_id text,
  full_name text,
  email text,
  phone text,
  age integer,
  relationship_status text,
  assigned_at timestamp with time zone,
  last_session timestamp with time zone,
  total_sessions bigint
) language plpgsql security definer as $$
begin
  if doctor_id_param is null then
    -- Return all patients when no specific doctor is provided
    return query
    select
      pp.id,
      pp.case_id,
      pp.full_name,
      pp.email,
      pp.phone,
      pp.age,
      coalesce(dpr.status, 'unassigned') as relationship_status,
      dpr.assigned_at,
      (select max(ts.session_date) from public.therapy_sessions ts where ts.patient_id = pp.id) as last_session,
      (select count(*) from public.therapy_sessions ts where ts.patient_id = pp.id) as total_sessions
    from public.patient_profiles pp
    left join public.doctor_patient_relationships dpr on pp.id = dpr.patient_id
    where
      (search_term = '' or
       pp.case_id ilike '%' || search_term || '%' or
       pp.full_name ilike '%' || search_term || '%' or
       pp.email ilike '%' || search_term || '%')
    order by pp.full_name;
  else
    -- Return only patients assigned to the specific doctor
    return query
    select
      pp.id,
      pp.case_id,
      pp.full_name,
      pp.email,
      pp.phone,
      pp.age,
      dpr.status as relationship_status,
      dpr.assigned_at,
      (select max(ts.session_date) from public.therapy_sessions ts where ts.patient_id = pp.id) as last_session,
      (select count(*) from public.therapy_sessions ts where ts.patient_id = pp.id) as total_sessions
    from public.patient_profiles pp
    inner join public.doctor_patient_relationships dpr on pp.id = dpr.patient_id
      and dpr.doctor_id = doctor_id_param
    where
      (search_term = '' or
       pp.case_id ilike '%' || search_term || '%' or
       pp.full_name ilike '%' || search_term || '%' or
       pp.email ilike '%' || search_term || '%')
    order by pp.full_name;
  end if;
end;
$$;


