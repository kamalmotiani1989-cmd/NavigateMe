-- 13. Block and report (Kamal, 10 Nov). A = Asha (seeker), B = Bala (owner), C = Chitra (seeker), D = Dev (seeker).
reset role;
insert into auth.users (id, phone) values ('80000000-0000-4000-8000-000000000081', '919800000081'), ('80000000-0000-4000-8000-000000000082', '919800000082'),
  ('80000000-0000-4000-8000-000000000083', '919800000083'), ('80000000-0000-4000-8000-000000000084', '919800000084') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, adult_at, discoverable, tribe_open, vibe, search, occupation) values
  ('80000000-0000-4000-8000-000000000081', '919800000081', 'Asha Rao', 'seeker', now(), true, true, '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":0,"social":1}', '{"city":"Nagpur","areas":[]}', '{"type":"working"}'),
  ('80000000-0000-4000-8000-000000000082', '919800000082', 'Bala Iyer', 'owner', now(), true, true, '{}', '{}', '{"type":"working"}'),
  ('80000000-0000-4000-8000-000000000083', '919800000083', 'Chitra K', 'seeker', now(), true, true, '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":0,"social":1}', '{"city":"Nagpur","areas":[]}', '{"type":"working"}'),
  ('80000000-0000-4000-8000-000000000084', '919800000084', 'Dev Shah', 'seeker', now(), true, true, '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":0,"social":1}', '{"city":"Nagpur","areas":[]}', '{"type":"working"}')
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, adult_at = excluded.adult_at, discoverable = true, tribe_open = true,
     vibe = excluded.vibe, search = excluded.search, occupation = excluded.occupation;
update fm_settings set charges_enabled = false;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, household) values
  ('8a000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000082', 'room', 'Room in Dharampeth', 'Nagpur', 'Dharampeth', 2, 8000, 'active', '{"residents":1,"sleep":1,"clean":1,"food":1,"cook":1,"smoke":0,"social":1}')
  on conflict (id) do nothing;
insert into fm_requests (id, listing_id, seeker_id, status) values ('8b000000-0000-4000-8000-000000000001', '8a000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000084', 'approved') on conflict do nothing;
insert into fm_market_items (id, seller_id, title, category, price, city, locality) values ('8c000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000082', 'Office chair', 'furniture', 1500, 'Nagpur', 'Dharampeth') on conflict do nothing;
insert into fm_tribe_links (id, a, b, match_pct) values ('8d000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000081', '80000000-0000-4000-8000-000000000083', 90) on conflict do nothing;

-- before: everyone sees everyone
select pg_temp.as_user('80000000-0000-4000-8000-000000000081');
select pg_temp.ok(exists (select 1 from fm_search(p_city => 'Nagpur') where id = '8a000000-0000-4000-8000-000000000001')
  and exists (select 1 from fm_tribe_list() where id = '8d000000-0000-4000-8000-000000000001'), 'block: before, the listing and the tribe match show');
-- A blocks B from B's listing
select pg_temp.ok((fm_block('listing', '8a000000-0000-4000-8000-000000000001')->>'name') = 'Bala', 'block: from a listing, by what was tapped (no account ids in the app)');
select pg_temp.ok(not exists (select 1 from fm_search(p_city => 'Nagpur') where id = '8a000000-0000-4000-8000-000000000001')
  and not exists (select 1 from fm_search_near(21.14, 79.08, 25, 'Dharampeth') where id = '8a000000-0000-4000-8000-000000000001')
  and not exists (select 1 from fm_listing_get('8a000000-0000-4000-8000-000000000001')), 'block: their listing is gone from search, nearby and a direct link');
select pg_temp.ok((select error from fm_request('8a000000-0000-4000-8000-000000000001', 'hi')) = 'listing-not-found', 'block: no request to their listing (it just isn''t found)');
select pg_temp.ok(not exists (select 1 from fm_market_search(p_city => 'Nagpur') where id = '8c000000-0000-4000-8000-000000000001')
  and (select error from fm_market_offer('8c000000-0000-4000-8000-000000000001', 1200, 'hi')) = 'item-not-available', 'block: their FlatMart items are gone and can''t get offers');
select pg_temp.ok((fm_my_blocks()->0->>'name') = 'Bala', 'block: Account lists them under Blocked people');
select pg_temp.as_user('80000000-0000-4000-8000-000000000082');
select pg_temp.ok(not exists (select 1 from fm_find_seekers('8a000000-0000-4000-8000-000000000001') where seeker_id = '80000000-0000-4000-8000-000000000081')
  and (select error from fm_invite('8a000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000081', 'Come see it')) = 'seeker-not-found',
  'block: the other way too: they don''t see me in Escape and can''t invite me');
select pg_temp.ok(jsonb_array_length(fm_my_blocks()) = 0 and fm_block_target('user', '80000000-0000-4000-8000-000000000081') is not null, 'block: silent: they have no sign of it');
-- tribe
select pg_temp.as_user('80000000-0000-4000-8000-000000000081');
select fm_block('tribe', '8d000000-0000-4000-8000-000000000001');
select pg_temp.ok(not exists (select 1 from fm_tribe_list() where id = '8d000000-0000-4000-8000-000000000001') and fm_tribe_answer('8d000000-0000-4000-8000-000000000001', true) = 'not-found',
  'block: a tribe match goes, and can''t be said yes to');
