-- ============================================================
-- SkaiTech Solutions Portfolio — Brand, Contact, and Video Support
-- Run after schema.sql, migration-v2.sql, and migration-v3-content-control.sql.
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url TEXT;

INSERT INTO site_settings (key, value) VALUES
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
  ('project-images', 'project-images', true, 52428800, ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
