-- ============================================================
-- SkaiTechgh Portfolio — Content Control Center Migration
-- Run after schema.sql and migration-v2.sql.
-- ============================================================

-- Project presentation fields used by the flagship/product cards.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'fas fa-bolt';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- Reusable image library for logos, team photos, project artwork, and future sections.
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

-- Brand settings are stored in the same public key/value store as the other site content.
INSERT INTO site_settings (key, value) VALUES
  ('brand', '{
    "brand_name": "SkaiTechgh",
    "tagline": "Digital experiences that drive growth",
    "logo_url": "",
    "logo_path": "",
    "favicon_url": "",
    "favicon_path": "",
    "logo_alt": "SkaiTechgh logo"
  }'::jsonb),
  ('footer', '{
    "copyright": "© 2024 SkaiTechgh. All rights reserved.",
    "description": "Premier software engineering team crafting cutting-edge digital solutions for businesses across Africa and beyond."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Public image bucket used by the Media Library and the brand uploader.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public can view site media'
  ) THEN
    CREATE POLICY "Public can view site media"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'site-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload site media'
  ) THEN
    CREATE POLICY "Authenticated users can upload site media"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'site-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can update site media'
  ) THEN
    CREATE POLICY "Authenticated users can update site media"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'site-media')
      WITH CHECK (bucket_id = 'site-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete site media'
  ) THEN
    CREATE POLICY "Authenticated users can delete site media"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'site-media');
  END IF;
END $$;
