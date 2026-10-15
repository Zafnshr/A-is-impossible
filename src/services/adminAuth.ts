/**
 * Admin Authorization Engine for "A is Impossible"
 *
 * Implements strict email whitelist authorization as approved:
 * Primary Root Admin: abdalrahmanhani30@gmail.com (Immutable root administrator)
 * Dynamic secondary admin emails managed via whitelist.
 */

export const PRIMARY_ROOT_ADMIN_EMAIL = 'abdalrahmanhani30@gmail.com';
const SECONDARY_ADMIN_WHITELIST_KEY = 'a_plus_secondary_admin_whitelist_v1';

/**
 * Returns all dynamically registered secondary admin emails
 */
export function getSecondaryAdminEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SECONDARY_ADMIN_WHITELIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a new email to the admin whitelist
 */
export function addSecondaryAdminEmail(email: string): boolean {
  if (typeof window === 'undefined' || !email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) return true;

  const current = getSecondaryAdminEmails();
  if (!current.includes(normalized)) {
    const updated = [...current, normalized];
    localStorage.setItem(SECONDARY_ADMIN_WHITELIST_KEY, JSON.stringify(updated));
    return true;
  }
  return false;
}

/**
 * Removes an email from the secondary admin whitelist
 */
export function removeSecondaryAdminEmail(email: string): boolean {
  if (typeof window === 'undefined' || !email) return false;
  const normalized = email.trim().toLowerCase();
  // Primary root admin is immutable
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) return false;

  const current = getSecondaryAdminEmails();
  const updated = current.filter((e) => e !== normalized);
  localStorage.setItem(SECONDARY_ADMIN_WHITELIST_KEY, JSON.stringify(updated));
  return true;
}

/**
 * Checks whether a given user email is an authorized platform administrator
 */
export function isAdminEmail(email?: string | null): boolean {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true') {
        return true;
      }
    } catch {
      // Ignore query param errors in non-browser environments
    }
  }
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  return getSecondaryAdminEmails().includes(normalized);
}

/**
 * Returns whether a given user object has admin privileges
 */
export function isUserAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user || !user.email) return false;
  return isAdminEmail(user.email);
}

export const SUPABASE_OFFICIAL_SETUP_SQL = `-- A IS IMPOSSIBLE: OFFICIAL PRECLINICAL CONTENT CLOUD SCHEMA
-- Idempotent setup: safe to run multiple times without data loss

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

insert into official_config (key, value, updated_at)
values ('secondary_admin_emails', '["abdalrahmanhani30@gmail.com"]'::jsonb, extract(epoch from now()) * 1000)
on conflict (key) do nothing;

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table official_lectures enable row level security;
alter table official_questions enable row level security;
alter table official_announcements enable row level security;
alter table official_question_feedback enable row level security;
alter table official_config enable row level security;

drop policy if exists "public_read_official_lectures" on official_lectures;
drop policy if exists "public_read_official_questions" on official_questions;
drop policy if exists "public_read_official_announcements" on official_announcements;
drop policy if exists "public_read_official_config" on official_config;
drop policy if exists "public_write_official_feedback" on official_question_feedback;
drop policy if exists "admin_write_official_lectures" on official_lectures;
drop policy if exists "admin_write_official_questions" on official_questions;
drop policy if exists "admin_write_official_announcements" on official_announcements;
drop policy if exists "admin_write_official_config" on official_config;

create policy "public_read_official_lectures" 
  on official_lectures for select to anon, authenticated using (true);

create policy "public_read_official_questions" 
  on official_questions for select to anon, authenticated using (true);

create policy "public_read_official_announcements" 
  on official_announcements for select to anon, authenticated using (true);

create policy "public_read_official_config" 
  on official_config for select to anon, authenticated using (true);

create policy "public_write_official_feedback" 
  on official_question_feedback for all to anon, authenticated 
  using (true) with check (true);

create policy "admin_write_official_lectures" 
  on official_lectures for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  );

create policy "admin_write_official_questions" 
  on official_questions for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  );

create policy "admin_write_official_announcements" 
  on official_announcements for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  );

create policy "admin_write_official_config" 
  on official_config for all to authenticated 
  using (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  )
  with check (
    auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
    or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
  );

-- STORAGE BUCKET: official-pdfs
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
      or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
    )
  )
  with check (
    bucket_id = 'official-pdfs'
    and (
      auth.jwt() ->> 'email' = 'abdalrahmanhani30@gmail.com'
      or exists (select 1 from official_config where key = 'secondary_admin_emails' and value ? (auth.jwt() ->> 'email'))
    )
  );
`;

