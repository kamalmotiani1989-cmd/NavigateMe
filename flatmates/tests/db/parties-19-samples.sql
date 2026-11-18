-- 19. Sample parties (Kamal, 18 Nov: "create some samples for parties so that i can check the map and test the same.
-- Create some 15 parties"). fm_sample_parties(lat, lng, areas) hosts 15 open parties around a point from sample
-- accounts; the app is told they are samples; asking to join one is accepted straight away; nothing is notified;
-- running it again moves them; none of it can be called from the app.
-- People of this file: 20 sample people (no phone, nobody can sign in as them); Tara, a tester whose place is the
-- point; Uma, a tester 1.2 km east of it; Vani, a real host near them with a real open party.
select pg_temp.ok((select count(*) from fm_profiles where sample) = 0
  and pg_temp.err($$select fm_sample_parties(18.5204, 73.8567, array['Shivajinagar'])$$) like '%no-samples%', 'samples: with no sample people yet there is nothing to host them, and it says so');
insert into auth.users (id) select ('5a000000-0000-4000-8000-0000000000' || lpad(i::text, 2, '0'))::uuid from generate_series(1, 20) i on conflict do nothing;
insert into fm_profiles (id, full_name, gender, role, sample, vibe)
select ('5a000000-0000-4000-8000-0000000000' || lpad(i::text, 2, '0'))::uuid,
       (array['Riya','Kabir','Meher','Arjun','Sana','Dev','Isha','Rohan','Kavya','Sameer'])[1 + i % 10] || ' ' || (array['Nair','Joshi','Bose','Menon'])[1 + i % 4],
       case when i % 2 = 0 then 'female' else 'male' end, 'seeker', true,
       jsonb_build_object('sleep', i % 3, 'clean', 1, 'food', 1, 'cook', i % 3, 'smoke', 0, 'drinks', 1, 'guests', 1, 'noise', i % 3, 'social', (i + 1) % 3, 'gen', case when i % 2 = 0 then 'z' else 'm' end)
  from generate_series(1, 20) i
on conflict (id) do update set full_name = excluded.full_name, gender = excluded.gender, role = excluded.role, sample = excluded.sample, vibe = excluded.vibe;
insert into auth.users (id, phone) values ('79000000-0000-4000-8000-000000000001', '919800000401'), ('79000000-0000-4000-8000-000000000002', '919800000402'),
  ('79000000-0000-4000-8000-000000000003', '919800000403') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, gender, role, adult_at, party_rules_v, party_rules_at, vibe) values
 ('79000000-0000-4000-8000-000000000001', '919800000401', 'Tara Sen',  'male',   'seeker', now(), 2, now(), '{"sleep":1,"clean":2,"social":2,"cook":1,"noise":1,"food":1,"gen":"z"}'),
 ('79000000-0000-4000-8000-000000000002', '919800000402', 'Uma Rao',   'female', 'seeker', now(), 2, now(), '{"sleep":1,"clean":1,"social":2,"cook":1,"noise":2,"food":1,"gen":"z"}'),
 ('79000000-0000-4000-8000-000000000003', '919800000403', 'Vani Shah', 'female', 'seeker', now(), 2, now(), '{"sleep":2,"clean":1,"social":1,"cook":1,"noise":1,"food":1,"gen":"m"}')
on conflict (id) do update set full_name = excluded.full_name, gender = excluded.gender, role = excluded.role, adult_at = excluded.adult_at,
  party_rules_v = excluded.party_rules_v, party_rules_at = excluded.party_rules_at, vibe = excluded.vibe;
-- Vani's own party, a real one, 600 m from the point
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000020', 'Game night', 'party', '79000000-0000-4000-8000-000000000003') on conflict do nothing;
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000020', 'Vani', '9800000403');
select pg_temp.as_user('79000000-0000-4000-8000-000000000003');
select fm_party_save('99999999-0000-4000-8000-000000000020', jsonb_build_object('occasion', 'games', 'title', 'Game night at Vani''s', 'starts_at', now() + interval '2 days', 'place', 'home')) as vcode \gset
select fm_party_open_save('99999999-0000-4000-8000-000000000020', '{"open":true,"guest_limit":6,"entry":"free","who":"all","radius_km":5,"area":"Deccan","near_address":"B-4, River View, Deccan, Pune","near_geo":{"lat":18.5250,"lng":73.8540}}') is not null as vopen \gset
-- Tara's place is the point; Uma's is 1.2 km east of it
select pg_temp.as_user('79000000-0000-4000-8000-000000000001');
select fm_party_nearby_set(true, '{"lat":18.5204,"lng":73.8567}', 'Shivajinagar') is not null as ton \gset
select pg_temp.as_user('79000000-0000-4000-8000-000000000002');
select fm_party_nearby_set(true, '{"lat":18.5204,"lng":73.8681}', 'Near you') is not null as uon \gset

