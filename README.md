# Skai-portfolio

## Content control center

The public portfolio is backed by Supabase and the `/admin/` dashboard controls the public-facing content:

- Websites, mobile apps, web apps, and flagship products through **Websites & Apps**.
- Project thumbnails, galleries, app-store links, icons, highlights, visibility, status, and ordering.
- Services, team members, testimonials, inquiries, hero copy, contact details, social links, stats, and footer copy.
- A reusable **Media Library** for uploaded images and videos.
- Brand name, logo, favicon, and logo alt text through **Brand & Logo** settings.
- Contact inquiries are saved in Supabase and can also open a pre-filled email to `skaitech360@gmail.com`.

### Supabase setup

Run these SQL files in the Supabase SQL Editor, in order:

1. `database/schema.sql`
2. `database/migration-v2.sql`
3. `database/migration-v3-content-control.sql`
4. `database/migration-v4-skai-tech-solutions.sql`

The third migration creates the `media_assets` table, adds project presentation fields, seeds the content-control settings, and creates the public storage buckets plus authenticated upload policies. The fourth migration is self-contained for the admin repair: it safely creates any missing media table, project fields, storage buckets, policies, SkaiTech Solutions contact details, and common image/video uploads up to 50MB.

If `schema.sql` and `migration-v2.sql` are already applied, running `migration-v4-skai-tech-solutions.sql` is enough to repair the current admin dashboard. It can be run safely whether or not migration v3 was previously applied.

The admin login uses Supabase Auth. Confirm `skaitech360@gmail.com` in Supabase Auth before signing in at `/admin/`; the password is intentionally not stored in this repository.

### Password reset URL

In Supabase **Authentication → URL Configuration**, set:

- Site URL: `https://skaiteam.wasmer.app`
- Redirect URL: `https://skaiteam.wasmer.app/reset-password.html`

The admin login's **Forgot password?** action uses that Wasmer reset URL, and `reset-password.html` accepts the recovery link and updates the password without a server.
