-- Run ONCE in Supabase SQL Editor after the initial setup SQL.
-- Exhaust is now included in Engine. Removes the separate Exhaust category.
-- Reassign any Exhaust listings to Engine before deleting the old category.
update public.listings
set category_id = (select id from public.categories where name = 'Engine')
where category_id = (select id from public.categories where name = 'Exhaust');
delete from public.categories where name = 'Exhaust';
update public.categories set sort_order = 8 where name = 'Wheels & Hubs';
update public.categories set sort_order = 9 where name = 'Miscellaneous';