-- what it refuses
select pg_temp.ok(pg_temp.err($$select fm_sample_parties(51.5, -0.12, array['London'])$$) like '%need-pin%' and pg_temp.err($$select fm_sample_parties(18.5204, 73.8567, array[' ', 'x'])$$) like '%bad-area%'
  and pg_temp.err($$select fm_sample_parties(18.5204, 73.8567, null)$$) like '%bad-area%', 'samples: a point outside India or no area name is refused');
select pg_temp.ok((select count(*) from fm_parties p where fm_is_sample(p.host_id)) = 0, 'samples: a refused call makes nothing');

-- the 15
truncate pg_temp.posts;
select fm_sample_parties(18.5204, 73.8567, array['Shivajinagar', 'Deccan', 'Model Colony']) as made \gset
create temp table smp as select p.*, fm_km(18.5204, 73.8567, (p.near_geo->>'lat')::float8, (p.near_geo->>'lng')::float8) as km_out, fm_party_taken(p.id) as taken
  from fm_parties p where fm_is_sample(p.host_id);
select pg_temp.ok(:made = 15 and (select count(*) from smp) = 15 and (select count(distinct host_id) from smp) = 15 and (select bool_and(open and not cancelled and who = 'all' and place = 'home') from smp)
  and (select count(distinct code) from smp where code ~ '^SMP[0-9A-F]{4}$') = 15, 'samples: 15 open parties, each with its own sample host, open to everyone, their codes starting SMP');
select pg_temp.ok((select array_agg(occasion order by occasion) from smp) = (select array_agg(o order by o) from unnest(fm_party_occasions()) o),
  'samples: one of each kind of party: ' || (select string_agg(occasion, ', ' order by starts_at) from smp));
select pg_temp.ok((select bool_and(starts_at >= now() + interval '59 minutes' and starts_at <= now() + interval '22 days' and ends_at > starts_at and ends_at <= starts_at + interval '6 hours') from smp)
  and (select count(*) from smp where (starts_at at time zone 'Asia/Kolkata')::date <= (now() at time zone 'Asia/Kolkata')::date + 2) >= 4
  and (select count(distinct (starts_at at time zone 'Asia/Kolkata')::date) from smp) >= 7,
  'samples: all still to come, the first within an hour or more and the last within three weeks, on ' || (select count(distinct (starts_at at time zone 'Asia/Kolkata')::date) from smp) || ' different days');
select pg_temp.ok((select bool_and(km_out between 0.3 and 3.6 and km_out + 1.2 < radius_km) from smp) and (select count(distinct round(km_out::numeric, 1)) from smp) >= 12,
  'samples: spread from ' || (select round(min(km_out)::numeric, 2) from smp) || ' to ' || (select round(max(km_out)::numeric, 2) from smp) || ' km from the point, each within its host''s reach with 1.2 km to spare');
select pg_temp.ok((select count(distinct (round((near_geo->>'lat')::numeric, 2), round((near_geo->>'lng')::numeric, 2))) from smp) >= 10
  and (select fm_km((a.near_geo->>'lat')::float8, (a.near_geo->>'lng')::float8, (b.near_geo->>'lat')::float8, (b.near_geo->>'lng')::float8) from smp a, smp b where a.occasion = 'games' and b.occasion = 'movie') between 0.05 and 0.2,
  'samples: they fall in ' || (select count(distinct (round((near_geo->>'lat')::numeric, 2), round((near_geo->>'lng')::numeric, 2))) from smp) || ' squares of the map''s grid, so the map has many circles; the first two are about 100 m apart, to share a mark');
