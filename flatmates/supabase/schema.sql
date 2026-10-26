-- =====================================================================
-- FindMyFlatMate: database schema
-- =====================================================================
-- Business rules this file enforces (in the database, not the browser):
--   * At sign-in everyone picks a role:
--       'owner'  = has a flat, looking for a flatmate -> posts free
--       'seeker' = looking for a room in a flat       -> asks to meet owners
--   * Posting a flat is free (owners only), with up to 6 photos and a
--     description of each flatmate (working/student, what they do, age).
--   * Seekers fill in what they do and 12 living-style questions first.
--   * A seeker never sees an owner's number or address directly. They send
--     a request (their profile + match %), the owner is notified, and only
--     if the owner accepts are the number and address shared both ways.
--   * Contacts: every seeker gets 5 free as a welcome gift. One is used
--     only when an owner ACCEPTS, so nothing ever needs refunding. After
--     that, packs of 10 for Rs 500. Only the payment webhook adds credits.
--   * fm_settings.charges_enabled = false makes accepted requests free.

-- Run this once in the Supabase SQL editor. Turn on Phone auth under
-- Authentication -> Providers, then paste the project URL and anon key
-- into FM_CONFIG in flatmates/index.html.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------- profiles --
create table if not exists public.fm_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  credits      int  not null default 0 check (credits >= 0),
  created_at   timestamptz not null default now()
);
-- Added after the first version; safe to re-run on an existing database.
alter table public.fm_profiles add column if not exists role text
  check (role in ('owner','seeker'));
-- Seeker's living-style answers, used for the vibe match ({sleep:0..2, clean:0..2, ...}).
alter table public.fm_profiles add column if not exists vibe jsonb not null default '{}';
-- What they do: {type: working|student|self|between, what: "Analyst at Deloitte"}.
alter table public.fm_profiles add column if not exists occupation jsonb not null default '{}';
alter table public.fm_profiles add column if not exists gift_given boolean not null default false;
-- Music and hobbies: shown to owners and as "you both like", never part of the match score.
alter table public.fm_profiles add column if not exists interests jsonb not null default '{}';
-- A seeker's search, so owners can find them (The Empty Room Escape): {city, areas: [...], budget}.
alter table public.fm_profiles add column if not exists search jsonb not null default '{}';
alter table public.fm_profiles add column if not exists search_at timestamptz;
-- Seekers can hide from owners' searches; invites need it on.
alter table public.fm_profiles add column if not exists discoverable boolean not null default true;
-- Seekers can also hide from other seekers' tribe matches (Build your tribe).
alter table public.fm_profiles add column if not exists tribe_open boolean not null default true;

create or replace function public.fm_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.fm_profiles (id, phone) values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists fm_on_auth_user_created on auth.users;
create trigger fm_on_auth_user_created
  after insert on auth.users
  for each row execute function public.fm_handle_new_user();

-- ---------------------------------------------------------- listings --
-- Public part of a listing: anything here can be seen by anyone.
create table if not exists public.fm_listings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('room','shared','flatmate','flat')),
  title         text not null check (char_length(title) between 5 and 90),
  city          text not null,
  locality      text not null,
  bhk           int  not null check (bhk between 1 and 6),
  rent          int  not null check (rent > 0),
  deposit       int  not null default 0 check (deposit >= 0),
  available_from date not null default current_date,
  gender        text not null default 'any' check (gender in ('any','male','female')),
  furnishing    text not null default 'semi' check (furnishing in ('full','semi','none')),
  amenities     text[] not null default '{}',
  description   text not null default '',
  status        text not null default 'active' check (status in ('active','closed')),
  created_at    timestamptz not null default now()
);
-- 'delisted': taken down after a seeker who connected with the owner reported a broker.
alter table public.fm_listings drop constraint if exists fm_listings_status_check;
alter table public.fm_listings add constraint fm_listings_status_check check (status in ('active','closed','delisted'));
alter table public.fm_listings add column if not exists photos text[] not null default '{}';
-- The household: same living-style answers as seekers, plus who lives there.
alter table public.fm_listings add column if not exists household jsonb not null default '{}';
-- Monthly expenses for the room, NOT included in rent: {maintenance: 1200, electricity: "usage", ...}.
-- Only the expenses that apply are present; "usage" means paid as per meter/usage.
alter table public.fm_listings add column if not exists costs jsonb not null default '{}';
-- "Bachelors welcome": singles or a group of friends (a tribe) may rent it.
alter table public.fm_listings add column if not exists bachelors boolean not null default true;
-- 'shared' (a bed in a twin-sharing room) was added later; widen the check on existing databases.
alter table public.fm_listings drop constraint if exists fm_listings_kind_check;
alter table public.fm_listings add constraint fm_listings_kind_check check (kind in ('room','shared','flatmate','flat'));
create index if not exists fm_listings_search on public.fm_listings (status, city, rent);

-- Private part: never readable directly. Released only by fm_contact().
create table if not exists public.fm_listing_private (
  listing_id    uuid primary key references public.fm_listings(id) on delete cascade,
  contact_name  text not null,
  contact_phone text not null,
  address       text not null
);

-- Structured address: {flat, building, street, landmark, pin}. Area and city are public on the listing.
alter table public.fm_listing_private add column if not exists address_parts jsonb not null default '{}';
-- Normalised address (flat + building + PIN) so an owner can list at most two different addresses.
alter table public.fm_listing_private add column if not exists address_key text;
update public.fm_listing_private set address_key =
  lower(regexp_replace(coalesce(address_parts->>'flat', '') || '|' || coalesce(address_parts->>'building', address, '')
                       || '|' || coalesce(address_parts->>'pin', ''), '[^a-zA-Z0-9|]', '', 'g'))
where address_key is null;

-- ----------------------------------------------------- unlocks/visits --
create table if not exists public.fm_unlocks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  listing_id  uuid not null references public.fm_listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.fm_unlocks add column if not exists refunded_at timestamptz;
alter table public.fm_unlocks add column if not exists refund_reason text
  check (refund_reason in ('rented','no_reply'));

-- Free unlocks (made while charges were off) can never be refunded into credits.
alter table public.fm_unlocks add column if not exists charged boolean not null default true;

-- One-row app settings. Turn charges off with:
--   update public.fm_settings set charges_enabled = false;
create table if not exists public.fm_settings (
  id boolean primary key default true check (id),
  charges_enabled boolean not null default true
);
alter table public.fm_settings add column if not exists welcome_credits int not null default 5;
-- TESTING ONLY: lets functions/fm-login sign people in with a shared code and no SMS.
-- Turn it off before real users: update public.fm_settings set test_login = false;
alter table public.fm_settings add column if not exists test_login boolean not null default true;
insert into public.fm_settings (id) values (true) on conflict (id) do nothing;

-- A seeker asking to meet an owner. The owner accepts or declines.
create table if not exists public.fm_requests (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.fm_listings(id) on delete cascade,
  seeker_id     uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending','approved','declined','withdrawn')),
  message       text not null default '',
  match_pct     int,
  seen_by_owner boolean not null default false,
  seen_by_seeker boolean not null default true,
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  unique (listing_id, seeker_id)
);
-- 'seeker': the seeker asked, the owner decides. 'owner': the owner invited a seeker
-- (The Empty Room Escape), the seeker decides. Numbers are shared only on acceptance.
alter table public.fm_requests add column if not exists initiated_by text not null default 'seeker'
  check (initiated_by in ('seeker','owner'));
-- Compromise: after a decline the seeker may change some answers for this home only and ask once more.
-- compromise holds just the changed answers ({smoke: 1, ...}); orig_match_pct the score before.
alter table public.fm_requests add column if not exists compromise jsonb;
alter table public.fm_requests add column if not exists orig_match_pct int;

-- Broker reports, one per listing per reporter.
create table if not exists public.fm_reports (
  listing_id  uuid not null references public.fm_listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null default '',
  created_at  timestamptz not null default now(),
  primary key (listing_id, reporter_id)
);

