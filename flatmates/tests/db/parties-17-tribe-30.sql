-- 17. Tribe shows people down to a 30% vibe match (Kamal, 16 Nov: "In tribe show the match upto 30%"; it was 70%).
-- Only the strong matches (70%+) are pushed when they appear; a yes, a bond and "complete your tribe" are pushed
-- whatever the score.
create table if not exists pg_temp.posts (body jsonb);
create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 1000)
returns bigint language plpgsql as $$ begin insert into pg_temp.posts values (body); return 1; end $$;
update fm_settings set notify_url = 'https://example.invalid/fm-notify', notify_secret = 'test-secret', charges_enabled = false;
-- Eight people looking in Tribepur (a made-up city, so nobody else in these tests is looking there). Isha answers 0 to everything. Against her:
-- Jai 100, Kiran 70, Pia 67, Lata 50, Mona 30, Nitin 27, Omar 0. (Food, smoking and pets count double.)
insert into auth.users (id, phone) select ('77000000-0000-4000-8000-0000000001' || lpad(g::text, 2, '0'))::uuid, '9198000002' || lpad(g::text, 2, '0') from generate_series(1, 8) g on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, search, vibe)
select ('77000000-0000-4000-8000-0000000001' || lpad(x.n::text, 2, '0'))::uuid, '9198000002' || lpad(x.n::text, 2, '0'), x.name, 'seeker', '{"city":"Tribepur","areas":[]}'::jsonb, x.vibe::jsonb
from (values
  (1, 'Isha Test',  '{"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"drinks":0,"guests":0,"noise":0,"social":0,"sharing":0,"work":0,"pets":0}'),
  (2, 'Jai Test',   '{"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"drinks":0,"guests":0,"noise":0,"social":0,"sharing":0,"work":0,"pets":0}'),
  (3, 'Kiran Test', '{"sleep":1,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":0}'),
  (4, 'Pia Test',   '{"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":0}'),
  (5, 'Lata Test',  '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":1,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":1}'),
  (6, 'Mona Test',  '{"sleep":1,"clean":1,"food":2,"cook":1,"smoke":2,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":2}'),
  (7, 'Nitin Test', '{"sleep":2,"clean":1,"food":2,"cook":1,"smoke":2,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":2}'),
  (8, 'Omar Test',  '{"sleep":2,"clean":2,"food":2,"cook":2,"smoke":2,"drinks":2,"guests":2,"noise":2,"social":2,"sharing":2,"work":2,"pets":2}')) x(n, name, vibe)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, search = excluded.search, vibe = excluded.vibe;
select pg_temp.ok((select array_agg(fm_match((select vibe from fm_profiles where id = '77000000-0000-4000-8000-000000000101'), p.vibe) order by p.phone)
    from fm_profiles p where p.phone between '919800000202' and '919800000208') = array[100, 70, 67, 50, 30, 27, 0], 'tribe 30: the test people score 100, 70, 67, 50, 30, 27 and 0 against Isha');
truncate pg_temp.posts;
select pg_temp.as_user('77000000-0000-4000-8000-000000000101');
select fm_tribe_refresh() as n1 \gset
select pg_temp.ok(:n1 = 5, 'tribe 30: everyone from 30% up is matched (5 people: 100, 70, 67, 50 and exactly 30)');
select pg_temp.ok((select array_agg(name || ' ' || match_pct order by match_pct desc) from fm_tribe_list()) = array['Jai 100', 'Kiran 70', 'Pia 67', 'Lata 50', 'Mona 30'],
  'tribe 30: my list has them, best vibe first, with the score');
reset role;
select pg_temp.ok(not exists (select 1 from fm_tribe_links where '77000000-0000-4000-8000-000000000107' in (a, b) or '77000000-0000-4000-8000-000000000108' in (a, b)),
  'tribe 30: someone at 27%, or at 0%, is not matched');
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'insert' and body ? 'tribe_id') = 2
  and (select array_agg(l.match_pct order by l.match_pct desc) from pg_temp.posts q join fm_tribe_links l on l.id = (q.body->>'tribe_id')::uuid) = array[100, 70],
  'tribe 30: only the strong new matches (70%+) are pushed: 100 and 70, not 67, 50 or 30');
