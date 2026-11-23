-- ============================================================
-- SkaiTechgh Portfolio — Database Migration
-- Run AFTER the initial schema.sql
-- Adds: app store URLs, rich text support, more settings
-- ============================================================

-- Add app store URL columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS play_store_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS app_store_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Add more site_settings for full control
INSERT INTO site_settings (key, value) VALUES
  ('stats', '{
    "items": [
      {"value": "50+", "label": "Projects Delivered"},
      {"value": "20+", "label": "Happy Clients"},
      {"value": "5+", "label": "Years Experience"},
      {"value": "99%", "label": "Client Satisfaction"}
    ]
  }'::jsonb),
  ('footer', '{
    "copyright": "© 2024 SkaiTechgh. All rights reserved.",
    "description": "Premier software engineering team crafting cutting-edge digital solutions for businesses across Africa and beyond."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