create table if not exists public.fm_visits (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.fm_listings(id) on delete cascade,
  seeker_id   uuid not null references auth.users(id) on delete cascade,
  visit_at    timestamptz not null,
  note        text not null default '',
  status      text not null default 'requested'
              check (status in ('requested','confirmed','cancelled')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ orders --
create table if not exists public.fm_orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  amount_paise        int  not null,
  credits             int  not null,
  status              text not null default 'created' check (status in ('created','paid')),
  created_at          timestamptz not null default now()
);

-- --------------------------------------------------------------- RLS --
alter table public.fm_profiles        enable row level security;
alter table public.fm_listings        enable row level security;
alter table public.fm_listing_private enable row level security;
alter table public.fm_unlocks         enable row level security;
alter table public.fm_visits          enable row level security;
alter table public.fm_orders          enable row level security;
alter table public.fm_settings        enable row level security;
alter table public.fm_requests        enable row level security;
alter table public.fm_reports         enable row level security;   -- no policies: written by fm_report_broker only

drop policy if exists fm_requests_parties on public.fm_requests;
create policy fm_requests_parties on public.fm_requests
  for select using (
    seeker_id = auth.uid()
    or exists (select 1 from public.fm_listings l where l.id = listing_id and l.owner_id = auth.uid()));
-- All writes go through fm_request / fm_withdraw / fm_decide.

drop policy if exists fm_settings_read on public.fm_settings;
create policy fm_settings_read on public.fm_settings for select using (true);

drop policy if exists fm_profiles_self on public.fm_profiles;
create policy fm_profiles_self on public.fm_profiles
  for select using (auth.uid() = id);
-- No update policy: credits can't be edited from the browser. Name and
-- role go through fm_set_profile().

drop policy if exists fm_listings_read on public.fm_listings;
create policy fm_listings_read on public.fm_listings
  for select using (status = 'active' or owner_id = auth.uid());
drop policy if exists fm_listings_update on public.fm_listings;
create policy fm_listings_update on public.fm_listings
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- Inserts go through fm_post_listing() so the private row is written too.

-- fm_listing_private: RLS on, no policies => nobody reads it directly.

drop policy if exists fm_unlocks_self on public.fm_unlocks;
create policy fm_unlocks_self on public.fm_unlocks
  for select using (user_id = auth.uid());

drop policy if exists fm_visits_parties on public.fm_visits;
create policy fm_visits_parties on public.fm_visits
  for select using (
    seeker_id = auth.uid()
    or exists (select 1 from public.fm_listings l
               where l.id = listing_id and l.owner_id = auth.uid()));

drop policy if exists fm_orders_self on public.fm_orders;
create policy fm_orders_self on public.fm_orders
  for select using (user_id = auth.uid());

-- ------------------------------------------------------------- RPCs --
-- Return types and signatures changed since the first version; drop the old ones.
drop function if exists public.fm_me();
drop function if exists public.fm_inbox();
drop function if exists public.fm_tribe_list();
drop function if exists public.fm_tribe_answer(uuid, boolean);
drop function if exists public.fm_set_name(text);
drop function if exists public.fm_search(text, text, int, text, text);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[]);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[], jsonb, jsonb);
drop function if exists public.fm_contact(uuid);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[], jsonb, jsonb, jsonb);

drop function if exists public.fm_unlock(uuid);           -- contact now only via an accepted request
drop function if exists public.fm_claim_refund(uuid, text); -- nothing to refund: contacts are used on acceptance

create or replace function public.fm_me()
returns table (credits int, full_name text, phone text, role text, vibe jsonb, occupation jsonb,
               gift_given boolean, packs bigint, pending bigint, interests jsonb, discoverable boolean, tribe_open boolean)
language sql security definer set search_path = public stable as $$
  select p.credits, p.full_name, p.phone, p.role, p.vibe, p.occupation, p.gift_given,
         (select count(*) from fm_orders o where o.user_id = p.id and o.status = 'paid'),
         (select count(*) from fm_requests r where r.seeker_id = p.id and r.status = 'pending' and r.initiated_by = 'seeker'),
         p.interests, p.discoverable, p.tribe_open
  from fm_profiles p where p.id = auth.uid();
$$;

-- A seeker's city, areas and budget, so owners in those areas can find and invite them.
create or replace function public.fm_set_search(p_search jsonb, p_discoverable boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update fm_profiles set
    search = jsonb_build_object('city', p_search->>'city',
                                'areas', case when jsonb_typeof(p_search->'areas') = 'array' then p_search->'areas' else '[]'::jsonb end,
                                'budget', case when p_search->>'budget' ~ '^[0-9]{1,7}$' then (p_search->>'budget')::int end),
    search_at = now(),
    discoverable = coalesce(p_discoverable, discoverable)
  where id = auth.uid();
  perform fm_tribe_refresh();
end $$;

create or replace function public.fm_set_interests(p_interests jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_interests) <> 'object' or pg_column_size(p_interests) > 2048 then raise exception 'bad-interests'; end if;
  update fm_profiles set interests = p_interests where id = auth.uid();
end $$;

create or replace function public.fm_set_vibe(p_vibe jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_vibe) <> 'object' or pg_column_size(p_vibe) > 2048 then raise exception 'bad-vibe'; end if;
  update fm_profiles set vibe = p_vibe where id = auth.uid();
end $$;

create or replace function public.fm_set_occupation(p_occ jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_occ) <> 'object' or pg_column_size(p_occ) > 512
     or coalesce(p_occ->>'type', '') not in ('working','student','self','between') then
    raise exception 'bad-occupation';
  end if;
  update fm_profiles set occupation = p_occ where id = auth.uid();
end $$;

-- Null arguments leave the current value alone. The first time someone
-- becomes a seeker they get the welcome gift of free contacts.
create or replace function public.fm_set_profile(p_name text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_role is not null and p_role not in ('owner','seeker') then raise exception 'bad-role'; end if;
  update fm_profiles
     set full_name = coalesce(nullif(left(trim(p_name), 60), ''), full_name),
         role      = coalesce(p_role, role)
   where id = auth.uid();
  if p_role = 'seeker' then
    update fm_profiles
       set credits = credits + (select welcome_credits from fm_settings), gift_given = true
     where id = auth.uid() and not gift_given;
  end if;
end $$;

-- Weighted living-style match, 0..100, then the generation nudge (same as vibeMatch/genAdjust in
-- index.html): each answer is 0..2, a question scores 1 - gap/2, smoking/food/pets count double,
-- at least 4 shared answers are needed. Generations (gen: z Gen Z, m millennial, g Gen X; x = neither):
-- the same generation gets +10 when under 80, two different generations get -10.
create or replace function public.fm_match(p_v jsonb, p_h jsonb) returns int
language sql immutable set search_path = public as $$
  with q as (
    select (p_v->>k)::int a, (p_h->>k)::int b, case when k in ('smoke','food','pets') then 2 else 1 end w
    from unnest(array['sleep','clean','food','cook','smoke','drinks','guests','noise','social','sharing','work','pets']) k
    where jsonb_typeof(p_v->k) = 'number' and jsonb_typeof(p_h->k) = 'number'),
  base as (
    select case when count(*) < 4 then null
                else round(100 * sum(w * (1 - abs(a - b) / 2.0)) / sum(w))::int end s from q)
  select case
    when s is null then null
    when coalesce(p_v->>'gen', '') not in ('z','m','g') or coalesce(p_h->>'gen', '') not in ('z','m','g') then s
    when p_v->>'gen' = p_h->>'gen' then case when s < 80 then least(100, s + 10) else s end
    else greatest(0, s - 10) end
  from base;
$$;

-- Listings, with whether the caller can see the contact and where their request stands.
create or replace function public.fm_search(
  p_city text default null, p_kind text default null,
  p_max_rent int default null, p_gender text default null, p_q text default null)
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint, request_status text, bachelors boolean, status text)
language sql security definer set search_path = public stable as $$
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_requests r where r.listing_id = l.id),
         mine.status, l.bachelors, l.status
  from fm_listings l
  left join fm_requests mine on mine.listing_id = l.id and mine.seeker_id = auth.uid()
  where (l.status = 'active' or l.owner_id = auth.uid())
    and (p_city is null or l.city = p_city)
    and (p_kind is null or l.kind = p_kind)
    and (p_max_rent is null or l.rent <= p_max_rent)
    and (p_gender is null or p_gender = 'any' or l.gender in ('any', p_gender))
    and (p_q is null or l.locality ilike '%' || p_q || '%' or l.title ilike '%' || p_q || '%')
  order by l.created_at desc
  limit 200;
$$;

