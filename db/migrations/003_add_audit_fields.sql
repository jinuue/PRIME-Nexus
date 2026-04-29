-- Migration: add created_by and created_at audit fields

alter table if exists hr_users
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists users
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now();

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
