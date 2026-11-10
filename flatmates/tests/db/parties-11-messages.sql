-- 11. Messages after a yes (Kamal, 10 Nov): room requests, tribes, FlatMart offers and Flatsplits groups.
insert into auth.users (id, phone) values ('70000000-0000-4000-8000-000000000071', '919800000071'), ('70000000-0000-4000-8000-000000000072', '919800000072'),
  ('70000000-0000-4000-8000-000000000073', '919800000073') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role) values
  ('70000000-0000-4000-8000-000000000071', '919800000071', 'Meera Rao', 'seeker'),
  ('70000000-0000-4000-8000-000000000072', '919800000072', 'Arjun Shah', 'owner'),
  ('70000000-0000-4000-8000-000000000073', '919800000073', 'Stranger Danger', 'seeker') on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status) values
  ('7a000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000072', 'room', 'Room in Baner', 'Pune', 'Baner', 2, 9000, 'active') on conflict (id) do nothing;
insert into fm_requests (id, listing_id, seeker_id, status) values
  ('7b000000-0000-4000-8000-000000000001', '7a000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000071', 'pending') on conflict (id) do nothing;
-- before the yes: nothing
select pg_temp.as_user('70000000-0000-4000-8000-000000000071');
select pg_temp.ok(fm_thread_open('room', '7b000000-0000-4000-8000-000000000001')->>'error' = 'not-yet' and not exists (select 1 from fm_threads),
  'messages: no chat before the owner says yes');
reset role;
update fm_requests set status = 'approved' where id = '7b000000-0000-4000-8000-000000000001';
select pg_temp.as_user('70000000-0000-4000-8000-000000000071');
select fm_thread_open('room', '7b000000-0000-4000-8000-000000000001')->>'thread' as room \gset
select pg_temp.ok(:'room' is not null and (fm_thread_send(:'room', '  Hi Arjun, when can I visit?  ')->>'message') is not null, 'messages: after the yes the seeker can write');
select pg_temp.ok(fm_thread_send(:'room', '   ')->>'error' = 'empty', 'messages: an empty message is refused');
select fm_thread_send(:'room', '<b>hi</b>')->>'message' as html \gset
select pg_temp.ok((select body from fm_thread_messages where id = :'html') = '‹b›hi‹/b›', 'messages: text can''t carry HTML');
select pg_temp.as_user('70000000-0000-4000-8000-000000000072');
select pg_temp.ok((select (x->>'unread')::int from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'room') = 2
  and (select x->>'title' from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'room') = 'Room in Baner', 'messages: the owner sees it in their list, 2 unread, named after the home');
select pg_temp.ok(fm_thread_open('room', '7b000000-0000-4000-8000-000000000001')->>'thread' = :'room', 'messages: one conversation per connection');
select fm_thread_get(:'room') as got \gset
select pg_temp.ok((:'got'::jsonb)->'messages'->0->>'body' = 'Hi Arjun, when can I visit?' and (:'got'::jsonb)->'people' = '["Meera"]'::jsonb and not ((:'got'::jsonb)->'messages'->0->>'mine')::boolean, 'messages: the owner reads it, with the other person''s first name');
select pg_temp.ok((select (x->>'unread')::int from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'room') = 0, 'messages: opening it marks it read');
select pg_temp.ok((select count(*) from fm_thread_audience((select id from fm_thread_messages where thread_id = :'room' order by created_at limit 1))) = 1, 'messages: a push goes to the other person only');
-- a stranger can't
select pg_temp.as_user('70000000-0000-4000-8000-000000000073');
select pg_temp.ok(fm_thread_get(:'room')->>'error' = 'not-found' and fm_thread_send(:'room', 'hello')->>'error' = 'not-found'
  and fm_thread_open('room', '7b000000-0000-4000-8000-000000000001')->>'error' = 'not-yet' and jsonb_array_length(fm_thread_list()) = 0, 'messages: someone else can''t read, write or list it');
reset role;
select pg_temp.ok(not has_table_privilege('authenticated', 'public.fm_thread_messages', 'select') and not has_table_privilege('anon', 'public.fm_threads', 'select'),
  'messages: the tables can''t be read directly');
