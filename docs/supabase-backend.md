# Supabase Backend Configuration & Setup Guide

This document contains the complete database setup, security policies (RLS), and troubleshooting checklist for **A is Impossible**.

---

## 1. Official Preclinical Content Cloud Setup (Idempotent SQL Script)

Run the following SQL script in your **Supabase Dashboard → SQL Editor** (one time) to provision the cloud tables, indexes, RLS policies, and public PDF storage bucket for Official Lectures, Official Questions (all 6 types), Announcements, QA Feedback, and Admin Configuration.

```sql
-- ============================================================================
-- A IS IMPOSSIBLE: OFFICIAL PRECLINICAL CONTENT CLOUD SCHEMA
-- Idempotent setup: safe to run multiple times without data loss
-- ============================================================================

-- 1. Official Lectures Table
create table if not exists official_lectures (
  id text primary key,
  week_id text not null,
  module_slug text not null,
  subject_slug text not null,
  week_slug text not null,
  slug text not null,
  title text not null,
  description text default '',
  pdf_url text,
  pdf_page_count integer default 0,
  pdf_file_size_bytes bigint default 0,
  status text not null default 'published',
  display_order integer default 0,
  view_count integer default 0,
  pdf_view_count integer default 0,
  practice_questions_count integer default 0,
  university_exam_style_questions_count integer default 0,
  published_at bigint,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_official_lectures_module_subject 
  on official_lectures(module_slug, subject_slug, week_slug);
create index if not exists idx_official_lectures_status 
  on official_lectures(status);

-- 2. Official Questions Table (Unified 6 Question Types)
create table if not exists official_questions (
  id text primary key,
  lecture_id text not null references official_lectures(id) on delete cascade,
  version_type text not null default 'practice',
  type text not null default 'single_mcq',
  stem text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answers jsonb default '[]'::jsonb,
  matching_pairs jsonb,
  correct_order jsonb,
  case_vignette text,
  sub_questions jsonb,
  display_order integer default 0,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_official_questions_lecture_version 
  on official_questions(lecture_id, version_type);
create index if not exists idx_official_questions_type 
  on official_questions(type);

-- 3. Official Announcements Table
create table if not exists official_announcements (
  id text primary key,
  title text not null,
  body text not null,
  target_url text,
  is_active boolean not null default true,
  created_at bigint not null,
  expires_at bigint
);

create index if not exists idx_official_announcements_active 
  on official_announcements(is_active);

-- 4. Official Question Feedback (Student Dislikes & QA Queue)
create table if not exists official_question_feedback (
  id text primary key,
  user_id text not null,
  question_id text not null,
  lecture_id text not null,
  is_favorite boolean default false,
  is_disliked boolean default false,
  dislike_reason text,
  dislike_notes text,
  created_at bigint not null
);

create index if not exists idx_official_feedback_question 
  on official_question_feedback(question_id);
create index if not exists idx_official_feedback_disliked 
  on official_question_feedback(is_disliked);

-- 5. Official System Configuration Table
create table if not exists official_config (
  key text primary key,
  value jsonb not null,
  updated_at bigint not null
);

-- Seed default primary and secondary admin config
insert into official_config (key, value, updated_at)
values 
  ('secondary_admin_emails', '["abdalrahmanhani30@gmail.com"]'::jsonb, extract(epoch from now()) * 1000)
on conflict (key) do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Guarantee: 100% Guest Mode Equivalence (Public Read) + Admin Authoring
-- ============================================================================

alter table official_lectures enable row level security;
alter table official_questions enable row level security;
alter table official_announcements enable row level security;
alter table official_question_feedback enable row level security;
alter table official_config enable row level security;

-- Drop legacy policies if re-running
drop policy if exists "public_read_official_lectures" on official_lectures;
drop policy if exists "public_read_official_questions" on official_questions;
drop policy if exists "public_read_official_announcements" on official_announcements;
drop policy if exists "public_read_official_config" on official_config;
drop policy if exists "public_write_official_feedback" on official_question_feedback;
drop policy if exists "admin_write_official_lectures" on official_lectures;
drop policy if exists "admin_write_official_questions" on official_questions;
drop policy if exists "admin_write_official_announcements" on official_announcements;
drop policy if exists "admin_write_official_config" on official_config;

-- 1. Public Read (Guest & Authenticated Users)
create policy "public_read_official_lectures" 
  on official_lectures for select to anon, authenticated using (true);

create policy "public_read_official_questions" 
  on official_questions for select to anon, authenticated using (true);

create policy "public_read_official_announcements" 
  on official_announcements for select to anon, authenticated using (true);

create policy "public_read_official_config" 
  on official_config for select to anon, authenticated using (true);

-- 2. Student Feedback (All users can submit dislike and favorite reports)
create policy "public_write_official_feedback" 
  on official_question_feedback for all to anon, authenticated 
  using (true) with check (true);

-- 3. Admin Mutations (Authorized Administrator Accounts)
create policy "admin_write_official_lectures" 
  on official_lectures for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  );

create policy "admin_write_official_questions" 
  on official_questions for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  );

create policy "admin_write_official_announcements" 
  on official_announcements for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  );

create policy "admin_write_official_config" 
  on official_config for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (
      select 1 from official_config
      where key = 'secondary_admin_emails'
      and value ? (auth.jwt() ->> 'email')
    )
  );

-- ============================================================================
-- SUPABASE STORAGE BUCKET: official-pdfs
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('official-pdfs', 'official-pdfs', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_official_pdfs" on storage.objects;
drop policy if exists "admin_write_official_pdfs" on storage.objects;

create policy "public_read_official_pdfs" 
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'official-pdfs');

create policy "admin_write_official_pdfs" 
  on storage.objects for all to authenticated
  using (
    bucket_id = 'official-pdfs'
    and (
      auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
      or exists (
        select 1 from official_config
        where key = 'secondary_admin_emails'
        and value ? (auth.jwt() ->> 'email')
      )
    )
  )
  with check (
    bucket_id = 'official-pdfs'
    and (
      auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
      or exists (
        select 1 from official_config
        where key = 'secondary_admin_emails'
        and value ? (auth.jwt() ->> 'email')
      )
    )
  );
```

---

## 2. Personal User Decks & Settings Cloud Sync

The app is local-first by default. For authenticated user account synchronization across devices, ensure the user tables and RLS are enabled:

```sql
alter table decks enable row level security;
alter table questions enable row level security;
alter table user_question_statuses enable row level security;
alter table profiles enable row level security;

drop policy if exists "own rows" on decks;
create policy "own rows" on decks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on questions;
create policy "own rows" on questions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on user_question_statuses;
create policy "own rows" on user_question_statuses for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Composite unique indexes for fast batch upsert
create unique index if not exists decks_id_user_id on decks (id, user_id);
create unique index if not exists questions_id_user_id on questions (id, user_id);
create unique index if not exists statuses_id_user_id on user_question_statuses (id, user_id);
```

---

## 3. Fail-Closed & Offline-First Guarantees

1. **Guest Mode Equivalence:** Any student device opening the application without logging in immediately fetches and caches all published Official Lectures, Questions, PDFs, and Announcements from Supabase via `anon` access.
2. **Offline Immunity:** All fetched official data is written directly to local `IndexedDB` and `localStorage`. If an internet connection drops or the device goes into airplane mode during a study session, the curriculum remains 100% accessible.
3. **Fail-Closed Protection:** If a network query fails, local data is never overwritten or deleted.
