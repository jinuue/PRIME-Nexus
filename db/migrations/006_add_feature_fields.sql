-- Migration: add fields for newer features

alter table if exists applications
  add column if not exists withdraw_reason text;

alter table if exists messages
  add column if not exists read boolean not null default false;

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
