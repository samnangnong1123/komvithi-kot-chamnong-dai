create extension if not exists pgcrypto;

drop table if exists public.wedding_gifts;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author_name text not null,
  category text,
  cover_url text,
  excerpt text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.stories enable row level security;

drop policy if exists "Public can read stories" on public.stories;
create policy "Public can read stories"
on public.stories
for select
to anon
using (true);

drop policy if exists "Public can insert stories" on public.stories;
create policy "Public can insert stories"
on public.stories
for insert
to anon
with check (true);

drop policy if exists "Public can delete stories" on public.stories;
create policy "Public can delete stories"
on public.stories
for delete
to anon
using (true);
