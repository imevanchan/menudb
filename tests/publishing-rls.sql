-- Run only against an empty, disposable local Postgres database.
-- This creates minimal Supabase auth stubs; never run it on hosted Supabase.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
insert into auth.users values
  ('11111111-1111-4111-8111-111111111111', 'imevanchan.careers@gmail.com'),
  ('22222222-2222-4222-8222-222222222222', 'nonpublisher@example.test');
\ir ../supabase/migrations/202611040001_publishing.sql

set role anon;
do $$ begin
  perform * from public.menu_sync_jobs;
  raise exception 'Anonymous history access was allowed';
exception when insufficient_privilege then null; end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
insert into public.menu_sync_jobs(user_id, store_id, payload_hash, submitted_payload)
values ('11111111-1111-4111-8111-111111111111', 'test-store', 'test-hash', '{}');
do $$ begin
  insert into public.menu_sync_jobs(user_id, store_id, payload_hash, submitted_payload)
  values ('11111111-1111-4111-8111-111111111111', 'test-store', 'other-hash', '{}');
  raise exception 'Overlapping upload was allowed';
exception when unique_violation then null; end $$;
update public.menu_sync_jobs set original_menu = '{"backup":true}', status = 'verified' where store_id = 'test-store';
do $$ begin
  if (select count(*) from public.menu_sync_jobs where status = 'verified') <> 1 then
    raise exception 'Publisher could not update or read its history';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
do $$ begin
  if (select count(*) from public.menu_sync_jobs) <> 0 then raise exception 'Nonpublisher can read history'; end if;
  insert into public.menu_sync_jobs(user_id, store_id, payload_hash, submitted_payload)
  values ('22222222-2222-4222-8222-222222222222', 'other-store', 'hash', '{}');
  raise exception 'Nonpublisher can create jobs';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into public.menu_publishers values ('22222222-2222-4222-8222-222222222222');
  raise exception 'User can self-approve as publisher';
exception when insufficient_privilege then null; end $$;
reset role;
select 'Publishing RLS and overlap checks passed' as result;
