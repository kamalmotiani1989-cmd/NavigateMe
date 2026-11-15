-- 15. A home's living-style answers always end up on the listing (Kamal, 15 Nov: "in escape the room vibe score
-- should be visible"). A room posted without them took none (the form's copy lived on one phone), so nobody could be
-- scored against it. fm_listing_vibe fills them from the lister's own answers; the trigger keeps it so on every
-- post and edit; listings that have their own answers are never touched.
insert into auth.users (id, phone) values ('75000000-0000-4000-8000-000000000151', '919800000151'), ('75000000-0000-4000-8000-000000000152', '919800000152'),
  ('75000000-0000-4000-8000-000000000153', '919800000153') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, gender, vibe, search, discoverable) values
  ('75000000-0000-4000-8000-000000000151', '919800000151', 'Owner Withanswers', 'owner', 'male',
     '{"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m","junk":"x"}', '{}', true),
  ('75000000-0000-4000-8000-000000000152', '919800000152', 'Owner Noanswers', 'owner', 'male', '{}', '{}', true),
  ('75000000-0000-4000-8000-000000000153', '919800000153', 'Sita Seeker', 'seeker', 'female',
     '{"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":0,"guests":2,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m"}', '{"city":"Vtest","areas":[]}', true)
  on conflict (id) do update set vibe = excluded.vibe, search = excluded.search, role = excluded.role;
-- the rule itself
select pg_temp.ok(fm_vibe_count(fm_listing_vibe('{"residents":0}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}')) = 4
  and fm_listing_vibe('{"residents":0}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}')->>'gen' = 'z'
  and fm_listing_vibe('{"residents":0}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}')->>'residents' = '0',
  'listing vibe: a listing with no answers takes the lister''s, and keeps everything else it says');
select pg_temp.ok(fm_listing_vibe('{"sleep":0,"clean":0,"food":0,"cook":0,"gen":"g"}', '{"sleep":2,"clean":2,"food":2,"cook":2,"smoke":2,"gen":"z"}') = '{"sleep":0,"clean":0,"food":0,"cook":0,"gen":"g"}'::jsonb,
  'listing vibe: a listing with its own answers (4 or more) is left exactly as it is');
select pg_temp.ok(fm_listing_vibe('{"sleep":0,"residents":2}', '{"sleep":2,"clean":2,"food":2,"cook":2,"gen":"z"}') = '{"sleep":0,"clean":2,"food":2,"cook":2,"gen":"z","residents":2}'::jsonb,
  'listing vibe: with fewer than 4 of its own, the lister''s come in and the listing''s own stay on top');
select pg_temp.ok(fm_listing_vibe('{"residents":1}', '{"sleep":1,"clean":1}') = '{"residents":1}'::jsonb and fm_listing_vibe('{"residents":1}', null) = '{"residents":1}'::jsonb
  and fm_listing_vibe(null, null) is null, 'listing vibe: a lister with fewer than 4 answers changes nothing');
select pg_temp.ok(not (fm_listing_vibe('{}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"q","junk":"x","pets":"two"}') ?| array['gen','junk','pets']),
  'listing vibe: only the 12 questions and a known generation are copied, nothing else from the profile');
