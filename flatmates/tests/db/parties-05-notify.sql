-- 5. Notifications: each event posts to fm-notify (here net.http_post is replaced by a recorder)
create table if not exists pg_temp.posts (body jsonb);
create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 1000)
returns bigint language plpgsql as $$ begin insert into pg_temp.posts values (body); return 1; end $$;
update fm_settings set notify_url = 'https://example.invalid/fm-notify', notify_secret = 'test-secret';
truncate pg_temp.posts;
-- a fresh party by Farah (the Chai one, open to all within 5 km); Asha asks
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select fm_party_request(:'code3', 'Hello!') is not null as r5 \gset
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'request' and body ? 'party_request_id') = 1, 'notify: a new request goes to the host');
select pg_temp.as_user('10000000-0000-4000-8000-000000000010');
select fm_party_decide((select r.id from fm_party_requests r join fm_parties p on p.id = r.party_id where p.code = :'code3' and r.user_id = 'a0000000-0000-4000-8000-00000000000a'), true) is not null as d5 \gset
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'accepted') = 1, 'notify: an accept goes to the guest');
select pg_temp.as_user('d0000000-0000-4000-8000-00000000000d');
delete from fm_rate where who = 'd0000000-0000-4000-8000-00000000000d';
select fm_party_nearby_set(true, '{"lat":18.568,"lng":73.77}', 'Baner') is not null as on_d5 \gset
select fm_party_request(:'code3') is not null as r5d \gset
select pg_temp.as_user('10000000-0000-4000-8000-000000000010');
select fm_party_decide((select r.id from fm_party_requests r join fm_parties p on p.id = r.party_id where p.code = :'code3' and r.user_id = 'd0000000-0000-4000-8000-00000000000d'), false) is not null as d5d \gset
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'declined') = 1, 'notify: a decline goes to the guest');
select fm_party_cancel('99999999-0000-4000-8000-000000000003', true);
select pg_temp.ok((select count(*) from pg_temp.posts where body->>'event' = 'cancel_nearby') = 1, 'notify: calling it off tells the guests who asked or were accepted');
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok((fm_party_nearby_get(:'code3'))->>'cancelled' = 'true' and not (fm_party_nearby_get(:'code3') ? 'address'), 'notify: a called-off party shows as called off, without the address');
select pg_temp.ok((select count(*) from pg_temp.posts where body::text ~ '(9800000|B-12|Green Woods|Lake View)') = 0, 'notify: nothing private is in the notification payloads');