create or replace function public.fm_post_listing(
  p_kind text, p_title text, p_city text, p_locality text, p_bhk int,
  p_rent int, p_deposit int, p_available_from date, p_gender text,
  p_furnishing text, p_amenities text[], p_description text,
  p_contact_name text, p_contact_phone text, p_address text, p_photos text[] default '{}',
  p_household jsonb default '{}', p_costs jsonb default '{}', p_address_parts jsonb default '{}',
  p_bachelors boolean default true)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_photo text; v_key text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if (select role from fm_profiles where id = auth.uid()) is distinct from 'owner' then
    raise exception 'owners-only';
  end if;
  if coalesce(array_length(p_photos, 1), 0) > 6 then raise exception 'too-many-photos'; end if;
  if jsonb_typeof(coalesce(p_household, '{}')) <> 'object' or pg_column_size(p_household) > 4096
     or jsonb_typeof(coalesce(p_costs, '{}')) <> 'object' or pg_column_size(p_costs) > 1024 then
    raise exception 'bad-details';
  end if;
  if jsonb_typeof(coalesce(p_address_parts, '{}')) <> 'object' or pg_column_size(p_address_parts) > 1024
     or coalesce(p_address_parts->>'pin', '') !~ '^([1-9][0-9]{5})?$' then
    raise exception 'bad-address';
  end if;
  -- Photos must be the caller's own uploads in the fm-photos bucket.
  -- Owners rent out their own home: at most two different addresses per account, and a contact
  -- number can't front for more than two addresses either. Rooms in the same flat share an address.
  v_key := lower(regexp_replace(coalesce(p_address_parts->>'flat', '') || '|' || coalesce(p_address_parts->>'building', p_address, '')
                                || '|' || coalesce(p_address_parts->>'pin', ''), '[^a-zA-Z0-9|]', '', 'g'));
  if (select count(distinct pv.address_key) from fm_listing_private pv join fm_listings l on l.id = pv.listing_id
       where l.owner_id = auth.uid() and pv.address_key is distinct from v_key) >= 2
     or (select count(distinct pv.address_key) from fm_listing_private pv
          where regexp_replace(pv.contact_phone, '\D', '', 'g') = regexp_replace(coalesce(p_contact_phone, ''), '\D', '', 'g')
            and pv.address_key is distinct from v_key) >= 2 then
    raise exception 'address-limit';
  end if;
  foreach v_photo in array coalesce(p_photos, '{}') loop
    if position('/storage/v1/object/public/fm-photos/' || auth.uid()::text || '/' in v_photo) = 0 then
      raise exception 'bad-photo-url';
    end if;
  end loop;
  insert into fm_listings (owner_id, kind, title, city, locality, bhk, rent, deposit,
                           available_from, gender, furnishing, amenities, description, photos,
                           household, costs, bachelors)
  values (auth.uid(), p_kind, p_title, p_city, p_locality, p_bhk, p_rent, p_deposit,
          p_available_from, p_gender, p_furnishing, coalesce(p_amenities, '{}'),
          coalesce(p_description, ''), coalesce(p_photos, '{}'),
          coalesce(p_household, '{}'), coalesce(p_costs, '{}'), coalesce(p_bachelors, true))
  returning id into v_id;
  insert into fm_listing_private (listing_id, contact_name, contact_phone, address, address_parts, address_key)
  values (v_id, p_contact_name, p_contact_phone, p_address, coalesce(p_address_parts, '{}'), v_key);
  return v_id;
end $$;

-- Seeker asks to meet an owner. Needs a filled profile and, when charges are
-- on, a contact that isn't already reserved by another pending request.
create or replace function public.fm_request(p_listing uuid, p_message text)
returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_me fm_profiles%rowtype; v_l fm_listings%rowtype; v_req fm_requests%rowtype; v_pending int;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_me from fm_profiles where id = auth.uid() for update;
  if v_me.role is distinct from 'seeker' then return query select null::text, 'seekers-only'; return; end if;
  if (select count(*) from jsonb_object_keys(v_me.vibe)) < 8 then return query select null::text, 'vibe-required'; return; end if;
  if coalesce(v_me.occupation->>'type', '') = '' then return query select null::text, 'profile-required'; return; end if;
  select * into v_l from fm_listings where id = p_listing and fm_listings.status = 'active';
  if v_l.id is null then return query select null::text, 'listing-not-found'; return; end if;
  if v_l.owner_id = auth.uid() then return query select null::text, 'own-listing'; return; end if;

  select * into v_req from fm_requests where listing_id = p_listing and seeker_id = auth.uid();
  if v_req.status in ('pending','approved') then return query select v_req.status, null::text; return; end if;
  if v_req.status = 'declined' then return query select v_req.status, 'declined'; return; end if;

  if (select charges_enabled from fm_settings) then
    select count(*) into v_pending from fm_requests r where r.seeker_id = auth.uid() and r.status = 'pending';
    if v_me.credits - v_pending < 1 then return query select null::text, 'no-credits'; return; end if;
  end if;

  insert into fm_requests (listing_id, seeker_id, message, match_pct)
  values (p_listing, auth.uid(), left(coalesce(p_message, ''), 300), fm_match(v_me.vibe, v_l.household))
  on conflict (listing_id, seeker_id) do update
    set status = 'pending', message = excluded.message, match_pct = excluded.match_pct,
        seen_by_owner = false, seen_by_seeker = true, created_at = now(), decided_at = null;
  return query select 'pending'::text, null::text;
end $$;

create or replace function public.fm_withdraw(p_request uuid) returns void
language sql security definer set search_path = public as $$
  update fm_requests set status = 'withdrawn'
   where id = p_request and seeker_id = auth.uid() and status = 'pending' and initiated_by = 'seeker';
$$;

-- The other side accepts or declines: the owner for a seeker's request, the seeker for an
-- owner's invite. Accepting shares contact details both ways. It uses one of the seeker's
-- contacts (when charges are on) only when the seeker asked; owners' invites are free.
create or replace function public.fm_decide(p_request uuid, p_approve boolean)
returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_req fm_requests%rowtype; v_credits int; v_charges boolean;
begin
  select r.* into v_req from fm_requests r join fm_listings l on l.id = r.listing_id
   where r.id = p_request
     and ((r.initiated_by = 'seeker' and l.owner_id = auth.uid()) or (r.initiated_by = 'owner' and r.seeker_id = auth.uid()))
   for update of r;
  if v_req.id is null then return query select null::text, 'not-found'; return; end if;
  if v_req.status <> 'pending' then return query select v_req.status, 'already-decided'; return; end if;

  if not p_approve then
    update fm_requests set status = 'declined', decided_at = now(),
           seen_by_seeker = (v_req.initiated_by = 'owner'), seen_by_owner = (v_req.initiated_by = 'seeker')
     where id = p_request;
    return query select 'declined'::text, null::text; return;
  end if;

  v_charges := (select charges_enabled from fm_settings) and v_req.initiated_by = 'seeker';
  if v_charges then
    select credits into v_credits from fm_profiles where id = v_req.seeker_id for update;
    if v_credits < 1 then return query select 'pending'::text, 'seeker-out-of-contacts'; return; end if;
    update fm_profiles set credits = credits - 1 where id = v_req.seeker_id;
  end if;
  insert into fm_unlocks (user_id, listing_id, charged) values (v_req.seeker_id, v_req.listing_id, v_charges)
  on conflict (user_id, listing_id) do nothing;
  update fm_requests set status = 'approved', decided_at = now(),
         seen_by_seeker = (v_req.initiated_by = 'owner'), seen_by_owner = (v_req.initiated_by = 'seeker')
   where id = p_request;
  return query select 'approved'::text, null::text;
end $$;

-- The Empty Room Escape: seekers looking in this listing's city (and area, if they picked
-- areas), with their budget and vibe match. Only the listing's owner can ask.
create or replace function public.fm_find_seekers(p_listing uuid)
returns table (seeker_id uuid, name text, occupation jsonb, areas jsonb, budget int, match_pct int,
               interests jsonb, vibe jsonb, active_at timestamptz, invite_status text, invite_by text)
language sql security definer set search_path = public stable as $$
  select p.id, split_part(coalesce(p.full_name, ''), ' ', 1), p.occupation,
         coalesce(p.search->'areas', '[]'::jsonb), (p.search->>'budget')::int,
         fm_match(p.vibe, l.household), p.interests, p.vibe, coalesce(p.search_at, p.created_at),
         r.status, r.initiated_by
  from fm_listings l
  join fm_profiles p on p.role = 'seeker' and p.discoverable and p.id <> l.owner_id
   and lower(p.search->>'city') = lower(l.city)
   and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0 or p.search->'areas' ? l.locality)
  left join fm_requests r on r.listing_id = l.id and r.seeker_id = p.id
  where l.id = p_listing and l.owner_id = auth.uid()
    and (select count(*) from jsonb_object_keys(p.vibe)) >= 8
  order by fm_match(p.vibe, l.household) desc nulls last, coalesce(p.search_at, p.created_at) desc
  limit 100;
