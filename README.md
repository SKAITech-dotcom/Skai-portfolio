# Skai-portfolio

## Content control center

The public portfolio is backed by Supabase and the `/admin/` dashboard controls the public-facing content:

- Websites, mobile apps, web apps, and flagship products through **Websites & Apps**.
- Project thumbnails, galleries, app-store links, icons, highlights, visibility, status, and ordering.
- Services, team members, testimonials, inquiries, hero copy, contact details, social links, stats, and footer copy.
- A reusable **Media Library** for uploaded images.
- Brand name, logo, favicon, and logo alt text through **Brand & Logo** settings.

### Supabase setup

Run these SQL files in the Supabase SQL Editor, in order:

1. `database/schema.sql`
2. `database/migration-v2.sql`
3. `database/migration-v3-content-control.sql`

The third migration creates the `media_assets` table, adds project presentation fields, seeds brand settings, and creates the public `site-media` storage bucket plus authenticated upload policies.

The admin login uses Supabase Auth. Confirm `skaitech360@gmail.com` in Supabase Auth before signing in at `/admin/`; the password is intentionally not stored in this repository.

### Password reset URL

In Supabase **Authentication → URL Configuration**, set:

- Site URL: `https://skaiteam.wasmer.app`
- Redirect URL: `https://skaiteam.wasmer.app/reset-password.html`

The admin login's **Forgot password?** action uses that Wasmer reset URL, and `reset-password.html` accepts the recovery link and updates the password without a server.
