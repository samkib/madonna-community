# Madonna Community

A resident portal for a 114-unit residential estate — announcements, a
notice board, maintenance requests, complaints, and suggestions.
React + Vite + Tailwind CSS on the frontend, Supabase for auth, database,
and row-level security. **No mock data anywhere** — every screen reads
and writes real Supabase tables, and shows a friendly empty state when a
table has no rows yet.

## Roles

- **Resident** — submit maintenance requests, complaints, suggestions; read announcements and the notice board.
- **Caretaker** — everything a resident can read, plus manage maintenance/complaints/suggestions and post announcements.
- **Chairperson** — everything a caretaker can do, plus manage units and add/remove residents.
- **Landlady** — full access to everything above.

## 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then grab your
Project URL and anon public key from **Project Settings → API**.

## 2. Set up the database

Open the **SQL Editor** in your Supabase project and run the contents of
[`supabase/schema.sql`](./supabase/schema.sql). This creates all seven
tables (`profiles`, `units`, `maintenance_requests`, `complaints`,
`suggestions`, `announcements`, `notice_board`), the role-based Row Level
Security policies, and a trigger that copies an announcement onto the
notice board the moment it's archived.

## 3. Deploy the `create-resident` Edge Function

Adding a resident needs to create a real Supabase Auth account, which the
browser can never be trusted to do directly (that requires the service
role key). Instead, the "Add resident" form calls a small Edge Function
that does it server-side.

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy create-resident
```

The function reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` — Supabase sets these automatically for
deployed functions, so no extra configuration is needed.

## 4. Create your first landlady account

There's no public sign-up screen — accounts are created from inside the
app by a chairperson or landlady, which means the very first account has
to be bootstrapped by hand:

1. In the Supabase Dashboard, go to **Authentication → Users → Add user** and create yourself an account.
2. Copy that user's UUID.
3. In the SQL Editor, run:
   ```sql
   insert into public.profiles (id, full_name, email, phone, role)
   values ('paste-the-uuid-here', 'Your Name', 'you@example.com', '07XXXXXXXX', 'landlady');
   ```
4. Sign in with that account — from there you can add units and residents from the **Units & Residents** page.

## 5. Run the app locally

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Project structure

```
src/
  context/       AuthContext (session + profile), ThemeContext (light/dark)
  components/    Sidebar, TopBar, Layout, Modal, EmptyState, UnitPlaque, StatusBadge…
  pages/         Login, Dashboard, Announcements, NoticeBoard,
                 MaintenanceRequests, Complaints, Suggestions, Units, Settings
  lib/           supabaseClient.js
supabase/
  schema.sql                        tables, RLS policies, archive trigger
  functions/create-resident/        Edge Function for admin account creation
```

## Notes

- There is intentionally no rent, lease, payments, invoices, tenants, or
  finance module — this system is scoped to residents, units,
  communication, maintenance, complaints, suggestions, and announcements.
- `AuthContext.jsx` normalizes the `profiles.full_name` database column
  to `user.name` in one place, so every dashboard greeting and sidebar
  label reads the same field consistently.
- Every dashboard statistic (pending maintenance, occupied/vacant units,
  etc.) is a live Supabase count query — nothing is hardcoded.
