-- 4. Safety: check-in codes, reports, thumbs, the block until Kamal reviews, rate limits
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select fm_party_nearby_get(:'code') as ga4 \gset
select pg_temp.ok((:'ga4'::jsonb)->>'checkin_code' ~ '^[0-9A-F]{6}$' and (:'ga4'::jsonb)->>'checked_in' = 'false', 'safety: Asha, accepted, has a check-in code: ' || ((:'ga4'::jsonb)->>'checkin_code'));
select pg_temp.as_user('20000000-0000-4000-8000-000000000020');
select pg_temp.ok(not (fm_party_nearby_get(:'code') ? 'checkin_code'), 'safety: a declined guest has no check-in code');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok(pg_temp.err($$select fm_party_checkin('99999999-0000-4000-8000-000000000001', 'ZZZZZZ')$$) like '%bad-code%', 'safety: a wrong code is refused at the door');
select (fm_party_checkin('99999999-0000-4000-8000-000000000001', lower((:'ga4'::jsonb)->>'checkin_code')))->>'name' as ci \gset
select pg_temp.ok(:'ci' = 'Asha' and (select checked_in_at is not null from fm_party_requests where user_id = 'a0000000-0000-4000-8000-00000000000a'), 'safety: the host confirms Asha''s code at the door');
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok(pg_temp.err($$select fm_party_checkin('99999999-0000-4000-8000-000000000001', 'ABCDEF')$$) like '%not-the-host%', 'safety: only the host checks people in');
-- thumbs only after the party
select pg_temp.ok(pg_temp.err(format('select fm_party_rate(%L, null, true)', :'code')) like '%not-yet%', 'safety: no thumbs before the party is over');
update fm_parties set starts_at = now() - interval '6 hours', ends_at = now() - interval '1 hour' where code = :'code';
select pg_temp.ok(pg_temp.err(format('select fm_party_rate(%L, null, true)', :'code')) = '', 'safety: after the party Asha gives the host a thumbs up');
select pg_temp.as_user('20000000-0000-4000-8000-000000000020');
select pg_temp.ok(pg_temp.err(format('select fm_party_rate(%L, null, false)', :'code')) like '%not-a-guest%', 'safety: only accepted guests rate the host');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok(pg_temp.err(format('select fm_party_rate(%L, %L, true)', :'code', (select id from fm_party_requests where user_id = 'a0000000-0000-4000-8000-00000000000a'))) = '', 'safety: the host gives Asha a thumbs up');
select x as hr4 from fm_party_host_requests('99999999-0000-4000-8000-000000000001') x where x->>'name' = 'Asha' \gset
select pg_temp.ok((:'hr4'::jsonb)->>'thumbs_up' = '1' and (:'hr4'::jsonb)->>'checked_in' = 'true' and (:'hr4'::jsonb)->>'parties' = '1' and (:'hr4'::jsonb)->>'my_rating' = 'true',
  'safety: the host''s list shows Asha''s thumbs up, check-in and one party attended');