$$;

-- An owner invites a seeker to their listing. Up to 30 invites a day.
create or replace function public.fm_invite(p_listing uuid, p_seeker uuid, p_message text)
returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_l fm_listings%rowtype; v_s fm_profiles%rowtype; v_req fm_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_l from fm_listings where id = p_listing and owner_id = auth.uid() and fm_listings.status = 'active';
  if v_l.id is null then return query select null::text, 'listing-not-found'; return; end if;
  select * into v_s from fm_profiles where id = p_seeker and role = 'seeker' and discoverable;
  if v_s.id is null then return query select null::text, 'seeker-not-found'; return; end if;
  select * into v_req from fm_requests where listing_id = p_listing and seeker_id = p_seeker;
  if v_req.status in ('pending','approved','declined') then return query select v_req.status, null::text; return; end if;
  if (select count(*) from fm_requests r join fm_listings l on l.id = r.listing_id
       where l.owner_id = auth.uid() and r.initiated_by = 'owner' and r.created_at > now() - interval '1 day') >= 30 then
    return query select null::text, 'daily-limit'; return;
  end if;
  insert into fm_requests (listing_id, seeker_id, message, match_pct, initiated_by, seen_by_owner, seen_by_seeker)
  values (p_listing, p_seeker, left(coalesce(p_message, ''), 300), fm_match(v_s.vibe, v_l.household), 'owner', true, false)
  on conflict (listing_id, seeker_id) do update
    set status = 'pending', message = excluded.message, match_pct = excluded.match_pct, initiated_by = 'owner',
        seen_by_owner = true, seen_by_seeker = false, created_at = now(), decided_at = null;
  return query select 'pending'::text, null::text;
end $$;

-- Compromise: after an owner declines, the seeker may change the answers that clashed, for this home
-- only, and send the request once more. The new score must be higher than before.
create or replace function public.fm_compromise(p_request uuid, p_changes jsonb, p_message text)
returns table (status text, error text, match_pct int)
language plpgsql security definer set search_path = public as $$
declare v_req fm_requests%rowtype; v_me fm_profiles%rowtype; v_l fm_listings%rowtype; v_new int; v_pending int; k text;
begin
  select * into v_req from fm_requests r where r.id = p_request and r.seeker_id = auth.uid() and r.initiated_by = 'seeker' for update;
  if v_req.id is null then return query select null::text, 'not-found', null::int; return; end if;
  if v_req.status <> 'declined' then return query select v_req.status, 'not-declined', null::int; return; end if;
  if v_req.compromise is not null then return query select v_req.status, 'already-compromised', null::int; return; end if;
  if jsonb_typeof(p_changes) <> 'object' or (select count(*) from jsonb_object_keys(p_changes)) = 0 then
    return query select null::text, 'no-changes', null::int; return;
  end if;
  for k in select jsonb_object_keys(p_changes) loop
    if k not in ('sleep','clean','food','cook','smoke','drinks','guests','noise','social','sharing','work','pets')
       or jsonb_typeof(p_changes->k) <> 'number' or (p_changes->>k)::int not between 0 and 2 then
      return query select null::text, 'bad-changes', null::int; return;
    end if;
  end loop;
  select * into v_me from fm_profiles where id = auth.uid();
  select * into v_l from fm_listings where id = v_req.listing_id and fm_listings.status = 'active';
  if v_l.id is null then return query select null::text, 'listing-not-found', null::int; return; end if;
  v_new := fm_match(v_me.vibe || p_changes, v_l.household);
  if v_new is null or v_new <= coalesce(v_req.match_pct, 0) then return query select null::text, 'no-better', v_new; return; end if;
  if (select charges_enabled from fm_settings) then
    select count(*) into v_pending from fm_requests r where r.seeker_id = auth.uid() and r.status = 'pending' and r.initiated_by = 'seeker';
    if v_me.credits - v_pending < 1 then return query select null::text, 'no-credits', null::int; return; end if;
  end if;
  update fm_requests set status = 'pending', compromise = p_changes, orig_match_pct = v_req.match_pct, match_pct = v_new,
         message = left(coalesce(nullif(p_message, ''), message), 300), seen_by_owner = false, seen_by_seeker = true,
         created_at = now(), decided_at = null
   where id = p_request;
  return query select 'pending'::text, null::text, v_new;
end $$;

-- A seeker the owner accepted reports a broker: the listing is taken down straight away.
create or replace function public.fm_report_broker(p_listing uuid, p_reason text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from fm_unlocks u join fm_listings l on l.id = u.listing_id
                  where u.listing_id = p_listing and u.user_id = auth.uid() and l.owner_id <> auth.uid()) then
    return 'not-connected';
  end if;
  insert into fm_reports (listing_id, reporter_id, reason) values (p_listing, auth.uid(), left(coalesce(p_reason, ''), 300))
  on conflict (listing_id, reporter_id) do nothing;
  update fm_listings set status = 'delisted' where id = p_listing and status = 'active';
  return 'delisted';
end $$;

-- ------------------------------------------------------- build your tribe --
-- Two seekers looking in the same area whose vibes match 70%+ are suggested to each other
-- as a tribe: hunt together, rent a whole flat, split it. Each says yes or no; numbers are
-- shared only when both say yes. One row per pair, a < b.
create table if not exists public.fm_tribe_links (
  id         uuid primary key default gen_random_uuid(),
  a          uuid not null references auth.users(id) on delete cascade,
  b          uuid not null references auth.users(id) on delete cascade,
  match_pct  int,
  a_yes      boolean,
  b_yes      boolean,
  status     text not null default 'open' check (status in ('open','bonded','closed')),
  kind       text not null default 'match',   -- 'complete': the third person joining, to be bonded with the other two
  seen_a     boolean not null default false,
  seen_b     boolean not null default false,
  created_at timestamptz not null default now(),
  bonded_at  timestamptz,
  check (a < b),
  unique (a, b)
);
alter table public.fm_tribe_links enable row level security;
drop policy if exists fm_tribe_parties on public.fm_tribe_links;
create policy fm_tribe_parties on public.fm_tribe_links for select using (a = auth.uid() or b = auth.uid());
alter table public.fm_tribe_links add column if not exists kind text not null default 'match';

-- Everyone in a person's tribe (bonded links, followed through), the person included. Max 3.
create or replace function public.fm_tribe_members(p_user uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  with recursive m(id) as (
    select p_user
    union
    select case when t.a = m.id then t.b else t.a end
    from fm_tribe_links t join m on (t.a = m.id or t.b = m.id) and t.status = 'bonded')
  select array_agg(id) from m;
$$;
-- All writes go through the functions below.

create or replace function public.fm_set_tribe_open(p_open boolean) returns void
language sql security definer set search_path = public as $$
  update fm_profiles set tribe_open = coalesce(p_open, tribe_open) where id = auth.uid();
$$;

-- Find new 70%+ matches for the caller: same city, overlapping areas (or either open to any area).
create or replace function public.fm_tribe_refresh() returns int
language plpgsql security definer set search_path = public as $$
declare v_me fm_profiles%rowtype; v_n int;
begin
  select * into v_me from fm_profiles where id = auth.uid();
  if v_me.id is null or v_me.role is distinct from 'seeker' or not v_me.tribe_open
     or coalesce(v_me.search->>'city', '') = '' or (select count(*) from jsonb_object_keys(v_me.vibe)) < 8 then
    return 0;
  end if;
  insert into fm_tribe_links (a, b, match_pct)
  select least(v_me.id, p.id), greatest(v_me.id, p.id), fm_match(v_me.vibe, p.vibe)
  from fm_profiles p
  where p.id <> v_me.id and p.role = 'seeker' and p.tribe_open
    and lower(p.search->>'city') = lower(v_me.search->>'city')
    and (select count(*) from jsonb_object_keys(p.vibe)) >= 8
    and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0
         or jsonb_array_length(coalesce(v_me.search->'areas', '[]'::jsonb)) = 0
         or exists (select 1 from jsonb_array_elements_text(p.search->'areas') x where v_me.search->'areas' ? x))
    and fm_match(v_me.vibe, p.vibe) >= 70
  on conflict (a, b) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- My tribe matches and bonds. The other person's number only once both said yes.
