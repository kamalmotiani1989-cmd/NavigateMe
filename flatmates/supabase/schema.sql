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
alter table public.fm_listings add column if not exists photos text[] not null default '{}';
-- The household: same living-style answers as seekers, plus who lives there.
alter table public.fm_listings add column if not exists household jsonb not null default '{}';
-- Monthly expenses for the room, NOT included in rent: {maintenance: 1200, electricity: "usage", ...}.
-- Only the expenses that apply are present; "usage" means paid as per meter/usage.
alter table public.fm_listings add column if not exists costs jsonb not null default '{}';
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
drop function if exists public.fm_set_name(text);
drop function if exists public.fm_search(text, text, int, text, text);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[]);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[], jsonb, jsonb);
drop function if exists public.fm_contact(uuid);

drop function if exists public.fm_unlock(uuid);           -- contact now only via an accepted request
drop function if exists public.fm_claim_refund(uuid, text); -- nothing to refund: contacts are used on acceptance

create or replace function public.fm_me()
returns table (credits int, full_name text, phone text, role text, vibe jsonb, occupation jsonb,
               gift_given boolean, packs bigint, pending bigint, interests jsonb)
language sql security definer set search_path = public stable as $$
  select p.credits, p.full_name, p.phone, p.role, p.vibe, p.occupation, p.gift_given,
         (select count(*) from fm_orders o where o.user_id = p.id and o.status = 'paid'),
         (select count(*) from fm_requests r where r.seeker_id = p.id and r.status = 'pending'),
         p.interests
  from fm_profiles p where p.id = auth.uid();
$$;

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

-- Weighted living-style match, 0..100. Same rules as vibeMatch() in index.html:
-- each answer is 0..2, a question scores 1 - gap/2, smoking/food/pets count double,
-- and at least 4 shared answers are needed.
create or replace function public.fm_match(p_v jsonb, p_h jsonb) returns int
language sql immutable as $$
  with q as (
    select (p_v->>k)::int a, (p_h->>k)::int b, case when k in ('smoke','food','pets') then 2 else 1 end w
    from unnest(array['sleep','clean','food','cook','smoke','drinks','guests','noise','social','sharing','work','pets']) k
    where jsonb_typeof(p_v->k) = 'number' and jsonb_typeof(p_h->k) = 'number')
  select case when count(*) < 4 then null
              else round(100 * sum(w * (1 - abs(a - b) / 2.0)) / sum(w))::int end from q;
$$;

-- Listings, with whether the caller can see the contact and where their request stands.
create or replace function public.fm_search(
  p_city text default null, p_kind text default null,
  p_max_rent int default null, p_gender text default null, p_q text default null)
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint, request_status text)
language sql security definer set search_path = public stable as $$
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_requests r where r.listing_id = l.id),
         mine.status
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
  p_household jsonb default '{}', p_costs jsonb default '{}', p_address_parts jsonb default '{}')
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_photo text;
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
  foreach v_photo in array coalesce(p_photos, '{}') loop
    if position('/storage/v1/object/public/fm-photos/' || auth.uid()::text || '/' in v_photo) = 0 then
      raise exception 'bad-photo-url';
    end if;
  end loop;
  insert into fm_listings (owner_id, kind, title, city, locality, bhk, rent, deposit,
                           available_from, gender, furnishing, amenities, description, photos,
                           household, costs)
  values (auth.uid(), p_kind, p_title, p_city, p_locality, p_bhk, p_rent, p_deposit,
          p_available_from, p_gender, p_furnishing, coalesce(p_amenities, '{}'),
          coalesce(p_description, ''), coalesce(p_photos, '{}'),
          coalesce(p_household, '{}'), coalesce(p_costs, '{}'))
  returning id into v_id;
  insert into fm_listing_private (listing_id, contact_name, contact_phone, address, address_parts)
  values (v_id, p_contact_name, p_contact_phone, p_address, coalesce(p_address_parts, '{}'));
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
   where id = p_request and seeker_id = auth.uid() and status = 'pending';
$$;

-- Owner accepts or declines. Accepting uses one of the seeker's contacts
-- (when charges are on) and shares contact details both ways.
create or replace function public.fm_decide(p_request uuid, p_approve boolean)
returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_req fm_requests%rowtype; v_credits int; v_charges boolean;
begin
  select r.* into v_req from fm_requests r join fm_listings l on l.id = r.listing_id
   where r.id = p_request and l.owner_id = auth.uid() for update of r;
  if v_req.id is null then return query select null::text, 'not-found'; return; end if;
  if v_req.status <> 'pending' then return query select v_req.status, 'already-decided'; return; end if;

  if not p_approve then
    update fm_requests set status = 'declined', decided_at = now(), seen_by_seeker = false where id = p_request;
    return query select 'declined'::text, null::text; return;
  end if;

  v_charges := (select charges_enabled from fm_settings);
  if v_charges then
    select credits into v_credits from fm_profiles where id = v_req.seeker_id for update;
    if v_credits < 1 then return query select 'pending'::text, 'seeker-out-of-contacts'; return; end if;
    update fm_profiles set credits = credits - 1 where id = v_req.seeker_id;
  end if;
  insert into fm_unlocks (user_id, listing_id, charged) values (v_req.seeker_id, v_req.listing_id, v_charges)
  on conflict (user_id, listing_id) do nothing;
  update fm_requests set status = 'approved', decided_at = now(), seen_by_seeker = false where id = p_request;
  return query select 'approved'::text, null::text;
end $$;

-- Both sides' requests in one list, newest first. 'incoming' = on my listing,
-- 'outgoing' = mine as a seeker. The seeker's phone only appears once accepted.
create or replace function public.fm_inbox()
returns table (id uuid, listing_id uuid, listing_title text, direction text, status text,
               match_pct int, message text, created_at timestamptz, decided_at timestamptz,
               name text, occupation jsonb, vibe jsonb, phone text, unseen boolean, interests jsonb)
language sql security definer set search_path = public stable as $$
  select r.id, r.listing_id, l.title,
         case when l.owner_id = auth.uid() then 'incoming' else 'outgoing' end,
         r.status, r.match_pct, r.message, r.created_at, r.decided_at,
         case when l.owner_id = auth.uid() then sp.full_name end,
         case when l.owner_id = auth.uid() then sp.occupation end,
         case when l.owner_id = auth.uid() then sp.vibe end,
         case when l.owner_id = auth.uid() and r.status = 'approved' then sp.phone end,
         case when l.owner_id = auth.uid() then not r.seen_by_owner and r.status = 'pending'
              else not r.seen_by_seeker end,
         case when l.owner_id = auth.uid() then sp.interests end
  from fm_requests r
  join fm_listings l on l.id = r.listing_id
  join fm_profiles sp on sp.id = r.seeker_id
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

