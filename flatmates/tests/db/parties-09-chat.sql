-- 9. The AI go-between chat (Kamal, 10 Nov): switch, parties only, privacy filter, Truth Check, both-yes before
-- anything is shared, and closing hides the content. The filter examples are tests/shield/cases.json (the app's
-- demo filter is checked on the same file in tests/demo/p14).
insert into auth.users (id, phone) values ('50000000-0000-4000-8000-000000000051', '919800000051'), ('50000000-0000-4000-8000-000000000052', '919800000052'),
  ('50000000-0000-4000-8000-000000000053', '919800000053') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, adult_at, vibe, search) values
  ('50000000-0000-4000-8000-000000000051', '919800000051', 'Meera Rao', 'seeker', now(), '{"smoke":0,"drinks":1,"pets":1,"food":0,"guests":1,"clean":0,"sleep":0}', '{"budget":12000}'),
  ('50000000-0000-4000-8000-000000000052', '919800000052', 'Arjun Shah', 'owner', now(), '{}', '{}'),
  ('50000000-0000-4000-8000-000000000053', '919800000053', 'Stranger', 'seeker', now(), '{}', '{}')
  on conflict (id) do update set adult_at = excluded.adult_at, vibe = excluded.vibe, search = excluded.search;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, household) values
  ('59000000-0000-4000-8000-000000000059', '50000000-0000-4000-8000-000000000052', 'room', 'Chat test room', 'Pune', 'Baner', 2, 15000, 'active',
   '{"smoke":2,"drinks":1,"pets":1,"food":2,"guests":2,"clean":1,"sleep":2,"residents":1}') on conflict (id) do nothing;
insert into fm_requests (id, listing_id, seeker_id, status, match_pct) values
  ('5a000000-0000-4000-8000-00000000005a', '59000000-0000-4000-8000-000000000059', '50000000-0000-4000-8000-000000000051', 'pending', 50),
  ('5b000000-0000-4000-8000-00000000005b', '59000000-0000-4000-8000-000000000059', '50000000-0000-4000-8000-000000000053', 'pending', 40)
  on conflict (id) do nothing;
update fm_settings set charges_enabled = false;

-- switch off: nothing opens, nothing is posted
update fm_settings set ai_chat_enabled = false;
select pg_temp.as_user('50000000-0000-4000-8000-000000000051');
select pg_temp.ok(fm_chat_open('5a000000-0000-4000-8000-00000000005a')->>'error' = 'off' and not exists (select 1 from fm_chats), 'chat: with the switch off no chat opens');
update fm_settings set ai_chat_enabled = true;
select fm_chat_open('5a000000-0000-4000-8000-00000000005a', 'en')->>'chat' as chat \gset
select pg_temp.ok(:'chat' <> '', 'chat: the seeker opens a chat for a waiting request');
update fm_settings set ai_chat_enabled = false;
select pg_temp.ok(fm_chat_post(:'chat', 'hello')->>'error' = 'off', 'chat: with the switch off nothing is sent');
update fm_settings set ai_chat_enabled = true;

-- Conflict Detector
select pg_temp.ok((select array(select x->>'key' from jsonb_array_elements(clashes) x)) @> array['smoke','food','guests','rent'] and (select clashes->0->>'key' from fm_chats where id = :'chat') in ('smoke','food','rent'),
  'chat: the clashes (smoke, food, guests, budget against rent) are worked out when it opens, the biggest first') from fm_chats where id = :'chat';

-- strangers can't open, read or post
select pg_temp.as_user('50000000-0000-4000-8000-000000000053');
select pg_temp.ok(fm_chat_open('5a000000-0000-4000-8000-00000000005a')->>'error' = 'not-found' and fm_chat_get(:'chat')->>'error' = 'not-found'
  and fm_chat_post(:'chat', 'hi')->>'error' = 'not-found', 'chat: someone else can''t open, read or post in it');

-- Privacy Shield on what's stored, and the sender-only note
select pg_temp.as_user('50000000-0000-4000-8000-000000000051');
select fm_chat_post(:'chat', 'Hi! call me on nine eight seven six five four three two one zero or riya@okicici', 'Namaste! mujhe nine eight seven six five four three two one zero par call karo', 'en', 'hi') as sent \gset
select pg_temp.ok((select body !~ '(nine eight|okicici)' and shown !~ 'nine eight' from fm_chat_messages where chat_id = :'chat' limit 1),
  'chat: a number and a UPI ID never reach the stored message, in either language');
