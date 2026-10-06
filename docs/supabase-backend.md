# Supabase backend checklist — when devices do not sync

The app degrades silently by design (local-first), so a broken backend
looks like "sync does nothing". Since the last client update, failures
surface in two places instead of hiding in the console:

- Navbar account pill turns **amber** with the backend message in its tooltip.
- Account dialog (click the pill) lists backend warnings under Last Synced.

## If warnings mention RLS / policies / permission denied

Run this in the Supabase dashboard → SQL editor (one time). It grants each
signed-in user full access to **their own rows only**:

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
```

## If warnings mention constraints / ON CONFLICT / unique

The client already retries those upserts against the primary key, so sync
recovers on its own. For full speed, add the composite indexes:

```sql
create unique index if not exists decks_id_user_id
  on decks (id, user_id);
create unique index if not exists questions_id_user_id
  on questions (id, user_id);
create unique index if not exists statuses_id_user_id
  on user_question_statuses (id, user_id);
```

## After fixing the backend

On each device: open the account dialog → **Sync Cloud Now**. The amber
dot clears on the first clean sync. Verify: create a deck on device A,
force-sync, sign in on device B — it downloads on login automatically.

## Fail-closed guarantee

If any cloud read fails (denied table, flaky network), the sync aborts
BEFORE uploading anything or touching local data, and the reason appears
in the account dialog. A denied backend can therefore never be mistaken
for an empty cloud, and can never clobber good data in either direction.
