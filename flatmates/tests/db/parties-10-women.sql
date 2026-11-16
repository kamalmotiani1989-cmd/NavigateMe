-- 10. Women-only / men-only homes (Kamal, 10 Nov): "Women only" means only women live there and only women are welcome.
insert into auth.users (id, phone) values ('60000000-0000-4000-8000-000000000061', '919800000061'), ('60000000-0000-4000-8000-000000000062', '919800000062'),
  ('60000000-0000-4000-8000-000000000063', '919800000063'), ('60000000-0000-4000-8000-000000000064', '919800000064') on conflict do nothing;
insert into fm_profiles (id, phone, full_name, role, gender) values
  ('60000000-0000-4000-8000-000000000061', '919800000061', 'Priya Owner', 'owner', 'female'),
  ('60000000-0000-4000-8000-000000000062', '919800000062', 'Rahul Owner', 'owner', 'male'),
  ('60000000-0000-4000-8000-000000000063', '919800000063', 'Unset Owner', 'owner', null),
  ('60000000-0000-4000-8000-000000000064', '919800000064', 'Neha Seeker', 'seeker', 'female')
  on conflict (id) do update set gender = excluded.gender;
insert into fm_listings (id, owner_id, kind, title, city, locality, bhk, rent, status, gender, household) values
  ('6a000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000061', 'room', 'W1 two women', 'Wtest', 'Warea', 2, 9000, 'active', 'female', '{"residents":2,"flatmate_genders":["female"]}'),
  ('6a000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000061', 'room', 'W2 open to anyone', 'Wtest', 'Warea', 2, 9000, 'active', 'any', '{"residents":1}'),
  ('6a000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000061', 'room', 'W3 mixed home', 'Wtest', 'Warea', 2, 9000, 'active', 'female', '{"residents":2,"flatmate_genders":["male"]}'),
  ('6a000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000062', 'flat', 'W4 whole flat for women', 'Wtest', 'Warea', 2, 20000, 'active', 'female', '{"residents":0}'),
  ('6a000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000061', 'room', 'W5 older, lister alone', 'Wtest', 'Warea', 2, 9000, 'active', 'female', '{"residents":1}'),
  ('6a000000-0000-4000-8000-000000000006', '60000000-0000-4000-8000-000000000061', 'room', 'W6 older, three, unknown', 'Wtest', 'Warea', 3, 9000, 'active', 'female', '{"residents":3}'),
  ('6a000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000062', 'room', 'W7 two men', 'Wtest', 'Warea', 2, 9000, 'active', 'male', '{"residents":2,"flatmate_genders":["male"]}'),
  ('6a000000-0000-4000-8000-000000000008', '60000000-0000-4000-8000-000000000062', 'room', 'W8 says women, lister is a man', 'Wtest', 'Warea', 2, 9000, 'active', 'female', '{"residents":1}'),
  ('6a000000-0000-4000-8000-000000000009', '60000000-0000-4000-8000-000000000063', 'room', 'W9 lister gender unset', 'Wtest', 'Warea', 2, 9000, 'active', 'female', '{"residents":2,"flatmate_genders":["female"]}')
  on conflict (id) do nothing;
select pg_temp.as_user('60000000-0000-4000-8000-000000000064');
select pg_temp.ok((select string_agg(right(title_key, 2) || '=' || coalesce(home_gender, '-'), ' ' order by title_key) from
  (select split_part(title, ' ', 1) as title_key, home_gender from fm_search(p_city => 'Wtest', p_gender => 'female')) x) = 'W1=female W4=female W5=female W6=female? W9=female?',
  'women only: two women, a whole flat, a lister alone; three unknown and an unset lister come back marked unconfirmed');
select pg_temp.ok(not exists (select 1 from fm_search(p_city => 'Wtest', p_gender => 'female') where split_part(title, ' ', 1) in ('W2','W3','W7','W8')),
  'women only: no "open to anyone" home, no mixed home, no men''s home, no home whose lister is a man');
select pg_temp.ok((select string_agg(split_part(title, ' ', 1) || '=' || coalesce(home_gender, '-'), ' ') from fm_search(p_city => 'Wtest', p_gender => 'male')) = 'W7=male',
  'men only works the same way');
select pg_temp.ok((select count(*) from fm_search(p_city => 'Wtest')) = 9 and (select count(*) from fm_search(p_city => 'Wtest', p_gender => 'any')) = 9,
  'anyone: every home, as before');
