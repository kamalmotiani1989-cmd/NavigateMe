-- 18. Parties on a map (Kamal, 17 Nov: "Check how the search happens on parties own discover page through maps. Can we
-- build this also"). What someone nearby gets for the map is 'zone': the party's pin rounded to two decimals, the rule
-- a home's public pin follows. Never the pin itself or the address before the host accepts; after, both, as before.
-- Zoya hosts at 18.55934, 73.78677 (Baner); Yami is 1 km away. Their own people, so nothing above changes these checks.
insert into auth.users (id, phone) values ('78000000-0000-4000-8000-000000000001', '919800000301'), ('78000000-0000-4000-8000-000000000002', '919800000302') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, gender, role, adult_at, party_rules_v, party_rules_at, vibe) values
 ('78000000-0000-4000-8000-000000000001', '919800000301', 'Zoya Khan', 'female', 'seeker', now(), 2, now(), '{"sleep":1,"clean":2,"social":2,"cook":1,"noise":1,"food":1,"gen":"z"}'),
 ('78000000-0000-4000-8000-000000000002', '919800000302', 'Yami Shah', 'female', 'seeker', now(), 2, now(), '{"sleep":1,"clean":1,"social":2,"cook":1,"noise":2,"food":1,"gen":"z"}')
on conflict (id) do update set full_name = excluded.full_name, gender = excluded.gender, role = excluded.role, adult_at = excluded.adult_at,
  party_rules_v = excluded.party_rules_v, party_rules_at = excluded.party_rules_at, vibe = excluded.vibe;
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000018', 'Terrace night', 'party', '78000000-0000-4000-8000-000000000001') on conflict do nothing;
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000018', 'Zoya', '9800000301');
select pg_temp.as_user('78000000-0000-4000-8000-000000000001');
select fm_party_save('99999999-0000-4000-8000-000000000018', jsonb_build_object('occasion', 'terrace', 'title', 'Terrace night at Zoya''s', 'starts_at', now() + interval '2 days', 'place', 'home')) as zcode \gset
select fm_party_open_save('99999999-0000-4000-8000-000000000018', '{"open":true,"guest_limit":5,"entry":"free","who":"all","radius_km":3,"area":"Baner","near_address":"C-7, Skyline Heights, Baner Road, Pune","near_geo":{"lat":18.55934,"lng":73.78677}}') is not null as zopen \gset
select pg_temp.as_user('78000000-0000-4000-8000-000000000002');
select fm_party_nearby_set(true, '{"lat":18.5680,"lng":73.7850}', 'Baner') is not null as zon \gset
select x as zrow from fm_party_nearby() x where x->>'code' = :'zcode' \gset
select pg_temp.ok((:'zrow'::jsonb)->'zone' = '{"lat":18.56,"lng":73.79}'::jsonb, 'map: someone nearby gets the party''s zone, the pin rounded to two decimals: ' || ((:'zrow'::jsonb)->'zone')::text);
select pg_temp.ok(not ((:'zrow'::jsonb) ?| array['near_address','near_geo','address','geo','phone','host_phone']) and :'zrow' not like '%18.55934%' and :'zrow' not like '%73.78677%'
  and :'zrow' not like '%Skyline%', 'map: the list still carries no address, pin or number, anywhere in it');
select pg_temp.ok(((:'zrow'::jsonb)->>'km')::numeric between 0.8 and 1.2 and (:'zrow'::jsonb)->>'area' = 'Baner', 'map: the area and the distance are what they were: ' || ((:'zrow'::jsonb)->>'km'));
-- the zone is a square of the grid, not the pin: about half a kilometre can lie between the two, and here does
select pg_temp.ok(fm_km(18.55934, 73.78677, ((:'zrow'::jsonb)->'zone'->>'lat')::float8, ((:'zrow'::jsonb)->'zone'->>'lng')::float8) between 0.2 and 0.8,
  'map: the zone is not the flat (it is ' || round(fm_km(18.55934, 73.78677, 18.56, 73.79)::numeric, 2) || ' km from it), and the flat is inside an 800 m circle around it');
