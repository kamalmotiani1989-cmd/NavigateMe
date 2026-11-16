-- 15. A home's living-style answers end up on the listing where the lister lives there, and only there.
-- Kamal, 15 Nov: "in escape the room vibe score should be visible". A room posted without answers took none (the
-- form's copy lived on one phone), so nobody could be scored against it: fm_listing_vibe fills them from the lister's
-- own, and the trigger keeps it so on every post and edit.
-- Kamal, 16 Nov: "Fix the vibe fill-in when the lister doesn't live in the flat". The lister's answers stand in for
-- the household only when the lister is one of them (a room, a bed or a flatmate listing with 1 or more people
-- living there). A whole flat, or a home nobody lives in yet, carries no living-style answers at all, so no score.
insert into auth.users (id, phone) values ('75000000-0000-4000-8000-000000000151', '919800000151'), ('75000000-0000-4000-8000-000000000152', '919800000152'),
  ('75000000-0000-4000-8000-000000000153', '919800000153') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, gender, vibe, search, discoverable) values
  ('75000000-0000-4000-8000-000000000151', '919800000151', 'Owner Withanswers', 'owner', 'male',
     '{"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m","junk":"x"}', '{}', true),
  ('75000000-0000-4000-8000-000000000152', '919800000152', 'Owner Noanswers', 'owner', 'male', '{}', '{}', true),
  ('75000000-0000-4000-8000-000000000153', '919800000153', 'Sita Seeker', 'seeker', 'female',
     '{"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":0,"guests":2,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m"}', '{"city":"Vtest","areas":[]}', true)
  on conflict (id) do update set vibe = excluded.vibe, search = excluded.search, role = excluded.role;
-- who counts as living there
select pg_temp.ok(fm_lister_lives('room', '{"residents":1}') and fm_lister_lives('shared', '{"residents":4}') and fm_lister_lives('flatmate', '{"residents":"2"}'),
  'the lister lives there: a room, a bed or a flatmate listing with 1 or more people living there');
select pg_temp.ok(not fm_lister_lives('room', '{"residents":0}') and not fm_lister_lives('flat', '{"residents":3}') and not fm_lister_lives('room', '{}')
  and not fm_lister_lives('room', null) and not fm_lister_lives('shared', '{"residents":"many"}') and not fm_lister_lives('flatmate', '[1]'),
  'the lister does not: a home nobody lives in, any whole flat, and a listing that doesn''t say (never an error)');
-- the rule itself, where the lister lives there
select pg_temp.ok(fm_vibe_count(fm_listing_vibe('room', '{"residents":1}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}')) = 4
  and fm_listing_vibe('room', '{"residents":1}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}')->>'gen' = 'z'
  and fm_listing_vibe('room', '{"residents":1}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}')->>'residents' = '1',
  'listing vibe: a listing with no answers takes the lister''s, and keeps everything else it says');
select pg_temp.ok(fm_listing_vibe('shared', '{"residents":1,"sleep":0,"clean":0,"food":0,"cook":0,"gen":"g"}', '{"sleep":2,"clean":2,"food":2,"cook":2,"smoke":2,"gen":"z"}') = '{"residents":1,"sleep":0,"clean":0,"food":0,"cook":0,"gen":"g"}'::jsonb,
  'listing vibe: a listing with its own answers (4 or more) is left exactly as it is');
select pg_temp.ok(fm_listing_vibe('flatmate', '{"sleep":0,"residents":2}', '{"sleep":2,"clean":2,"food":2,"cook":2,"gen":"z"}') = '{"sleep":0,"clean":2,"food":2,"cook":2,"gen":"z","residents":2}'::jsonb,
  'listing vibe: with fewer than 4 of its own, the lister''s come in and the listing''s own stay on top');
select pg_temp.ok(fm_listing_vibe('room', '{"residents":1}', '{"sleep":1,"clean":1}') = '{"residents":1}'::jsonb and fm_listing_vibe('room', '{"residents":1}', null) = '{"residents":1}'::jsonb
  and fm_listing_vibe('room', null, null) is null, 'listing vibe: a lister with fewer than 4 answers changes nothing');
