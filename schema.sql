-- ================================================================
-- BER CAN'T PREMIUM COACHING — SUPABASE ŞEMASI
-- Supabase > SQL Editor içinde tek seferde çalıştırın.
-- ================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student','coach','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.gender_type as enum ('male','female','unspecified');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.goal_type as enum ('fat_loss','muscle_gain','recomposition','performance');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.level_type as enum ('beginner','intermediate','advanced');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.photo_view_type as enum ('front','side','back','other');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default 'Yeni Sporcu',
  gender public.gender_type not null default 'unspecified',
  role public.app_role not null default 'student',
  goal public.goal_type not null default 'recomposition',
  birth_date date,
  height_cm numeric(5,1) check (height_cm between 100 and 250),
  current_weight numeric(5,1) check (current_weight between 20 and 400),
  target_weight numeric(5,1) check (target_weight between 20 and 400),
  avatar_url text,
  coach_id uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  membership_start date,
  membership_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  workout_done boolean not null default false,
  split text check (char_length(split) <= 60),
  total_sets integer not null default 0 check (total_sets between 0 and 100),
  main_lift text check (char_length(main_lift) <= 80),
  main_lift_kg numeric(6,1) check (main_lift_kg between 0 and 1000),
  rpe numeric(3,1) check (rpe between 1 and 10),
  cardio_minutes integer not null default 0 check (cardio_minutes between 0 and 500),
  steps integer not null default 0 check (steps between 0 and 100000),
  calories integer not null default 0 check (calories between 0 and 10000),
  protein_g integer not null default 0 check (protein_g between 0 and 1000),
  carbs_g integer not null default 0 check (carbs_g between 0 and 1500),
  fat_g integer not null default 0 check (fat_g between 0 and 500),
  water_l numeric(4,1) not null default 0 check (water_l between 0 and 15),
  sleep_hours numeric(4,1) not null default 0 check (sleep_hours between 0 and 24),
  energy smallint check (energy between 1 and 5),
  mood smallint check (mood between 1 and 5),
  pump smallint check (pump between 1 and 5),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(5,1) not null check (weight_kg between 20 and 400),
  body_fat_percent numeric(4,1) check (body_fat_percent between 2 and 70),
  chest_cm numeric(5,1) check (chest_cm between 30 and 250),
  waist_cm numeric(5,1) check (waist_cm between 30 and 250),
  hips_cm numeric(5,1) check (hips_cm between 30 and 250),
  arm_cm numeric(4,1) check (arm_cm between 10 and 100),
  thigh_cm numeric(5,1) check (thigh_cm between 20 and 150),
  notes text check (char_length(notes) <= 800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, measured_at)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 120),
  description text,
  level public.level_type not null default 'beginner',
  gender_target public.gender_type,
  is_template boolean not null default true,
  coach_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  day_index integer not null check (day_index between 1 and 14),
  title text not null check (char_length(title) <= 100),
  notes text,
  unique(program_id, day_index)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  order_no integer not null default 1,
  name text not null check (char_length(name) <= 120),
  sets integer check (sets between 1 and 20),
  reps text check (char_length(reps) <= 30),
  rir text check (char_length(rir) <= 20),
  rest_seconds integer check (rest_seconds between 0 and 900),
  tempo text check (char_length(tempo) <= 30),
  video_url text,
  notes text,
  unique(program_day_id, order_no)
);

create table if not exists public.program_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1200),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_date date not null default current_date,
  view_type public.photo_view_type not null default 'other',
  storage_path text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_logs_user_date on public.daily_logs(user_id, log_date desc);
create index if not exists idx_measurements_user_date on public.measurements(user_id, measured_at desc);
create index if not exists idx_profiles_coach on public.profiles(coach_id);
create index if not exists idx_assignments_user_active on public.program_assignments(user_id, active);
create index if not exists idx_messages_user_created on public.coach_messages(user_id, created_at desc);
create index if not exists idx_photos_user_date on public.progress_photos(user_id, photo_date desc);

-- ----------------------------------------------------------------
-- Yardımcı fonksiyonlar
-- ----------------------------------------------------------------
create or replace function public.current_user_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function public.is_coach_or_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select coalesce(public.current_user_role() in ('coach','admin'), false); $$;

