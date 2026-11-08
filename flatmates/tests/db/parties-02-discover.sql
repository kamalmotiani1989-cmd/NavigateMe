-- 2. Discovery: only people who switched it on, within the radius, of the gender the host picked, before it's full
-- Hema's party (from part 1) is at Baner (18.5590, 73.7868), women only, 3 km, 4 guests.
\set NEAR '''{"lat":18.5680,"lng":73.7700}'''
\set FAR  '''{"lat":18.5204,"lng":73.8567}'''
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok(not (select count(*) > 0 from fm_party_nearby()), 'discover: nothing shows until "Show me parties nearby" is on (opted out)');
select pg_temp.ok(pg_temp.err($$select fm_party_nearby_set(true)$$) like '%need-pin%', 'discover: switching on needs a pin to measure from');
select (fm_party_nearby_set(true, :NEAR, 'Baner'))->>'on' as on_a \gset
select pg_temp.ok(:'on_a' = 'true', 'discover: Asha switches it on near Baner');
select fm_party_nearby() as a \gset
select pg_temp.ok((:'a'::jsonb)->>'title' = 'Diwali night at Hema''s' and (:'a'::jsonb)->>'area' = 'Baner' and ((:'a'::jsonb)->>'km')::numeric between 1.5 and 2.5
  and (:'a'::jsonb)->>'host' = 'Hema' and (:'a'::jsonb)->>'spots_left' = '4' and (:'a'::jsonb)->>'entry_chip' = '300' and (:'a'::jsonb)->'host_vibe'->>'gen' = 'm'
  and (:'a'::jsonb)->>'house_rules' like 'No smoking%', 'discover: Asha sees what, when, area and distance, chip-in, spots left, host and house rules: ' || :'a');
select pg_temp.ok(not ((:'a'::jsonb) ?| array['near_address','near_geo','address','geo','phone','host_phone']) and :'a' not like '%Green Woods%' and :'a' not like '%9800000006%',
  'discover: before acceptance, no address, pin or number in what Asha sees');
-- wrong gender, out of radius, opted out, not 18+
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b'); select fm_party_nearby_set(true, :NEAR, 'Baner') is not null as on_b \gset
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0 and fm_party_cant_see((select id from fm_parties where code = :'code'), 'b0000000-0000-4000-8000-00000000000b') = 'wrong-gender', 'discover: a women-only party is hidden from Bharat (wrong gender)');
select pg_temp.as_user('c0000000-0000-4000-8000-00000000000c'); select fm_party_nearby_set(true, :FAR, 'Shivajinagar') is not null as on_c \gset
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0 and fm_party_cant_see((select id from fm_parties where code = :'code'), 'c0000000-0000-4000-8000-00000000000c') = 'out-of-radius', 'discover: hidden from Chitra, 10 km away (out of radius)');
select pg_temp.as_user('d0000000-0000-4000-8000-00000000000d');
update fm_profiles set party_pin = :NEAR::jsonb where id = 'd0000000-0000-4000-8000-00000000000d';
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0 and fm_party_cant_see((select id from fm_parties where code = :'code'), 'd0000000-0000-4000-8000-00000000000d') = 'opted-out', 'discover: hidden from Divya, near but switched off (opted out)');
select pg_temp.as_user('e0000000-0000-4000-8000-00000000000e');
select pg_temp.ok(pg_temp.err($$select fm_party_nearby_set(true, '{"lat":18.568,"lng":73.77}')$$) like '%age-required%', 'discover: Esha, not confirmed 18+, cannot switch it on');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f'); select fm_party_nearby_set(true, :NEAR, 'Baner') is not null as on_h \gset
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0, 'discover: hosts do not see their own party in the list');
-- everyone for the men-only and open checks: a second party, everyone welcome, then a past one
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b');
select pg_temp.ok(fm_party_cant_see(null, null) = 'not-signed-in', 'discover: signed-out callers see nothing');
-- switching off hides it again
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select fm_party_nearby_set(false) is not null as off_a \gset
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0, 'discover: switching it off hides parties again');
select fm_party_nearby_set(true) is not null as on_a2 \gset
select pg_temp.ok((select count(*) from fm_party_nearby()) = 1, 'discover: switching back on keeps the pin');
-- a party that has started is not listed
update fm_parties set starts_at = now() - interval '1 hour' where code = :'code';
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0, 'discover: a party that has started is not listed');
update fm_parties set starts_at = now() + interval '3 days' where code = :'code';