select pg_temp.ok((select count(*) from jsonb_array_elements(fm_chat_get(:'chat')->'notes') n where n->>'kind' = 'held') = 1, 'chat: the sender is told what was held back');
select pg_temp.as_user('50000000-0000-4000-8000-000000000052');
select pg_temp.ok(jsonb_array_length(fm_chat_get(:'chat')->'messages') = 1 and jsonb_array_length(fm_chat_get(:'chat')->'notes') = 0,
  'chat: the lister reads the message but not the sender''s notes');

-- Truth Check: private to the sender
select pg_temp.as_user('50000000-0000-4000-8000-000000000051');
select fm_chat_post(:'chat', 'Honestly I smoke on the balcony sometimes') as t \gset
select pg_temp.ok((select count(*) from jsonb_array_elements(fm_chat_get(:'chat')->'notes') n where n->>'kind' = 'truth' and n->'data'->'items'->0->>'key' = 'smoke') = 1,
  'chat: saying "I smoke" against a non-smoker profile gives the sender a private prompt');
select pg_temp.ok(jsonb_array_length(fm_chat_truth('{"smoke":0}', 'I don''t smoke, never have')) = 0 and jsonb_array_length(fm_chat_truth('{"smoke":2}', 'I smoke on the balcony')) = 0
  and jsonb_array_length(fm_chat_truth('{"pets":0}', 'my dog is very calm')) = 1 and jsonb_array_length(fm_chat_truth('{"food":0}', 'we cook chicken on Sundays')) = 1,
  'chat: the profile check ignores "I don''t smoke" and matching answers, and catches pets and food');
select pg_temp.as_user('50000000-0000-4000-8000-000000000052');
select pg_temp.ok(not exists (select 1 from jsonb_array_elements(fm_chat_get(:'chat')->'notes')), 'chat: the other person never sees the profile prompt');

-- row-level security on the tables themselves
set role authenticated;
select pg_temp.as_user('50000000-0000-4000-8000-000000000053');
select pg_temp.ok((select count(*) from fm_chat_messages) = 0 and (select count(*) from fm_chats) = 0 and (select count(*) from fm_chat_notes) = 0, 'chat: tables: a stranger reads nothing');
select pg_temp.as_user('50000000-0000-4000-8000-000000000052');
select pg_temp.ok((select count(*) from fm_chat_messages) = 2 and (select count(*) from fm_chat_notes) = 0, 'chat: tables: the lister reads the messages, not the seeker''s notes');
select pg_temp.ok(pg_temp.err($$insert into fm_chat_messages (chat_id, sender_id, body, shown) select id, '50000000-0000-4000-8000-000000000052', '9876543210', '9876543210' from fm_chats limit 1$$) <> '',
  'chat: tables: nobody writes directly (so the filter can''t be skipped)');
reset role;

-- Mutual Consent: the lister's yes waits for the seeker's "Share my number"
select pg_temp.as_user('50000000-0000-4000-8000-000000000052');
select pg_temp.ok((select x.error from fm_decide('5a000000-0000-4000-8000-00000000005a', true) x) = 'waiting-for-seeker'
  and not exists (select 1 from fm_unlocks where user_id = '50000000-0000-4000-8000-000000000051' and listing_id = '59000000-0000-4000-8000-000000000059')
  and (select status from fm_requests where id = '5a000000-0000-4000-8000-00000000005a') = 'pending', 'chat: the lister accepts, and nothing is shared yet');
select pg_temp.as_user('50000000-0000-4000-8000-000000000053');
select pg_temp.ok(fm_chat_share(:'chat')->>'error' = 'not-found', 'chat: only the seeker can share their number');
select pg_temp.as_user('50000000-0000-4000-8000-000000000051');
select fm_chat_share(:'chat')->>'status' as shared \gset
select pg_temp.ok(:'shared' = 'approved'
  and exists (select 1 from fm_unlocks where user_id = '50000000-0000-4000-8000-000000000051' and listing_id = '59000000-0000-4000-8000-000000000059')
  and (select status from fm_chats where id = :'chat') = 'accepted', 'chat: the seeker shares their number: now both have said yes and contacts unlock');