create or replace function public.fm_tribe_list()
returns table (id uuid, other_id uuid, name text, occupation jsonb, areas jsonb, budget int, match_pct int,
               interests jsonb, vibe jsonb, my_yes boolean, their_yes boolean, status text, phone text,
               created_at timestamptz, bonded_at timestamptz, unseen boolean,
               kind text, my_size int, their_size int)
language sql security definer set search_path = public stable as $$
  select t.id, o.id, split_part(coalesce(o.full_name, ''), ' ', 1), o.occupation,
         coalesce(o.search->'areas', '[]'::jsonb), (o.search->>'budget')::int, t.match_pct, o.interests, o.vibe,
         case when t.a = auth.uid() then t.a_yes else t.b_yes end,
         case when t.a = auth.uid() then t.b_yes else t.a_yes end,
         t.status,
         case when t.status = 'bonded' then o.phone end,
         t.created_at, t.bonded_at,
         case when t.a = auth.uid() then not t.seen_a else not t.seen_b end,
         t.kind, cardinality(fm_tribe_members(auth.uid())), cardinality(fm_tribe_members(o.id))
  from fm_tribe_links t
  join fm_profiles o on o.id = case when t.a = auth.uid() then t.b else t.a end
  where (t.a = auth.uid() or t.b = auth.uid()) and t.status <> 'closed'
    and (t.status = 'bonded' or o.tribe_open)
  order by (t.status = 'bonded') desc, t.match_pct desc
  limit 100;
$$;

-- Say yes or no to a tribe match. Both yes = bonded (numbers shared). Any no closes it quietly.
create or replace function public.fm_tribe_answer(p_link uuid, p_yes boolean) returns text
language plpgsql security definer set search_path = public as $$
declare t fm_tribe_links%rowtype; v_all uuid[]; x uuid; y uuid;
begin
  select * into t from fm_tribe_links where fm_tribe_links.id = p_link and (a = auth.uid() or b = auth.uid()) for update;
  if t.id is null then return 'not-found'; end if;
  if t.status <> 'open' then return t.status; end if;
  if not p_yes then
    update fm_tribe_links set status = 'closed',
           a_yes = case when a = auth.uid() then false else a_yes end,
           b_yes = case when b = auth.uid() then false else b_yes end
     where fm_tribe_links.id = p_link;
    return 'closed';
  end if;
  -- A tribe is at most 3 people: joining two groups mustn't go over that.
  select array_agg(distinct m) into v_all from unnest(fm_tribe_members(t.a) || fm_tribe_members(t.b)) m;
  if cardinality(v_all) > 3 then return 'full'; end if;
  if t.a = auth.uid() then
    update fm_tribe_links set a_yes = true, seen_b = false where fm_tribe_links.id = p_link returning * into t;
  else
    update fm_tribe_links set b_yes = true, seen_a = false where fm_tribe_links.id = p_link returning * into t;
  end if;
  if t.a_yes and t.b_yes then
    update fm_tribe_links set status = 'bonded', bonded_at = now(), seen_a = false, seen_b = false where fm_tribe_links.id = p_link;
    -- A group of three: everyone in it should agree to everyone else, so open the missing links.
    foreach x in array v_all loop
      foreach y in array v_all loop
        if x < y and not exists (select 1 from fm_tribe_links l where l.a = x and l.b = y and l.status = 'bonded') then
          insert into fm_tribe_links (a, b, match_pct, kind)
          values (x, y, fm_match((select vibe from fm_profiles where id = x), (select vibe from fm_profiles where id = y)), 'complete')
          on conflict (a, b) do update set status = 'open', kind = 'complete', a_yes = null, b_yes = null,
                                           seen_a = false, seen_b = false
            where fm_tribe_links.status <> 'bonded';
        end if;
      end loop;
    end loop;
    return 'bonded';
  end if;
  return 'open';
end $$;

create or replace function public.fm_tribe_seen() returns void
language sql security definer set search_path = public as $$
  update fm_tribe_links set seen_a = true where a = auth.uid() and not seen_a;
  update fm_tribe_links set seen_b = true where b = auth.uid() and not seen_b;
$$;

-- Both sides' requests in one list, newest first. 'incoming' = on my listing,
-- 'outgoing' = mine as a seeker; 'by' says who started it. The seeker's phone reaches the
-- owner only once the request or invite is accepted.
create or replace function public.fm_inbox()
returns table (id uuid, listing_id uuid, listing_title text, direction text, status text,
               match_pct int, message text, created_at timestamptz, decided_at timestamptz,
               name text, occupation jsonb, vibe jsonb, phone text, unseen boolean, interests jsonb,
               by text, compromise jsonb, orig_match_pct int)
language sql security definer set search_path = public stable as $$
  select r.id, r.listing_id, l.title,
         case when l.owner_id = auth.uid() then 'incoming' else 'outgoing' end,
         r.status, r.match_pct, r.message, r.created_at, r.decided_at,
         case when l.owner_id = auth.uid() then sp.full_name
              when r.initiated_by = 'owner' then split_part(coalesce(pv.contact_name, ''), ' ', 1) end,
         case when l.owner_id = auth.uid() then sp.occupation end,
         case when l.owner_id = auth.uid() then sp.vibe end,
         case when l.owner_id = auth.uid() and r.status = 'approved' then sp.phone end,
         case when l.owner_id = auth.uid() then not r.seen_by_owner and (r.status = 'pending') = (r.initiated_by = 'seeker')
              else not r.seen_by_seeker end,
         case when l.owner_id = auth.uid() then sp.interests end,
         r.initiated_by, r.compromise, r.orig_match_pct
  from fm_requests r
  join fm_listings l on l.id = r.listing_id
  join fm_profiles sp on sp.id = r.seeker_id
  left join fm_listing_private pv on pv.listing_id = r.listing_id
  where (l.owner_id = auth.uid() or r.seeker_id = auth.uid()) and r.status <> 'withdrawn'
  order by r.created_at desc
  limit 200;
$$;

create or replace function public.fm_mark_seen() returns void
language sql security definer set search_path = public as $$
  update fm_requests r set seen_by_owner = true
   from fm_listings l where l.id = r.listing_id and l.owner_id = auth.uid() and not r.seen_by_owner;
  update fm_requests set seen_by_seeker = true where seeker_id = auth.uid() and not seen_by_seeker;
$$;

-- Owner contact and exact address: only for the owner, or a seeker whose request was accepted.
create or replace function public.fm_contact(p_listing uuid)
returns table (contact_name text, contact_phone text, address text, address_parts jsonb)
language sql security definer set search_path = public stable as $$
  select pv.contact_name, pv.contact_phone, pv.address, pv.address_parts
  from fm_listing_private pv
  join fm_listings l on l.id = pv.listing_id
  where pv.listing_id = p_listing
    and (l.owner_id = auth.uid() or exists (
          select 1 from fm_unlocks u where u.listing_id = p_listing and u.user_id = auth.uid()));
$$;

