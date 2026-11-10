-- People: Hema hosts (female, Baner); Asha (female, 2 km away), Bharat (male, 2 km), Chitra (female, 12 km away),
-- Divya (female, near but has not switched parties on), Esha (female, near, not 18+ confirmed).
\set ON_ERROR_STOP on
create or replace function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u::text, false), set_config('request.jwt.claim.role', 'authenticated', false); $$;
create or replace function pg_temp.ok(c boolean, m text) returns text language sql as $$ select case when c then 'PASS ' else 'FAIL ' end || m $$;
-- runs a statement and returns the error text ('' when it worked)
create or replace function pg_temp.err(q text) returns text language plpgsql as $$
begin execute q; return ''; exception when others then return sqlerrm; end $$;
insert into auth.users (id, phone) values
 ('a0000000-0000-4000-8000-00000000000a', '919800000001'), ('b0000000-0000-4000-8000-00000000000b', '919800000002'),
 ('c0000000-0000-4000-8000-00000000000c', '919800000003'), ('d0000000-0000-4000-8000-00000000000d', '919800000004'),
 ('e0000000-0000-4000-8000-00000000000e', '919800000005'), ('f0000000-0000-4000-8000-00000000000f', '919800000006'),
 ('10000000-0000-4000-8000-000000000010', '919800000007'), ('20000000-0000-4000-8000-000000000020', '919800000008');
insert into fm_profiles (id, phone, full_name, gender, adult_at, vibe) values
 ('f0000000-0000-4000-8000-00000000000f', '919800000006', 'Hema Rao',   'female', now(), '{"sleep":1,"clean":2,"social":2,"cook":1,"noise":1,"food":1,"gen":"m"}'),
 ('a0000000-0000-4000-8000-00000000000a', '919800000001', 'Asha Iyer',  'female', now(), '{"sleep":1,"clean":2,"social":2,"cook":1,"noise":2,"food":1,"gen":"z"}'),
 ('b0000000-0000-4000-8000-00000000000b', '919800000002', 'Bharat N',   'male',   now(), '{"sleep":2,"clean":0,"social":1,"cook":1,"noise":1,"food":1,"gen":"z"}'),
 ('c0000000-0000-4000-8000-00000000000c', '919800000003', 'Chitra K',   'female', now(), '{"sleep":1,"clean":1,"food":1,"cook":1,"drinks":1,"guests":1,"gen":"z"}'),
 ('d0000000-0000-4000-8000-00000000000d', '919800000004', 'Divya S',    'female', now(), '{"sleep":1,"clean":1,"food":1,"cook":1,"drinks":1,"guests":1,"gen":"z"}'),
 ('e0000000-0000-4000-8000-00000000000e', '919800000005', 'Esha P',     'female', null,  '{"sleep":1,"clean":1,"food":1,"cook":1,"drinks":1,"guests":1,"gen":"z"}'),
 ('10000000-0000-4000-8000-000000000010', '919800000007', 'Farah M',    'female', now(), '{"sleep":1,"clean":1,"food":1,"cook":1,"drinks":1,"guests":1,"gen":"z"}'),
 ('20000000-0000-4000-8000-000000000020', '919800000008', 'Gita V',     'female', now(), '{"sleep":1,"clean":1,"food":1,"cook":1,"drinks":1,"guests":1,"gen":"z"}')
on conflict (id) do update set full_name = excluded.full_name, gender = excluded.gender, adult_at = excluded.adult_at, vibe = excluded.vibe;
-- everyone here has answered the vibe questions as a seeker (parties nearby need them)
update fm_profiles set role = 'seeker' where phone like '9198000000%';
-- and everyone here has agreed to the party rules (parties-12 checks what happens without)
update fm_profiles set party_rules_v = 2, party_rules_at = now() where phone like '9198000000%';
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000001', 'Diwali night', 'party', 'f0000000-0000-4000-8000-00000000000f');
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000001', 'Hema', '9800000006');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select fm_party_save('99999999-0000-4000-8000-000000000001', jsonb_build_object('occasion', 'festival', 'title', 'Diwali night at Hema''s',
  'starts_at', now() + interval '3 days', 'place', 'home')) as code \gset
