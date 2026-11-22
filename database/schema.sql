-- ============================================================
-- SkaiTechgh Portfolio — Supabase Database Schema
-- ============================================================
-- Run this entire script in your Supabase SQL Editor:
-- https://app.supabase.com → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: team_members
-- Stores team member profiles displayed on the public site
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  email TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: projects
-- Portfolio projects including client work and flagship products
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL CHECK (category IN ('website', 'mobile_app', 'flagship', 'web_app')),
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  client_challenge TEXT,
  live_url TEXT,
  github_url TEXT,
  is_flagship BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: services
-- Services offered to clients
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'fas fa-code',
  features TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: inquiries
-- Contact form submissions / project inquiry leads
-- ============================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service_type TEXT,
  budget_range TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: site_settings
-- Key-value store for dynamic site content (hero, contact, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: testimonials
-- Client testimonials and reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_role TEXT,
  client_company TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  photo_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- PUBLIC READ policies (anonymous users)
-- ----------------------------------------
CREATE POLICY "Public can view visible team members"
  ON team_members FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can view published projects"
  ON projects FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view visible services"
  ON services FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Public can view visible testimonials"
  ON testimonials FOR SELECT
  USING (is_visible = true);

-- ----------------------------------------
-- PUBLIC INSERT policy (contact form)
-- ----------------------------------------
CREATE POLICY "Anyone can submit inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------
-- ADMIN FULL ACCESS policies (authenticated)
-- ----------------------------------------
CREATE POLICY "Admins have full access to team members"
  ON team_members FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access to projects"
  ON projects FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access to services"
  ON services FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access to inquiries"
  ON inquiries FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access to site settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access to testimonials"
  ON testimonials FOR ALL
  USING (auth.role() = 'authenticated');


-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- STORAGE BUCKETS (create via Supabase Dashboard)
-- ============================================================
-- Go to Supabase Dashboard → Storage → Create new bucket:
--
-- 1. Bucket name: team-avatars
--    Public: YES
--    Allowed MIME types: image/png, image/jpeg, image/webp, image/gif
--    Max file size: 5MB
--
-- 2. Bucket name: project-images
--    Public: YES
--    Allowed MIME types: image/png, image/jpeg, image/webp, image/gif
--    Max file size: 10MB
--
-- Then add storage policies for each bucket:
--   - Public can VIEW (SELECT) all files
--   - Authenticated users can INSERT, UPDATE, DELETE files


-- ============================================================
-- SEED DATA — Default Site Settings
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('hero', '{
    "headline": "We Build Digital Experiences That Drive Growth",
    "subheadline": "SkaiTechgh is a premier software engineering team crafting cutting-edge websites, mobile apps, and enterprise platforms for businesses across Africa and beyond.",
    "cta_primary": "Explore Our Work",
    "cta_secondary": "Start a Project"
  }'::jsonb),
  ('contact', '{
    "email": "hello@skaitechgh.com",
    "phone": "+233 XX XXX XXXX",
    "address": "Accra, Ghana",
    "working_hours": "Mon - Fri: 9:00 AM - 6:00 PM"
  }'::jsonb),
  ('social', '{
    "github": "https://github.com/skaitechgh",
    "linkedin": "https://linkedin.com/company/skaitechgh",
    "twitter": "https://twitter.com/skaitechgh",
    "instagram": "https://instagram.com/skaitechgh"
  }'::jsonb),
  ('about', '{
    "title": "About SkaiTechgh",
    "description": "We are a team of passionate software engineers, designers, and digital strategists dedicated to building innovative solutions that transform businesses. From our flagship products to custom enterprise solutions, we deliver excellence at every step."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED DATA — Default Services
-- ============================================================
INSERT INTO services (title, description, icon, features, display_order) VALUES
  (
    'Corporate & E-Commerce Websites',
    'High-performance, responsive websites designed to convert visitors into customers. From corporate presences to full-scale e-commerce platforms.',
    'fas fa-globe',
    ARRAY['Responsive Design', 'SEO Optimization', 'E-Commerce Integration', 'CMS Development', 'Performance Optimization'],
    1
  ),
  (
    'Mobile Applications',
    'Cross-platform mobile apps for iOS and Android that deliver seamless user experiences with native performance.',
    'fas fa-mobile-alt',
    ARRAY['iOS & Android', 'Cross-Platform (React Native/Flutter)', 'Offline Support', 'Push Notifications', 'App Store Deployment'],
    2
  ),
  (
    'Web Applications & APIs',
    'Custom web applications, RESTful APIs, and cloud-based systems tailored to your business logic and scalability needs.',
    'fas fa-server',
    ARRAY['Custom Web Apps', 'RESTful & GraphQL APIs', 'Cloud Architecture', 'Database Design', 'Third-Party Integrations'],
    3
  ),
  (
    'UI/UX Design & Digital Transformation',
    'User-centered design and digital strategy that transforms how your business operates and engages with customers.',
    'fas fa-paint-brush',
    ARRAY['User Research', 'Wireframing & Prototyping', 'Visual Design', 'Design Systems', 'Digital Strategy Consulting'],
    4
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — Flagship Projects
-- ============================================================
INSERT INTO projects (title, description, short_description, category, tech_stack, is_flagship, status, display_order) VALUES
  (
    'SkaiTechgh',
    'SkaiTechgh is our flagship automated digital services platform powering mobile data purchases, airtime top-ups, utility bill payments, and a comprehensive agent store ecosystem. Built for speed, reliability, and scale across Ghana and West Africa.',
    'Automated digital services, mobile data, airtime, utility payments & agent store ecosystem.',
    'flagship',
    ARRAY['React', 'Node.js', 'PostgreSQL', 'Redis', 'Payment APIs', 'Mobile Money'],
    true,
    'published',
    1
  ),
  (
    'SkaiSchool',
    'SkaiSchool is a comprehensive school management and educational technology platform designed to digitize academic operations. Features include student enrollment, attendance tracking, grade management, fee processing, parent communication portals, and interactive learning resources.',
    'Comprehensive school management and educational technology platform.',
    'flagship',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'PWA', 'Real-time Sync'],
    true,
    'published',
    2
  )
ON CONFLICT DO NOTHING;