select pg_temp.ok(not (fm_listing_vibe('room', '{"residents":1}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"q","junk":"x","pets":"two"}') ?| array['gen','junk','pets']),
  'listing vibe: only the 12 questions and a known generation are copied, nothing else from the profile');
-- the rule itself, where the lister doesn't
select pg_temp.ok(fm_listing_vibe('room', '{"residents":0}', '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":1,"gen":"z"}') = '{"residents":0}'::jsonb
  and fm_listing_vibe('flat', '{"residents":2,"flatmates":[]}', '{"sleep":1,"clean":1,"food":1,"cook":1,"smoke":1,"gen":"z"}') = '{"residents":2,"flatmates":[]}'::jsonb
  and fm_listing_vibe('room', '{}', '{"sleep":1,"clean":1,"food":1,"cook":1,"gen":"z"}') = '{}'::jsonb,
  'listing vibe: nobody lives there, or it is a whole flat: the lister''s answers are not copied');
select pg_temp.ok(fm_listing_vibe('room', '{"residents":0,"sleep":0,"clean":0,"food":0,"cook":0,"smoke":1,"gen":"g","interests":{"music":["Indie"]}}', '{"sleep":0,"clean":0,"food":0,"cook":0,"smoke":1,"gen":"g"}') = '{"residents":0,"interests":{"music":["Indie"]}}'::jsonb
  and fm_listing_vibe('flat', '{"residents":1,"sleep":2,"clean":2,"food":2,"cook":2,"pets":1,"gen":"z","rooms_free":1}', null) = '{"residents":1,"rooms_free":1}'::jsonb,
  'listing vibe: answers sent for a home the lister doesn''t live in (an older app pre-fills them) are dropped, with the generation; the rest stays');
