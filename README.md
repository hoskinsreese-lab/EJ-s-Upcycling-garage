# EJ's Upcycling Garage — Vexo Digital

A responsive, black-and-white used Subaru parts website using EJ's actual supplied logo and mission statement. Includes search, categories, donor vehicle browsing, part inquiry copy-to-Facebook, and a mobile-friendly owner inventory manager.

## Important: preview vs live inventory

The site works as a static **portfolio preview** immediately, showing four **fictional** sample listings. They are clearly marked as examples. There is no secure admin access or live shared inventory until you connect Supabase. Never advertise the demo listings as real EJ's inventory.

The owner interface is implemented but intentionally **disabled** without Supabase. GitHub Pages alone cannot provide secure owner logins, shared photo storage, or editable inventory. Do not add passwords to JavaScript or HTML.

## Go live with a real database

1. Obtain the owner's permission to publish their logo, photos, business details, and inventory. Confirm the mission, partners, Facebook URL, and policies.
2. Create a Supabase project in an account owned or approved by EJ's. Check free-tier limits and costs.
3. Create the owner user in Supabase Authentication > Users. Disable public signup if not needed.
4. Run `supabase-schema.sql` in SQL Editor on a fresh project (review it first). It creates `parts`, `staff`, and a public image bucket with role-based security policies.
5. Find the owner user's UUID in Authentication > Users and run `insert into public.staff(user_id,role) values ('REAL-UUID','owner');` in SQL Editor.
6. In `config.js`, set `supabaseUrl` and the **public anon/publishable key** from Project Settings > API. Never use a service_role key, secret key, or password in website files.
7. Upload the whole folder to GitHub Pages (preserve `assets/ejs-logo.jpg`). Configure Settings > Pages > Deploy from branch > main > root.
8. Log in via OWNER LOGIN, add a real part with real photos, and verify it appears publicly. Test a sold listing, mobile upload, search, and Facebook inquiry.

### Owner workflow

Owner logs in from a phone, types part name and donor vehicle freely, adds condition and optional price, takes/uploads up to five photos (JPEG/PNG/WebP, max 5 MB each), and chooses Available, Sold, or Draft. Owner can edit listings and mark items sold. Drafts remain private. Photos are stored in a public bucket for customer-visible listings; do not upload sensitive information.

### Facebook inquiries

Customer clicks Inquire, copies part name, donor vehicle, and listing ID, then opens EJ's Facebook page to paste the inquiry. Facebook may require sign-in and does not guarantee Messenger opens automatically. Replace the page URL with EJ's preferred direct Messenger link when confirmed.

### Limitations

No checkout, payment processing, shipping calculations, or automatic inquiry submissions. No guarantee of parts fitment. Admin photo removal, bulk management, and detailed vehicle normalization are not included in this first version. External Google Fonts and Supabase client script require internet access. The sample catalog is only a demo.

## Version 2: donor vehicle stories
Owner dashboard now has a separate Donor Vehicles form: free-text vehicle name, biography, up to five photos, and published/draft visibility. Public donor cards display the vehicle photo and story. To associate a part with a vehicle, type the same donor vehicle name in the part listing (matching is currently by exact name; keep spelling consistent). On a **fresh** Supabase project, run the included full schema. On an **existing** V1 project, run only the new `public.vehicles` table and policy statements at the end of `supabase-schema.sql` to avoid duplicate policies.

Homepage headline updated to “Keeping the Cars We Love on the Road.” The owner's exact mission statement remains in the About section.