create or replace function public.fm_request_visit(p_listing uuid, p_at timestamptz, p_note text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not exists (select 1 from fm_unlocks where user_id = auth.uid() and listing_id = p_listing) then
    raise exception 'not-unlocked';
  end if;
  if p_at < now() then raise exception 'visit-in-past'; end if;
  insert into fm_visits (listing_id, seeker_id, visit_at, note)
  values (p_listing, auth.uid(), p_at, left(coalesce(p_note, ''), 300))
  returning id into v_id;
  return v_id;
end $$;

-- Owner confirms or cancels; seeker can cancel their own.
create or replace function public.fm_set_visit_status(p_visit uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('confirmed','cancelled') then raise exception 'bad-status'; end if;
  update fm_visits v set status = p_status
  where v.id = p_visit
    and ((p_status = 'cancelled' and v.seeker_id = auth.uid())
         or exists (select 1 from fm_listings l where l.id = v.listing_id and l.owner_id = auth.uid()));
end $$;

-- Called ONLY by the payment webhook with the service_role key.
create or replace function public.fm_credit_order(p_razorpay_order text, p_razorpay_payment text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_order fm_orders%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden'; end if;
  select * into v_order from fm_orders where razorpay_order_id = p_razorpay_order for update;
  if v_order.id is null then raise exception 'order-not-found'; end if;
  if v_order.status = 'paid' then return 0; end if;     -- webhook retries are harmless
  update fm_orders set status = 'paid', razorpay_payment_id = p_razorpay_payment
   where id = v_order.id;
  update fm_profiles set credits = credits + v_order.credits where id = v_order.user_id;
  return v_order.credits;
end $$;

revoke execute on function public.fm_credit_order(text, text) from public, anon, authenticated;

-- ------------------------------------------------------------ photos --
-- Public bucket: listing photos are free to browse. Each user may only
-- write inside a folder named after their own user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fm-photos', 'fm-photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists fm_photos_insert on storage.objects;
create policy fm_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fm-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fm_photos_delete on storage.objects;
create policy fm_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fm-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------ push notifications --
-- Device tokens for Firebase Cloud Messaging (Android app). One row per device.
create table if not exists public.fm_push_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null default 'android',
  updated_at timestamptz not null default now()
);
alter table public.fm_push_tokens enable row level security;   -- no policies: only fm-notify (service role) reads them

create or replace function public.fm_save_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or coalesce(p_token, '') = '' or length(p_token) > 4096 then return; end if;
  insert into fm_push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), coalesce(p_platform, 'android'), now())
  on conflict (token) do update set user_id = excluded.user_id, updated_at = now();
end $$;

-- When a request is created, accepted or declined, ask the fm-notify function to push it.
-- Off until fm_settings.notify_url / notify_secret are set (see README, "Push notifications").
alter table public.fm_settings add column if not exists notify_url text;
alter table public.fm_settings add column if not exists notify_secret text;
revoke select on public.fm_settings from anon, authenticated;
grant select (id, charges_enabled, welcome_credits) on public.fm_settings to anon, authenticated;

do $$ begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net is not available here; push notifications from the database stay off';
end $$;

create or replace function public.fm_request_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  if new.status not in ('pending','approved','declined') then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('request_id', new.id, 'status', new.status),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;   -- a failed push must never block the request itself
end $$;

drop trigger if exists fm_requests_notify on public.fm_requests;
create trigger fm_requests_notify after insert or update of status on public.fm_requests
  for each row execute function public.fm_request_notify();

-- Tribe matches: tell both people about a new match, a "yes" and a bond (fm-notify).
create or replace function public.fm_tribe_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status and new.a_yes is not distinct from old.a_yes
     and new.b_yes is not distinct from old.b_yes then return new; end if;
  if new.status = 'closed' then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('tribe_id', new.id, 'event', lower(tg_op)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists fm_tribe_links_notify on public.fm_tribe_links;
create trigger fm_tribe_links_notify after insert or update on public.fm_tribe_links
  for each row execute function public.fm_tribe_notify();

-- ------------------------------------------------------------ Flatsplits --
-- Splitting rent, bills and groceries inside a flat. A group's members are people (name +
-- mobile number); anyone who signs in with that number sees the group. Money is stored in
-- paise so a three-way split of Rs 100 stays exact. All reads and writes go through the
-- fm_split_* functions below; the tables have RLS on and no policies.
create table if not exists public.fm_split_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  emoji       text not null default '🏠' check (char_length(emoji) <= 8),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create table if not exists public.fm_split_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.fm_split_groups(id) on delete cascade,
  name      text not null check (char_length(name) between 1 and 40),
  phone     text not null check (phone ~ '^[6-9][0-9]{9}$'),
  upi       text,
  seen_at   timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (group_id, phone)
);
-- kind 'expense': paid_by paid amount, splits says who owes what ({member_id: paise}, sums to amount).
-- kind 'settle': paid_by paid the one member in splits back.
create table if not exists public.fm_split_expenses (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.fm_split_groups(id) on delete cascade,
  kind        text not null default 'expense' check (kind in ('expense','settle')),
  title       text not null check (char_length(title) between 1 and 80),
  category    text not null default 'other',
  amount      bigint not null check (amount > 0 and amount <= 100000000000),
  paid_by     uuid not null references public.fm_split_members(id) on delete cascade,
  splits      jsonb not null,
  spent_on    date not null default current_date,
  created_by  uuid references public.fm_split_members(id) on delete set null,
  bill_id     uuid,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists fm_split_expenses_group on public.fm_split_expenses (group_id, spent_on desc);
-- Monthly bills (rent, Wi-Fi, maid...): added to the group automatically on day_of_month.
create table if not exists public.fm_split_bills (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.fm_split_groups(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 80),
  category     text not null default 'other',
  amount       bigint not null check (amount > 0 and amount <= 100000000000),
  paid_by      uuid not null references public.fm_split_members(id) on delete cascade,
  splits       jsonb not null,
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  last_month   text,
  created_at   timestamptz not null default now()
);
alter table public.fm_split_groups   enable row level security;
alter table public.fm_split_members  enable row level security;
alter table public.fm_split_expenses enable row level security;
alter table public.fm_split_bills    enable row level security;

-- The caller's 10-digit mobile number (profiles store it as 91XXXXXXXXXX).
create or replace function public.fm_my_phone() returns text
language sql stable security definer set search_path = public as $$
  select right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) from fm_profiles where id = auth.uid();
$$;