create or replace function public.can_manage(target_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'coach' and exists (
      select 1 from public.profiles p where p.id = target_user and p.coach_id = auth.uid()
    )), false
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_logs_updated on public.daily_logs;
create trigger trg_logs_updated before update on public.daily_logs for each row execute function public.set_updated_at();
drop trigger if exists trg_measurements_updated on public.measurements;
create trigger trg_measurements_updated before update on public.measurements for each row execute function public.set_updated_at();
drop trigger if exists trg_programs_updated on public.programs;
create trigger trg_programs_updated before update on public.programs for each row execute function public.set_updated_at();

-- Öğrencinin rol/üyelik gibi yetkili alanları değiştirmesini önler.
create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and not public.is_coach_or_admin() then
    new.role := old.role;
    new.coach_id := old.coach_id;
    new.active := old.active;
    new.membership_start := old.membership_start;
    new.membership_end := old.membership_end;
  end if;
  return new;
end; $$;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before update on public.profiles for each row execute function public.protect_profile_privileged_fields();

-- Auth kullanıcısı oluşunca profil açar.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name,gender,goal)
  values(
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Yeni Sporcu'),
    case when new.raw_user_meta_data->>'gender' in ('male','female','unspecified') then (new.raw_user_meta_data->>'gender')::public.gender_type else 'unspecified' end,
    case when new.raw_user_meta_data->>'goal' in ('fat_loss','muscle_gain','recomposition','performance') then (new.raw_user_meta_data->>'goal')::public.goal_type else 'recomposition' end
  ) on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.exercises enable row level security;
alter table public.program_assignments enable row level security;
alter table public.coach_messages enable row level security;
alter table public.progress_photos enable row level security;

-- Profiller
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
using (id = auth.uid() or public.can_manage(id));
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
using (id = auth.uid() or public.can_manage(id)) with check (id = auth.uid() or public.can_manage(id));

-- Günlük kayıtlar
drop policy if exists "logs_select" on public.daily_logs;
create policy "logs_select" on public.daily_logs for select to authenticated using (user_id = auth.uid() or public.can_manage(user_id));
drop policy if exists "logs_insert" on public.daily_logs;
create policy "logs_insert" on public.daily_logs for insert to authenticated with check (user_id = auth.uid() or public.can_manage(user_id));
drop policy if exists "logs_update" on public.daily_logs;
create policy "logs_update" on public.daily_logs for update to authenticated using (user_id = auth.uid() or public.can_manage(user_id)) with check (user_id = auth.uid() or public.can_manage(user_id));
drop policy if exists "logs_delete" on public.daily_logs;
create policy "logs_delete" on public.daily_logs for delete to authenticated using (user_id = auth.uid() or public.can_manage(user_id));

-- Ölçümler
drop policy if exists "measurements_select" on public.measurements;
create policy "measurements_select" on public.measurements for select to authenticated using (user_id = auth.uid() or public.can_manage(user_id));
drop policy if exists "measurements_insert" on public.measurements;
create policy "measurements_insert" on public.measurements for insert to authenticated with check (user_id = auth.uid() or public.can_manage(user_id));
drop policy if exists "measurements_update" on public.measurements;
create policy "measurements_update" on public.measurements for update to authenticated using (user_id = auth.uid() or public.can_manage(user_id)) with check (user_id = auth.uid() or public.can_manage(user_id));
drop policy if exists "measurements_delete" on public.measurements;
create policy "measurements_delete" on public.measurements for delete to authenticated using (user_id = auth.uid() or public.can_manage(user_id));

-- Programlar ve içerikleri
drop policy if exists "programs_select" on public.programs;
create policy "programs_select" on public.programs for select to authenticated
using (is_template or public.is_coach_or_admin() or exists(select 1 from public.program_assignments a where a.program_id=id and a.user_id=auth.uid() and a.active));
drop policy if exists "programs_manage" on public.programs;
create policy "programs_manage" on public.programs for all to authenticated using (public.is_coach_or_admin()) with check (public.is_coach_or_admin());

