begin;

-- Only explicitly approved existing administrators may publish.
create table if not exists public.menu_publishers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.menu_publishers enable row level security;
revoke all on public.menu_publishers from anon, authenticated;
grant select on public.menu_publishers to authenticated;
create policy "Publishers can check their membership" on public.menu_publishers
  for select to authenticated using (user_id = (select auth.uid()));

-- Existing MenuDB owner. Change this email if the administrator signs in under
-- a different account. New signups are never automatically made publishers.
insert into public.menu_publishers(user_id)
select id from auth.users where lower(email) = 'imevanchan.careers@gmail.com'
on conflict do nothing;

create table if not exists public.menu_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  platform text not null default 'uber_eats' check (platform = 'uber_eats'),
  environment text not null default 'sandbox' check (environment = 'sandbox'),
  store_id text not null,
  payload_hash text not null,
  status text not null default 'running'
    check (status in ('running', 'accepted', 'verified', 'failed', 'uncertain', 'mismatch')),
  message text not null default 'Publishing started.',
  http_status integer,
  submitted_payload jsonb not null,
  original_menu jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create unique index menu_sync_one_active_store
  on public.menu_sync_jobs(platform, environment, store_id)
  where status in ('running', 'accepted', 'uncertain');
create index menu_sync_recent on public.menu_sync_jobs(created_at desc);
alter table public.menu_sync_jobs enable row level security;
revoke all on public.menu_sync_jobs from anon, authenticated;
grant select, insert, update on public.menu_sync_jobs to authenticated;
create policy "Publishers can read sync history" on public.menu_sync_jobs
  for select to authenticated using (
    exists (select 1 from public.menu_publishers where user_id = (select auth.uid()))
  );
create policy "Publishers can start their own jobs" on public.menu_sync_jobs
  for insert to authenticated with check (
    user_id = (select auth.uid()) and
    exists (select 1 from public.menu_publishers where user_id = (select auth.uid()))
  );
create policy "Publishers can update their own jobs" on public.menu_sync_jobs
  for update to authenticated using (
    user_id = (select auth.uid()) and
    exists (select 1 from public.menu_publishers where user_id = (select auth.uid()))
  ) with check (
    user_id = (select auth.uid()) and
    exists (select 1 from public.menu_publishers where user_id = (select auth.uid()))
  );
commit;