select fm_party_nearby_get(:'zcode') as zget \gset
select pg_temp.ok((:'zget'::jsonb)->'zone' = '{"lat":18.56,"lng":73.79}'::jsonb and not ((:'zget'::jsonb) ?| array['address','geo','host_phone']), 'map: the party''s own page has the same zone and nothing finer before the host accepts');
-- a second party in the same square of the grid gets the same zone, so the map can draw one mark for both
select pg_temp.as_user('78000000-0000-4000-8000-000000000001');
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000019', 'Brunch', 'party', '78000000-0000-4000-8000-000000000001') on conflict do nothing;
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000019', 'Zoya', '9800000301');
select fm_party_save('99999999-0000-4000-8000-000000000019', jsonb_build_object('occasion', 'brunch', 'title', 'Brunch at Zoya''s', 'starts_at', now() + interval '4 days', 'place', 'home')) as zcode2 \gset
select fm_party_open_save('99999999-0000-4000-8000-000000000019', '{"open":true,"guest_limit":4,"entry":"free","who":"all","radius_km":3,"area":"Baner","near_address":"A-2, Lake View, Baner, Pune","near_geo":{"lat":18.5561,"lng":73.7942}}') is not null as zopen2 \gset
select pg_temp.as_user('78000000-0000-4000-8000-000000000002');
select pg_temp.ok((select count(distinct x->'zone') from fm_party_nearby() x where x->>'code' in (:'zcode', :'zcode2')) = 1
  and (select count(*) from fm_party_nearby() x where x->>'code' in (:'zcode', :'zcode2')) = 2, 'map: two parties in the same square share one zone');
-- asked and accepted: the address and the pin arrive as before; the zone stays the rounded one
select fm_party_request(:'zcode', 'New to Baner, would love to come') is not null as zreq \gset
select pg_temp.ok(not (fm_party_nearby_get(:'zcode') ?| array['address','geo']), 'map: still only the zone while the request waits');
select pg_temp.as_user('78000000-0000-4000-8000-000000000001');
select fm_party_decide((select r.id from fm_party_requests r join fm_parties p on p.id = r.party_id where p.code = :'zcode' and r.user_id = '78000000-0000-4000-8000-000000000002'), true) is not null as zacc \gset
select pg_temp.as_user('78000000-0000-4000-8000-000000000002');
select fm_party_nearby_get(:'zcode') as zin \gset
select pg_temp.ok((:'zin'::jsonb)->'geo' = '{"lat":18.55934,"lng":73.78677}'::jsonb and (:'zin'::jsonb)->>'address' like 'C-7, Skyline Heights%' and (:'zin'::jsonb)->'zone' = '{"lat":18.56,"lng":73.79}'::jsonb,
  'map: once the host accepts, the guest gets the address and the exact pin, as before');
-- the invite page for friends (the link) has no zone and no private address
select pg_temp.ok(not (fm_party_json(:'zcode') ?| array['zone','near_address','near_geo']), 'map: the invite link carries no zone, private address or pin');
-- "How was it?": a party I went to stays in my list for three days after it ends, marked ended, so the thumbs can be reached
update fm_parties set starts_at = now() - interval '6 hours', ends_at = now() - interval '2 hours' where code = :'zcode';
select x as zpast from fm_party_nearby() x where x->>'code' = :'zcode' \gset
select pg_temp.ok((:'zpast'::jsonb)->>'ended' = 'true' and (:'zpast'::jsonb)->'my_request'->>'status' = 'accepted' and not ((:'zpast'::jsonb) ?| array['address','geo','host_phone']),
  'past: a party I went to is still in my list after it ends, marked ended (and the list still has no address)');
select fm_party_rate(:'zcode', null, true);
select pg_temp.ok((select (x->>'my_rating')::boolean from fm_party_nearby() x where x->>'code' = :'zcode') = true, 'past: my thumbs up for the host is kept and comes back with the party');
update fm_parties set starts_at = now() - interval '5 days', ends_at = now() - interval '4 days' where code = :'zcode';
select pg_temp.ok(not exists (select 1 from fm_party_nearby() x where x->>'code' = :'zcode'), 'past: three days after it ended it leaves the list');
-- a party that was called off is not kept
update fm_parties set starts_at = now() - interval '6 hours', ends_at = now() - interval '2 hours', cancelled = true where code = :'zcode';
select pg_temp.ok(not exists (select 1 from fm_party_nearby() x where x->>'code' = :'zcode'), 'past: a party that was called off is not kept');
update fm_parties set cancelled = false, starts_at = now() + interval '2 days', ends_at = null where code = :'zcode';
