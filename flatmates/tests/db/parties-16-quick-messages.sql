-- 16. Quicker messaging (Kamal, 15 Nov): the app asks for only what's new, and a message tried twice arrives once.
insert into auth.users (id, phone) values ('76000000-0000-4000-8000-000000000161', '919800000161'), ('76000000-0000-4000-8000-000000000162', '919800000162'),
  ('76000000-0000-4000-8000-000000000163', '919800000163') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, search) values
  ('76000000-0000-4000-8000-000000000161', '919800000161', 'Nisha Menon', 'seeker', '{}'),
  ('76000000-0000-4000-8000-000000000162', '919800000162', 'Omkar Joshi', 'owner', '{}'),
  ('76000000-0000-4000-8000-000000000163', '919800000163', 'Pooja Nair', 'seeker', '{}') on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status) values
  ('76a00000-0000-4000-8000-000000000161', '76000000-0000-4000-8000-000000000162', 'room', 'Room in Aundh', 'Pune', 'Aundh', 2, 11000, 'active') on conflict (id) do nothing;
insert into fm_requests (id, listing_id, seeker_id, status) values
  ('76b00000-0000-4000-8000-000000000161', '76a00000-0000-4000-8000-000000000161', '76000000-0000-4000-8000-000000000161', 'approved'),
  ('76b00000-0000-4000-8000-000000000162', '76a00000-0000-4000-8000-000000000161', '76000000-0000-4000-8000-000000000163', 'approved') on conflict (id) do nothing;

-- a message with its own id: sent once, however often it is tried
select pg_temp.as_user('76000000-0000-4000-8000-000000000161');
select fm_thread_open('room', '76b00000-0000-4000-8000-000000000161')->>'thread' as qm \gset
select fm_thread_send(:'qm', 'Hi Omkar, is the room still free?', '76c00000-0000-4000-8000-000000000001') as s1 \gset
select pg_temp.ok((:'s1'::jsonb)->>'message' = '76c00000-0000-4000-8000-000000000001' and ((:'s1'::jsonb)->>'at') is not null and (:'s1'::jsonb)->'again' is null,
  'quick messages: a message is saved under the id the app gave it, and the answer says when');
select fm_thread_send(:'qm', 'Hi Omkar, is the room still free?', '76c00000-0000-4000-8000-000000000001') as s1b \gset
reset role;
select pg_temp.ok((:'s1b'::jsonb)->>'message' = '76c00000-0000-4000-8000-000000000001' and ((:'s1b'::jsonb)->>'again')::boolean
  and (:'s1b'::jsonb)->>'at' = (:'s1'::jsonb)->>'at'
  and (select count(*) from fm_thread_messages where thread_id = :'qm') = 1, 'quick messages: tried again, the same message is not saved twice');
select pg_temp.ok((select sum(n) from fm_rate where who = '76000000-0000-4000-8000-000000000161' and bucket = 'message') = 1
  and (select sum(n) from fm_rate where who = '76000000-0000-4000-8000-000000000161' and bucket = 'message-new') = 1, 'quick messages: and it is counted once against the limits');

-- the other person: the whole chat the first time; "read" is written once, not at every ask
select pg_temp.as_user('76000000-0000-4000-8000-000000000162');
select pg_temp.ok((select (x->>'unread')::int from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'qm') = 1, 'quick messages: the owner has 1 unread');
select fm_thread_get(:'qm') as g1 \gset
select pg_temp.ok(jsonb_array_length((:'g1'::jsonb)->'messages') = 1 and (:'g1'::jsonb)->'messages'->0->>'id' = '76c00000-0000-4000-8000-000000000001'
  and (:'g1'::jsonb)->'messages'->0->>'at' = (:'s1'::jsonb)->>'at' and (:'g1'::jsonb)->'people' = '["Nisha"]'::jsonb,
  'quick messages: the whole chat comes back when no time is given (an app from before this)');
reset role;
select xmin::text as x1, read_at as r1 from fm_thread_reads where thread_id = :'qm' and user_id = '76000000-0000-4000-8000-000000000162' \gset
select pg_temp.as_user('76000000-0000-4000-8000-000000000162');
select fm_thread_get(:'qm', ((:'s1'::jsonb)->>'at')::timestamptz) as g2 \gset
select fm_thread_get(:'qm', now() + interval '1 hour') as g3 \gset
reset role;
select pg_temp.ok((select xmin::text = :'x1' and read_at = :'r1' from fm_thread_reads where thread_id = :'qm' and user_id = '76000000-0000-4000-8000-000000000162'),
  'quick messages: asking again with nothing new writes nothing');
select pg_temp.ok(jsonb_array_length((:'g2'::jsonb)->'messages') = 1 and jsonb_array_length((:'g3'::jsonb)->'messages') = 0
  and (:'g3'::jsonb)->'people' = '["Nisha"]'::jsonb and (:'g3'::jsonb)->>'title' = 'Room in Aundh',
  'quick messages: from a time on: the message at that moment is included, nothing after the newest, and the chat''s name and people still come');

