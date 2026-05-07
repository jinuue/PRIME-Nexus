-- PRIME-Nexus: Full Schema Setup (Initial + Migrations)

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Sequences for custom IDs
create sequence if not exists user_id_seq start 1;
create sequence if not exists hr_id_seq start 1;

-- 3. Core Tables
create table if not exists hr_users (
  id text primary key default (
    'HR' || lpad(nextval('hr_id_seq')::text, 3, '0')
  ),
  email text unique not null,
  password text not null,
  name text not null,
  phone text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key default (
    to_char(current_date, 'YY') || lpad(nextval('user_id_seq')::text, 3, '0')
  ),
  email text unique not null,
  password text not null,
  name text not null,
  phone text,
  role text check (role in ('intern', 'applicant')) not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
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
  interview_date date,
  interview_time time,
  final_interview_date date,
  final_interview_time time,
  is_deployed boolean default false,
  withdraw_reason text,
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
  read boolean not null default false,
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

create table if not exists legacy_interns (
  id text primary key,
  name text not null,
  email text,
  phone text,
  school text,
  department text,
  hours integer,
  period text,
  ojt_type text,
  coc_status text,
  dtr_file_name text,
  resume_file_name text,
  portfolio_file_name text,
  added_at timestamptz not null default now()
);