-- on the table: filled when posted, kept when it has its own, left empty when the lister has none
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, gender, household) values
  ('7b000000-0000-4000-8000-000000000151', '75000000-0000-4000-8000-000000000151', 'room', 'V1 nobody lives there yet', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":0}'),
  ('7b000000-0000-4000-8000-000000000152', '75000000-0000-4000-8000-000000000151', 'room', 'V2 own answers', 'Vtest', 'Varea', 2, 9000, 'active', 'any',
     '{"residents":2,"sleep":0,"clean":0,"food":2,"cook":0,"smoke":2,"drinks":2,"guests":0,"noise":2,"social":0,"sharing":0,"work":2,"pets":0,"gen":"z"}'),
  ('7b000000-0000-4000-8000-000000000153', '75000000-0000-4000-8000-000000000152', 'room', 'V3 lister has none', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":1}')
  on conflict (id) do nothing;
select pg_temp.ok((select fm_vibe_count(household) = 12 and household->>'gen' = 'm' and household->>'residents' = '0' and not household ? 'junk' from fm_listings where id = '7b000000-0000-4000-8000-000000000151'),
  'posted without answers: the listing now carries the lister''s 12 answers and generation');
select pg_temp.ok((select household->>'sleep' = '0' and household->>'gen' = 'z' and household->>'residents' = '2' from fm_listings where id = '7b000000-0000-4000-8000-000000000152'),
  'posted with its own answers: untouched');
select pg_temp.ok((select fm_vibe_count(household) = 0 from fm_listings where id = '7b000000-0000-4000-8000-000000000153'), 'the lister has no answers either: the listing stays without');
-- The Empty Room Escape: now there is a score
select pg_temp.as_user('75000000-0000-4000-8000-000000000151');
select pg_temp.ok((select match_pct from fm_find_seekers('7b000000-0000-4000-8000-000000000151') where seeker_id = '75000000-0000-4000-8000-000000000153') =
  fm_match((select vibe from fm_profiles where id = '75000000-0000-4000-8000-000000000153'), (select vibe from fm_profiles where id = '75000000-0000-4000-8000-000000000151')),
  'Escape: a room that came without answers now shows each person''s vibe score: ' || coalesce((select match_pct::text from fm_find_seekers('7b000000-0000-4000-8000-000000000151') where seeker_id = '75000000-0000-4000-8000-000000000153'), 'none'));
select pg_temp.ok((select match_pct from fm_find_seekers('7b000000-0000-4000-8000-000000000152') where seeker_id = '75000000-0000-4000-8000-000000000153') is not null, 'Escape: and a room with its own answers scores against those');
select pg_temp.as_user('75000000-0000-4000-8000-000000000152');
select pg_temp.ok((select count(*) = 1 and bool_and(match_pct is null) from fm_find_seekers('7b000000-0000-4000-8000-000000000153')), 'Escape: no answers anywhere means no score (the app then asks the lister to add them)');
-- the seeker sees the same score on the home
select pg_temp.as_user('75000000-0000-4000-8000-000000000153');
select pg_temp.ok((select fm_match((select vibe from fm_profiles where id = auth.uid()), household) from fm_search(p_city => 'Vtest') where id = '7b000000-0000-4000-8000-000000000151') is not null,
  'Discover: the person looking gets the answers with the home, so the same score shows on their side');
-- an edit that sends no answers doesn't lose them; one that sends its own keeps its own
select pg_temp.as_user('75000000-0000-4000-8000-000000000151');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000151', p_kind => 'room', p_title => 'V1 nobody lives there yet', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9500, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.', p_household => '{"residents":1}') is null as edited;
select pg_temp.ok((select rent = 9500 and fm_vibe_count(household) = 12 and household->>'residents' = '1' from fm_listings where id = '7b000000-0000-4000-8000-000000000151'),
  'an edit from an older app that sends no answers: the listing keeps answers (the lister''s), and takes the rest of the edit');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000151', p_kind => 'room', p_title => 'V1 nobody lives there yet', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9500, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.',
  p_household => '{"residents":1,"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"gen":"g"}') is null as edited;
select pg_temp.ok((select household = '{"residents":1,"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"gen":"g"}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000151'),
  'an edit with the home''s own answers: saved exactly as sent');
-- a new post through the app''s own function, without answers
select fm_post_listing(p_kind => 'room', p_title => 'V4 posted from another phone', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2, p_rent => 11000, p_deposit => 0,
  p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Posted without the household answers.',
  p_contact_name => 'Owner', p_contact_phone => '9800000151', p_address => 'A-1, Tower, Varea', p_household => '{"residents":1,"flatmates":[]}',
  p_address_parts => '{"flat":"A-1","building":"Tower","pin":"411045"}') as v4 \gset
select pg_temp.ok((select fm_vibe_count(household) = 12 and household->>'gen' = 'm' and household ? 'flatmates' from fm_listings where id = :'v4'), 'a new room posted without answers comes out with the lister''s');
-- the one-time fill for rooms posted before this (same statement as in schema.sql), on a row made the old way
alter table fm_listings disable trigger fm_listings_vibe_fill;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, gender, household) values
  ('7b000000-0000-4000-8000-000000000155', '75000000-0000-4000-8000-000000000151', 'room', 'V5 posted before the fix', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":0}');
alter table fm_listings enable trigger fm_listings_vibe_fill;
select pg_temp.ok((select fm_vibe_count(household) = 0 from fm_listings where id = '7b000000-0000-4000-8000-000000000155'), '(a room as they were posted before: no answers)');
update public.fm_listings l set household = fm_listing_vibe(l.household, o.vibe) from public.fm_profiles o
 where o.id = l.owner_id and fm_vibe_count(l.household) < 4 and fm_vibe_count(o.vibe) >= 4;
select pg_temp.ok((select fm_vibe_count(household) = 12 from fm_listings where id = '7b000000-0000-4000-8000-000000000155')
  and (select fm_vibe_count(household) = 0 from fm_listings where id = '7b000000-0000-4000-8000-000000000153')
  and (select household->>'gen' = 'z' from fm_listings where id = '7b000000-0000-4000-8000-000000000152'),
  'the one-time fill reaches the rooms without answers whose lister has them, and nothing else');
-- neither helper can be called from the app
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_listing_vibe(jsonb, jsonb)', 'execute') and not has_function_privilege('anon', 'public.fm_listing_vibe(jsonb, jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_listing_vibe_fill()', 'execute'), 'the two helpers are not callable from the app');