select pg_temp.as_user('77000000-0000-4000-8000-000000000101');
select pg_temp.ok(fm_tribe_refresh() = 0 and (select count(*) from fm_tribe_list()) = 5, 'tribe 30: asking again adds nobody twice');
-- the other side sees it too, and a yes from a 30% match is a yes like any other
select pg_temp.as_user('77000000-0000-4000-8000-000000000106');
select id as mona_link from fm_tribe_list() where name = 'Isha' \gset
truncate pg_temp.posts;
select pg_temp.ok((select match_pct from fm_tribe_list() where name = 'Isha') = 30 and fm_tribe_answer(:'mona_link', true) = 'open', 'tribe 30: the 30% match sees me too and can say yes');
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'update' and body->>'tribe_id' = :'mona_link') = 1, 'tribe 30: a yes is pushed whatever the score');
select pg_temp.as_user('77000000-0000-4000-8000-000000000101');
select fm_tribe_answer(:'mona_link', true) as bond \gset
select pg_temp.ok(:'bond' = 'bonded'
  and (select status = 'bonded' and phone = '919800000206' from fm_tribe_list() where name = 'Mona'), 'tribe 30: both say yes: a tribe, and the number is shared');
-- someone joining to complete a tribe is announced whatever the score
reset role; truncate pg_temp.posts;
insert into fm_tribe_links (a, b, match_pct, kind) values ('77000000-0000-4000-8000-000000000107', '77000000-0000-4000-8000-000000000108', 40, 'complete');
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'insert') = 1, 'tribe 30: "complete your tribe" is still pushed at 40%');
delete from fm_tribe_links where a = '77000000-0000-4000-8000-000000000107' and b = '77000000-0000-4000-8000-000000000108';
-- a big city: the best 60 new people a time, then the rest
insert into auth.users (id, phone) select ('77100000-0000-4000-8000-0000000002' || lpad(g::text, 2, '0'))::uuid, '9198000003' || lpad(g::text, 2, '0') from generate_series(0, 65) g on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, search, vibe)
select ('77100000-0000-4000-8000-0000000002' || lpad(g::text, 2, '0'))::uuid, '9198000003' || lpad(g::text, 2, '0'), 'Big ' || g, 'seeker', '{"city":"Bigcitypur","areas":[]}'::jsonb,
  case when g = 0 then '{"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"drinks":0,"guests":0,"noise":0,"social":0,"sharing":0,"work":0,"pets":0}'
       when g <= 5 then '{"sleep":1,"clean":1,"food":2,"cook":1,"smoke":2,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":2}'
       else '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":1,"drinks":1,"guests":1,"noise":1,"social":1,"sharing":1,"work":1,"pets":1}' end::jsonb
from generate_series(0, 65) g
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, search = excluded.search, vibe = excluded.vibe;   -- the sign-up trigger made the rows
truncate pg_temp.posts;
select pg_temp.as_user('77100000-0000-4000-8000-000000000200');
select fm_tribe_refresh() as k1 \gset
reset role;
select pg_temp.ok(:k1 = 60 and (select count(*) = 60 and min(match_pct) = 50 from fm_tribe_links where '77100000-0000-4000-8000-000000000200' in (a, b)),
  'tribe 30: in a big city one call brings the best 60 new people (all the 50% ones before any 30%)');
select pg_temp.as_user('77100000-0000-4000-8000-000000000200');
select fm_tribe_refresh() as k2 \gset
reset role;
select pg_temp.ok(:k2 = 5 and (select count(*) = 65 and count(*) filter (where match_pct = 30) = 5 from fm_tribe_links where '77100000-0000-4000-8000-000000000200' in (a, b))
  and (select count(*) from pg_temp.posts) = 0, 'tribe 30: the next call brings the remaining 5; none of these 65 (50% and 30%) was pushed');
select pg_temp.as_user('77100000-0000-4000-8000-000000000200');
select pg_temp.ok((select count(*) from fm_tribe_list()) = 65 and (select match_pct from fm_tribe_list() limit 1) = 50, 'tribe 30: and the list shows them, strongest first');
reset role;
