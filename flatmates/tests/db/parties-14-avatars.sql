-- 14. Avatars (Kamal, 13 Nov). A = Anu (seeker), B = Bilal (owner), C = Chris (seeker, no avatar), D = Divya (blocks A).
reset role;
insert into auth.users (id, phone) values ('90000000-0000-4000-8000-000000000091', '919800000091'), ('90000000-0000-4000-8000-000000000092', '919800000092'),
  ('90000000-0000-4000-8000-000000000093', '919800000093'), ('90000000-0000-4000-8000-000000000094', '919800000094') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, adult_at, discoverable, vibe, search, occupation) values
  ('90000000-0000-4000-8000-000000000091', '919800000091', 'Anu Das', 'seeker', now(), true, '{"sleep":0,"clean":0}', '{"city":"Surat","areas":[]}', '{"type":"working"}'),
  ('90000000-0000-4000-8000-000000000092', '919800000092', 'Bilal Khan', 'owner', now(), true, '{}', '{}', '{"type":"working"}'),
  ('90000000-0000-4000-8000-000000000093', '919800000093', 'Chris P', 'seeker', now(), true, '{}', '{}', '{"type":"working"}'),
  ('90000000-0000-4000-8000-000000000094', '919800000094', 'Divya M', 'seeker', now(), true, '{}', '{}', '{"type":"working"}')
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, adult_at = excluded.adult_at, avatar = null;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status) values
  ('9a000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000092', 'room', 'Room in Adajan', 'Surat', 'Adajan', 2, 9000, 'active') on conflict (id) do nothing;
insert into fm_requests (id, listing_id, seeker_id, status) values ('9b000000-0000-4000-8000-000000000001', '9a000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000091', 'pending') on conflict do nothing;
insert into fm_market_items (id, seller_id, title, category, price, city, locality) values ('9c000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000092', 'Study table', 'furniture', 900, 'Surat', 'Adajan') on conflict do nothing;

-- saving: the allowed choices only
select pg_temp.as_user('90000000-0000-4000-8000-000000000091');
select pg_temp.ok((fm_set_avatar('{"v":1,"s":"s4","f":"grin","h":"none","c":"hijab","cc":"#C3C9F6","g":false,"b":"none","t":"#C3E0D6","ty":"0-3"}')->>'c') = 'hijab', 'avatar: a valid avatar saves');
select pg_temp.ok((select avatar->>'s' from fm_profiles where id = '90000000-0000-4000-8000-000000000091') = 's4', 'avatar: stored on the profile as a few choices');
do $$ begin perform fm_set_avatar('{"s":"s9"}'); raise exception 'no-error'; exception when others then
  if sqlerrm <> 'avatar-invalid' then raise exception 'got %', sqlerrm; end if; end $$;
select pg_temp.ok(true, 'avatar: an unknown skin tone is refused');
do $$ begin perform fm_set_avatar('{"s":"s1","photo":"https://x.example/me.jpg"}'); raise exception 'no-error'; exception when others then
  if sqlerrm <> 'avatar-invalid' then raise exception 'got %', sqlerrm; end if; end $$;
select pg_temp.ok(true, 'avatar: no other keys (no photo links)');
do $$ begin perform fm_set_avatar('{"s":"s1","t":"#FF00FF"}'); raise exception 'no-error'; exception when others then
  if sqlerrm <> 'avatar-invalid' then raise exception 'got %', sqlerrm; end if; end $$;
select pg_temp.ok(true, 'avatar: colours only from the palette');
select pg_temp.ok(not fm_avatar_valid('{"s":"s1","ty":"3-0"}') and not fm_avatar_valid('{"s":"s1","g":"yes"}') and not fm_avatar_valid('[1]') and fm_avatar_valid(null)
  and fm_avatar_valid('{"s":"s6","h":"curly","hc":"#1C1917","b":"full","ty":"1-1"}'), 'avatar: type key, glasses flag and shape checked');
-- the studio's choices (Kamal, 22 Nov): new keys next to the first ones
select pg_temp.ok((fm_set_avatar('{"v":2,"s":"s4","f":"smile","m":"smirk","e":"big","br":"thick","h":"short","h2":"quiff","hc":"#9C9590","hc2":"#E4DFDA","c":"none","c2":"none","cc":"#C3C9F6","g":true,"gl":"square","b":"full","b2":"short","bc":"#E4DFDA","ea":"none","t":"#86A6E0","tc":"#2F3E63","o":"blazer","p":"trousers","pc":"#7D828A","sh":"loafers","shc":"#23262B","ty":"2-4"}')->>'o') = 'blazer',
  'avatar: an avatar from the studio saves, its new choices next to the first ones');
