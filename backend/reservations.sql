-- getshecurity.com: "reserve a piece, pay nothing now".
-- Visitors can add a reservation and read the total count, nothing else.
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  piece text not null check (piece in ('signet', 'halo', 'locket', 'undecided')),
  finish text not null default 'gold' check (finish in ('gold', 'silver')),
  country text check (length(country) <= 60),
  created_at timestamptz not null default now()
);
create unique index if not exists reservations_email_piece on public.reservations (lower(email), piece);

alter table public.reservations enable row level security;
revoke all on public.reservations from anon, authenticated;
grant insert (email, piece, finish, country) on public.reservations to anon, authenticated;
drop policy if exists "anyone can reserve" on public.reservations;
create policy "anyone can reserve" on public.reservations for insert to anon, authenticated with check (true);

-- only the number is public, never the emails
create or replace function public.reservation_count() returns integer
language sql security definer set search_path = public stable as
$$ select count(*)::int from public.reservations $$;
revoke all on function public.reservation_count() from public;
grant execute on function public.reservation_count() to anon, authenticated;