-- withdrawing closes the chat and hides the content from both
select pg_temp.as_user('50000000-0000-4000-8000-000000000053');
select fm_chat_open('5b000000-0000-4000-8000-00000000005b')->>'chat' as chat2 \gset
select fm_chat_post(:'chat2', 'Do you allow guests on weekends?') as p2 \gset
select pg_temp.ok(fm_chat_share(:'chat2')->>'error' = 'owner-not-yet', 'chat: sharing before the lister accepts does nothing');
select pg_temp.as_user('50000000-0000-4000-8000-000000000052');
select fm_chat_close(:'chat2') as closed2 \gset
select pg_temp.ok(:'closed2' = 'closed' and (select status from fm_requests where id = '5b000000-0000-4000-8000-00000000005b') = 'declined', 'chat: the lister closes the chat (and the request is declined)');
select pg_temp.as_user('50000000-0000-4000-8000-000000000053');
select pg_temp.ok(fm_chat_get(:'chat2')->>'status' = 'closed' and fm_chat_get(:'chat2')->'messages' is null and fm_chat_post(:'chat2', 'hello?')->>'error' = 'closed',
  'chat: the other side sees "closed", not the content, and can''t post');
set role authenticated;
select pg_temp.ok((select count(*) from fm_chat_messages where chat_id = :'chat2') = 0, 'chat: tables: a closed chat''s messages can''t be read');
reset role;

-- 18+ only, and the 30-day clean-up
update fm_profiles set adult_at = null where id = '50000000-0000-4000-8000-000000000053';
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status) values
  ('5d000000-0000-4000-8000-00000000005d', '50000000-0000-4000-8000-000000000052', 'room', 'Chat test room 2', 'Pune', 'Aundh', 2, 9000, 'active') on conflict (id) do nothing;
