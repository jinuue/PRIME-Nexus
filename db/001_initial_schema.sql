-- Initial Supabase schema for PRIME-Nexus

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  name text not null,
  phone text,
  role text check (role in ('hr', 'intern', 'applicant')) not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  course text,
  school text,
  cv_name text,
  cover_name text,
  ojt_type text check (ojt_type in ('required', 'voluntary')),
  hours_required integer,
  source text,
  status text,
  applied_date date,
  quarter text,
  department text,
  supervisor text,
  schedule text,
  start_date date,
  company_docs jsonb,
  school_docs jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists dtr_entries (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references applications(id) on delete cascade,
  date date not null,
  time_in time,
  time_out time,
  type text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists school_activities (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references applications(id) on delete cascade,
  name text,
  description text,
  status text,
  type text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references applications(id) on delete cascade,
  sender text,
  text text,
  time timestamptz default now(),
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists email_templates (
  id text primary key,
  name text,
  subject text,
  body text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists company_documents (
  id text primary key,
  name text,
  description text,
  type text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists dept_slots (
  department text primary key,
  slots integer,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists quarter_settings (
  id serial primary key,
  current text,
  created_by text,
  created_at timestamptz not null default now()
);