select pg_temp.ok(not fm_avatar_valid('{"s":"s1","h":"quiff"}') and fm_avatar_valid('{"s":"s1","h":"short","h2":"quiff"}') and not fm_avatar_valid('{"s":"s1","hc":"#E4DFDA"}') and not fm_avatar_valid('{"s":"s1","b":"goatee"}'),
  'avatar: a new choice goes in its own key; the first keys keep their first values (an app from before the studio reads those)');
select pg_temp.ok(not fm_avatar_valid('{"s":"s1","h2":"mohawk"}') and not fm_avatar_valid('{"s":"s1","tc":"#FF00FF"}') and not fm_avatar_valid('{"s":"s1","o":"cape"}') and not fm_avatar_valid('{"s":"s1","gl":true}')
  and not fm_avatar_valid('{"s":"s1","selfie":"data:image/png;base64,AAAA"}') and not fm_avatar_valid('{"s":"s1","sh":"heels","shc":"#F4F2EE"}'),
  'avatar: the studio''s choices come from fixed lists too, and there are still no other keys (no picture of any kind)');
reset role;
do $$ begin update fm_profiles set avatar = '{"s":"s0"}' where id = '90000000-0000-4000-8000-000000000093'; raise exception 'no-error'; exception when check_violation then null; end $$;
select pg_temp.ok(true, 'avatar: the table refuses bad values too');

-- seeing: by the ids each list already has
select pg_temp.as_user('90000000-0000-4000-8000-000000000092');
select fm_set_avatar('{"s":"s5","h":"curly","hc":"#1C1917","b":"full","t":"#EBD981","ty":"1-1"}');
select pg_temp.ok((select avatar->>'s' from fm_avatars('request', array['9b000000-0000-4000-8000-000000000001']::uuid[])) = 's4', 'avatars: the owner sees the seeker''s on a request');
select pg_temp.ok((select avatar->>'s' from fm_avatars('profile', array['90000000-0000-4000-8000-000000000091']::uuid[])) = 's4', 'avatars: by person (Escape, Tribe)');
select pg_temp.as_user('90000000-0000-4000-8000-000000000091');
select pg_temp.ok((select avatar->>'s' from fm_avatars('request', array['9b000000-0000-4000-8000-000000000001']::uuid[])) = 's5'
  and (select avatar->>'s' from fm_avatars('listing', array['9a000000-0000-4000-8000-000000000001']::uuid[])) = 's5'
  and (select avatar->>'s' from fm_avatars('item', array['9c000000-0000-4000-8000-000000000001']::uuid[])) = 's5', 'avatars: the seeker sees the owner''s: request, listing, FlatMart seller');
select pg_temp.as_user('90000000-0000-4000-8000-000000000093');
select pg_temp.ok(not exists (select 1 from fm_avatars('request', array['9b000000-0000-4000-8000-000000000001']::uuid[])), 'avatars: not through a request you aren''t part of');
select pg_temp.ok(not exists (select 1 from fm_avatars('profile', array['90000000-0000-4000-8000-000000000093']::uuid[])), 'avatars: no avatar, no row (the app shows the default)');
select pg_temp.as_user('90000000-0000-4000-8000-000000000094');
select fm_block('user', '90000000-0000-4000-8000-000000000091');
select pg_temp.ok(not exists (select 1 from fm_avatars('profile', array['90000000-0000-4000-8000-000000000091']::uuid[])), 'avatars: not between blocked people');
select pg_temp.as_user('90000000-0000-4000-8000-000000000091');
select pg_temp.ok((select count(*) from fm_avatars('profile', array['90000000-0000-4000-8000-000000000091','90000000-0000-4000-8000-000000000094']::uuid[])) = 1, 'avatars: your own always; the blocker''s not');
select fm_set_avatar(null);
select pg_temp.ok(not exists (select 1 from fm_avatars('profile', array['90000000-0000-4000-8000-000000000091']::uuid[])), 'avatar: removing it goes back to the default');
reset role;
select pg_temp.ok(not has_function_privilege('anon', 'public.fm_avatars(text, uuid[])', 'execute') and not has_function_privilege('authenticated', 'public.fm_avatar_valid(jsonb)', 'execute'),
  'avatars: signed-in only; the check is internal');