insert into fm_requests (id, listing_id, seeker_id, status) values ('5c000000-0000-4000-8000-00000000005c', '5d000000-0000-4000-8000-00000000005d', '50000000-0000-4000-8000-000000000053', 'pending') on conflict do nothing;
select pg_temp.as_user('50000000-0000-4000-8000-000000000053');
delete from fm_chats where request_id = '5c000000-0000-4000-8000-00000000005c';
select pg_temp.ok(fm_chat_open('5c000000-0000-4000-8000-00000000005c')->>'error' = 'adults-only', 'chat: 18+ only');
update fm_chats set closed_at = now() - interval '31 days' where id = :'chat2';
select fm_chat_get(:'chat') is not null as purged \gset
select pg_temp.ok(not exists (select 1 from fm_chats where id = :'chat2') and not exists (select 1 from fm_chat_messages where chat_id = :'chat2'),
  'chat: 30 days after closing, the chat and its messages are deleted');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_request_approve(uuid)', 'execute') and not has_function_privilege('authenticated', 'public.fm_chat_clashes(uuid, uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.fm_chat_post(uuid, text, text, text, text, jsonb)', 'execute'), 'chat: the approval and clash helpers can''t be called from the app');
update fm_settings set ai_chat_enabled = false;
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$Call me on 9876543210$t$)->'held') order by 1)) = array['phone']::text[] and position($g$9876543210$g$ in fm_chat_shield($t$Call me on 9876543210$t$)->>'text') = 0, 'shield: Call me on 9876543210');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$my no. is +91 98765 43210 ok$t$)->'held') order by 1)) = array['phone']::text[] and position($g$98765$g$ in fm_chat_shield($t$my no. is +91 98765 43210 ok$t$)->>'text') = 0 and position($g$43210$g$ in fm_chat_shield($t$my no. is +91 98765 43210 ok$t$)->>'text') = 0, 'shield: my no. is +91 98765 43210 ok');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$98-76-54-32-10 anytime$t$)->'held') order by 1)) = array['phone']::text[] and position($g$98-76$g$ in fm_chat_shield($t$98-76-54-32-10 anytime$t$)->>'text') = 0, 'shield: 98-76-54-32-10 anytime');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$nine eight seven six five four three two one zero$t$)->'held') order by 1)) = array['phone']::text[] and position($g$nine eight seven$g$ in fm_chat_shield($t$nine eight seven six five four three two one zero$t$)->>'text') = 0, 'shield: nine eight seven six five four three two one zero');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$it's nine eight double seven six five four three two one$t$)->'held') order by 1)) = array['phone']::text[] and position($g$double seven$g$ in fm_chat_shield($t$it's nine eight double seven six five four three two one$t$)->>'text') = 0, 'shield: it''s nine eight double seven six five four three two one');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$ek do teen chaar paanch chhe saat aath nau$t$)->'held') order by 1)) = array['phone']::text[] and position($g$chaar paanch$g$ in fm_chat_shield($t$ek do teen chaar paanch chhe saat aath nau$t$)->>'text') = 0, 'shield: ek do teen chaar paanch chhe saat aath nau');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$(987) 654-3210$t$)->'held') order by 1)) = array['phone']::text[] and position($g$654-3210$g$ in fm_chat_shield($t$(987) 654-3210$t$)->>'text') = 0, 'shield: (987) 654-3210');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$mail me at riya.k@gmail.com$t$)->'held') order by 1)) = array['email']::text[] and position($g$gmail$g$ in fm_chat_shield($t$mail me at riya.k@gmail.com$t$)->>'text') = 0, 'shield: mail me at riya.k@gmail.com');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$riya dot k at gmail dot com$t$)->'held') order by 1)) = array['email']::text[] and position($g$gmail dot com$g$ in fm_chat_shield($t$riya dot k at gmail dot com$t$)->>'text') = 0, 'shield: riya dot k at gmail dot com');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$pay the token to riya@okhdfc$t$)->'held') order by 1)) = array['payment','upi']::text[] and position($g$okhdfc$g$ in fm_chat_shield($t$pay the token to riya@okhdfc$t$)->>'text') = 0, 'shield: pay the token to riya@okhdfc');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$my insta is riya_k99$t$)->'held') order by 1)) = array['social']::text[] and position($g$riya_k99$g$ in fm_chat_shield($t$my insta is riya_k99$t$)->>'text') = 0, 'shield: my insta is riya_k99');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$find me @riya.k on there$t$)->'held') order by 1)) = array['social']::text[] and position($g$@riya.k$g$ in fm_chat_shield($t$find me @riya.k on there$t$)->>'text') = 0, 'shield: find me @riya.k on there');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$see www.findhouses.in/x or bit.ly/abc$t$)->'held') order by 1)) = array['link']::text[] and position($g$findhouses$g$ in fm_chat_shield($t$see www.findhouses.in/x or bit.ly/abc$t$)->>'text') = 0 and position($g$bit.ly$g$ in fm_chat_shield($t$see www.findhouses.in/x or bit.ly/abc$t$)->>'text') = 0, 'shield: see www.findhouses.in/x or bit.ly/abc');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$Flat no. 402, Tower B$t$)->'held') order by 1)) = array['address']::text[] and position($g$402$g$ in fm_chat_shield($t$Flat no. 402, Tower B$t$)->>'text') = 0, 'shield: Flat no. 402, Tower B');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$I'm at 12 MG Road near the metro$t$)->'held') order by 1)) = array['address']::text[] and position($g$12 MG Road$g$ in fm_chat_shield($t$I'm at 12 MG Road near the metro$t$)->>'text') = 0, 'shield: I''m at 12 MG Road near the metro');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$PIN 560034$t$)->'held') order by 1)) = array['address']::text[] and position($g$560034$g$ in fm_chat_shield($t$PIN 560034$t$)->>'text') = 0, 'shield: PIN 560034');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$Please send 5000 advance on GPay$t$)->'held') order by 1)) = array['payment']::text[] and position($g$5000$g$ in fm_chat_shield($t$Please send 5000 advance on GPay$t$)->>'text') = 0 and position($g$GPay$g$ in fm_chat_shield($t$Please send 5000 advance on GPay$t$)->>'text') = 0, 'shield: Please send 5000 advance on GPay');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$Rent is 15000 and deposit two months$t$)->'held') order by 1)) = array[]::text[] and position($k$15000$k$ in fm_chat_shield($t$Rent is 15000 and deposit two months$t$)->>'text') > 0 and position($k$deposit two months$k$ in fm_chat_shield($t$Rent is 15000 and deposit two months$t$)->>'text') > 0, 'shield: Rent is 15000 and deposit two months');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$I sleep by 11 and have one or two guests a month$t$)->'held') order by 1)) = array[]::text[] and position($k$11$k$ in fm_chat_shield($t$I sleep by 11 and have one or two guests a month$t$)->>'text') > 0 and position($k$one or two guests$k$ in fm_chat_shield($t$I sleep by 11 and have one or two guests a month$t$)->>'text') > 0, 'shield: I sleep by 11 and have one or two guests a month');
select pg_temp.ok((select array(select jsonb_array_elements_text(fm_chat_shield($t$Do you cook non-veg? I work 9 to 6$t$)->'held') order by 1)) = array[]::text[] and position($k$Do you cook$k$ in fm_chat_shield($t$Do you cook non-veg? I work 9 to 6$t$)->>'text') > 0 and position($k$9 to 6$k$ in fm_chat_shield($t$Do you cook non-veg? I work 9 to 6$t$)->>'text') > 0, 'shield: Do you cook non-veg? I work 9 to 6');