-- on the table: filled when posted where the lister lives there, kept when it has its own, left empty when the lister has none, never filled where nobody lives
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, gender, household) values
  ('7b000000-0000-4000-8000-000000000151', '75000000-0000-4000-8000-000000000151', 'room', 'V1 the lister lives there', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":1}'),
  ('7b000000-0000-4000-8000-000000000152', '75000000-0000-4000-8000-000000000151', 'room', 'V2 own answers', 'Vtest', 'Varea', 2, 9000, 'active', 'any',
     '{"residents":2,"sleep":0,"clean":0,"food":2,"cook":0,"smoke":2,"drinks":2,"guests":0,"noise":2,"social":0,"sharing":0,"work":2,"pets":0,"gen":"z"}'),
  ('7b000000-0000-4000-8000-000000000153', '75000000-0000-4000-8000-000000000152', 'room', 'V3 lister has none', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":1}'),
  ('7b000000-0000-4000-8000-000000000156', '75000000-0000-4000-8000-000000000151', 'room', 'V6 nobody lives there yet', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":0,"flatmates":[]}'),
  ('7b000000-0000-4000-8000-000000000157', '75000000-0000-4000-8000-000000000151', 'room', 'V7 nobody lives there, an older app sent the lister''s answers', 'Vtest', 'Varea', 2, 9000, 'active', 'any',
     '{"residents":0,"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m","interests":{"music":["Indie"],"hobbies":[]}}'),
  ('7b000000-0000-4000-8000-000000000158', '75000000-0000-4000-8000-000000000151', 'flat', 'V8 whole flat, sent with answers', 'Vtest', 'Varea', 2, 30000, 'active', 'any',
     '{"residents":1,"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"gen":"m"}')
  on conflict (id) do nothing;
select pg_temp.ok((select fm_vibe_count(household) = 12 and household->>'gen' = 'm' and household->>'residents' = '1' and not household ? 'junk' from fm_listings where id = '7b000000-0000-4000-8000-000000000151'),
  'the lister lives there, posted without answers: the listing now carries the lister''s 12 answers and generation');
select pg_temp.ok((select household->>'sleep' = '0' and household->>'gen' = 'z' and household->>'residents' = '2' from fm_listings where id = '7b000000-0000-4000-8000-000000000152'),
  'posted with its own answers: untouched');
select pg_temp.ok((select fm_vibe_count(household) = 0 from fm_listings where id = '7b000000-0000-4000-8000-000000000153'), 'the lister has no answers either: the listing stays without');
select pg_temp.ok((select household = '{"residents":0,"flatmates":[]}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000156'),
  'nobody lives there: the lister''s answers are NOT copied onto the listing, though the lister has all 12');
select pg_temp.ok((select household = '{"residents":0,"interests":{"music":["Indie"],"hobbies":[]}}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000157'),
  'nobody lives there and an older app sent the lister''s own answers: they are not kept; the rest of the listing is');
select pg_temp.ok((select household = '{"residents":1}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000158'), 'a whole flat keeps no living-style answers, whatever it says about who lives there');
-- The Empty Room Escape: a score where the lister lives there, none where nobody does
select pg_temp.as_user('75000000-0000-4000-8000-000000000151');
select pg_temp.ok((select match_pct from fm_find_seekers('7b000000-0000-4000-8000-000000000151') where seeker_id = '75000000-0000-4000-8000-000000000153') =
  fm_match((select vibe from fm_profiles where id = '75000000-0000-4000-8000-000000000153'), (select vibe from fm_profiles where id = '75000000-0000-4000-8000-000000000151')),
  'Escape: a room that came without answers, lister living there, shows each person''s vibe score: ' || coalesce((select match_pct::text from fm_find_seekers('7b000000-0000-4000-8000-000000000151') where seeker_id = '75000000-0000-4000-8000-000000000153'), 'none'));
select pg_temp.ok((select match_pct from fm_find_seekers('7b000000-0000-4000-8000-000000000152') where seeker_id = '75000000-0000-4000-8000-000000000153') is not null, 'Escape: and a room with its own answers scores against those');
select pg_temp.ok((select count(*) = 1 and bool_and(match_pct is null) from fm_find_seekers('7b000000-0000-4000-8000-000000000156'))
  and (select count(*) = 1 and bool_and(match_pct is null) from fm_find_seekers('7b000000-0000-4000-8000-000000000157')),
  'Escape: a room nobody lives in still lists the people looking, with no score (the app says why)');
select pg_temp.as_user('75000000-0000-4000-8000-000000000152');
select pg_temp.ok((select count(*) = 1 and bool_and(match_pct is null) from fm_find_seekers('7b000000-0000-4000-8000-000000000153')), 'Escape: no answers anywhere means no score (the app then asks the lister to add them)');
-- the seeker sees the same on the home: a score where there is a household, none where there isn't
select pg_temp.as_user('75000000-0000-4000-8000-000000000153');
select pg_temp.ok((select fm_match((select vibe from fm_profiles where id = auth.uid()), household) from fm_search(p_city => 'Vtest') where id = '7b000000-0000-4000-8000-000000000151') is not null,
  'Discover: the person looking gets the answers with the home, so the same score shows on their side');
select pg_temp.ok((select count(*) = 3 and bool_and(fm_match((select vibe from fm_profiles where id = auth.uid()), household) is null) from fm_search(p_city => 'Vtest')
    where id in ('7b000000-0000-4000-8000-000000000156', '7b000000-0000-4000-8000-000000000157', '7b000000-0000-4000-8000-000000000158')),
  'Discover: the homes the lister doesn''t live in are all there, and none of them can be scored');
-- edits: the count of people living there decides
select pg_temp.as_user('75000000-0000-4000-8000-000000000151');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000156', p_kind => 'room', p_title => 'V6 nobody lives there yet', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9500, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.', p_household => '{"residents":0}') is null as edited;
select pg_temp.ok((select rent = 9500 and household = '{"residents":0}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000156'),
  'an edit that still says nobody lives there: saved, still without answers');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000156', p_kind => 'room', p_title => 'V6 someone lives there now', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9500, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.', p_household => '{"residents":1}') is null as edited;
select pg_temp.ok((select fm_vibe_count(household) = 12 and household->>'residents' = '1' and household->>'gen' = 'm' from fm_listings where id = '7b000000-0000-4000-8000-000000000156'),
  'an edit that says the lister lives there now, sent without answers: the listing takes the lister''s');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000156', p_kind => 'room', p_title => 'V6 someone lives there now', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9500, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.',
  p_household => '{"residents":2,"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"gen":"g"}') is null as edited;
