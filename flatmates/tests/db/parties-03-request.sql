-- 3. Request and accept. Hema's party: 4 guests, women only. Asha, Farah and Gita are women within reach.
\set NEAR '''{"lat":18.5680,"lng":73.7700}'''
select pg_temp.as_user('10000000-0000-4000-8000-000000000010'); select fm_party_nearby_set(true, :NEAR, 'Baner') is not null as on_f \gset
select pg_temp.as_user('20000000-0000-4000-8000-000000000020'); select fm_party_nearby_set(true, :NEAR, 'Baner') is not null as on_g \gset
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok(pg_temp.err(format('select fm_party_nearby_get(%L)', :'code')) = '' and not (fm_party_nearby_get(:'code') ? 'address'), 'request: before asking, the party has no address (hidden before accept)');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L, %L)', :'code', 'Call me on 9876543210')) like '%no-contacts-in-note%', 'request: a note cannot carry a phone number');
select fm_party_request(:'code', 'Love board games!', 1) as req_a \gset
select pg_temp.ok((:'req_a'::jsonb)->'my_request'->>'status' = 'pending' and (:'req_a'::jsonb)->'my_request'->>'plus' = '1', 'request: Asha asks to join with a note and one plus-one');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code')) like '%already-asked%', 'request: asking twice is refused');
select pg_temp.ok(not (fm_party_nearby_get(:'code') ? 'address'), 'request: still no address while the request is waiting');
-- wrong gender and opted out can't ask
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code')) like '%wrong-gender%', 'request: Bharat cannot ask (wrong gender)');
select pg_temp.ok(pg_temp.err(format('select fm_party_nearby_get(%L)', :'code')) like '%no-party%', 'request: Bharat cannot open it by its code either');
select pg_temp.as_user('d0000000-0000-4000-8000-00000000000d');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code')) like '%opted-out%', 'request: Divya cannot ask (opted out)');
select pg_temp.as_user('c0000000-0000-4000-8000-00000000000c');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code')) like '%out-of-radius%', 'request: Chitra cannot ask (out of radius)');
-- host sees requests
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select x as hr from fm_party_host_requests('99999999-0000-4000-8000-000000000001') x limit 1 \gset
select pg_temp.ok((:'hr'::jsonb)->>'name' = 'Asha' and (:'hr'::jsonb)->>'gen' = 'z' and (:'hr'::jsonb)->>'gender' = 'female' and (:'hr'::jsonb)->>'match' is not null
  and (:'hr'::jsonb)->>'parties' = '0' and (:'hr'::jsonb)->>'phone' is null and (:'hr'::jsonb)->>'note' = 'Love board games!', 'request: the host sees first name, age group, gender, vibe match, past parties and the note, but no number yet: ' || :'hr');
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok(pg_temp.err($$select fm_party_decide((select id from fm_party_requests limit 1), true)$$) like '%not-the-host%', 'request: only the host can accept');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select fm_party_decide((:'hr'::jsonb->>'id')::uuid, true) as acc \gset
select pg_temp.ok((:'acc'::jsonb)->>'status' = 'accepted' and (:'acc'::jsonb)->>'phone' = '9800000001', 'request: on accept the host gets Asha''s number');
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select fm_party_nearby_get(:'code') as ga \gset
select pg_temp.ok((:'ga'::jsonb)->>'address' like 'B-12, Green Woods%' and (:'ga'::jsonb)->'geo'->>'lat' = '18.559000' and (:'ga'::jsonb)->>'host_phone' = '9800000006',
  'request: on accept Asha gets the address, the map pin and Hema''s number');
select pg_temp.ok((:'ga'::jsonb)->>'spots_left' = '2', 'request: Asha and her plus-one take 2 of the 4 spots');
-- Farah asks for 1 + 1 (fills it), Gita asks for 1: when accepted guests reach the limit, the party closes
select pg_temp.as_user('10000000-0000-4000-8000-000000000010'); select fm_party_request(:'code', null, 1) is not null as req_f \gset
select pg_temp.as_user('20000000-0000-4000-8000-000000000020'); select fm_party_request(:'code', null, 0) is not null as req_g \gset
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L, null, 3)', :'code')) like '%already-asked%', 'request: (Gita already asked)');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select fm_party_decide((select id from fm_party_requests where user_id = '10000000-0000-4000-8000-000000000010'), true) is not null as acc_f \gset
select pg_temp.ok(pg_temp.err($$select fm_party_decide((select id from fm_party_requests where user_id = '20000000-0000-4000-8000-000000000020'), true)$$) like '%party-full%', 'request: accepting past the guest limit is refused (over limit)');
select pg_temp.as_user('20000000-0000-4000-8000-000000000020');
select pg_temp.ok((select count(*) from fm_party_nearby() x where x->>'code' = :'code' and x->'my_request'->>'status' = 'pending') = 1, 'request: Gita still sees the party she asked to join');
select pg_temp.as_user('c0000000-0000-4000-8000-00000000000c'); select fm_party_nearby_set(true, :NEAR, 'Baner') is not null as near_c \gset
select pg_temp.ok((select count(*) from fm_party_nearby()) = 0 and fm_party_cant_see((select id from fm_parties where code = :'code'), 'c0000000-0000-4000-8000-00000000000c') = 'party-full', 'request: once full, the party closes to new requests');
-- withdraw frees the spots; decline is final
select pg_temp.as_user('10000000-0000-4000-8000-000000000010'); select (fm_party_withdraw(:'code'))->'my_request'->>'status' as w_f \gset
select pg_temp.ok(:'w_f' = 'withdrawn', 'request: a guest can withdraw, even after being accepted');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select fm_party_decide((select id from fm_party_requests where user_id = '20000000-0000-4000-8000-000000000020'), false) is not null as dec_g \gset
select pg_temp.as_user('20000000-0000-4000-8000-000000000020');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code')) like '%declined-before%' and not (fm_party_nearby_get(:'code') ? 'address'), 'request: Gita, declined, gets no address and cannot ask again');
select pg_temp.as_user('c0000000-0000-4000-8000-00000000000c');
select pg_temp.ok((select count(*) from fm_party_nearby()) = 1, 'request: with Farah gone, Chitra (now nearby) sees it again');
