-- DANGER: This script permanently deletes every record in public.artworks.
-- Run it only for an intentional reset of a disposable or explicitly approved database.
-- Never run it on a production project that contains data to preserve.
-- The authenticated CRUD policies below mirror a prior deployed configuration.
-- The current website has no login or browser write path and does not rely on them.

-- =============================================
-- 0. 清理旧数据（如需保留已有数据，请勿执行本文件）
-- =============================================
DROP TABLE IF EXISTS public.artworks CASCADE;
DROP TYPE IF EXISTS public.inventory_status CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- =============================================
-- 1. 枚举类型
-- =============================================
CREATE TYPE public.inventory_status AS ENUM ('available', 'reserved', 'sold');

-- =============================================
-- 2. 数据表
-- =============================================
CREATE TABLE public.artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_number text NOT NULL UNIQUE,
  title text NOT NULL,
  title_zh text,
  origin text,
  material text NOT NULL,
  technique text,
  dimensions text NOT NULL,
  price text NOT NULL,
  inventory_status public.inventory_status NOT NULL DEFAULT 'available',
  is_published boolean NOT NULL DEFAULT false,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 3. 索引
-- =============================================
CREATE INDEX artworks_published_sort_order_idx
  ON public.artworks (is_published, sort_order);

-- =============================================
-- 4. 自动更新 updated_at 触发器
-- =============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER artworks_set_updated_at
BEFORE UPDATE ON public.artworks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- 5. RLS 策略
-- =============================================
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published artworks are publicly readable"
ON public.artworks
FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Legacy policies retained to record the previously deployed reset script.
-- Do not use these policies as the authorization model for a future website backend.
CREATE POLICY "Authenticated users can view all artworks"
ON public.artworks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert artworks"
ON public.artworks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update artworks"
ON public.artworks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete artworks"
ON public.artworks
FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- 6. Storage Bucket（图片存储）
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Artwork images are publicly readable" ON storage.objects;

CREATE POLICY "Artwork images are publicly readable"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'artwork-images');

-- Manage table rows and image uploads in the Supabase Dashboard as a project owner.
-- Do not create browser write policies or expose a service_role key in this application.
