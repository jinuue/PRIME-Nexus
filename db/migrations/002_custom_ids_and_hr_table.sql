-- Migration: custom ID formats and separate HR table

create sequence if not exists user_id_seq start 1;
create sequence if not exists hr_id_seq start 1;

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

alter table if exists applications
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists dtr_entries
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists school_activities
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists messages
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists email_templates
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists company_documents
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists dept_slots
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists quarter_settings
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

-- Note: If the original users table already exists with uuid IDs, this migration
-- does not move data. Add a dedicated data migration if needed.
