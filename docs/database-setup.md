# Database setup

This intake project shares its Supabase project with **Bounce_the_pound_pms**
(`ferfjikgycinziceawbt`) — the same project that backs the PMS app's `clients`
table. The submit path (`src/lib/intake.functions.ts`) writes an audit row to
`intake_submissions` and then upserts directly into `clients`, so both tables
must exist in that one project.

The full schema (both `clients` and `intake_submissions`, plus everything
else the PMS app needs) lives in
`Bounce_the_pound_pms/supabase/migrations/20260903000000_bounce_the_pound_baseline_and_intake.sql`.
Run **that file only** once in the Supabase SQL editor for the
`ferfjikgycinziceawbt` project — it supersedes every other file in that
folder (see the comment at the top of that migration for why).

The `intake_submissions` table it creates:

```sql
create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  branch text not null check (branch in ('female','male','child')),
  age integer check (age >= 0 and age <= 120),
  dob date,

  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (char_length(phone) <= 32),
  email text check (char_length(email) <= 254),
  city text check (char_length(city) <= 120),

  guardian_name text check (char_length(guardian_name) <= 120),
  guardian_relationship text check (char_length(guardian_relationship) <= 60),
  guardian_phone text check (char_length(guardian_phone) <= 32),
  guardian_email text check (char_length(guardian_email) <= 254),

  payload jsonb not null default '{}'::jsonb,

  pms_lead_id text,
  pms_status text not null default 'pending'
    check (pms_status in ('pending','sent','failed','duplicate_merged')),
  pms_error text,
  pms_attempts integer not null default 0,
  pms_sent_at timestamptz,

  constraint contact_required check (
    (phone is not null and char_length(phone) > 0)
    or (email is not null and char_length(email) > 0)
    or (guardian_phone is not null and char_length(guardian_phone) > 0)
  )
);
```

`upsertClient()` in `intake.functions.ts` maps a subset of the intake payload
onto `clients` columns (name, date_of_birth, address, gender, weight, height,
goal, diet_preference, health_conditions, phone, email) — see the `GOAL_MAP`
/ `DIET_PREFERENCE_MAP` tables in that file for how the intake form's enums
translate to the PMS's option lists. Everything else the form collects
(symptoms, lifestyle, detailed medical history, etc.) has no matching PMS
column, so it's kept in `intake_submissions.payload` and viewable from the
Clients page via the eye icon next to each client's name.

RLS on `intake_submissions` only allows `authenticated` (PMS staff) to
`SELECT`; the intake form's own inserts go through the service-role key
below and bypass RLS entirely, so no `anon` policy is needed.

## Required secrets (set in this Lovable project)

These are server-only and must NOT have a `VITE_` prefix:

- `INTAKE_SUPABASE_SERVICE_KEY` — service role key from the same Supabase project.
  Needed so the server can update `pms_lead_id`, `pms_status`, etc. on the
  submission row after forwarding to the PMS. (Without it, inserts still
  succeed via the anon role but sync columns won't update.)
- `PMS_EDGE_URL` / `PMS_EDGE_KEY` — only used by the legacy curl-testable
  mirror route (`src/routes/api/public/intake.ts`), not by the main submit
  path. Bounce The Pound has no such edge function, so these are left blank.
- `ADMIN_RETRY_TOKEN` — random token to authorize manual retries.