select pg_temp.ok((select household = '{"residents":2,"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"gen":"g"}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000156'),
  'an edit with the household''s own answers: saved exactly as sent');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000156', p_kind => 'room', p_title => 'V6 everyone moved out', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9500, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.',
  p_household => '{"residents":0,"sleep":0,"clean":0,"food":0,"cook":0,"smoke":0,"gen":"g"}') is null as edited;
select pg_temp.ok((select household = '{"residents":0}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000156'),
  'an edit back to nobody living there: the answers go with the household');
select fm_update_listing(p_listing => '7b000000-0000-4000-8000-000000000152', p_kind => 'flat', p_title => 'V2 now let as a whole flat', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2,
  p_rent => 9000, p_deposit => 0, p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Edited.',
  p_household => '{"residents":2,"sleep":0,"clean":0,"food":2,"cook":0,"smoke":2,"drinks":2,"guests":0,"noise":2,"social":0,"sharing":0,"work":2,"pets":0,"gen":"z"}') is null as edited;
select pg_temp.ok((select kind = 'flat' and household = '{"residents":2}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-000000000152'),
  'a room turned into a whole flat: it no longer carries a household''s answers');
-- new posts through the app's own function
select fm_post_listing(p_kind => 'room', p_title => 'V4 posted from another phone', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2, p_rent => 11000, p_deposit => 0,
  p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Posted without the household answers.',
  p_contact_name => 'Owner', p_contact_phone => '9800000151', p_address => 'A-1, Tower, Varea', p_household => '{"residents":1,"flatmates":[]}',
  p_address_parts => '{"flat":"A-1","building":"Tower","pin":"411045"}') as v4 \gset
select pg_temp.ok((select fm_vibe_count(household) = 12 and household->>'gen' = 'm' and household ? 'flatmates' from fm_listings where id = :'v4'), 'a new room posted without answers, lister living there, comes out with the lister''s');
select fm_post_listing(p_kind => 'room', p_title => 'V9 an empty flat, room by room', p_city => 'Vtest', p_locality => 'Varea', p_bhk => 2, p_rent => 11000, p_deposit => 0,
  p_available_from => current_date, p_gender => 'any', p_furnishing => 'semi', p_amenities => '{}', p_description => 'Posted from an older app that fills in the lister''s own answers.',
  p_contact_name => 'Owner', p_contact_phone => '9800000151', p_address => 'A-2, Tower, Varea',
  p_household => '{"residents":0,"flatmates":[],"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m"}',
  p_address_parts => '{"flat":"A-2","building":"Tower","pin":"411045"}') as v9 \gset