create or replace function public.fm_split_me(p_group uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from fm_split_members where group_id = p_group and phone = fm_my_phone();
$$;

-- splits must name members of the group with positive paise that add up to the amount.
create or replace function public.fm_split_check(p_group uuid, p_amount bigint, p_paid_by uuid, p_splits jsonb) returns void
language plpgsql stable security definer set search_path = public as $$
declare k text; v_sum bigint := 0;
begin
  if not exists (select 1 from fm_split_members where id = p_paid_by and group_id = p_group) then raise exception 'bad-payer'; end if;
  if jsonb_typeof(p_splits) <> 'object' or (select count(*) from jsonb_object_keys(p_splits)) = 0 then raise exception 'bad-splits'; end if;
  for k in select jsonb_object_keys(p_splits) loop
    if k !~ '^[0-9a-f-]{36}$' or not exists (select 1 from fm_split_members where id = k::uuid and group_id = p_group)
       or jsonb_typeof(p_splits->k) <> 'number' or (p_splits->>k)::numeric < 0 or (p_splits->>k)::numeric <> floor((p_splits->>k)::numeric) then
      raise exception 'bad-splits';
    end if;
    v_sum := v_sum + (p_splits->>k)::bigint;
  end loop;
  if v_sum <> p_amount then raise exception 'splits-dont-add-up'; end if;
end $$;

create or replace function public.fm_split_create(p_name text, p_emoji text, p_members jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_phone text := fm_my_phone(); v_name text; m jsonb;
begin
  if auth.uid() is null or coalesce(v_phone, '') = '' then raise exception 'not-signed-in'; end if;
  if (select count(*) from fm_split_members where phone = v_phone) >= 20 then raise exception 'too-many-groups'; end if;
  select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Me') into v_name from fm_profiles where id = auth.uid();
  insert into fm_split_groups (name, emoji, created_by)
  values (left(trim(p_name), 60), coalesce(nullif(left(p_emoji, 8), ''), '🏠'), auth.uid()) returning id into v_id;
  insert into fm_split_members (group_id, name, phone, upi)
  values (v_id, left(v_name, 40), v_phone, (select upi from fm_split_members where phone = v_phone and upi is not null limit 1));
  for m in select * from jsonb_array_elements(case when jsonb_typeof(p_members) = 'array' then p_members else '[]' end) loop
    insert into fm_split_members (group_id, name, phone, upi)
    select v_id, left(trim(m->>'name'), 40), x.phone, (select upi from fm_split_members where phone = x.phone and upi is not null limit 1)
    from (select right(regexp_replace(coalesce(m->>'phone', ''), '\D', '', 'g'), 10) as phone) x
    on conflict (group_id, phone) do nothing;
  end loop;
  if (select count(*) from fm_split_members where group_id = v_id) > 12 then raise exception 'too-many-members'; end if;
  return v_id;
end $$;

create or replace function public.fm_split_update(p_group uuid, p_name text, p_emoji text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if fm_split_me(p_group) is null then raise exception 'not-a-member'; end if;
  update fm_split_groups set name = coalesce(nullif(left(trim(p_name), 60), ''), name),
         emoji = coalesce(nullif(left(p_emoji, 8), ''), emoji) where id = p_group;
end $$;

create or replace function public.fm_split_add_member(p_group uuid, p_name text, p_phone text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if fm_split_me(p_group) is null then raise exception 'not-a-member'; end if;
  if (select count(*) from fm_split_members where group_id = p_group) >= 12 then raise exception 'too-many-members'; end if;
  insert into fm_split_members (group_id, name, phone, upi)
  values (p_group, left(trim(p_name), 40), v_phone, (select upi from fm_split_members where phone = v_phone and upi is not null limit 1))
  on conflict (group_id, phone) do update set name = excluded.name returning id into v_id;
  return v_id;
end $$;

-- Each member's balance in paise: what they paid minus their share. Positive = they're owed.
create or replace function public.fm_split_net(p_member uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(case when e.paid_by = p_member then e.amount else 0 end
                      - coalesce((e.splits->>p_member::text)::bigint, 0)), 0)::bigint
  from fm_split_expenses e join fm_split_members m on m.id = p_member and m.group_id = e.group_id
  where e.deleted_at is null;
$$;

-- Only someone who is all settled up can be removed (or leave).
create or replace function public.fm_split_remove_member(p_member uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from fm_split_members where id = p_member;
  if v_group is null or fm_split_me(v_group) is null then return 'not-found'; end if;
  if fm_split_net(p_member) <> 0 then return 'not-settled'; end if;
  delete from fm_split_members where id = p_member;
  if not exists (select 1 from fm_split_members where group_id = v_group) then delete from fm_split_groups where id = v_group; end if;
  return 'removed';
end $$;

create or replace function public.fm_split_add(p_group uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_me uuid := fm_split_me(p_group); v_id uuid; v_amount bigint;
begin
  if v_me is null then raise exception 'not-a-member'; end if;
  if jsonb_typeof(p->'amount') <> 'number' then raise exception 'bad-amount'; end if;
  v_amount := (p->>'amount')::bigint;
  perform fm_split_check(p_group, v_amount, (p->>'paid_by')::uuid, p->'splits');
  insert into fm_split_expenses (group_id, kind, title, category, amount, paid_by, splits, spent_on, created_by)
  values (p_group, coalesce(nullif(p->>'kind', ''), 'expense'), left(coalesce(nullif(trim(p->>'title'), ''), 'Expense'), 80),
          left(coalesce(nullif(p->>'category', ''), 'other'), 20), v_amount, (p->>'paid_by')::uuid, p->'splits',
          coalesce((p->>'spent_on')::date, current_date), v_me)
  returning id into v_id;
  update fm_split_members set seen_at = now() where id = v_me;
  return v_id;
end $$;

create or replace function public.fm_split_delete(p_expense uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from fm_split_expenses where id = p_expense;
  if v_group is null or fm_split_me(v_group) is null then raise exception 'not-found'; end if;
  update fm_split_expenses set deleted_at = now() where id = p_expense and deleted_at is null;
end $$;

create or replace function public.fm_split_bill_save(p_group uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_amount bigint;
begin
  if fm_split_me(p_group) is null then raise exception 'not-a-member'; end if;
  if jsonb_typeof(p->'amount') <> 'number' then raise exception 'bad-amount'; end if;
  v_amount := (p->>'amount')::bigint;
  perform fm_split_check(p_group, v_amount, (p->>'paid_by')::uuid, p->'splits');
  if (select count(*) from fm_split_bills where group_id = p_group) >= 15 then raise exception 'too-many-bills'; end if;
  insert into fm_split_bills (group_id, title, category, amount, paid_by, splits, day_of_month, last_month)
  values (p_group, left(coalesce(nullif(trim(p->>'title'), ''), 'Monthly bill'), 80), left(coalesce(nullif(p->>'category', ''), 'other'), 20),
          v_amount, (p->>'paid_by')::uuid, p->'splits', least(28, greatest(1, coalesce((p->>'day')::int, 1))),
          nullif(p->>'last_month', ''))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.fm_split_bill_delete(p_bill uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from fm_split_bills where id = p_bill;
  if v_group is null or fm_split_me(v_group) is null then raise exception 'not-found'; end if;
  delete from fm_split_bills where id = p_bill;
end $$;

-- UPI ID so flatmates can pay you in one tap. Saved on every group you're in.
create or replace function public.fm_split_set_upi(p_upi text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_upi, '') <> '' and p_upi !~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$' then raise exception 'bad-upi'; end if;
  update fm_split_members set upi = nullif(trim(p_upi), '') where phone = fm_my_phone();
end $$;

-- My groups with my balance and how many new expenses others have added.
create or replace function public.fm_split_groups()
returns table (id uuid, name text, emoji text, members bigint, names text[], my_net bigint, unseen bigint, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.emoji,
         (select count(*) from fm_split_members x where x.group_id = g.id),
         (select array_agg(x.name order by x.created_at) from fm_split_members x where x.group_id = g.id and x.id <> m.id),
         fm_split_net(m.id),
         (select count(*) from fm_split_expenses e where e.group_id = g.id and e.deleted_at is null
            and e.created_at > m.seen_at and e.created_by is distinct from m.id),
         coalesce((select max(e.created_at) from fm_split_expenses e where e.group_id = g.id and e.deleted_at is null), g.created_at)
  from fm_split_members m join fm_split_groups g on g.id = m.group_id
  where m.phone = fm_my_phone()
  order by 8 desc;
$$;

-- One group, everything the screen needs. Adds this month's monthly bills that are due first.
create or replace function public.fm_split_get(p_group uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_me uuid := fm_split_me(p_group); b fm_split_bills%rowtype; v_month text := to_char(current_date, 'YYYY-MM');
begin
  if v_me is null then raise exception 'not-a-member'; end if;
  for b in select * from fm_split_bills where group_id = p_group and (last_month is null or last_month < v_month)
           and extract(day from current_date) >= day_of_month for update loop
    insert into fm_split_expenses (group_id, kind, title, category, amount, paid_by, splits, spent_on, created_by, bill_id)
    values (p_group, 'expense', b.title, b.category, b.amount, b.paid_by, b.splits,
            make_date(extract(year from current_date)::int, extract(month from current_date)::int, b.day_of_month), null, b.id);
    update fm_split_bills set last_month = v_month where id = b.id;
  end loop;
  update fm_split_members set seen_at = now() where id = v_me;
  return jsonb_build_object(
    'group', (select to_jsonb(g) - 'created_by' from fm_split_groups g where g.id = p_group),
    'me', v_me,
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'phone', m.phone, 'upi', m.upi,
                 'on_app', exists (select 1 from fm_profiles p where right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = m.phone))
                 order by m.created_at) from fm_split_members m where m.group_id = p_group), '[]'),
    'expenses', coalesce((select jsonb_agg(to_jsonb(e) - 'deleted_at' - 'group_id' order by e.spent_on desc, e.created_at desc)
                 from (select * from fm_split_expenses where group_id = p_group and deleted_at is null
                       order by spent_on desc, created_at desc limit 500) e), '[]'),
    'bills', coalesce((select jsonb_agg(to_jsonb(x) - 'group_id' order by x.day_of_month) from fm_split_bills x where x.group_id = p_group), '[]'));
end $$;

-- -------------------------------------------------------------- FlatMart --
-- Flatmates selling furniture, appliances and the rest to each other. Same rule as rooms:
-- the seller's number is only shared once they accept an offer, and then both ways.
create table if not exists public.fm_market_items (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 80),
  category    text not null check (category in ('furniture','beds','appliances','kitchen','electronics','decor','bikes','books','other')),
  condition   text not null default 'good' check (condition in ('new','good','used')),
  price       int  not null check (price between 0 and 10000000),
  negotiable  boolean not null default true,
  city        text not null,
  locality    text not null,
  description text not null default '' check (char_length(description) <= 1000),
  photos      text[] not null default '{}',
  moving_by   date,
  status      text not null default 'active' check (status in ('active','reserved','sold','removed')),
  created_at  timestamptz not null default now(),
  bumped_at   timestamptz not null default now()
);
create index if not exists fm_market_items_city on public.fm_market_items (city, status, bumped_at desc);
create table if not exists public.fm_market_offers (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.fm_market_items(id) on delete cascade,
  buyer_id    uuid not null references auth.users(id) on delete cascade,
  offer       int  not null check (offer between 0 and 10000000),
  message     text not null default '',
  status      text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  seen_seller boolean not null default false,
  seen_buyer  boolean not null default true,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  unique (item_id, buyer_id)
);
alter table public.fm_market_items  enable row level security;
alter table public.fm_market_offers enable row level security;

drop function if exists public.fm_market_search(text, text, text);
create or replace function public.fm_market_search(p_city text default null, p_category text default null, p_q text default null,
                                                   p_mine boolean default false)
returns table (id uuid, title text, category text, condition text, price int, negotiable boolean, city text, locality text,
               description text, photos text[], moving_by date, status text, created_at timestamptz, bumped_at timestamptz,
               seller_name text, is_mine boolean, my_offer_status text, my_offer int, offer_count bigint)
language sql stable security definer set search_path = public as $$
  select i.id, i.title, i.category, i.condition, i.price, i.negotiable, i.city, i.locality, i.description, i.photos,
         i.moving_by, i.status, i.created_at, i.bumped_at,
         split_part(coalesce(p.full_name, ''), ' ', 1), i.seller_id = auth.uid(), o.status, o.offer,
         (select count(*) from fm_market_offers x where x.item_id = i.id and x.status in ('pending','accepted'))
  from fm_market_items i
  left join fm_profiles p on p.id = i.seller_id
  left join fm_market_offers o on o.item_id = i.id and o.buyer_id = auth.uid()
  where (i.status in ('active','reserved') or (i.seller_id = auth.uid() and i.status <> 'removed'))
    and (not coalesce(p_mine, false) or i.seller_id = auth.uid())
    and (p_city is null or i.city = p_city)
    and (p_category is null or i.category = p_category or (p_category = 'free' and i.price = 0))
    and (p_q is null or i.title ilike '%' || p_q || '%' or i.description ilike '%' || p_q || '%')
  order by i.bumped_at desc
  limit 300;
$$;

create or replace function public.fm_market_post(
  p_title text, p_category text, p_condition text, p_price int, p_negotiable boolean, p_city text, p_locality text,
  p_description text, p_photos text[] default '{}', p_moving_by date default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_photo text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if (select count(*) from fm_market_items where seller_id = auth.uid() and status in ('active','reserved')) >= 25 then
    raise exception 'too-many-items';
  end if;
  if coalesce(array_length(p_photos, 1), 0) > 4 then raise exception 'too-many-photos'; end if;
  foreach v_photo in array coalesce(p_photos, '{}') loop
    if position('/storage/v1/object/public/fm-photos/' || auth.uid()::text || '/' in v_photo) = 0 then
      raise exception 'bad-photo-url';
    end if;
  end loop;
  insert into fm_market_items (seller_id, title, category, condition, price, negotiable, city, locality, description, photos, moving_by)
  values (auth.uid(), trim(p_title), p_category, p_condition, p_price, coalesce(p_negotiable, true), p_city, trim(p_locality),
          left(coalesce(p_description, ''), 1000), coalesce(p_photos, '{}'), p_moving_by)
  returning id into v_id;
  return v_id;
end $$;

-- Seller: reserve, mark sold, relist or remove. Dropping the price bumps the item to the top.
create or replace function public.fm_market_set_status(p_item uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('active','reserved','sold','removed') then raise exception 'bad-status'; end if;
  update fm_market_items set status = p_status where id = p_item and seller_id = auth.uid();
end $$;

create or replace function public.fm_market_set_price(p_item uuid, p_price int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_price is null or p_price < 0 or p_price > 10000000 then raise exception 'bad-price'; end if;
  update fm_market_items set bumped_at = case when p_price < price then now() else bumped_at end, price = p_price
   where id = p_item and seller_id = auth.uid();
end $$;

create or replace function public.fm_market_offer(p_item uuid, p_offer int, p_message text)
returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_i fm_market_items%rowtype; v_o fm_market_offers%rowtype;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_i from fm_market_items where id = p_item and fm_market_items.status = 'active';
  if v_i.id is null then return query select null::text, 'item-not-available'; return; end if;
  if v_i.seller_id = auth.uid() then return query select null::text, 'own-item'; return; end if;
  if p_offer is null or p_offer < 0 or p_offer > 10000000 then return query select null::text, 'bad-offer'; return; end if;
  select * into v_o from fm_market_offers where item_id = p_item and buyer_id = auth.uid();
  if v_o.status in ('pending','accepted') then return query select v_o.status, null::text; return; end if;
  if (select count(*) from fm_market_offers o where o.buyer_id = auth.uid() and o.created_at > now() - interval '1 day') >= 30 then
    return query select null::text, 'daily-limit'; return;
  end if;
  insert into fm_market_offers (item_id, buyer_id, offer, message)
  values (p_item, auth.uid(), p_offer, left(coalesce(p_message, ''), 300))
  on conflict (item_id, buyer_id) do update
    set status = 'pending', offer = excluded.offer, message = excluded.message, seen_seller = false, seen_buyer = true,
        created_at = now(), decided_at = null;
  return query select 'pending'::text, null::text;
end $$;

create or replace function public.fm_market_withdraw(p_offer uuid) returns void
language sql security definer set search_path = public as $$
  update fm_market_offers set status = 'withdrawn' where id = p_offer and buyer_id = auth.uid() and status = 'pending';
$$;

-- Accepting shares both numbers and reserves the item for that buyer.
create or replace function public.fm_market_decide(p_offer uuid, p_accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare v_o fm_market_offers%rowtype;
begin
  select o.* into v_o from fm_market_offers o join fm_market_items i on i.id = o.item_id
   where o.id = p_offer and i.seller_id = auth.uid() for update of o;
  if v_o.id is null then return 'not-found'; end if;
  if v_o.status <> 'pending' then return v_o.status; end if;
  update fm_market_offers set status = case when p_accept then 'accepted' else 'declined' end, decided_at = now(),
         seen_buyer = false, seen_seller = true where id = p_offer;
  if p_accept then update fm_market_items set status = 'reserved' where id = v_o.item_id and status = 'active'; end if;
  return case when p_accept then 'accepted' else 'declined' end;
end $$;

-- Offers on my items ('incoming') and my offers ('outgoing'). Numbers only once accepted.
create or replace function public.fm_market_inbox()
returns table (id uuid, item_id uuid, item_title text, item_photo text, item_price int, item_status text, category text,
               direction text, status text, offer int, message text, name text, phone text, unseen boolean,
               created_at timestamptz, decided_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.id, i.id, i.title, i.photos[1], i.price, i.status, i.category,
         case when i.seller_id = auth.uid() then 'incoming' else 'outgoing' end,
         o.status, o.offer, o.message,
         split_part(coalesce(case when i.seller_id = auth.uid() then b.full_name else s.full_name end, ''), ' ', 1),
         case when o.status = 'accepted' then (case when i.seller_id = auth.uid() then b.phone else s.phone end) end,
         case when i.seller_id = auth.uid() then not o.seen_seller else not o.seen_buyer end,
         o.created_at, o.decided_at
  from fm_market_offers o
  join fm_market_items i on i.id = o.item_id
  left join fm_profiles b on b.id = o.buyer_id
  left join fm_profiles s on s.id = i.seller_id
  where (i.seller_id = auth.uid() or o.buyer_id = auth.uid()) and o.status <> 'withdrawn'
  order by o.created_at desc
  limit 200;
$$;

create or replace function public.fm_market_seen() returns void
language sql security definer set search_path = public as $$
  update fm_market_offers o set seen_seller = true
   from fm_market_items i where i.id = o.item_id and i.seller_id = auth.uid() and not o.seen_seller;
  update fm_market_offers set seen_buyer = true where buyer_id = auth.uid() and not seen_buyer;
$$;

-- ------------------------------------------------------- function access --
-- Every fm_ function checks auth.uid() itself; on top of that only signed-in users may
-- call them (fm_me and fm_search also answer signed-out callers, with nothing private).
-- Trigger functions, the payment webhook's fm_credit_order and the Flatsplits helpers can't be called at all.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'fm\_%' loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.proname in ('fm_handle_new_user','fm_request_notify','fm_tribe_notify','fm_credit_order',
                     'fm_my_phone','fm_split_me','fm_split_check','fm_split_net') then
      execute format('revoke execute on function %s from authenticated', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
grant execute on function public.fm_search(text, text, int, text, text) to anon;
grant execute on function public.fm_me() to anon;
alter function public.fm_match(jsonb, jsonb) set search_path = public;