select pg_temp.ok((select home_gender from fm_search(p_city => 'Wtest') where split_part(title, ' ', 1) = 'W2') is null
  and (select home_gender from fm_search(p_city => 'Wtest') where split_part(title, ' ', 1) = 'W3') is null,
  'no badge for an "anyone" home or a mixed one');
select pg_temp.ok((select string_agg(split_part(title, ' ', 1) || '=' || coalesce(home_gender, '-'), ' ' order by title) from fm_search_near(18.52, 73.85, 5, 'Warea')) =
  'W1=female W2=- W3=- W4=female W5=female W6=female? W7=male W8=- W9=female?', 'nearby search carries the same answer for every home');
select pg_temp.ok((select home_gender from fm_listing_get('6a000000-0000-4000-8000-000000000001')) = 'female', 'a home''s page carries it too');
select pg_temp.as_user('60000000-0000-4000-8000-000000000061');
select pg_temp.ok((select home_gender from fm_my_listings() where id = '6a000000-0000-4000-8000-000000000003') is null
  and (select home_gender from fm_my_listings() where id = '6a000000-0000-4000-8000-000000000001') = 'female', 'the lister''s own list shows it');
-- an owner updates an older listing: it moves up from unconfirmed
reset role;
update fm_listings set household = '{"residents":3,"flatmate_genders":["female","female"]}' where id = '6a000000-0000-4000-8000-000000000006';
select pg_temp.as_user('60000000-0000-4000-8000-000000000064');
select pg_temp.ok((select home_gender from fm_search(p_city => 'Wtest', p_gender => 'female') where split_part(title, ' ', 1) = 'W6') = 'female', 'once the owner says who lives there, the home qualifies');
reset role;
select pg_temp.ok(fm_home_gender('room', 'female', '{"residents":"x"}', 'female') = 'female' and fm_home_gender('room', 'female', '{"residents":2,"flatmate_genders":"female"}', 'female') = 'female?',
  'odd household data never errors');
-- "Do you live in this flat?" (household.lister_lives_here, Kamal, 16 Nov): a lister who doesn't live there doesn't count
select pg_temp.ok(fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":false,"flatmate_genders":["female","female"]}', 'male') = 'female'
  and fm_home_gender('shared', 'female', '{"residents":1,"lister_lives_here":false,"flatmate_genders":["female"]}', null) = 'female',
  'the lister says they don''t live there: a man letting a room in a home of two women is a women-only home; his own gender, or none, doesn''t matter');
select pg_temp.ok(fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":false,"flatmate_genders":["female","male"]}', 'female') is null
  and fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":false,"flatmate_genders":["male","female"]}', 'female') is null,
  'and then every person living there is checked: one man among them, and it is not a women-only home, whoever lists it');
select pg_temp.ok(fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":false,"flatmate_genders":["female"]}', 'female') = 'female?'
  and fm_home_gender('room', 'female', '{"residents":1,"lister_lives_here":false}', 'female') = 'female?',
  'someone living there whose gender wasn''t given leaves it unconfirmed (the lister''s own gender does not fill the gap)');
select pg_temp.ok(fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":true,"flatmate_genders":["female"]}', 'female') = 'female'
  and fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":true,"flatmate_genders":["female"]}', 'male') is null
  and fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":true,"flatmate_genders":["female"]}', null) = 'female?',
  'the lister says they live there: counted by their own gender, with the others after them, as before');
select pg_temp.ok(fm_home_gender('room', 'female', '{"residents":2,"flatmate_genders":["female"]}', 'male') is null
  and fm_home_gender('room', 'female', '{"residents":2,"flatmate_genders":["female"]}', 'female') = 'female'
  and fm_home_gender('room', 'female', '{"residents":1}', 'female') = 'female',
  'a listing that doesn''t say (posted before the question) is read as before: the lister is one of the people living there');
select pg_temp.ok(fm_home_gender('flat', 'female', '{"residents":2,"lister_lives_here":false,"flatmate_genders":["male","male"]}', 'male') = 'female'
  and fm_home_gender('room', 'male', '{"residents":0,"lister_lives_here":false}', 'female') = 'male'
  and fm_home_gender('room', 'female', '{"residents":2,"lister_lives_here":"no idea","flatmate_genders":["female"]}', 'female') = 'female',
  'a whole flat, or a home nobody lives in, qualifies by what the listing says, as before; an odd answer is read as living there');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.fm_home_gender(text, text, jsonb, text)', 'execute'), 'the helper can''t be called from the app');