-- reports: two different people report Bharat -> blocked from asking and from hosting
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok(pg_temp.err(format('select fm_party_report(%L, %L, %L)', :'code', (select id from fm_party_requests where user_id = '20000000-0000-4000-8000-000000000020'), 'x')) like '%bad-reason%', 'safety: a report needs a reason');
-- a second party, hosted by Asha, everyone welcome, for Bharat
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000002', 'Games night', 'party', 'a0000000-0000-4000-8000-00000000000a');
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000002', 'Asha', '9800000001');
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select fm_party_save('99999999-0000-4000-8000-000000000002', jsonb_build_object('occasion', 'games', 'title', 'Games night', 'starts_at', now() + interval '2 days')) as code2 \gset
select fm_party_open_save('99999999-0000-4000-8000-000000000002', '{"open":true,"guest_limit":6,"entry":"free","who":"all","radius_km":5,"area":"Baner","near_address":"C-4, Sun Towers, Baner","near_geo":{"lat":18.565,"lng":73.775}}') is not null as open2 \gset
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b'); select fm_party_request(:'code2', 'Hi!', 0) is not null as rb \gset
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select fm_party_report(:'code2', (select id from fm_party_requests where user_id = 'b0000000-0000-4000-8000-00000000000b'), 'Rude messages before the party') is null as rep1 \gset
select pg_temp.ok(not fm_party_blocked('b0000000-0000-4000-8000-00000000000b'), 'safety: one report does not block');
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b');
select pg_temp.ok(pg_temp.err(format('select fm_party_report(%L, null, %L)', :'code2', 'Felt unsafe')) = '', 'safety: a guest can report the party (its host)');
-- a second reporter: Hema reports Bharat on her party (he never asked there) -> refused; so Farah hosts and reports
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000003', 'Chai', 'party', '10000000-0000-4000-8000-000000000010');
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000003', 'Farah', '9800000007');
select pg_temp.as_user('10000000-0000-4000-8000-000000000010');
select fm_party_save('99999999-0000-4000-8000-000000000003', jsonb_build_object('occasion', 'chai', 'title', 'Chai and chill', 'starts_at', now() + interval '2 days')) as code3 \gset
select fm_party_open_save('99999999-0000-4000-8000-000000000003', '{"open":true,"guest_limit":6,"entry":"free","who":"all","radius_km":5,"area":"Baner","near_address":"D-9, Lake View, Baner","near_geo":{"lat":18.562,"lng":73.772}}') is not null as open3 \gset
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b'); select fm_party_request(:'code3') is not null as rb3 \gset
select pg_temp.as_user('10000000-0000-4000-8000-000000000010');
select fm_party_report(:'code3', (select r.id from fm_party_requests r join fm_parties p on p.id = r.party_id where p.code = :'code3' and r.user_id = 'b0000000-0000-4000-8000-00000000000b'), 'Kept messaging after I declined') is null as rep2 \gset
select pg_temp.ok(fm_party_blocked('b0000000-0000-4000-8000-00000000000b'), 'safety: two reports from different people block Bharat');
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b');
update fm_parties set who = 'all' where code = :'code';
select pg_temp.ok((select count(*) from fm_party_nearby() x where x->'my_request' is null) = 0, 'safety: blocked, Bharat sees no new parties');
select pg_temp.ok(fm_party_cant_see((select id from fm_parties where code = :'code2'), 'b0000000-0000-4000-8000-00000000000b') = 'blocked', 'safety: and cannot ask to join (blocked user)');
insert into fm_split_groups (id, name, kind, created_by) values ('99999999-0000-4000-8000-000000000004', 'Mine', 'party', 'b0000000-0000-4000-8000-00000000000b');
insert into fm_split_members (group_id, name, phone) values ('99999999-0000-4000-8000-000000000004', 'Bharat', '9800000002');
select fm_party_save('99999999-0000-4000-8000-000000000004', jsonb_build_object('occasion', 'party', 'title', 'My party', 'starts_at', now() + interval '2 days')) as code4 \gset
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000004', '{"open":true,"guest_limit":4,"entry":"free","area":"Baner","near_address":"E-1, Baner Hill","near_geo":{"lat":18.56,"lng":73.78}}')$$) like '%blocked%', 'safety: and cannot host for people nearby (blocked user)');
-- Kamal's list and clearing
select pg_temp.ok(pg_temp.err('select * from fm_party_review_list()') = '' and (select blocked and reports = 2 from fm_party_review_list() where name = 'Bharat N'), 'safety: Kamal''s review list shows Bharat, blocked, with 2 reports');
set role authenticated;
select pg_temp.ok(pg_temp.err('select * from fm_party_review_list()') like '%permission denied%' and pg_temp.err($$select fm_party_clear('b0000000-0000-4000-8000-00000000000b')$$) like '%permission denied%', 'safety: signed-in users cannot see the review list or clear anyone');
reset role;
select fm_party_clear('b0000000-0000-4000-8000-00000000000b', 'Spoke to both hosts') is null as cleared \gset
select pg_temp.ok(not fm_party_blocked('b0000000-0000-4000-8000-00000000000b'), 'safety: after Kamal clears him, Bharat can take part again');
-- three thumbs down also block
select pg_temp.as_user('c0000000-0000-4000-8000-00000000000c');
insert into fm_party_ratings (party_id, rater, ratee, up) select p.id, u, 'c0000000-0000-4000-8000-00000000000c', false from fm_parties p, (values ('a0000000-0000-4000-8000-00000000000a'::uuid), ('f0000000-0000-4000-8000-00000000000f'::uuid)) x(u) where p.code = :'code';
select pg_temp.ok(not fm_party_blocked('c0000000-0000-4000-8000-00000000000c'), 'safety: two thumbs down do not block');
insert into fm_party_ratings (party_id, rater, ratee, up) select id, '10000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-00000000000c', false from fm_parties where code = :'code';
select pg_temp.ok(fm_party_blocked('c0000000-0000-4000-8000-00000000000c'), 'safety: three thumbs down block');
-- rate limits
select pg_temp.as_user('d0000000-0000-4000-8000-00000000000d');
-- ten requests already this hour (a failed call rolls back its own count, so seed the counter as ten good ones would)
insert into fm_rate (who, bucket, slot, n) values ('d0000000-0000-4000-8000-00000000000d', 'party-req', date_trunc('hour', now()), 10);
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'code2')) like '%rate-limited%', 'safety: asking to join is rate-limited (10 an hour)');
insert into fm_rate (who, bucket, slot, n) values ('d0000000-0000-4000-8000-00000000000d', 'party-report', date_trunc('hour', now()), 10);
select pg_temp.ok(pg_temp.err(format('select fm_party_report(%L, null, %L)', :'code2', 'spam')) like '%rate-limited%', 'safety: reports are rate-limited too');
