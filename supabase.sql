create extension if not exists pgcrypto;

create table if not exists public.wedding_gifts (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null check (currency in ('USD', 'KHR')),
  gift_type text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.wedding_gifts enable row level security;

drop policy if exists "Public can read wedding gifts" on public.wedding_gifts;
create policy "Public can read wedding gifts"
on public.wedding_gifts
for select
to anon
using (true);

drop policy if exists "Public can insert wedding gifts" on public.wedding_gifts;
create policy "Public can insert wedding gifts"
on public.wedding_gifts
for insert
to anon
with check (true);

drop policy if exists "Public can delete wedding gifts" on public.wedding_gifts;
create policy "Public can delete wedding gifts"
on public.wedding_gifts
for delete
to anon
using (true);