select pg_temp.as_user('80000000-0000-4000-8000-000000000083');
select pg_temp.ok(not exists (select 1 from fm_tribe_list() where id = '8d000000-0000-4000-8000-000000000001') and fm_tribe_answer('8d000000-0000-4000-8000-000000000001', true) = 'not-found',
  'block: for them too');
-- a chat: D (seeker) and B (owner) after a yes; B writes, D reports the message and blocks
select pg_temp.as_user('80000000-0000-4000-8000-000000000082');
select fm_thread_open('room', '8b000000-0000-4000-8000-000000000001')->>'thread' as th \gset
select fm_thread_send(:'th', 'Pay 5000 token today or lose it')->>'message' as msg \gset
select pg_temp.as_user('80000000-0000-4000-8000-000000000084');
select pg_temp.ok(fm_report('message', :'msg', 'scam', 'asked for a token', true)->>'blocked' = 'true', 'report: a message, with a reason and a note, and block in the same step');
select pg_temp.ok(fm_thread_get(:'th')->>'error' = 'unavailable' and fm_thread_send(:'th', 'hello')->>'error' = 'unavailable', 'block: the chat closes for me');
select pg_temp.as_user('80000000-0000-4000-8000-000000000082');
select pg_temp.ok(fm_thread_get(:'th')->>'error' = 'unavailable' and fm_thread_open('room', '8b000000-0000-4000-8000-000000000001')->>'error' = 'unavailable'
  and not exists (select 1 from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'th'), 'block: and for them ("you can''t message this person", never "blocked")');
reset role;
delete from fm_thread_messages where id = :'msg';
select pg_temp.ok((select copy from fm_user_reports where kind = 'message' and ref = :'msg') = 'Pay 5000 token today or lose it', 'report: a copy of the message is kept, even after it''s deleted');
select pg_temp.ok((select count(*) from fm_thread_audience(:'msg')) = 0, 'block: no push between them');
-- thresholds: reports from two different people pause messages, requests and invites
select pg_temp.ok(not fm_user_restricted('80000000-0000-4000-8000-000000000082'), 'thresholds: one person''s report doesn''t pause anyone');
select pg_temp.as_user('80000000-0000-4000-8000-000000000083');
select pg_temp.ok(fm_report('listing', '8a000000-0000-4000-8000-000000000001', 'fake')->>'reported' = 'true' and fm_report('listing', '8a000000-0000-4000-8000-000000000001', 'nonsense')->>'error' = 'bad-reason',
  'report: a listing, with one of the set reasons');
reset role;
select pg_temp.ok(fm_user_restricted('80000000-0000-4000-8000-000000000082'), 'thresholds: two different people reported: paused');
insert into fm_requests (id, listing_id, seeker_id, status) values ('8b000000-0000-4000-8000-000000000002', '8a000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000083', 'approved') on conflict do nothing;
select pg_temp.as_user('80000000-0000-4000-8000-000000000082');
select fm_thread_open('room', '8b000000-0000-4000-8000-000000000002')->>'thread' as th2 \gset
select pg_temp.ok(fm_thread_send(:'th2', 'hello')->>'error' = 'paused' and (select error from fm_invite('8a000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000084', 'x')) in ('paused', 'seeker-not-found'),
  'thresholds: a paused person can''t send messages or invites');
reset role;
select pg_temp.ok(exists (select 1 from fm_safety_review_list() where user_id = '80000000-0000-4000-8000-000000000082' and reports = 2 and paused and last_copy is not null),
  'review: Kamal''s list shows them, the reasons and a copy');
select fm_safety_clear('80000000-0000-4000-8000-000000000082', 'looked, warned');
select pg_temp.ok(not fm_user_restricted('80000000-0000-4000-8000-000000000082'), 'review: clearing lifts the pause');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_safety_review_list()', 'execute') and not has_function_privilege('authenticated', 'public.fm_safety_clear(uuid, text)', 'execute')
  and has_function_privilege('service_role', 'public.fm_safety_review_list()', 'execute') and has_function_privilege('service_role', 'public.fm_safety_clear(uuid, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_blocked(uuid, uuid)', 'execute') and not has_function_privilege('authenticated', 'public.fm_block_target(text, uuid)', 'execute'),
  'review: only the service role; nobody can ask who blocked whom');
-- unblock
select pg_temp.as_user('80000000-0000-4000-8000-000000000081');
select fm_unblock((fm_my_blocks()->0->>'user')::uuid);
select fm_unblock((fm_my_blocks()->0->>'user')::uuid);
select pg_temp.ok(jsonb_array_length(fm_my_blocks()) = 0 and exists (select 1 from fm_search(p_city => 'Nagpur') where id = '8a000000-0000-4000-8000-000000000001'), 'unblock: from Account, and the listing is back');
select pg_temp.ok(fm_block('user', '80000000-0000-4000-8000-000000000081')->>'error' = 'not-found' and fm_report('user', '80000000-0000-4000-8000-000000000081', 'other')->>'error' = 'not-found',
  'can''t block or report yourself');
reset role;