drop policy if exists "program_days_select" on public.program_days;
create policy "program_days_select" on public.program_days for select to authenticated
using (exists(select 1 from public.programs p where p.id=program_id and (p.is_template or public.is_coach_or_admin() or exists(select 1 from public.program_assignments a where a.program_id=p.id and a.user_id=auth.uid() and a.active))));
drop policy if exists "program_days_manage" on public.program_days;
create policy "program_days_manage" on public.program_days for all to authenticated using (public.is_coach_or_admin()) with check (public.is_coach_or_admin());

drop policy if exists "exercises_select" on public.exercises;
create policy "exercises_select" on public.exercises for select to authenticated
using (exists(select 1 from public.program_days d join public.programs p on p.id=d.program_id where d.id=program_day_id and (p.is_template or public.is_coach_or_admin() or exists(select 1 from public.program_assignments a where a.program_id=p.id and a.user_id=auth.uid() and a.active))));
drop policy if exists "exercises_manage" on public.exercises;
create policy "exercises_manage" on public.exercises for all to authenticated using (public.is_coach_or_admin()) with check (public.is_coach_or_admin());

-- Program atamaları
drop policy if exists "assignments_select" on public.program_assignments;
create policy "assignments_select" on public.program_assignments for select to authenticated using (user_id=auth.uid() or public.can_manage(user_id));
drop policy if exists "assignments_manage" on public.program_assignments;
create policy "assignments_manage" on public.program_assignments for all to authenticated using (public.can_manage(user_id) or public.current_user_role()='admin') with check (public.can_manage(user_id) or public.current_user_role()='admin');

-- Koç mesajları
drop policy if exists "messages_select" on public.coach_messages;
create policy "messages_select" on public.coach_messages for select to authenticated using (user_id=auth.uid() or coach_id=auth.uid() or public.can_manage(user_id));
drop policy if exists "messages_insert" on public.coach_messages;
create policy "messages_insert" on public.coach_messages for insert to authenticated with check (public.is_coach_or_admin() and (coach_id=auth.uid() or public.current_user_role()='admin') and public.can_manage(user_id));
drop policy if exists "messages_update" on public.coach_messages;
create policy "messages_update" on public.coach_messages for update to authenticated using (user_id=auth.uid() or coach_id=auth.uid() or public.can_manage(user_id));

-- Fotoğraf metadatası
drop policy if exists "photos_select" on public.progress_photos;
create policy "photos_select" on public.progress_photos for select to authenticated using (user_id=auth.uid() or public.can_manage(user_id));
drop policy if exists "photos_insert" on public.progress_photos;
create policy "photos_insert" on public.progress_photos for insert to authenticated with check (user_id=auth.uid() or public.can_manage(user_id));
drop policy if exists "photos_delete" on public.progress_photos;
create policy "photos_delete" on public.progress_photos for delete to authenticated using (user_id=auth.uid() or public.can_manage(user_id));

