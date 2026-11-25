-- ============================================================
-- SkaiTech Solutions Portfolio — Brand, Contact, and Video Support
-- Run after schema.sql and migration-v2.sql. Safe to run even if migration-v3 ran.
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'fas fa-bolt';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  alt_text TEXT,
  media_type TEXT DEFAULT 'image',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view visible media assets" ON media_assets;
CREATE POLICY "Public can view visible media assets"
  ON media_assets FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admins have full access to media assets" ON media_assets;
CREATE POLICY "Admins have full access to media assets"
  ON media_assets FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS set_updated_at ON media_assets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

INSERT INTO site_settings (key, value) VALUES
  ('hero', '{
    "headline": "We Build Digital Experiences That Drive Growth",
    "subheadline": "SkaiTech Solutions is a software engineering team crafting websites, mobile apps, and digital platforms for businesses across Ghana and beyond.",
    "cta_primary": "Explore Our Work",
    "cta_secondary": "Start a Project"
  }'::jsonb),
  ('about', '{
    "title": "About SkaiTech Solutions",
    "description": "We build innovative websites, mobile apps, and digital platforms that help businesses grow."
  }'::jsonb),
  ('brand', '{
    "brand_name": "SkaiTech Solutions",
    "tagline": "Digital products that drive growth",
    "logo_url": "",
    "logo_path": "",
    "favicon_url": "",
    "favicon_path": "",
    "logo_alt": "SkaiTech Solutions logo"
  }'::jsonb),
  ('contact', '{
    "email": "skaitech360@gmail.com",
    "phone": "05434233685 / 0551418254",
    "address": "Wa, Upper West Region, Ghana",
    "working_hours": "Mon - Fri: 9:00 AM - 6:00 PM"
  }'::jsonb),
  ('footer', '{
    "copyright": "© 2026 SkaiTech Solutions. All rights reserved.",
    "description": "SkaiTech Solutions builds websites, mobile apps, and digital platforms for businesses in Ghana and beyond."
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Allow the admin Media Library to store common image and video formats up to 50MB.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('site-media', 'site-media', true, 52428800, ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ]),
  ('team-avatars', 'team-avatars', true, 5242880, ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif'
  ]),
  ('project-images', 'project-images', true, 52428800, ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public can view portfolio media'
  ) THEN
    CREATE POLICY "Public can view portfolio media"
      ON storage.objects FOR SELECT
      USING (bucket_id IN ('site-media', 'team-avatars', 'project-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload portfolio media'
  ) THEN
    CREATE POLICY "Authenticated users can upload portfolio media"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id IN ('site-media', 'team-avatars', 'project-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can update portfolio media'
  ) THEN
    CREATE POLICY "Authenticated users can update portfolio media"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id IN ('site-media', 'team-avatars', 'project-images'))
      WITH CHECK (bucket_id IN ('site-media', 'team-avatars', 'project-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete portfolio media'
  ) THEN
    CREATE POLICY "Authenticated users can delete portfolio media"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id IN ('site-media', 'team-avatars', 'project-images'));
  END IF;
END $$;
