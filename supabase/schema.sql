create extension if not exists pgcrypto;

create table if not exists public.pos_workspaces (
  code text primary key,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_waiters (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  full_name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_terminals (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  name text not null,
  terminal_no text not null,
  model text not null,
  location text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_menu_items (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  name text not null,
  category text not null,
  price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_modifier_groups (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  category text not null,
  name text not null,
  required boolean not null default false,
  multi boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_modifier_options (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  group_id text not null references public.pos_modifier_groups(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_tables (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  number integer not null,
  status text not null,
  guest_count integer not null default 0,
  opened_at timestamptz,
  adisyon_no text,
  order_items jsonb not null default '[]'::jsonb,
  audit_logs jsonb not null default '[]'::jsonb,
  cover_enabled boolean not null default false,
  cover_per_guest numeric(12, 2) not null default 35,
  waiter_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_order_items (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  table_id text not null references public.pos_tables(id) on delete cascade,
  line_key text not null,
  base_menu_item_id text,
  item_name text not null,
  category text not null,
  unit_price numeric(12, 2) not null default 0,
  quantity integer not null default 1,
  portion_multiplier numeric(4, 2) not null default 1,
  seat_no integer,
  note text,
  item_status text not null default 'AKTIF',
  void_reason text,
  voided_at timestamptz,
  sort_order integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_order_item_modifiers (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  order_item_id text not null references public.pos_order_items(id) on delete cascade,
  modifier_id text not null,
  modifier_name text not null,
  price numeric(12, 2) not null default 0,
  sort_order integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_order_audit_logs (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  table_id text not null references public.pos_tables(id) on delete cascade,
  menu_item_id text,
  action text not null,
  message text not null,
  created_at timestamptz not null
);

create table if not exists public.pos_transactions (
  id text primary key,
  workspace_code text not null references public.pos_workspaces(code) on delete cascade,
  created_at timestamptz not null,
  table_id text not null,
  table_no integer not null,
  adisyon_no text not null,
  terminal_no text not null,
  terminal_name text not null,
  waiter_name text,
  payment_type text not null,
  split_method text,
  amount numeric(12, 2) not null default 0,
  status text not null,
  reference_no text,
  error_code text,
  refunded_from_transaction_id text,
  refund_of_payment_type text,
  note text
);

create index if not exists idx_pos_waiters_workspace_code on public.pos_waiters (workspace_code);
create index if not exists idx_pos_terminals_workspace_code on public.pos_terminals (workspace_code);
create index if not exists idx_pos_menu_items_workspace_code on public.pos_menu_items (workspace_code);
create index if not exists idx_pos_modifier_groups_workspace_code on public.pos_modifier_groups (workspace_code);
create index if not exists idx_pos_modifier_options_workspace_code on public.pos_modifier_options (workspace_code);
create index if not exists idx_pos_tables_workspace_code on public.pos_tables (workspace_code);
create index if not exists idx_pos_tables_workspace_number on public.pos_tables (workspace_code, number);
create index if not exists idx_pos_order_items_workspace_code on public.pos_order_items (workspace_code);
create index if not exists idx_pos_order_items_table_id on public.pos_order_items (table_id);
create index if not exists idx_pos_order_item_modifiers_workspace_code on public.pos_order_item_modifiers (workspace_code);
create index if not exists idx_pos_order_item_modifiers_order_item_id on public.pos_order_item_modifiers (order_item_id);
create index if not exists idx_pos_order_audit_logs_workspace_code on public.pos_order_audit_logs (workspace_code);
create index if not exists idx_pos_order_audit_logs_table_id on public.pos_order_audit_logs (table_id);
create index if not exists idx_pos_transactions_workspace_code on public.pos_transactions (workspace_code);
create index if not exists idx_pos_transactions_created_at on public.pos_transactions (created_at desc);

-- Eski snapshot tablosu geçiş için tutulur.
create table if not exists public.pos_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_code text not null unique,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_pos_snapshots_workspace_code on public.pos_snapshots (workspace_code);

alter table public.pos_workspaces enable row level security;
alter table public.pos_waiters enable row level security;
alter table public.pos_terminals enable row level security;
alter table public.pos_menu_items enable row level security;
alter table public.pos_modifier_groups enable row level security;
alter table public.pos_modifier_options enable row level security;
alter table public.pos_tables enable row level security;
alter table public.pos_order_items enable row level security;
alter table public.pos_order_item_modifiers enable row level security;
alter table public.pos_order_audit_logs enable row level security;
alter table public.pos_transactions enable row level security;
alter table public.pos_snapshots enable row level security;

drop policy if exists "demo-pos-workspaces-select" on public.pos_workspaces;
drop policy if exists "demo-pos-workspaces-insert" on public.pos_workspaces;
drop policy if exists "demo-pos-workspaces-update" on public.pos_workspaces;
drop policy if exists "demo-pos-workspaces-delete" on public.pos_workspaces;

create policy "demo-pos-workspaces-select"
on public.pos_workspaces
for select
using (true);

create policy "demo-pos-workspaces-insert"
on public.pos_workspaces
for insert
with check (true);

create policy "demo-pos-workspaces-update"
on public.pos_workspaces
for update
using (true)
with check (true);

create policy "demo-pos-workspaces-delete"
on public.pos_workspaces
for delete
using (true);

drop policy if exists "demo-pos-waiters-select" on public.pos_waiters;
drop policy if exists "demo-pos-waiters-insert" on public.pos_waiters;
drop policy if exists "demo-pos-waiters-update" on public.pos_waiters;
drop policy if exists "demo-pos-waiters-delete" on public.pos_waiters;

create policy "demo-pos-waiters-select"
on public.pos_waiters
for select
using (true);

create policy "demo-pos-waiters-insert"
on public.pos_waiters
for insert
with check (true);

create policy "demo-pos-waiters-update"
on public.pos_waiters
for update
using (true)
with check (true);

create policy "demo-pos-waiters-delete"
on public.pos_waiters
for delete
using (true);

drop policy if exists "demo-pos-terminals-select" on public.pos_terminals;
drop policy if exists "demo-pos-terminals-insert" on public.pos_terminals;
drop policy if exists "demo-pos-terminals-update" on public.pos_terminals;
drop policy if exists "demo-pos-terminals-delete" on public.pos_terminals;

create policy "demo-pos-terminals-select"
on public.pos_terminals
for select
using (true);

create policy "demo-pos-terminals-insert"
on public.pos_terminals
for insert
with check (true);

create policy "demo-pos-terminals-update"
on public.pos_terminals
for update
using (true)
with check (true);

create policy "demo-pos-terminals-delete"
on public.pos_terminals
for delete
using (true);

drop policy if exists "demo-pos-menu-items-select" on public.pos_menu_items;
drop policy if exists "demo-pos-menu-items-insert" on public.pos_menu_items;
drop policy if exists "demo-pos-menu-items-update" on public.pos_menu_items;
drop policy if exists "demo-pos-menu-items-delete" on public.pos_menu_items;

create policy "demo-pos-menu-items-select"
on public.pos_menu_items
for select
using (true);

create policy "demo-pos-menu-items-insert"
on public.pos_menu_items
for insert
with check (true);

create policy "demo-pos-menu-items-update"
on public.pos_menu_items
for update
using (true)
with check (true);

create policy "demo-pos-menu-items-delete"
on public.pos_menu_items
for delete
using (true);

drop policy if exists "demo-pos-modifier-groups-select" on public.pos_modifier_groups;
drop policy if exists "demo-pos-modifier-groups-insert" on public.pos_modifier_groups;
drop policy if exists "demo-pos-modifier-groups-update" on public.pos_modifier_groups;
drop policy if exists "demo-pos-modifier-groups-delete" on public.pos_modifier_groups;

create policy "demo-pos-modifier-groups-select"
on public.pos_modifier_groups
for select
using (true);

create policy "demo-pos-modifier-groups-insert"
on public.pos_modifier_groups
for insert
with check (true);

create policy "demo-pos-modifier-groups-update"
on public.pos_modifier_groups
for update
using (true)
with check (true);

create policy "demo-pos-modifier-groups-delete"
on public.pos_modifier_groups
for delete
using (true);

drop policy if exists "demo-pos-modifier-options-select" on public.pos_modifier_options;
drop policy if exists "demo-pos-modifier-options-insert" on public.pos_modifier_options;
drop policy if exists "demo-pos-modifier-options-update" on public.pos_modifier_options;
drop policy if exists "demo-pos-modifier-options-delete" on public.pos_modifier_options;

create policy "demo-pos-modifier-options-select"
on public.pos_modifier_options
for select
using (true);

create policy "demo-pos-modifier-options-insert"
on public.pos_modifier_options
for insert
with check (true);

create policy "demo-pos-modifier-options-update"
on public.pos_modifier_options
for update
using (true)
with check (true);

create policy "demo-pos-modifier-options-delete"
on public.pos_modifier_options
for delete
using (true);

drop policy if exists "demo-pos-tables-select" on public.pos_tables;
drop policy if exists "demo-pos-tables-insert" on public.pos_tables;
drop policy if exists "demo-pos-tables-update" on public.pos_tables;
drop policy if exists "demo-pos-tables-delete" on public.pos_tables;

create policy "demo-pos-tables-select"
on public.pos_tables
for select
using (true);

create policy "demo-pos-tables-insert"
on public.pos_tables
for insert
with check (true);

create policy "demo-pos-tables-update"
on public.pos_tables
for update
using (true)
with check (true);

create policy "demo-pos-tables-delete"
on public.pos_tables
for delete
using (true);

drop policy if exists "demo-pos-order-items-select" on public.pos_order_items;
drop policy if exists "demo-pos-order-items-insert" on public.pos_order_items;
drop policy if exists "demo-pos-order-items-update" on public.pos_order_items;
drop policy if exists "demo-pos-order-items-delete" on public.pos_order_items;

create policy "demo-pos-order-items-select"
on public.pos_order_items
for select
using (true);

create policy "demo-pos-order-items-insert"
on public.pos_order_items
for insert
with check (true);

create policy "demo-pos-order-items-update"
on public.pos_order_items
for update
using (true)
with check (true);

create policy "demo-pos-order-items-delete"
on public.pos_order_items
for delete
using (true);

drop policy if exists "demo-pos-order-item-modifiers-select" on public.pos_order_item_modifiers;
drop policy if exists "demo-pos-order-item-modifiers-insert" on public.pos_order_item_modifiers;
drop policy if exists "demo-pos-order-item-modifiers-update" on public.pos_order_item_modifiers;
drop policy if exists "demo-pos-order-item-modifiers-delete" on public.pos_order_item_modifiers;

create policy "demo-pos-order-item-modifiers-select"
on public.pos_order_item_modifiers
for select
using (true);

create policy "demo-pos-order-item-modifiers-insert"
on public.pos_order_item_modifiers
for insert
with check (true);

create policy "demo-pos-order-item-modifiers-update"
on public.pos_order_item_modifiers
for update
using (true)
with check (true);

create policy "demo-pos-order-item-modifiers-delete"
on public.pos_order_item_modifiers
for delete
using (true);

drop policy if exists "demo-pos-order-audit-logs-select" on public.pos_order_audit_logs;
drop policy if exists "demo-pos-order-audit-logs-insert" on public.pos_order_audit_logs;
drop policy if exists "demo-pos-order-audit-logs-update" on public.pos_order_audit_logs;
drop policy if exists "demo-pos-order-audit-logs-delete" on public.pos_order_audit_logs;

create policy "demo-pos-order-audit-logs-select"
on public.pos_order_audit_logs
for select
using (true);

create policy "demo-pos-order-audit-logs-insert"
on public.pos_order_audit_logs
for insert
with check (true);

create policy "demo-pos-order-audit-logs-update"
on public.pos_order_audit_logs
for update
using (true)
with check (true);

create policy "demo-pos-order-audit-logs-delete"
on public.pos_order_audit_logs
for delete
using (true);

drop policy if exists "demo-pos-transactions-select" on public.pos_transactions;
drop policy if exists "demo-pos-transactions-insert" on public.pos_transactions;
drop policy if exists "demo-pos-transactions-update" on public.pos_transactions;
drop policy if exists "demo-pos-transactions-delete" on public.pos_transactions;

create policy "demo-pos-transactions-select"
on public.pos_transactions
for select
using (true);

create policy "demo-pos-transactions-insert"
on public.pos_transactions
for insert
with check (true);

create policy "demo-pos-transactions-update"
on public.pos_transactions
for update
using (true)
with check (true);

create policy "demo-pos-transactions-delete"
on public.pos_transactions
for delete
using (true);

drop policy if exists "demo-pos-snapshots-select" on public.pos_snapshots;
drop policy if exists "demo-pos-snapshots-insert" on public.pos_snapshots;
drop policy if exists "demo-pos-snapshots-update" on public.pos_snapshots;

create policy "demo-pos-snapshots-select"
on public.pos_snapshots
for select
using (true);

create policy "demo-pos-snapshots-insert"
on public.pos_snapshots
for insert
with check (true);

create policy "demo-pos-snapshots-update"
on public.pos_snapshots
for update
using (true)
with check (true);