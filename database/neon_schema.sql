create extension if not exists pgcrypto;

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  business_name varchar(160) not null,
  industry varchar(120) not null,
  team_size varchar(60) not null,
  process_description text not null,
  file_name varchar(255),
  file_text text,
  status varchar(40) not null default 'new',
  internal_notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists audit_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  automation_score int not null check (automation_score between 0 and 100),
  hours_wasted_weekly double precision not null check (hours_wasted_weekly >= 0),
  automatable_percentage int not null check (automatable_percentage between 0 and 100),
  pain_points jsonb not null default '[]',
  blueprint jsonb not null default '{}',
  summary text not null,
  industry_context text not null,
  created_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  agent_type varchar(80) not null,
  status varchar(40) not null default 'queued',
  logs jsonb not null default '[]',
  output text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  email varchar(180),
  phone varchar(40),
  whatsapp_number varchar(40),
  created_at timestamptz not null default now()
);

create index if not exists idx_submissions_status_created on submissions(status, created_at desc);
create index if not exists idx_audit_submission on audit_results(submission_id);
create index if not exists idx_agent_runs_submission on agent_runs(submission_id);

