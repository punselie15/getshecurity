-- getshecurity.com "Your voice counts" box. Visitors can only add an idea, never read them.
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  topic text not null default 'app' check (topic in ('app', 'jewelry', 'other')),
  message text not null check (length(btrim(message)) between 3 and 1000),
  created_at timestamptz not null default now()
);
alter table public.wishes enable row level security;
revoke all on public.wishes from anon, authenticated;
grant insert (topic, message) on public.wishes to anon, authenticated;
drop policy if exists "anyone can add a wish" on public.wishes;
create policy "anyone can add a wish" on public.wishes for insert to anon, authenticated with check (true);
