-- 6. "Just Flatsplits & FlatMart" accounts: no parties nearby and no room requests until the vibe questions are answered
insert into auth.users (id, phone) values ('30000000-0000-4000-8000-000000000030', '919800000009');
insert into fm_profiles (id, phone, full_name, gender, adult_at, vibe) values ('30000000-0000-4000-8000-000000000030', '919800000009', 'Ira Sen', 'female', now(), '{"gen":"z"}')
on conflict (id) do update set gender = excluded.gender, adult_at = excluded.adult_at, vibe = excluded.vibe;
select pg_temp.as_user('30000000-0000-4000-8000-000000000030');
select pg_temp.err($$select fm_set_profile('Ira Sen', 'splits')$$) as setrole \gset
select pg_temp.ok(:'setrole' = '' and (select role from fm_profiles where id = '30000000-0000-4000-8000-000000000030') = 'splits', 'splits: an account can sign up for Flatsplits and FlatMart only');
select pg_temp.ok(pg_temp.err($$select fm_set_profile(null, 'admin')$$) like '%bad-role%', 'splits: any other role is refused');
select pg_temp.ok(pg_temp.err($$select fm_party_nearby_set(true, '{"lat":18.568,"lng":73.77}', 'Baner')$$) like '%need-vibe%', 'splits: cannot switch parties nearby on before the vibe questions');
update fm_profiles set parties_nearby = true, party_pin = '{"lat":18.565,"lng":73.775}' where id = '30000000-0000-4000-8000-000000000030';
select pg_temp.ok(fm_party_cant_see((select id from fm_parties where code = :'code2'), '30000000-0000-4000-8000-000000000030') = 'need-vibe' and (select count(*) from fm_party_nearby()) = 0,
  'splits: sees no parties nearby, even if switched on by other means (need-vibe)');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code2')) like '%need-vibe%', 'splits: cannot ask to join a party nearby');
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000006', 'Ira''s party', 'party', '30000000-0000-4000-8000-000000000030');
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000006', 'Ira', '9800000009');
select fm_party_save('99999999-0000-4000-8000-000000000006', jsonb_build_object('occasion', 'party', 'title', 'Ira''s party', 'starts_at', now() + interval '2 days')) as code6 \gset
select pg_temp.ok(:'code6' <> '', 'splits: can still make a party invite for friends (Flatsplits)');
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000006', '{"open":true,"guest_limit":4,"entry":"free","area":"Baner","near_address":"F-2, Baner","near_geo":{"lat":18.56,"lng":73.78}}')$$) like '%need-vibe%',
  'splits: cannot open a party to people nearby');
-- a seeker without the vibe answers can't send a room request either
update fm_profiles set role = 'seeker' where id = '30000000-0000-4000-8000-000000000030';
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status) select gen_random_uuid(), 'f0000000-0000-4000-8000-00000000000f', 'room', 'Test room', 'Pune', 'Baner', 2, 10000, 'active'
  where not exists (select 1 from fm_listings where title = 'Test room');
select pg_temp.ok((select x.error from fm_request((select id from fm_listings where title = 'Test room' limit 1), 'Hi') x) = 'need-vibe', 'splits: a room request needs the vibe answers (need-vibe)');
-- after answering as a seeker, parties nearby open
update fm_profiles set vibe = '{"sleep":1,"clean":1,"food":1,"cook":1,"drinks":1,"guests":1,"gen":"z"}' where id = '30000000-0000-4000-8000-000000000030';
select pg_temp.ok(fm_party_cant_see((select id from fm_parties where code = :'code2'), '30000000-0000-4000-8000-000000000030') is null, 'splits: once the vibe questions are answered as a seeker, parties nearby open');
-- signing in again with "Just Flatsplits & FlatMart" keeps a seeker a seeker
select fm_set_profile(null, 'splits') is null as again \gset
select pg_temp.ok((select role from fm_profiles where id = '30000000-0000-4000-8000-000000000030') = 'seeker', 'splits: picking it again at sign-in never takes rooms away from a seeker');