-- ----------------------------------------------------------------
-- Storage: özel ilerleme fotoğrafları
-- ----------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('progress-photos','progress-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "photo_objects_insert" on storage.objects;
create policy "photo_objects_insert" on storage.objects for insert to authenticated
with check (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "photo_objects_select" on storage.objects;
create policy "photo_objects_select" on storage.objects for select to authenticated
using (bucket_id='progress-photos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.profiles p where p.id::text=(storage.foldername(name))[1] and public.can_manage(p.id))));

drop policy if exists "photo_objects_delete" on storage.objects;
create policy "photo_objects_delete" on storage.objects for delete to authenticated
using (bucket_id='progress-photos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.profiles p where p.id::text=(storage.foldername(name))[1] and public.can_manage(p.id))));

-- API izinleri
grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;

-- ----------------------------------------------------------------
-- Örnek program şablonları
-- ----------------------------------------------------------------
insert into public.programs(id,title,description,level,gender_target,is_template)
values
('11111111-1111-4111-8111-111111111111','Foundation 4','Temel hareket kalitesi ve düzen oluşturma programı.','beginner',null,true),
('22222222-2222-4222-8222-222222222222','Hybrid Strength 8','Kas gelişimi ve kondisyon odaklı 8 haftalık plan.','intermediate',null,true),
('33333333-3333-4333-8333-333333333333','Transformation 12','Uzun dönem yağ kaybı, kuvvet ve alışkanlık yönetimi.','intermediate',null,true)
on conflict(id) do nothing;

insert into public.program_days(id,program_id,day_index,title) values
('21111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',1,'Full Body A'),
('21111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111',2,'Full Body B'),
('22222222-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',1,'Push — Güç'),
('22222222-1111-4111-8111-111111111112','22222222-2222-4222-8222-222222222222',2,'Pull — Yoğunluk'),
('22222222-1111-4111-8111-111111111113','22222222-2222-4222-8222-222222222222',3,'Legs — Performans'),
('23333333-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',1,'Upper'),
('23333333-1111-4111-8111-111111111112','33333333-3333-4333-8333-333333333333',2,'Lower')
on conflict(id) do nothing;

insert into public.exercises(program_day_id,order_no,name,sets,reps,rir,rest_seconds) values
('21111111-1111-4111-8111-111111111111',1,'Goblet Squat',3,'10-12','2',90),
('21111111-1111-4111-8111-111111111111',2,'Chest Press',3,'10-12','2',90),
('21111111-1111-4111-8111-111111111111',3,'Lat Pulldown',3,'10-12','2',90),
('21111111-1111-4111-8111-111111111111',4,'Leg Curl',3,'12-15','1-2',60),
('21111111-1111-4111-8111-111111111112',1,'Leg Press',3,'10-12','2',90),
('21111111-1111-4111-8111-111111111112',2,'Seated Row',3,'10-12','2',90),
('21111111-1111-4111-8111-111111111112',3,'Shoulder Press',3,'10-12','2',90),
('21111111-1111-4111-8111-111111111112',4,'Cable Curl',2,'12-15','1',60),
('22222222-1111-4111-8111-111111111111',1,'Incline Bench Press',4,'6-8','1-2',120),
('22222222-1111-4111-8111-111111111111',2,'Machine Chest Press',3,'8-10','1',90),
('22222222-1111-4111-8111-111111111111',3,'Lateral Raise',4,'12-15','0-1',60),
('22222222-1111-4111-8111-111111111111',4,'Rope Pushdown',3,'10-12','1',60),
('22222222-1111-4111-8111-111111111112',1,'Lat Pulldown',4,'8-10','1',90),
('22222222-1111-4111-8111-111111111112',2,'Chest Supported Row',4,'8-10','1',90),
('22222222-1111-4111-8111-111111111112',3,'Rear Delt Fly',3,'12-15','0-1',60),
('22222222-1111-4111-8111-111111111112',4,'Cable Curl',3,'10-12','1',60),
('22222222-1111-4111-8111-111111111113',1,'Hack Squat',4,'6-8','1-2',150),
('22222222-1111-4111-8111-111111111113',2,'Romanian Deadlift',3,'8-10','1',120),
('22222222-1111-4111-8111-111111111113',3,'Leg Extension',3,'12-15','0-1',60),
('22222222-1111-4111-8111-111111111113',4,'Seated Leg Curl',3,'10-12','1',60),
('23333333-1111-4111-8111-111111111111',1,'Smith Incline Press',3,'6-8','1',120),
('23333333-1111-4111-8111-111111111111',2,'Wide Grip Row',3,'8-10','1',90),
('23333333-1111-4111-8111-111111111111',3,'Shoulder Press',3,'8-10','1',90),
('23333333-1111-4111-8111-111111111112',1,'Leg Press',4,'8-10','1',120),
('23333333-1111-4111-8111-111111111112',2,'Romanian Deadlift',3,'8-10','1',120),
('23333333-1111-4111-8111-111111111112',3,'Walking Lunge',3,'10/10','1',90)
on conflict(program_day_id,order_no) do nothing;

-- ================================================================
-- İLK ADMIN HESABI
-- 1) Önce site üzerinden veya Supabase Authentication > Users'tan kullanıcı açın.
-- 2) Aşağıdaki komutta e-postayı değiştirip çalıştırın:
-- update public.profiles set role='admin' where email='SIZIN-ADMIN-EPOSTANIZ';
-- ================================================================
