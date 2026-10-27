# EJ's Upcycling Garage — Parts Catalog upgrade

This replaces the old Donor Yard with **Parts Catalog** and uses the existing Supabase tables: `models`, `generations`, `categories`, `listings`, `listing_photos`, and `inventory_admins`. Original logo, site styling, mission, partners, and Facebook inquiry link remain.

## Before publishing

1. You have already run `ejs-garage-supabase-setup.sql` in your empty Supabase project. Now run **`catalog-update.sql`** in Supabase SQL Editor to combine Exhaust into Engine (9 categories total). Do NOT run the old `supabase-schema.sql` from the prior website.
2. Confirm Supabase Storage contains the `part-photos` bucket, and RLS is enabled on all inventory tables. The initial SQL sets these up.
3. In Supabase **Authentication → URL Configuration**, set Site URL to the actual deployed website URL and add its exact URL (and any necessary redirect URLs) to the allow list. For the current GitHub Pages project, confirm the real URL and its trailing slash. Invite/reset links must redirect to the website, not an unconfigured localhost address. An invitation already sent may need to be resent after this is configured.
4. After the owner accepts the invite, copy their **User UID** from Authentication → Users and run this separately in SQL Editor (replace the UUID):

```sql
insert into public.inventory_admins (user_id)
values ('PASTE-OWNER-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

This is a trusted SQL Editor action, **not** a browser action. Never put a service-role key in frontend code.
5. `config.js` contains the project URL and **publishable** key. These are browser-safe only with correctly configured RLS; never add secrets or passwords to this repository.
6. Upload `index.html`, `styles.css`, `script.js`, `config.js`, and `assets/ejs-logo.jpg` to the **root** of the existing GitHub Pages repository. Keep `catalog-update.sql` and this README for reference; they are not executed by GitHub Pages.

## Features

- Customer navigation: Subaru model → generation/year range → 9 parts categories → available listings.
- Search, category filter, prices/ranges, listing photos, Facebook inquiry copying.
- Owner login, draft/published flag, available/pending/sold status, add/edit/delete listings, and upload/remove photos.
- Public queries only return `is_published = true` and `status = 'available'`; database RLS independently enforces this.
- JDM year ranges are **approximate** and should be confirmed with EJ's before launch. Individual part fitment must be verified, especially JDM vs USDM.

## Notes

- This is a **static GitHub Pages frontend**; Supabase is the database, authentication, and photo backend. No checkout/payment processing.
- The Supabase photo bucket created by the setup SQL is public. Do not upload private images, including to unpublished listings.
- Owner access is blocked until the `inventory_admins` row exists. Invitation alone does not grant admin privileges.
- The project has not been deployed or live-tested against your Supabase account from this workspace. Test login, password invitation, public browsing, upload, edit, delete, and permissions on the published site before sharing it with customers.
