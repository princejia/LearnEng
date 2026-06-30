-- ============================================================
-- 小学初中英语拆句填空 · Supabase 数据库初始化脚本
-- 在 Supabase 控制台 → SQL Editor 中整段执行
-- ============================================================

-- ---------- 1. 题库相关表 ----------

create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  chinese     text not null,
  english     text not null,
  audio_url   text,
  grade       smallint not null,        -- 6/7/8/9
  unit        smallint,
  topic       text,                     -- 逗号分隔的话题 key，如 "school,daily"
  difficulty  smallint default 1,       -- 1=基础 2=进阶
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists question_blanks (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid references questions(id) on delete cascade,
  blank_index   smallint not null,
  answer        text not null,
  display_order smallint not null
);
create index if not exists idx_blanks_question on question_blanks(question_id);

create table if not exists topics (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  label text not null
);

-- ---------- 2. 用户进度相关表 ----------

create table if not exists practice_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id),  -- null = 游客
  filter_grade  smallint,
  filter_unit   smallint,
  filter_topic  text,
  mode          text default 'fill_blank',
  started_at    timestamptz default now(),
  finished_at   timestamptz,
  total_count   int,
  correct_count int default 0
);

create table if not exists answer_records (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references practice_sessions(id) on delete cascade,
  question_id   uuid references questions(id),
  user_answer   text[],
  is_correct    boolean,
  hint_used     boolean default false,
  marked_status text default 'none',
  answered_at   timestamptz default now(),
  unique(session_id, question_id)        -- 支持按题 upsert
);
create index if not exists idx_answers_session on answer_records(session_id);

create table if not exists wrong_questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  question_id uuid references questions(id),
  count       int default 1,
  last_wrong  timestamptz default now(),
  unique(user_id, question_id)
);

create table if not exists daily_hint_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id),
  date       date default current_date,
  used_count int default 0,
  unique(user_id, date)
);

-- ---------- 3. RLS 策略 ----------
-- 注意：服务端使用 Service Role Key 访问会绕过 RLS（游客练习流程依赖此特性）。

alter table questions enable row level security;
drop policy if exists "public read questions" on questions;
create policy "public read questions" on questions for select using (true);

alter table topics enable row level security;
drop policy if exists "public read topics" on topics;
create policy "public read topics" on topics for select using (true);

alter table question_blanks enable row level security;
drop policy if exists "public read blanks" on question_blanks;
create policy "public read blanks" on question_blanks for select using (true);

alter table answer_records enable row level security;
drop policy if exists "owner answers" on answer_records;
create policy "owner answers" on answer_records for all
  using (
    session_id in (select id from practice_sessions where user_id = auth.uid())
  );

alter table practice_sessions enable row level security;
drop policy if exists "owner sessions" on practice_sessions;
create policy "owner sessions" on practice_sessions for all
  using (user_id = auth.uid() or user_id is null);

-- ---------- 4. 话题种子数据 ----------

insert into topics (name, label) values
  ('family', '家庭'),
  ('school', '学校'),
  ('travel', '旅行'),
  ('daily',  '日常生活'),
  ('tech',   '科技'),
  ('study',  '学习')
on conflict (name) do nothing;