-- only what's new
select pg_temp.as_user('76000000-0000-4000-8000-000000000161');
select fm_thread_send(:'qm', 'I can visit on Saturday.', '76c00000-0000-4000-8000-000000000002') as s2 \gset
select fm_thread_send(:'qm', 'Morning is best for me.') as s3 \gset
select pg_temp.ok(((:'s3'::jsonb)->>'message') is not null and (:'s3'::jsonb)->>'message' <> '76c00000-0000-4000-8000-000000000002' and ((:'s3'::jsonb)->>'at') is not null,
  'quick messages: without an id (an app from before this) the server still makes one');
select pg_temp.as_user('76000000-0000-4000-8000-000000000162');
select pg_temp.ok((select (x->>'unread')::int from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'qm') = 2, 'quick messages: two more unread');
select fm_thread_get(:'qm', ((:'s2'::jsonb)->>'at')::timestamptz) as g4 \gset
select pg_temp.ok(jsonb_array_length((:'g4'::jsonb)->'messages') = 2 and (:'g4'::jsonb)->'messages'->0->>'id' = '76c00000-0000-4000-8000-000000000002'
  and (:'g4'::jsonb)->'messages'->1->>'body' = 'Morning is best for me.' and not ((:'g4'::jsonb)->'messages'->0->>'mine')::boolean,
  'quick messages: asked from the second message on, only it and the one after come back, oldest first');
select pg_temp.ok((select (x->>'unread')::int from jsonb_array_elements(fm_thread_list()) x where x->>'thread' = :'qm') = 0, 'quick messages: and reading only what''s new marks the chat read');
reset role;
select pg_temp.ok((select xmin::text <> :'x1' and read_at > :'r1' from fm_thread_reads where thread_id = :'qm' and user_id = '76000000-0000-4000-8000-000000000162'),
  'quick messages: the read mark moves when there was something new');
-- the one who wrote doesn't write a read mark by asking either
select xmin::text as x2 from fm_thread_reads where thread_id = :'qm' and user_id = '76000000-0000-4000-8000-000000000161' \gset
select pg_temp.as_user('76000000-0000-4000-8000-000000000161');
select fm_thread_get(:'qm', ((:'s3'::jsonb)->>'at')::timestamptz) as g5 \gset
reset role;
select pg_temp.ok(jsonb_array_length((:'g5'::jsonb)->'messages') = 1 and ((:'g5'::jsonb)->'messages'->0->>'mine')::boolean
  and (select xmin::text = :'x2' from fm_thread_reads where thread_id = :'qm' and user_id = '76000000-0000-4000-8000-000000000161'),
  'quick messages: the sender asking for news gets their own last message and writes nothing');

-- an id can't be used to touch somebody else's message, and "from a time on" opens nothing new
select pg_temp.as_user('76000000-0000-4000-8000-000000000163');
select fm_thread_open('room', '76b00000-0000-4000-8000-000000000162')->>'thread' as qm2 \gset
select pg_temp.ok(fm_thread_send(:'qm2', 'Mine now', '76c00000-0000-4000-8000-000000000001')->>'error' = 'not-sent'
  and fm_thread_send(:'qm', 'Mine now', '76c00000-0000-4000-8000-000000000001')->>'error' = 'not-found'
  and fm_thread_get(:'qm', '-infinity')->>'error' = 'not-found', 'quick messages: an id that belongs to someone else''s message is refused; a stranger still reads nothing');
reset role;
select pg_temp.ok((select body = 'Hi Omkar, is the room still free?' and thread_id = :'qm' and sender_id = '76000000-0000-4000-8000-000000000161'
    from fm_thread_messages where id = '76c00000-0000-4000-8000-000000000001')
  and not exists (select 1 from fm_thread_messages where thread_id = :'qm2'), 'quick messages: and that message is untouched');

-- a long chat: from a time on, still at most the newest 200
insert into fm_thread_messages (thread_id, sender_id, body, created_at)
  select :'qm', '76000000-0000-4000-8000-000000000161', 'Line ' || g, now() + (g || ' seconds')::interval from generate_series(1, 205) g;
select pg_temp.as_user('76000000-0000-4000-8000-000000000162');
select fm_thread_get(:'qm', ((:'s1'::jsonb)->>'at')::timestamptz) as g6 \gset
select pg_temp.ok(jsonb_array_length((:'g6'::jsonb)->'messages') = 200 and (:'g6'::jsonb)->'messages'->199->>'body' = 'Line 205' and (:'g6'::jsonb)->'messages'->0->>'body' = 'Line 6',
  'quick messages: a long chat: the newest 200 from that time on');
reset role;
select pg_temp.ok(to_regprocedure('public.fm_thread_get(uuid)') is null and to_regprocedure('public.fm_thread_send(uuid, text)') is null
  and has_function_privilege('authenticated', 'public.fm_thread_get(uuid, timestamptz)', 'execute') and has_function_privilege('authenticated', 'public.fm_thread_send(uuid, text, uuid)', 'execute')
  and not has_function_privilege('anon', 'public.fm_thread_get(uuid, timestamptz)', 'execute') and not has_function_privilege('anon', 'public.fm_thread_send(uuid, text, uuid)', 'execute'),
  'quick messages: one fm_thread_get and one fm_thread_send, for signed-in people only');
