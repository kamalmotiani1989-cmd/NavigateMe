-- 8. Take back a tribe yes the other person hasn't answered
insert into auth.users (id, phone) values ('40000000-0000-4000-8000-000000000041', '919800000041'), ('40000000-0000-4000-8000-000000000042', '919800000042') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role) values ('40000000-0000-4000-8000-000000000041', '919800000041', 'Kabir Rao', 'seeker'), ('40000000-0000-4000-8000-000000000042', '919800000042', 'Anshik Jain', 'seeker') on conflict (id) do nothing;
update fm_settings set charges_enabled = false;
insert into fm_tribe_links (id, a, b, match_pct) values ('48000000-0000-4000-8000-000000000048', '40000000-0000-4000-8000-000000000041', '40000000-0000-4000-8000-000000000042', 72) on conflict do nothing;
select pg_temp.as_user('40000000-0000-4000-8000-000000000041');
select pg_temp.ok(fm_tribe_withdraw('48000000-0000-4000-8000-000000000048') = 'not-asked', 'tribe take back: nothing to take back before saying yes');
select fm_tribe_answer('48000000-0000-4000-8000-000000000048', true) as said \gset
select fm_tribe_withdraw('48000000-0000-4000-8000-000000000048') as took \gset
select pg_temp.ok(:'said' = 'open' and :'took' = 'withdrawn'
  and (select a_yes is null and status = 'open' from fm_tribe_links where id = '48000000-0000-4000-8000-000000000048'), 'tribe take back: my yes goes back to unanswered, the link stays open');
select pg_temp.as_user('40000000-0000-4000-8000-000000000042');
select pg_temp.ok((select not coalesce(t.their_yes, false) from fm_tribe_list() t where t.id = '48000000-0000-4000-8000-000000000048') is not false, 'tribe take back: the other person no longer sees a request');
select pg_temp.ok(fm_tribe_withdraw('48000000-0000-4000-8000-000000000048') = 'not-asked', 'tribe take back: the other person cannot take back a yes they never gave');
select pg_temp.as_user('40000000-0000-4000-8000-000000000041');
select fm_tribe_answer('48000000-0000-4000-8000-000000000048', true) as again \gset
select pg_temp.ok(:'again' = 'open', 'tribe take back: you can say yes again later');
select pg_temp.as_user('40000000-0000-4000-8000-000000000042');
select fm_tribe_answer('48000000-0000-4000-8000-000000000048', true) as bond \gset
select pg_temp.as_user('40000000-0000-4000-8000-000000000041');
select pg_temp.ok(:'bond' = 'bonded' and fm_tribe_withdraw('48000000-0000-4000-8000-000000000048') = 'bonded', 'tribe take back: once both said yes it is a tribe; leaving is the way out');
select pg_temp.as_user('40000000-0000-4000-8000-000000000099');
select pg_temp.ok(fm_tribe_withdraw('48000000-0000-4000-8000-000000000048') = 'not-found', 'tribe take back: someone else cannot touch it');
