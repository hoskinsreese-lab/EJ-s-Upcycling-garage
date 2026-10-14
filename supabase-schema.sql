-- Run in your own Supabase SQL Editor. Review before executing.
-- 1. Create owner user manually in Authentication > Users (do not allow public signups).
-- 2. Run this SQL. 3. Add the owner's auth UUID to staff (example at bottom).
create table if not exists public.staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','employee'))
);
create table if not exists public.parts (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 120),
 donor_vehicle text not null default '',
 category text not null default 'Other',
 price numeric(10,2) check(price>=0),
 description text not null default '',
 status text not null default 'draft' check(status in ('available','sold','draft')),
 photos text[] not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.staff enable row level security;
alter table public.parts enable row level security;
create policy "staff can read own role" on public.staff for select to authenticated using (user_id=auth.uid());
create policy "public reads listed parts" on public.parts for select to anon,authenticated using (status in ('available','sold') or exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
create policy "staff creates parts" on public.parts for insert to authenticated with check (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
create policy "staff edits parts" on public.parts for update to authenticated using (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee'))) with check (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
create policy "owner deletes parts" on public.parts for delete to authenticated using (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role='owner'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('part-photos','part-photos',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "public reads parts photos" on storage.objects for select to anon,authenticated using (bucket_id='part-photos');
create policy "staff uploads parts photos" on storage.objects for insert to authenticated with check (bucket_id='part-photos' and exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
-- IMPORTANT: replace with real owner auth user ID; never expose owner passwords in source code.
-- insert into public.staff(user_id,role) values ('OWNER-AUTH-UUID-HERE','owner');

-- Donor vehicle profiles: independent of individual part listings.
create table if not exists public.vehicles (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 160),
 bio text not null default '' check(length(bio)<=5000),
 photos text[] not null default '{}',
 status text not null default 'draft' check(status in ('published','draft')),
 created_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;
create policy "public reads published vehicles" on public.vehicles for select to anon,authenticated using (status='published' or exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
create policy "staff creates vehicles" on public.vehicles for insert to authenticated with check (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
create policy "staff updates vehicles" on public.vehicles for update to authenticated using (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee'))) with check (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role in ('owner','employee')));
create policy "owner deletes vehicles" on public.vehicles for delete to authenticated using (exists(select 1 from public.staff s where s.user_id=auth.uid() and s.role='owner'));