select pg_temp.ok((select household = '{"residents":0,"flatmates":[]}'::jsonb from fm_listings where id = :'v9'), 'a new room in a flat nobody lives in comes out without answers, even when the app sent the lister''s');
-- the two one-time statements (the same as in schema.sql), on rows made the old way
alter table fm_listings disable trigger fm_listings_vibe_fill;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, gender, household) values
  ('7b000000-0000-4000-8000-000000000155', '75000000-0000-4000-8000-000000000151', 'room', 'V5 posted before 15 Nov, lister lives there', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":1}'),
  ('7b000000-0000-4000-8000-00000000015a', '75000000-0000-4000-8000-000000000151', 'room', 'V10 nobody lives there, carries the copy of 15 Nov', 'Vtest', 'Varea', 2, 9000, 'active', 'any',
     '{"residents":0,"flatmates":[],"interests":{"music":[],"hobbies":["Cooking"]},"rooms_free":1,"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"drinks":1,"guests":1,"noise":0,"social":1,"sharing":1,"work":0,"pets":1,"gen":"m"}'),
  ('7b000000-0000-4000-8000-00000000015b', '75000000-0000-4000-8000-000000000151', 'flat', 'V11 whole flat with pre-filled answers', 'Vtest', 'Varea', 2, 30000, 'active', 'any',
     '{"residents":1,"sleep":2,"clean":1,"food":0,"cook":1,"smoke":0,"social":1,"gen":"m"}'),
  ('7b000000-0000-4000-8000-00000000015c', '75000000-0000-4000-8000-000000000151', 'room', 'V12 nobody lives there and nothing to clear', 'Vtest', 'Varea', 2, 9000, 'active', 'any', '{"residents":0}');
alter table fm_listings enable trigger fm_listings_vibe_fill;
select pg_temp.ok((select fm_vibe_count(household) = 0 from fm_listings where id = '7b000000-0000-4000-8000-000000000155')
  and (select fm_vibe_count(household) = 12 from fm_listings where id = '7b000000-0000-4000-8000-00000000015a')
  and (select fm_vibe_count(household) = 6 from fm_listings where id = '7b000000-0000-4000-8000-00000000015b'), '(rows as they were before: one without answers, two carrying answers they should not)');
update public.fm_listings l set household = fm_listing_vibe(l.kind, l.household, o.vibe)
  from public.fm_profiles o
 where o.id = l.owner_id and fm_lister_lives(l.kind, l.household) and fm_vibe_count(l.household) < 4 and fm_vibe_count(o.vibe) >= 4;
update public.fm_listings l set household = fm_listing_vibe(l.kind, l.household, null)
 where not fm_lister_lives(l.kind, l.household) and jsonb_typeof(l.household) = 'object'
   and l.household ?| array['sleep','clean','food','cook','smoke','drinks','guests','noise','social','sharing','work','pets','gen'];
select pg_temp.ok((select fm_vibe_count(household) = 12 from fm_listings where id = '7b000000-0000-4000-8000-000000000155')
  and (select fm_vibe_count(household) = 0 from fm_listings where id = '7b000000-0000-4000-8000-000000000153'),
  'the one-time fill reaches the rooms without answers whose lister lives there and has them, and nothing else');
select pg_temp.ok((select household = '{"residents":0,"flatmates":[],"interests":{"music":[],"hobbies":["Cooking"]},"rooms_free":1}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-00000000015a'),
  'the one-time clear takes the lister''s copy off a room nobody lives in, and leaves the rest of the listing as it was');
select pg_temp.ok((select household = '{"residents":1}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-00000000015b')
  and (select household = '{"residents":0}'::jsonb from fm_listings where id = '7b000000-0000-4000-8000-00000000015c'), 'and off a whole flat; a home with nothing to clear is not touched');
select pg_temp.ok((select fm_vibe_count(household) = 12 and household->>'gen' = 'm' from fm_listings where id = '7b000000-0000-4000-8000-000000000151')
  and (select fm_vibe_count(household) = 12 from fm_listings where id = :'v4'),
  'the one-time clear leaves every home the lister lives in exactly as it was');
-- none of the helpers can be called from the app, and the older two-argument form is gone
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_listing_vibe(text, jsonb, jsonb)', 'execute') and not has_function_privilege('anon', 'public.fm_listing_vibe(text, jsonb, jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_listing_vibe_fill()', 'execute')
  and not has_function_privilege('authenticated', 'public.fm_lister_lives(text, jsonb)', 'execute') and not has_function_privilege('anon', 'public.fm_lister_lives(text, jsonb)', 'execute')
  and to_regprocedure('public.fm_listing_vibe(jsonb, jsonb)') is null, 'the three helpers are not callable from the app, and the older form of fm_listing_vibe is gone');