select pg_temp.ok((select bool_and((entry = 'chip') = (entry_chip is not null) and (entry = 'chip' or (covers = '{}' and covers_other is null)) and covers <@ fm_party_covers()
    and not fm_party_alcohol(coalesce(covers_other, '')) and not fm_party_alcohol(title)) from smp)
  and (select count(*) from smp where entry = 'chip') between 5 and 7 and (select count(*) from smp where entry = 'free') >= 8,
  'samples: ' || (select count(*) from smp where entry = 'free') || ' free and ' || (select count(*) from smp where entry = 'chip') || ' with a chip-in, which never covers alcohol');
select pg_temp.ok((select bool_and(taken < guest_limit and guest_limit between 2 and 50) from smp) and (select count(*) from smp where taken = 0) = 1
  and (select count(*) from smp where guest_limit - taken <= 3) >= 3 and (select count(*) from smp where not plus_ones) = 2,
  'samples: none is full; one has nobody yet, ' || (select count(*) from smp where guest_limit - taken <= 3) || ' have three places or fewer left, two take no plus-ones');
select pg_temp.ok((select bool_and(fm_is_sample(r.user_id) and r.status = 'accepted' and r.checkin_code ~ '^[0-9A-F]{6}$' and r.user_id <> p.host_id) from fm_party_requests r join smp p on p.id = r.party_id)
  and (select count(*) from fm_party_requests r join smp p on p.id = r.party_id) = (select sum(taken) from smp),
  'samples: the guests already in are other sample people, never the host');
select pg_temp.ok((select count(*) from smp where area = 'Shivajinagar') = 5 and (select count(*) from smp where area = 'Deccan') = 5 and (select count(*) from smp where area = 'Model Colony') = 5
  and (select bool_and(near_address like '%(a sample address)' and near_address like '%' || area || '%') from smp), 'samples: the area names are used in turn, and every address says it is a sample address');
