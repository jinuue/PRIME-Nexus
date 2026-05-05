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
  drop constraint if exists applications_user_id_fkey;

alter table if exists users
  alter column id type text using id::text,
  alter column id set default (
    to_char(current_date, 'YY') || lpad(nextval('user_id_seq')::text, 3, '0')
  );

insert into hr_users (id, email, password, name, phone, created_by, created_at)
select u.id::text, u.email, u.password, u.name, u.phone, u.created_by, u.created_at
from users u
where u.role = 'hr'
on conflict (email) do nothing;

delete from users where role = 'hr';

alter table if exists users
  drop constraint if exists users_role_check;

alter table if exists users
  add constraint users_role_check check (role in ('intern', 'applicant'));

alter table if exists applications
  alter column user_id type text using user_id::text;

alter table if exists applications
  add constraint applications_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

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

-- Note: This migration converts existing UUID user IDs to text and moves HR users
-- into the hr_users table so the schema aligns with the custom-ID setup.
