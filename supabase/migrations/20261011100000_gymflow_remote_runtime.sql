-- GYMFlow Stage E: remote runtime read/save RPCs for the existing Vanilla JS UI.
-- Requires Stage B schema and Stage D import RPC to have been applied.
-- Run once in Supabase SQL Editor. These functions only operate on auth.uid().

begin;

-- Serialize one session from normalized tables while retaining legacy fields needed by the existing UI.
create or replace function public.gymflow_session_to_json(p_session_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Login diperlukan untuk membaca workout.';
  end if;

  select
    coalesce(s.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'id', coalesce(s.legacy_id, s.id::text),
      'routineId', coalesce(s.routine_legacy_id, r.legacy_id),
      'startedAt', s.started_at,
      'endedAt', s.ended_at,
      'duration', s.duration_seconds,
      'pausedSeconds', s.paused_seconds,
      'currentExerciseIndex', s.current_exercise_index,
      'restRemaining', s.rest_remaining,
      'restPaused', s.rest_paused,
      'caloriesBurned', s.calories_burned,
      'stats', coalesce(s.stats, '{}'::jsonb),
      'exercises', coalesce((
        select pg_catalog.jsonb_agg(
          coalesce(se.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
            'exerciseId', coalesce(se.legacy_exercise_id, e.legacy_id),
            'notes', se.notes,
            'sets', coalesce((
              select pg_catalog.jsonb_agg(
                coalesce(ws.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
                  'reps', case when se.metric_type = 'cardio' then ws.duration_minutes else ws.reps end,
                  'weight', case when se.metric_type = 'cardio' then ws.distance_km else ws.weight_kg end,
                  'completedAt', ws.completed_at
                ) order by ws.set_number
              )
              from public.workout_sets ws
              where ws.session_exercise_id = se.id and ws.user_id = se.user_id
            ), '[]'::jsonb)
          ) order by se.sort_order
        )
        from public.session_exercises se
        left join public.exercises e on e.id = se.exercise_id
        where se.workout_session_id = s.id and se.user_id = s.user_id
      ), '[]'::jsonb)
    )
  into v_result
  from public.workout_sessions s
  left join public.routines r on r.id = s.routine_id and r.user_id = s.user_id
  where s.id = p_session_id and s.user_id = v_user_id;

  return v_result;
end;
$$;

revoke all on function public.gymflow_session_to_json(uuid) from public, anon;
grant execute on function public.gymflow_session_to_json(uuid) to authenticated;

-- Read current authenticated user's data in the shape consumed by the existing state-based UI.
create or replace function public.gymflow_get_state()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_settings jsonb;
  v_exercises jsonb;
  v_routines jsonb;
  v_history jsonb;
  v_active jsonb;
  v_weights jsonb;
  v_meta jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Login diperlukan untuk membuka GYMFlow.';
  end if;

  select pg_catalog.jsonb_build_object(
    'theme', coalesce(us.theme, 'dark'),
    'restSeconds', coalesce(us.rest_seconds, 90),
    'weight', coalesce(p.weight_value, 65),
    'height', coalesce(p.height_value, 170),
    'age', coalesce(p.age, 25),
    'heightUnit', coalesce(us.height_unit, 'cm'),
    'weightUnit', coalesce(us.weight_unit, 'kg'),
    'weeklyGoal', coalesce(us.weekly_goal, 4),
    'userName', coalesce(p.display_name, 'GYMFlow User'),
    'language', coalesce(us.language, 'id')
  )
  into v_settings
  from public.profiles p
  left join public.user_settings us on us.user_id = p.user_id
  where p.user_id = v_user_id;

  if v_settings is null then
    v_settings := pg_catalog.jsonb_build_object(
      'theme', 'dark', 'restSeconds', 90, 'weight', 65, 'height', 170,
      'age', 25, 'heightUnit', 'cm', 'weightUnit', 'kg', 'weeklyGoal', 4,
      'userName', 'GYMFlow User', 'language', 'id'
    );
  end if;

  select coalesce(pg_catalog.jsonb_agg(
    coalesce(e.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'id', coalesce(e.legacy_id, e.id::text),
      'name', e.name,
      'muscle', e.muscle,
      'equipment', e.equipment,
      'isCustom', not e.is_builtin
    ) order by e.is_builtin desc, e.name
  ), '[]'::jsonb)
  into v_exercises
  from public.exercises e
  where e.is_builtin = true or e.owner_id = v_user_id;

  select coalesce(pg_catalog.jsonb_agg(
    coalesce(r.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'id', coalesce(r.legacy_id, r.id::text),
      'name', r.name,
      'description', r.description,
      'days', pg_catalog.to_jsonb(r.days),
      'exerciseIds', coalesce((
        select pg_catalog.jsonb_agg(re.legacy_exercise_id order by re.sort_order)
        from public.routine_exercises re
        where re.routine_id = r.id and re.user_id = r.user_id
      ), '[]'::jsonb),
      'exercises', coalesce((
        select pg_catalog.jsonb_agg(
          coalesce(re.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
            'id', coalesce(re.legacy_exercise_id, re.exercise_id::text),
            'sets', coalesce(re.default_sets, '[]'::jsonb)
          ) order by re.sort_order
        )
        from public.routine_exercises re
        where re.routine_id = r.id and re.user_id = r.user_id
      ), '[]'::jsonb)
    ) order by r.sort_order, r.created_at
  ), '[]'::jsonb)
  into v_routines
  from public.routines r
  where r.user_id = v_user_id;

  select coalesce(pg_catalog.jsonb_agg(public.gymflow_session_to_json(s.id)
    order by s.started_at desc nulls last, s.created_at desc), '[]'::jsonb)
  into v_history
  from public.workout_sessions s
  where s.user_id = v_user_id and s.status = 'completed';

  select public.gymflow_session_to_json(s.id)
  into v_active
  from public.workout_sessions s
  where s.user_id = v_user_id and s.status = 'active'
  order by s.updated_at desc
  limit 1;

  select coalesce(pg_catalog.jsonb_agg(
    coalesce(w.legacy_payload, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'date', w.record_date,
      'weight', w.weight_value
    ) order by w.record_date
  ), '[]'::jsonb)
  into v_weights
  from public.weight_records w
  where w.user_id = v_user_id;

  select pg_catalog.jsonb_build_object(
    'has_completed_import', exists (
      select 1 from public.migration_logs ml
      where ml.user_id = v_user_id and ml.status = 'completed'
    ),
    'server_counts', pg_catalog.jsonb_build_object(
      'exercises', (select pg_catalog.count(*) from public.exercises e where e.owner_id = v_user_id and e.is_builtin = false),
      'routines', (select pg_catalog.count(*) from public.routines r where r.user_id = v_user_id),
      'sessions', (select pg_catalog.count(*) from public.workout_sessions s where s.user_id = v_user_id),
      'weights', (select pg_catalog.count(*) from public.weight_records w where w.user_id = v_user_id)
    )
  )
  into v_meta;

  return pg_catalog.jsonb_build_object(
    'settings', v_settings,
    'exercises', coalesce(v_exercises, '[]'::jsonb),
    'routines', coalesce(v_routines, '[]'::jsonb),
    'activeSession', v_active,
    'history', coalesce(v_history, '[]'::jsonb),
    'weightHistory', coalesce(v_weights, '[]'::jsonb),
    '_meta', coalesce(v_meta, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.gymflow_get_state() from public, anon;
grant execute on function public.gymflow_get_state() to authenticated;

-- Save a complete UI state atomically. No user_id is accepted from the browser;
-- ownership always comes from auth.uid(). The payload is expected to be the state
-- just read from gymflow_get_state(), with the user's edits applied.
create or replace function public.gymflow_save_state(p_state jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_settings jsonb;
  v_exercises jsonb;
  v_routines jsonb;
  v_history jsonb;
  v_weights jsonb;
  v_active jsonb;
  v_sessions jsonb := '[]'::jsonb;
  v_item jsonb;
  v_routine jsonb;
  v_routine_exercise jsonb;
  v_session jsonb;
  v_session_exercise jsonb;
  v_set jsonb;
  v_ord bigint;
  v_sub_ord bigint;
  v_legacy_id text;
  v_legacy_exercise_id text;
  v_routine_legacy_id text;
  v_session_legacy_id text;
  v_routine_id uuid;
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_exercise_id uuid;
  v_exercise_name text;
  v_muscle text;
  v_equipment text;
  v_metric_type text;
  v_status text;
  v_started_at timestamptz;
  v_ended_at timestamptz;
  v_duration integer;
  v_paused_seconds integer;
  v_rest_remaining integer;
  v_rest_paused boolean;
  v_current_exercise_index integer;
  v_calories integer;
  v_reps numeric;
  v_weight numeric;
  v_duration_minutes numeric;
  v_distance_km numeric;
  v_completed_at timestamptz;
  v_date date;
  v_weight_value numeric;
  v_days text[];
  v_routine_exercises jsonb;
  v_session_exercises jsonb;
  v_sets jsonb;
  v_default_sets jsonb;
  v_custom_ids text[] := array[]::text[];
  v_routine_ids text[] := array[]::text[];
  v_routine_exercise_ids text[];
  v_session_ids text[] := array[]::text[];
  v_session_exercise_ids text[];
  v_weight_dates date[] := array[]::date[];
  v_child_count integer;
  v_set_count integer;
  v_imported_status text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Login diperlukan untuk menyimpan progress.';
  end if;
  if p_state is null or pg_catalog.jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'State GYMFlow harus berupa objek JSON.';
  end if;
  if coalesce(pg_catalog.jsonb_typeof(p_state->'settings'), '') <> 'object'
     or coalesce(pg_catalog.jsonb_typeof(p_state->'exercises'), '') <> 'array'
     or coalesce(pg_catalog.jsonb_typeof(p_state->'routines'), '') <> 'array'
     or coalesce(pg_catalog.jsonb_typeof(p_state->'history'), '') <> 'array'
     or coalesce(pg_catalog.jsonb_typeof(p_state->'weightHistory'), '') <> 'array'
     or coalesce(pg_catalog.jsonb_typeof(p_state->'activeSession'), '') not in ('object', 'null') then
    raise exception using errcode = '22023', message = 'Struktur state GYMFlow tidak lengkap atau tidak valid.';
  end if;

  v_settings := p_state->'settings';
  v_exercises := p_state->'exercises';
  v_routines := p_state->'routines';
  v_history := p_state->'history';
  v_weights := p_state->'weightHistory';
  v_active := p_state->'activeSession';

  -- Profile and preferences.
  insert into public.profiles (user_id, display_name, age, height_value, weight_value)
  values (
    v_user_id,
    left(coalesce(nullif(btrim(v_settings->>'userName'), ''), 'GYMFlow User'), 80),
    nullif(v_settings->>'age', '')::smallint,
    nullif(v_settings->>'height', '')::numeric,
    nullif(v_settings->>'weight', '')::numeric
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    age = excluded.age,
    height_value = excluded.height_value,
    weight_value = excluded.weight_value;

  insert into public.user_settings (user_id, theme, rest_seconds, weekly_goal, language, height_unit, weight_unit)
  values (
    v_user_id,
    coalesce(v_settings->>'theme', 'dark'),
    coalesce(nullif(v_settings->>'restSeconds', '')::integer, 90),
    coalesce(nullif(v_settings->>'weeklyGoal', '')::smallint, 4),
    coalesce(v_settings->>'language', 'id'),
    coalesce(v_settings->>'heightUnit', 'cm'),
    coalesce(v_settings->>'weightUnit', 'kg')
  )
  on conflict (user_id) do update set
    theme = excluded.theme,
    rest_seconds = excluded.rest_seconds,
    weekly_goal = excluded.weekly_goal,
    language = excluded.language,
    height_unit = excluded.height_unit,
    weight_unit = excluded.weight_unit;

  -- Upsert custom exercises and remember their source IDs for safe snapshot reconciliation.
  for v_item, v_ord in
    select value, ordinality from pg_catalog.jsonb_array_elements(v_exercises) with ordinality
  loop
    if coalesce((v_item->>'isCustom')::boolean, false) then
      v_legacy_id := nullif(pg_catalog.btrim(v_item->>'id'), '');
      if v_legacy_id is null then
        raise exception using errcode = '22023', message = 'Exercise custom tanpa ID tidak bisa disimpan.';
      end if;
      v_muscle := v_item->>'muscle';
      v_equipment := coalesce(nullif(pg_catalog.btrim(v_item->>'equipment'), ''), 'Bodyweight');
      if v_muscle not in ('Cardio', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core') then
        raise exception using errcode = '22023', message = 'Target otot exercise custom tidak valid.';
      end if;
      insert into public.exercises (owner_id, legacy_id, name, muscle, equipment, is_builtin, legacy_payload)
      values (
        v_user_id, v_legacy_id,
        left(coalesce(nullif(pg_catalog.btrim(v_item->>'name'), ''), 'Custom Exercise'), 120),
        v_muscle, left(v_equipment, 80), false, v_item
      )
      on conflict (owner_id, legacy_id) where owner_id is not null and legacy_id is not null
      do update set
        name = excluded.name,
        muscle = excluded.muscle,
        equipment = excluded.equipment,
        legacy_payload = excluded.legacy_payload
      returning id into v_exercise_id;
      v_custom_ids := array_append(v_custom_ids, v_legacy_id);
    end if;
  end loop;

  -- Upsert routines and ordered exercise presets.
  for v_routine, v_ord in
    select value, ordinality from pg_catalog.jsonb_array_elements(v_routines) with ordinality
  loop
    v_legacy_id := coalesce(nullif(pg_catalog.btrim(v_routine->>'id'), ''), 'legacy-routine-' || v_ord::text);
    select coalesce(array_agg(d.value), array[]::text[]) into v_days
    from pg_catalog.jsonb_array_elements_text(coalesce(v_routine->'days', '[]'::jsonb)) as d(value)
    where d.value in ('Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min');

    insert into public.routines (user_id, legacy_id, name, description, days, sort_order, legacy_payload)
    values (
      v_user_id,
      v_legacy_id,
      left(coalesce(nullif(pg_catalog.btrim(v_routine->>'name'), ''), 'Workout Routine'), 50),
      left(coalesce(v_routine->>'description', ''), 140),
      coalesce(v_days, array[]::text[]),
      (v_ord - 1)::integer,
      v_routine
    )
    on conflict (user_id, legacy_id) where legacy_id is not null
    do update set
      name = excluded.name,
      description = excluded.description,
      days = excluded.days,
      sort_order = excluded.sort_order,
      legacy_payload = excluded.legacy_payload
    returning id into v_routine_id;
    v_routine_ids := array_append(v_routine_ids, v_legacy_id);
    v_routine_exercise_ids := array[]::text[];

    v_routine_exercises := case
      when pg_catalog.jsonb_typeof(v_routine->'exercises') = 'array' then v_routine->'exercises'
      else '[]'::jsonb
    end;

    -- Older routines may contain only exerciseIds. Rebuild the default set plan.
    if pg_catalog.jsonb_array_length(v_routine_exercises) = 0
       and pg_catalog.jsonb_typeof(v_routine->'exerciseIds') = 'array' then
      for v_legacy_exercise_id, v_sub_ord in
        select value, ordinality
        from pg_catalog.jsonb_array_elements_text(v_routine->'exerciseIds') with ordinality
      loop
        select e.muscle into v_muscle
        from public.exercises e
        where e.legacy_id = v_legacy_exercise_id and (e.is_builtin or e.owner_id = v_user_id)
        order by (e.owner_id = v_user_id) desc nulls last
        limit 1;
        v_default_sets := case when v_muscle = 'Cardio'
          then '[{"reps":15,"weight":2}]'::jsonb
          else '[{"reps":10,"weight":0},{"reps":10,"weight":0},{"reps":10,"weight":0}]'::jsonb end;
        v_routine_exercises := v_routine_exercises || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object('id', v_legacy_exercise_id, 'sets', v_default_sets)
        );
      end loop;
    end if;

    for v_routine_exercise, v_sub_ord in
      select value, ordinality from pg_catalog.jsonb_array_elements(v_routine_exercises) with ordinality
    loop
      if pg_catalog.jsonb_typeof(v_routine_exercise) = 'string' then
        v_legacy_exercise_id := v_routine_exercise #>> '{}';
      else
        v_legacy_exercise_id := coalesce(nullif(v_routine_exercise->>'id', ''), nullif(v_routine_exercise->>'exerciseId', ''));
      end if;
      if v_legacy_exercise_id is null then
        raise exception using errcode = '22023', message = 'Routine berisi exercise tanpa ID.';
      end if;

      select e.id, e.name, e.muscle, e.equipment into v_exercise_id, v_exercise_name, v_muscle, v_equipment
      from public.exercises e
      where e.legacy_id = v_legacy_exercise_id and (e.is_builtin or e.owner_id = v_user_id)
      order by (e.owner_id = v_user_id) desc nulls last
      limit 1;
      if v_exercise_name is null then
        select x.value->>'name', x.value->>'muscle', x.value->>'equipment'
        into v_exercise_name, v_muscle, v_equipment
        from pg_catalog.jsonb_array_elements(v_exercises) x(value)
        where x.value->>'id' = v_legacy_exercise_id
        limit 1;
      end if;
      v_exercise_name := left(coalesce(nullif(pg_catalog.btrim(v_exercise_name), ''), 'Exercise ' || v_legacy_exercise_id), 120);
      if v_muscle not in ('Cardio', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core') then v_muscle := null; end if;
      if v_equipment is not null and pg_catalog.length(pg_catalog.btrim(v_equipment)) not between 1 and 80 then v_equipment := null; end if;
      v_default_sets := case when pg_catalog.jsonb_typeof(v_routine_exercise->'sets') = 'array' then v_routine_exercise->'sets' else '[]'::jsonb end;
      v_legacy_id := 'routine-exercise:' || v_sub_ord::text;

      insert into public.routine_exercises (
        user_id, routine_id, legacy_id, exercise_id, legacy_exercise_id,
        exercise_name_snapshot, muscle_snapshot, equipment_snapshot, sort_order, default_sets, legacy_payload
      ) values (
        v_user_id, v_routine_id, v_legacy_id, v_exercise_id, v_legacy_exercise_id,
        v_exercise_name, v_muscle, v_equipment, (v_sub_ord - 1)::integer, v_default_sets,
        case when pg_catalog.jsonb_typeof(v_routine_exercise) = 'object' then v_routine_exercise else pg_catalog.jsonb_build_object('id', v_legacy_exercise_id, 'sets', v_default_sets) end
      )
      on conflict (routine_id, legacy_id) where legacy_id is not null
      do update set
        exercise_id = excluded.exercise_id,
        legacy_exercise_id = excluded.legacy_exercise_id,
        exercise_name_snapshot = excluded.exercise_name_snapshot,
        muscle_snapshot = excluded.muscle_snapshot,
        equipment_snapshot = excluded.equipment_snapshot,
        sort_order = excluded.sort_order,
        default_sets = excluded.default_sets,
        legacy_payload = excluded.legacy_payload;

      v_routine_exercise_ids := array_append(v_routine_exercise_ids, v_legacy_id);
    end loop;

    delete from public.routine_exercises re
    where re.user_id = v_user_id and re.routine_id = v_routine_id
      and (re.legacy_id is null or not (re.legacy_id = any(v_routine_exercise_ids)));
  end loop;

  -- Combine completed history and the optional active session into one stable snapshot.
  select coalesce(pg_catalog.jsonb_agg(value || pg_catalog.jsonb_build_object('__gymflow_sync_status', 'completed') order by ordinality), '[]'::jsonb)
  into v_sessions
  from pg_catalog.jsonb_array_elements(v_history) with ordinality;
  if pg_catalog.jsonb_typeof(v_active) = 'object' then
    v_sessions := v_sessions || pg_catalog.jsonb_build_array(v_active || pg_catalog.jsonb_build_object('__gymflow_sync_status', 'active'));
  end if;

  for v_session, v_ord in
    select value, ordinality from pg_catalog.jsonb_array_elements(v_sessions) with ordinality
  loop
    v_status := v_session->>'__gymflow_sync_status';
    v_session_legacy_id := coalesce(nullif(pg_catalog.btrim(v_session->>'id'), ''), 'legacy-session-' || v_ord::text);
    if v_session_legacy_id = any(v_session_ids) then
      raise exception using errcode = '22023', message = 'Ditemukan ID sesi workout yang duplikat.';
    end if;
    v_session_ids := array_append(v_session_ids, v_session_legacy_id);
    v_routine_legacy_id := nullif(pg_catalog.btrim(v_session->>'routineId'), '');
    select r.id into v_routine_id
    from public.routines r
    where r.user_id = v_user_id and r.legacy_id = v_routine_legacy_id
    limit 1;

    v_started_at := nullif(v_session->>'startedAt', '')::timestamptz;
    v_ended_at := nullif(v_session->>'endedAt', '')::timestamptz;
    v_paused_seconds := greatest(0, coalesce(nullif(v_session->>'pausedSeconds', '')::integer, 0));
    v_current_exercise_index := greatest(0, coalesce(nullif(v_session->>'currentExerciseIndex', '')::integer, 0));
    v_rest_remaining := case when nullif(v_session->>'restRemaining', '') is null then null else greatest(0, (v_session->>'restRemaining')::integer) end;
    v_rest_paused := coalesce((v_session->>'restPaused')::boolean, false);
    v_calories := greatest(0, coalesce(nullif(v_session->>'caloriesBurned', '')::integer, 0));
    if v_status = 'active' and v_started_at is not null then
      v_duration := greatest(0, extract(epoch from (pg_catalog.now() - v_started_at))::integer - v_paused_seconds);
    else
      v_duration := greatest(0, coalesce(nullif(v_session->>'duration', '')::numeric, 0)::integer);
    end if;

    insert into public.workout_sessions (
      user_id, legacy_id, routine_id, routine_legacy_id, routine_name_snapshot,
      status, started_at, ended_at, duration_seconds, paused_seconds,
      current_exercise_index, rest_remaining, rest_paused, calories_burned, stats, legacy_payload
    ) values (
      v_user_id, v_session_legacy_id, v_routine_id, v_routine_legacy_id,
      coalesce((select r.name from public.routines r where r.user_id = v_user_id and r.legacy_id = v_routine_legacy_id limit 1), nullif(v_session->>'routineName', ''), 'Workout'),
      case when v_status = 'active' then 'active' else 'completed' end,
      v_started_at, v_ended_at, v_duration, v_paused_seconds,
      v_current_exercise_index, v_rest_remaining, v_rest_paused, v_calories,
      case when pg_catalog.jsonb_typeof(v_session->'stats') = 'object' then v_session->'stats' else '{}'::jsonb end,
      v_session - '__gymflow_sync_status'
    )
    on conflict (user_id, legacy_id) where legacy_id is not null
    do update set
      routine_id = excluded.routine_id,
      routine_legacy_id = excluded.routine_legacy_id,
      routine_name_snapshot = excluded.routine_name_snapshot,
      status = excluded.status,
      started_at = excluded.started_at,
      ended_at = excluded.ended_at,
      duration_seconds = excluded.duration_seconds,
      paused_seconds = excluded.paused_seconds,
      current_exercise_index = excluded.current_exercise_index,
      rest_remaining = excluded.rest_remaining,
      rest_paused = excluded.rest_paused,
      calories_burned = excluded.calories_burned,
      stats = excluded.stats,
      legacy_payload = excluded.legacy_payload
    returning id into v_session_id;

    v_session_exercises := case
      when pg_catalog.jsonb_typeof(v_session->'exercises') = 'array' then v_session->'exercises'
      else '[]'::jsonb
    end;
    v_session_exercise_ids := array[]::text[];
    v_child_count := 0;

    for v_session_exercise, v_sub_ord in
      select value, ordinality from pg_catalog.jsonb_array_elements(v_session_exercises) with ordinality
    loop
      v_child_count := v_child_count + 1;
      if pg_catalog.jsonb_typeof(v_session_exercise) <> 'object' then
        raise exception using errcode = '22023', message = 'Detail exercise pada workout tidak valid.';
      end if;
      v_legacy_exercise_id := coalesce(nullif(v_session_exercise->>'exerciseId', ''), nullif(v_session_exercise->>'id', ''));
      select e.id, e.name, e.muscle, e.equipment into v_exercise_id, v_exercise_name, v_muscle, v_equipment
      from public.exercises e
      where e.legacy_id = v_legacy_exercise_id and (e.is_builtin or e.owner_id = v_user_id)
      order by (e.owner_id = v_user_id) desc nulls last
      limit 1;
      if v_exercise_name is null then
        select x.value->>'name', x.value->>'muscle', x.value->>'equipment'
        into v_exercise_name, v_muscle, v_equipment
        from pg_catalog.jsonb_array_elements(v_exercises) x(value)
        where x.value->>'id' = v_legacy_exercise_id
        limit 1;
      end if;
      v_exercise_name := left(coalesce(nullif(pg_catalog.btrim(v_exercise_name), ''), 'Exercise ' || coalesce(v_legacy_exercise_id, 'unknown')), 120);
      if v_muscle not in ('Cardio', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core') then v_muscle := null; end if;
      v_metric_type := case when v_muscle = 'Cardio' then 'cardio' else 'strength' end;
      v_legacy_id := 'session-exercise:' || v_sub_ord::text;

      insert into public.session_exercises (
        user_id, workout_session_id, legacy_id, exercise_id, legacy_exercise_id,
        exercise_name_snapshot, muscle_snapshot, equipment_snapshot, metric_type, notes, sort_order, legacy_payload
      ) values (
        v_user_id, v_session_id, v_legacy_id, v_exercise_id, v_legacy_exercise_id,
        v_exercise_name, v_muscle, v_equipment, v_metric_type,
        coalesce(v_session_exercise->>'notes', ''), (v_sub_ord - 1)::integer, v_session_exercise
      )
      on conflict (workout_session_id, legacy_id) where legacy_id is not null
      do update set
        exercise_id = excluded.exercise_id,
        legacy_exercise_id = excluded.legacy_exercise_id,
        exercise_name_snapshot = excluded.exercise_name_snapshot,
        muscle_snapshot = excluded.muscle_snapshot,
        equipment_snapshot = excluded.equipment_snapshot,
        metric_type = excluded.metric_type,
        notes = excluded.notes,
        sort_order = excluded.sort_order,
        legacy_payload = excluded.legacy_payload
      returning id into v_session_exercise_id;

      v_sets := case when pg_catalog.jsonb_typeof(v_session_exercise->'sets') = 'array' then v_session_exercise->'sets' else '[]'::jsonb end;
      v_set_count := 0;
      for v_set, v_sub_ord in
        select value, ordinality from pg_catalog.jsonb_array_elements(v_sets) with ordinality
      loop
        v_set_count := v_set_count + 1;
        v_reps := nullif(v_set->>'reps', '')::numeric;
        v_weight := nullif(v_set->>'weight', '')::numeric;
        v_completed_at := nullif(v_set->>'completedAt', '')::timestamptz;
        if v_metric_type = 'cardio' then
          v_duration_minutes := v_reps;
          v_distance_km := v_weight;
          v_reps := null;
          v_weight := null;
        else
          v_duration_minutes := null;
          v_distance_km := null;
        end if;
        insert into public.workout_sets (
          user_id, session_exercise_id, legacy_id, set_number,
          reps, weight_kg, duration_minutes, distance_km, completed_at, legacy_payload
        ) values (
          v_user_id, v_session_exercise_id, 'set:' || v_set_count::text, v_set_count,
          v_reps, v_weight, v_duration_minutes, v_distance_km, v_completed_at, v_set
        )
        on conflict (session_exercise_id, set_number)
        do update set
          legacy_id = excluded.legacy_id,
          reps = excluded.reps,
          weight_kg = excluded.weight_kg,
          duration_minutes = excluded.duration_minutes,
          distance_km = excluded.distance_km,
          completed_at = excluded.completed_at,
          legacy_payload = excluded.legacy_payload;
      end loop;
      delete from public.workout_sets ws
      where ws.user_id = v_user_id and ws.session_exercise_id = v_session_exercise_id
        and ws.set_number > v_set_count;
      v_session_exercise_ids := array_append(v_session_exercise_ids, v_legacy_id);
    end loop;

    delete from public.session_exercises se
    where se.user_id = v_user_id and se.workout_session_id = v_session_id
      and (se.legacy_id is null or not (se.legacy_id = any(v_session_exercise_ids)));
  end loop;

  -- Upsert the dated weight records. The UI stores one record per date.
  for v_item, v_ord in
    select value, ordinality from pg_catalog.jsonb_array_elements(v_weights) with ordinality
  loop
    v_date := (v_item->>'date')::date;
    v_weight_value := (v_item->>'weight')::numeric;
    v_weight_dates := array_append(v_weight_dates, v_date);
    insert into public.weight_records (user_id, legacy_id, record_date, weight_value, weight_unit, legacy_payload)
    values (
      v_user_id, 'weight:' || v_date::text, v_date, v_weight_value,
      coalesce(v_settings->>'weightUnit', 'kg'), v_item
    )
    on conflict (user_id, record_date)
    do update set
      legacy_id = excluded.legacy_id,
      weight_value = excluded.weight_value,
      weight_unit = excluded.weight_unit,
      legacy_payload = excluded.legacy_payload;
  end loop;

  -- Reconcile rows absent from the latest complete state, scoped only to auth.uid().
  delete from public.routines r
  where r.user_id = v_user_id and (r.legacy_id is null or not (r.legacy_id = any(v_routine_ids)));

  delete from public.workout_sessions s
  where s.user_id = v_user_id and (s.legacy_id is null or not (s.legacy_id = any(v_session_ids)));

  delete from public.weight_records w
  where w.user_id = v_user_id and not (w.record_date = any(v_weight_dates));

  delete from public.exercises e
  where e.owner_id = v_user_id and e.is_builtin = false
    and (e.legacy_id is null or not (e.legacy_id = any(v_custom_ids)));

  return pg_catalog.jsonb_build_object(
    'status', 'saved',
    'routines', pg_catalog.jsonb_array_length(v_routines),
    'completed_sessions', pg_catalog.jsonb_array_length(v_history),
    'has_active_session', pg_catalog.jsonb_typeof(v_active) = 'object',
    'weight_records', pg_catalog.jsonb_array_length(v_weights)
  );
end;
$$;

revoke all on function public.gymflow_save_state(jsonb) from public, anon;
grant execute on function public.gymflow_save_state(jsonb) to authenticated;

comment on function public.gymflow_get_state() is
  'Reads the authenticated user GYMFlow state in legacy Vanilla JS format; only auth.uid() data and shared built-in exercises are returned.';
comment on function public.gymflow_save_state(jsonb) is
  'Atomically saves a complete GYMFlow snapshot for auth.uid(); does not accept an owner ID from the browser.';

commit;