select pg_temp.ok((select count(*) from smp where title like '% at %''s' and title like '%' || split_part((select full_name from fm_profiles where id = smp.host_id), ' ', 1) || '''s') = 3
  and (select bool_and(g.kind = 'party' and g.name = p.title) from smp p join fm_split_groups g on g.id = p.group_id), 'samples: three are named after their host, and each has its own party group');
select pg_temp.ok((select count(*) from pg_temp.posts) = 0, 'samples: making them notifies nobody');

-- as a tester sees them
select pg_temp.as_user('79000000-0000-4000-8000-000000000001');
create temp table tsee as select x from fm_party_nearby() x;
select pg_temp.ok((select count(*) from tsee where (x->>'sample')::boolean) = 15 and (select count(*) from tsee where x->>'code' = :'vcode' and not (x->>'sample')::boolean) = 1,
  'samples: the tester at the point sees all 15, each marked as a sample; the real party beside them is not');
select pg_temp.ok((select bool_and(not (x ?| array['near_address','near_geo','address','geo','phone','host_phone']) and x->'zone' ? 'lat' and (x->>'km')::numeric between 0.3 and 3.6 and x->>'host' <> ''
    and jsonb_typeof(x->'host_vibe') = 'object' and (x->>'spots_left')::int >= 1) from tsee where (x->>'sample')::boolean),
  'samples: like any party, the list gives the area, the distance and a rounded zone, never an address, a pin or a number');
select pg_temp.as_user('79000000-0000-4000-8000-000000000002');
select pg_temp.ok((select count(*) from fm_party_nearby() x where (x->>'sample')::boolean) = 15, 'samples: a tester 1.2 km away sees all 15 too');

-- asking to join one: the sample host says yes straight away
select pg_temp.as_user('79000000-0000-4000-8000-000000000001');
select code as c1, guest_limit - taken as left1 from smp where occasion = 'games' \gset
select fm_party_request(:'c1', 'Board games fan, new to the area') as asked \gset
select fm_party_nearby_get(:'c1') as got \gset
select pg_temp.ok((:'asked'::jsonb)->'my_request'->>'status' = 'accepted' and (:'got'::jsonb)->'my_request'->>'status' = 'accepted' and (:'got'::jsonb)->>'checkin_code' ~ '^[0-9A-F]{6}$'
  and (:'got'::jsonb)->>'address' like '%(a sample address)' and (:'got'::jsonb)->'geo' ? 'lat' and coalesce((:'got'::jsonb)->>'host_phone', '') = '' and ((:'got'::jsonb)->>'spots_left')::int = :left1 - 1,
  'samples: a request to a sample party is accepted at once: a door code, the made-up address and its pin, no number, one place fewer');
select pg_temp.ok((select count(*) from pg_temp.posts) = 0, 'samples: and no notification goes out for it');
select pg_temp.ok(pg_temp.err(format($$select fm_party_request(%L)$$, :'c1')) like '%already-asked%', 'samples: asking twice is refused as for any party');
-- the places left are still counted first
select code as c2 from smp where occasion = 'movie' \gset
select pg_temp.ok(pg_temp.err(format($$select fm_party_request(%L, null, 2)$$, :'c2')) like '%not-enough-spots%', 'samples: two places left do not take a guest with two plus-ones');
select fm_party_request(:'c2', null, 1) as asked2 \gset
select pg_temp.ok((:'asked2'::jsonb)->'my_request'->>'status' = 'accepted' and ((:'asked2'::jsonb)->>'spots_left')::int = 0, 'samples: a guest with one plus-one takes the last two places');
-- changing your mind and asking again
select fm_party_withdraw(:'c1') is not null as wd \gset
select pg_temp.ok((select status from fm_party_requests r join fm_parties p on p.id = r.party_id where p.code = :'c1' and r.user_id = '79000000-0000-4000-8000-000000000001') = 'withdrawn', 'samples: you can drop out of one');
select fm_party_request(:'c1') as again \gset
select pg_temp.ok((:'again'::jsonb)->'my_request'->>'status' = 'accepted', 'samples: and ask again, which is accepted again');
-- a real host still decides for herself
select fm_party_request(:'vcode', 'Hello') as real \gset
select pg_temp.ok((:'real'::jsonb)->'my_request'->>'status' = 'pending' and (select count(*) from pg_temp.posts where body->>'event' = 'request') = 1,
  'samples: a request to a real host waits for her answer, and she is told, as before');

-- running it again somewhere else moves all 15
select fm_sample_parties(19.0760, 72.8777, array['Bandra']) as made2 \gset
select pg_temp.ok(:made2 = 15 and (select count(*) from fm_parties p where fm_is_sample(p.host_id)) = 15 and (select bool_and(area = 'Bandra' and fm_km(19.0760, 72.8777, (near_geo->>'lat')::float8, (near_geo->>'lng')::float8) <= 3.6) from fm_parties p where fm_is_sample(p.host_id))
  and not exists (select 1 from fm_parties where code = :'c1') and not exists (select 1 from fm_party_requests r join smp p on p.id = r.party_id),
  'samples: run again for another place, the 15 move there; the old ones and what was asked of them are gone');
select pg_temp.ok((select count(*) from fm_party_nearby() x where (x->>'sample')::boolean) = 0 and (select count(*) from fm_party_nearby() x where x->>'code' = :'vcode') = 1
  and (select status from fm_party_requests r join fm_parties p on p.id = r.party_id where p.code = :'vcode' and r.user_id = '79000000-0000-4000-8000-000000000001') = 'pending',
  'samples: the tester no longer sees them; the real party and the request to it are untouched');
select fm_sample_parties_clear() as cleared \gset
select pg_temp.ok(:cleared = 15 and (select count(*) from fm_parties p where fm_is_sample(p.host_id)) = 0 and (select count(*) from fm_split_groups g where fm_is_sample(g.created_by)) = 0
  and exists (select 1 from fm_parties where code = :'vcode') and (select count(*) from fm_profiles where sample) = 20, 'samples: clearing removes the 15 and their groups, and nothing else');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_sample_parties(double precision, double precision, text[])', 'execute')
  and not has_function_privilege('anon', 'public.fm_sample_parties(double precision, double precision, text[])', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_sample_parties_clear()', 'execute') and not has_function_privilege('anon', 'public.fm_sample_parties_clear()', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_sample_party_spots(double precision, double precision)', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_sample_party_request()', 'execute'), 'samples: none of this can be called from the app');
-- leave no samples behind for the files after this one
delete from fm_party_requests where user_id = '79000000-0000-4000-8000-000000000001';
delete from auth.users where id in (select id from fm_profiles where sample);
drop table smp; drop table tsee;
