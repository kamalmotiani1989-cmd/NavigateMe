-- 12. Party rules (Kamal, 10 Nov), 21+: nobody asks to join a party or opens one to people nearby without confirming they're
-- 21 or older and agreeing first. Agreeing to the earlier (18+) version isn't enough.
reset role;
update fm_profiles set party_rules_v = null, party_rules_at = null where id in ('a0000000-0000-4000-8000-00000000000a', 'f0000000-0000-4000-8000-00000000000f');
select (select code from fm_parties order by created_at limit 1) as pcode,
       (select group_id from fm_parties where host_id = 'f0000000-0000-4000-8000-00000000000f' order by created_at limit 1) as pgroup \gset
update fm_profiles set party_rules_v = 1, party_rules_at = now() where id = 'b0000000-0000-4000-8000-00000000000b';
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b');
select pg_temp.ok(not (fm_party_nearby_me()->>'rules_ok')::boolean and pg_temp.err(format('select fm_party_request(%L)', :'pcode')) ~ 'rules-required',
  'party rules: having agreed to the old 18+ version isn''t enough (21+ now)');
select fm_party_rules_accept();
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
select pg_temp.ok((fm_party_nearby_me()->>'rules_ok')::boolean = false, 'party rules: the app knows I haven''t agreed yet');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'pcode')) ~ 'rules-required', 'party rules: no request to join before agreeing');
select fm_party_rules_accept()->>'rules_ok' as said \gset
select pg_temp.ok(:'said'::boolean and (fm_party_nearby_me()->>'rules_ok')::boolean
  and (select party_rules_at is not null and party_rules_v = 2 from fm_profiles where id = 'a0000000-0000-4000-8000-00000000000a'), 'party rules: agreeing is saved, with the date');
select pg_temp.ok(pg_temp.err(format('select fm_party_request(%L)', :'pcode')) !~ 'rules-required', 'party rules: after agreeing, the rules no longer stop a request');
select pg_temp.as_user('f0000000-0000-4000-8000-00000000000f');
select pg_temp.ok(pg_temp.err(format('select fm_party_open_save(%L, %L::jsonb)', :'pgroup', '{"open":true,"guest_limit":6}')) ~ 'rules-required', 'party rules: a host can''t open a party to people nearby before agreeing');
select pg_temp.ok(pg_temp.err(format('select fm_party_open_save(%L, %L::jsonb)', :'pgroup', '{"open":false}')) = '', 'party rules: closing it to people nearby never needs them');
select fm_party_rules_accept();
reset role;
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_party_rules_ok(uuid)', 'execute') and has_function_privilege('authenticated', 'public.fm_party_rules_accept()', 'execute'),
  'party rules: the check is internal; agreeing is open to signed-in people');
