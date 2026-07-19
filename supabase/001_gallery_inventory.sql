-- Run this file once for a brand-new, empty Supabase project.
-- Do not rerun it against a project that already contains the artwork schema or data.
-- For an intentional data wipe and rebuild, see 000_reset_gallery_inventory.sql.

create type public.inventory_status as enum ('available', 'reserved', 'sold');

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  inventory_number text not null unique,
  title text not null,
  title_zh text,
  origin text,
  material text not null,
  technique text,
  dimensions text not null,
  price text not null,
  inventory_status public.inventory_status not null default 'available',
  is_published boolean not null default false,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artworks_published_sort_order_idx
  on public.artworks (is_published, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger artworks_set_updated_at
before update on public.artworks
for each row
execute function public.set_updated_at();

alter table public.artworks enable row level security;

create policy "Published artworks are publicly readable"
on public.artworks
for select
to anon, authenticated
using (is_published = true);

insert into storage.buckets (id, name, public)
values ('artwork-images', 'artwork-images', true)
on conflict (id) do update set public = true;

create policy "Artwork images are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'artwork-images');

-- Manage table rows and image uploads in the Supabase Dashboard as a project owner.
-- This website has no Supabase Auth login or browser write path.
-- Do not add authenticated/anonymous browser write policies or expose a service_role key.