-- tribe: only once bonded, and not after it ends
insert into fm_tribe_links (id, a, b, status) values ('7c000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000071', '70000000-0000-4000-8000-000000000073', 'open') on conflict do nothing;
select pg_temp.as_user('70000000-0000-4000-8000-000000000071');
select pg_temp.ok(fm_thread_open('tribe', '7c000000-0000-4000-8000-000000000001')->>'error' = 'not-yet', 'messages: tribe: not before both said yes');
reset role; update fm_tribe_links set status = 'bonded' where id = '7c000000-0000-4000-8000-000000000001';
select pg_temp.as_user('70000000-0000-4000-8000-000000000071');
select fm_thread_open('tribe', '7c000000-0000-4000-8000-000000000001')->>'thread' as tribe \gset
select pg_temp.ok(fm_thread_send(:'tribe', 'Shall we look at Kothrud?')->>'message' is not null and fm_thread_get(:'tribe')->>'title' = 'Your tribe', 'messages: tribe: once bonded they can chat');
reset role; update fm_tribe_links set status = 'closed' where id = '7c000000-0000-4000-8000-000000000001';
select pg_temp.as_user('70000000-0000-4000-8000-000000000071');
select pg_temp.ok(fm_thread_get(:'tribe')->>'error' = 'not-found' and fm_thread_send(:'tribe', 'hello?')->>'error' = 'not-found', 'messages: tribe: after leaving, the chat can''t be read');
-- FlatMart: only an accepted offer
reset role;
insert into fm_market_items (id, seller_id, title, category, price, city, locality) values
  ('7d000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000072', 'Study table', 'furniture', 2000, 'Pune', 'Baner') on conflict do nothing;
insert into fm_market_offers (id, item_id, buyer_id, offer, status) values
  ('7e000000-0000-4000-8000-000000000001', '7d000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000071', 1800, 'pending') on conflict do nothing;
select pg_temp.as_user('70000000-0000-4000-8000-000000000071');
select pg_temp.ok(fm_thread_open('market', '7e000000-0000-4000-8000-000000000001')->>'error' = 'not-yet', 'messages: FlatMart: not before the seller accepts');
reset role; update fm_market_offers set status = 'accepted' where id = '7e000000-0000-4000-8000-000000000001';
select pg_temp.as_user('70000000-0000-4000-8000-000000000072');
select pg_temp.ok(fm_thread_open('market', '7e000000-0000-4000-8000-000000000001')->>'thread' is not null, 'messages: FlatMart: the seller can chat once the offer is accepted');
-- Flatsplits: the group's members who have an account
reset role;
insert into fm_split_groups (id, name) values ('7f000000-0000-4000-8000-000000000001', 'Flat 4B') on conflict do nothing;
insert into fm_split_members (group_id, name, phone) values ('7f000000-0000-4000-8000-000000000001', 'Meera', '9800000071'),
  ('7f000000-0000-4000-8000-000000000001', 'Arjun', '9800000072') on conflict do nothing;
select pg_temp.as_user('70000000-0000-4000-8000-000000000072');
select fm_thread_open('split', '7f000000-0000-4000-8000-000000000001')->>'thread' as grp \gset
select pg_temp.ok(fm_thread_send(:'grp', 'Rent is due Friday')->>'message' is not null and fm_thread_get(:'grp')->'people' = '["Meera"]'::jsonb, 'messages: Flatsplits: the group can chat');
select pg_temp.as_user('70000000-0000-4000-8000-000000000073');
select pg_temp.ok(fm_thread_open('split', '7f000000-0000-4000-8000-000000000001')->>'error' = 'not-yet' and fm_thread_get(:'grp')->>'error' = 'not-found', 'messages: Flatsplits: not someone outside the group');
reset role;
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_thread_people(uuid)', 'execute') and not has_function_privilege('authenticated', 'public.fm_thread_audience(uuid)', 'execute')
  and has_function_privilege('service_role', 'public.fm_thread_audience(uuid)', 'execute'), 'messages: the helpers can''t be called from the app; the push function can');
