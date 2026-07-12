-- =========================================================
-- Madonna Community — Supabase schema
-- Run this in the Supabase SQL Editor on a fresh project.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Tables
-- ---------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('landlady', 'chairperson', 'caretaker', 'resident')),
  created_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null unique,
  resident_id uuid references public.profiles(id) on delete set null,
  status text not null default 'vacant' check (status in ('occupied', 'vacant')),
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  category text not null check (category in ('Repainting', 'Electrical', 'Plumbing', 'Repairs', 'Cleaning', 'Security', 'Other')),
  description text not null,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Solved')),
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  subject text not null,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Solved')),
  created_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  category text not null check (category in (
    'Meetings', 'Maintenance Alerts', 'Reminders', 'Lost & Found',
    'Community Events', 'Security / Emergency Notices',
    'Policy & Rule Changes', 'Motivational / Engagement', 'Other'
  )),
  created_by uuid not null references public.profiles(id) on delete set null,
  is_urgent boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notice_board (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Helper: current caller's role, used throughout RLS policies
-- ---------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() in ('caretaker', 'chairperson', 'landlady');
$$;

create or replace function public.can_manage_units()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() in ('chairperson', 'landlady');
$$;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.units enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.complaints enable row level security;
alter table public.suggestions enable row level security;
alter table public.announcements enable row level security;
alter table public.notice_board enable row level security;

-- profiles: everyone can read their own row; staff can read everyone
-- (needed to show resident names against maintenance/complaints/units).
-- Writes happen only via the create-resident Edge Function (service role),
-- which bypasses RLS, so no client-side insert policy is defined.
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

-- units: unit numbers and occupancy aren't sensitive; any signed-in
-- resident can see the estate's unit list. Only chairperson/landlady
-- can create units or change assignment/status.
create policy "units_select_all" on public.units
  for select using (auth.uid() is not null);

create policy "units_insert_managers" on public.units
  for insert with check (public.can_manage_units());

create policy "units_update_managers" on public.units
  for update using (public.can_manage_units());

-- maintenance_requests: residents see + create only their own; staff see all and update status.
create policy "maintenance_select_own_or_staff" on public.maintenance_requests
  for select using (profile_id = auth.uid() or public.is_staff());

create policy "maintenance_insert_own_resident" on public.maintenance_requests
  for insert with check (profile_id = auth.uid() and public.current_role() = 'resident');

create policy "maintenance_update_staff" on public.maintenance_requests
  for update using (public.is_staff());

-- complaints: same shape as maintenance_requests.
create policy "complaints_select_own_or_staff" on public.complaints
  for select using (profile_id = auth.uid() or public.is_staff());

create policy "complaints_insert_own_resident" on public.complaints
  for insert with check (profile_id = auth.uid() and public.current_role() = 'resident');

create policy "complaints_update_staff" on public.complaints
  for update using (public.is_staff());

-- suggestions: residents see + create only their own; staff see all. No status to update.
create policy "suggestions_select_own_or_staff" on public.suggestions
  for select using (profile_id = auth.uid() or public.is_staff());

create policy "suggestions_insert_own_resident" on public.suggestions
  for insert with check (profile_id = auth.uid() and public.current_role() = 'resident');

-- announcements: everyone reads; only staff create or archive.
create policy "announcements_select_all" on public.announcements
  for select using (auth.uid() is not null);

create policy "announcements_insert_staff" on public.announcements
  for insert with check (public.is_staff() and created_by = auth.uid());

create policy "announcements_update_staff" on public.announcements
  for update using (public.is_staff());

-- notice_board: everyone reads. Rows are written only by the archive
-- trigger below (security definer), so no client insert policy exists.
create policy "notice_board_select_all" on public.notice_board
  for select using (auth.uid() is not null);

-- ---------------------------------------------------------
-- Archiving an announcement copies it onto the notice board
-- ---------------------------------------------------------

create or replace function public.archive_announcement_to_notice_board()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.archived = true and (OLD.archived is distinct from true) then
    insert into public.notice_board (title, message, created_at)
    values (NEW.title, NEW.message, now());
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_archive_announcement on public.announcements;
create trigger trg_archive_announcement
  after update on public.announcements
  for each row execute function public.archive_announcement_to_notice_board();

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

create index if not exists idx_units_resident on public.units(resident_id);
create index if not exists idx_maintenance_profile on public.maintenance_requests(profile_id);
create index if not exists idx_maintenance_unit on public.maintenance_requests(unit_id);
create index if not exists idx_complaints_profile on public.complaints(profile_id);
create index if not exists idx_complaints_unit on public.complaints(unit_id);
create index if not exists idx_suggestions_profile on public.suggestions(profile_id);
create index if not exists idx_announcements_archived on public.announcements(archived);

-- ---------------------------------------------------------
-- Bootstrap: your first landlady account
-- ---------------------------------------------------------
-- 1. Create the auth user from the Supabase Dashboard
--    (Authentication -> Users -> Add user), or via supabase.auth.signUp.
-- 2. Then run, substituting the new user's UUID:
--
-- insert into public.profiles (id, full_name, email, phone, role)
-- values ('paste-the-auth-user-uuid-here', 'Your Name', 'you@example.com', '07XXXXXXXX', 'landlady');
--
-- From then on, the landlady/chairperson can add every other resident
-- from the "Units & Residents" page, which calls the create-resident
-- Edge Function to do this step for them automatically.
