# EJ's Upcycling Garage — Delete Buttons Update

## Scope
- Parts Catalog: strengthens the existing Delete button; verifies owner session, requires typing DELETE, deletes the matching listing, then removes its linked photos.
- Car Profiles: adds a Delete button beside Edit; verifies owner session, requires typing DELETE, deletes the matching profile, then removes its linked photos.
- Unpublish remains available independently. No database migration, DNS, or domain changes are required.
- Both actions are permanent. A failed Storage cleanup is reported so orphaned files can be removed manually. The database row is deleted first to avoid removing photos from a listing that fails to delete.

## Important source/version note
These files are based on the reviewed Car Profiles integration ZIP and the earlier EJ GitHub repository ZIP supplied in this conversation, NOT a fresh download of today's live main branch. The current live site also has a later URL-cleanup edit. **Do not overwrite the current live index.html.** Before deploying, compare these files with the latest GitHub main branch and preserve any changes made since those uploads. In particular, script.js may have changed since the original repository ZIP. The included script.js is a full replacement based on that earlier snapshot; merge its `deletePart` change into the current script.js if the live file differs.

## Step-by-step (test first)
1. In GitHub, open the EJ's Upcycling Garage repository. Confirm main is the latest branch and download a ZIP as a fallback copy.
2. Create a new branch named `delete-buttons-test` from main (do not modify the GitHub Pages publishing branch).
3. Compare the package's `script.js`, `profiles.js`, and `styles.css` with the current main versions. If there are other recent changes, merge the deletion changes rather than replacing those newer versions. Upload only the three files to `delete-buttons-test`. Do not upload or replace `index.html`, `config.js`, or any SQL files.
4. In Netlify, deploy the new branch to a preview (either change the existing test site's production branch or use a separate preview). Confirm it shows the updated buttons. This is a real Supabase-backed preview: deleting there deletes real Supabase data. Use newly created disposable test listings only.
5. Test Car Profiles: create a disposable profile with two photos; delete it; confirm it disappears from the public view, `car_profiles` and `car_profile_photos`, and its photos disappear from the private Storage bucket. Check canceling the prompt does nothing and that Unpublish still works.
6. Test Parts Catalog: create a disposable part with a photo; delete it; confirm listing and photo records disappear and storage file is removed. Test canceling the prompt and existing inventory editing.
7. Test signed-out access, owner login, mobile layout, public catalog, photo uploads and cover switching. Server-side Supabase RLS must continue to enforce owner-only deletion; do not rely on hiding buttons alone.
8. If tests pass, open a PR from `delete-buttons-test` into `main`, review changes, merge, wait for GitHub Pages, and verify the live site. Leave domain/DNS unchanged.

## Known limitations / cautions
- Storage cleanup and database deletion cannot be made atomic from browser JavaScript. If the DB deletion succeeds but Storage removal fails, the interface reports the issue; the owner must clean up orphaned files in Supabase Storage.
- Deleting a profile cascades its photo metadata because of the installed foreign key. The Parts Catalog's listing_photos relationship should be confirmed to cascade before testing deletion; if it does not, database deletion will fail safely and will not remove the photos.
- Supabase Storage RLS must permit authenticated owner DELETE operations on the relevant bucket. It was configured earlier for both buckets, but test it.
- This package has passed JS syntax checks, not live owner/browser/DB tests.
