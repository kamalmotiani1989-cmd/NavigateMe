-- 7. Homes whose owner hasn't opened the app in 30 days leave Discover (and come back when they do)
select pg_temp.as_user('30000000-0000-4000-8000-000000000030');   -- Ira, a seeker with vibe answers by now
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status)
  values ('77777777-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-00000000000f', 'room', 'Quiet owner room', 'Pune', 'Aundh', 2, 9000, 'active') on conflict (id) do nothing;
update fm_profiles set active_at = now() - interval '2 days' where id = 'f0000000-0000-4000-8000-00000000000f';
select pg_temp.ok(exists (select 1 from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007' and s.owner_active_at < now() - interval '1 day'),
  'fresh: a home whose owner was active 2 days ago shows, with when they were last active');
update fm_profiles set active_at = now() - interval '40 days' where id = 'f0000000-0000-4000-8000-00000000000f';
select pg_temp.ok(not exists (select 1 from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007')
  and not exists (select 1 from fm_search_near(18.56, 73.81, 25, 'Aundh') s where s.id = '77777777-0000-4000-8000-000000000007'),
  'fresh: an owner away for 40 days: the home leaves the search and the place search');
select pg_temp.ok(exists (select 1 from fm_listing_get('77777777-0000-4000-8000-000000000007')), 'fresh: a link to it still opens');
insert into fm_requests (listing_id, seeker_id, status) values ('77777777-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000030', 'declined');
select pg_temp.ok(exists (select 1 from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007'), 'fresh: a home you already asked about still shows');
delete from fm_requests where listing_id = '77777777-0000-4000-8000-000000000007';
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok(exists (select 1 from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007'), 'fresh: the owner still sees their own home');
select count(*) from fm_me();
select pg_temp.ok((select active_at from fm_profiles where id = 'f0000000-0000-4000-8000-00000000000f') > now() - interval '1 minute', 'fresh: opening the app marks the owner active');
select pg_temp.as_user('30000000-0000-4000-8000-000000000030');
select pg_temp.ok(exists (select 1 from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007'), 'fresh: and the home is back');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_listing_fresh(uuid, timestamptz, uuid)', 'execute') and has_function_privilege('authenticated', 'public.fm_search(text, text, int, text, text)', 'execute'), 'fresh: the check itself is internal; the search stays open to signed-in people');
-- "Phone verified" only for a number confirmed by a delivered code (Supabase phone sign-in), never the test code
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
update auth.users set phone_confirmed_at = null, email = '9800000099@test.findmyflatmate.app' where id = 'f0000000-0000-4000-8000-00000000000f';   -- signed in with the test code
update fm_profiles set phone_verified_at = null where id = 'f0000000-0000-4000-8000-00000000000f';
select count(*) from fm_me();
select pg_temp.as_user('30000000-0000-4000-8000-000000000030');
select pg_temp.ok((select s.owner_verified from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007') = false
  and (select g.owner_verified from fm_listing_get('77777777-0000-4000-8000-000000000007') g) = false, 'verified: an owner who signed in with the test code shows no tick');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
update auth.users set phone_confirmed_at = now() where id = 'f0000000-0000-4000-8000-00000000000f';   -- the real WhatsApp / SMS sign-in confirms the phone
select count(*) from fm_me();
select pg_temp.as_user('30000000-0000-4000-8000-000000000030');
select pg_temp.ok((select s.owner_verified from fm_search('Pune') s where s.id = '77777777-0000-4000-8000-000000000007')
  and (select s.owner_verified from fm_search_near(18.56, 73.81, 25, 'Aundh') s where s.id = '77777777-0000-4000-8000-000000000007'), 'verified: after a sign-in with a delivered code, the tick shows');
insert into fm_requests (listing_id, seeker_id, status) values ('77777777-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000030', 'pending');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok((select i.verified from fm_inbox() i where i.listing_id = '77777777-0000-4000-8000-000000000007') = false, 'verified: the owner sees no tick on a seeker who used the test code');
select pg_temp.as_user('30000000-0000-4000-8000-000000000030');
select pg_temp.ok((select i.verified from fm_inbox() i where i.listing_id = '77777777-0000-4000-8000-000000000007') is null, 'verified: the seeker side carries no tick field');
select pg_temp.ok(pg_temp.err($$update fm_profiles set phone_verified_at = now() where id = auth.uid()$$) <> ''
  or not has_table_privilege('authenticated', 'public.fm_profiles', 'update') or not has_column_privilege('authenticated', 'public.fm_profiles', 'phone_verified_at', 'update'),
  'verified: people cannot set the flag themselves');
delete from fm_requests where listing_id = '77777777-0000-4000-8000-000000000007';
