-- Read-only verification for GYMFlow Stage E.
-- Run after the Stage E migration has completed successfully.

-- 1. Confirm the three runtime RPCs exist.
select
  p.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('gymflow_session_to_json', 'gymflow_get_state', 'gymflow_save_state')
order by p.proname;

-- 2. Confirm authenticated can execute and anon cannot execute the public RPCs.
select
  'gymflow_session_to_json(uuid)' as function_name,
  has_function_privilege('authenticated', 'public.gymflow_session_to_json(uuid)', 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('anon', 'public.gymflow_session_to_json(uuid)', 'EXECUTE') as anon_can_execute
union all
select
  'gymflow_get_state()',
  has_function_privilege('authenticated', 'public.gymflow_get_state()', 'EXECUTE'),
  has_function_privilege('anon', 'public.gymflow_get_state()', 'EXECUTE')
union all
select
  'gymflow_save_state(jsonb)',
  has_function_privilege('authenticated', 'public.gymflow_save_state(jsonb)', 'EXECUTE'),
  has_function_privilege('anon', 'public.gymflow_save_state(jsonb)', 'EXECUTE')
order by function_name;

-- 3. Confirm RLS remains enabled on every private GYMFlow table.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles', 'user_settings', 'exercises', 'routines', 'routine_exercises',
    'workout_sessions', 'session_exercises', 'workout_sets', 'weight_records', 'migration_logs'
  )
order by c.relname;

-- Note: SQL Editor commonly runs with elevated privileges and may not carry an Auth JWT.
-- The queries above validate schema and grants, not cross-account runtime isolation.
-- Test isolation with two real authenticated accounts in the browser before production rollout.
