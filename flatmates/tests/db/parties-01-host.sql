-- 1. Host side: open a party to people nearby
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
\set G '''99999999-0000-4000-8000-000000000001'''
\set GOOD '''{"open":true,"guest_limit":4,"entry":"chip","entry_chip":300,"covers":["food","snacks","music","alcohol"],"covers_other":"fairy lights","who":"female","radius_km":3,"area":"Baner","near_address":"B-12, Green Woods, Baner Road, Pune","near_geo":{"lat":18.5590,"lng":73.7868},"house_rules":"No smoking indoors. Wraps up by 11."}'''
select pg_temp.ok((select open from fm_parties where code = :'code') = false, 'host: a party is not open to people nearby by default');
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000001', '{"open":true,"entry":"free","area":"Baner","near_address":"B-12, Green Woods","near_geo":{"lat":18.559,"lng":73.7868}}')$$) like '%bad-limit%', 'host: a guest limit is required when the party is open');
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000001', '{"open":true,"guest_limit":4,"entry":"free","area":"Baner","near_address":"B-12, Green Woods"}')$$) like '%need-pin%', 'host: a map pin is required');
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000001', '{"open":true,"guest_limit":4,"entry":"chip","area":"Baner","near_address":"B-12, Green Woods","near_geo":{"lat":18.559,"lng":73.7868}}')$$) like '%bad-chip%', 'host: a chip-in needs an amount');
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000001', '{"open":true,"guest_limit":4,"entry":"chip","entry_chip":300,"covers_other":"2 beer crates","area":"Baner","near_address":"B-12, Green Woods","near_geo":{"lat":18.559,"lng":73.7868}}')$$) like '%no-alcohol%', 'host: alcohol cannot be part of the chip-in');
select fm_party_open_save(:G, :GOOD) as saved \gset
select pg_temp.ok((:'saved'::jsonb)->>'open' = 'true' and (:'saved'::jsonb)->'covers' = '["food","music","snacks"]' and (:'saved'::jsonb)->>'radius_km' = '3'
  and (:'saved'::jsonb)->>'who' = 'female' and (:'saved'::jsonb)->>'covers_other' = 'fairy lights', 'host: saved; "alcohol" dropped from the covers, radius 3 km: ' || :'saved');
select pg_temp.ok((select fm_party_open_save(:G, jsonb_set(:GOOD::jsonb, '{radius_km}', '9'))->>'radius_km') = '5', 'host: the radius stays between 1 and 5 km');
select pg_temp.ok((select fm_party_open_save(:G, (:GOOD::jsonb) - 'radius_km')->>'radius_km') = '3', 'host: the radius defaults to 3 km');
select pg_temp.ok(not (fm_party_json(:'code') ?| array['near_address','near_geo']) and fm_party_json(:'code')->>'address' is null, 'host: the invite page never shows the private address or pin');
-- someone else can't open it
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok(pg_temp.err($$select fm_party_open_save('99999999-0000-4000-8000-000000000001', '{"open":true}')$$) like '%not-the-host%', 'host: only the host can open it');
select pg_temp.ok(fm_party_open_for_group(:G) is null, 'host: only the host sees the private settings');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok((select fm_party_open_save(:G, '{"open":false}')->>'open') = 'false', 'host: closing it again works');
select fm_party_open_save(:G, :GOOD) is not null as reopened;
