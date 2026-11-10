-- =====================================================================
-- FindMeFlatMate: database schema
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
-- 'splits': signed up for Flatsplits and FlatMart only (8 Nov 2026). Rooms, flatmates and parties nearby open once
-- they answer the vibe questions as a seeker or an owner (the app switches the role and asks them).
alter table public.fm_profiles drop constraint if exists fm_profiles_role_check;
alter table public.fm_profiles add constraint fm_profiles_role_check check (role in ('owner','seeker','splits'));
-- When the person confirmed they are 18 or older (the tick on the sign-in card, or the one-question box for
-- accounts from before it). Null: not confirmed yet; the app asks before anything else.
alter table public.fm_profiles add column if not exists adult_at timestamptz;
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
-- When the person last opened the app (fm_me, at most once an hour). Discover shows "Active 2 days ago" on a home,
-- and hides homes whose owner hasn't opened the app in 30 days. Everyone already here counts as active today, so
-- nothing disappears when this is first added.
alter table public.fm_profiles add column if not exists active_at timestamptz;
update public.fm_profiles set active_at = now() where active_at is null;
alter table public.fm_profiles alter column active_at set default now();
-- When the phone was confirmed by a code actually delivered to it: copied (fm_me) from Supabase's own
-- auth.users.phone_confirmed_at, which only the real WhatsApp / SMS sign-in sets. The test sign-in (fm-login, a
-- shared code) makes an email account and never sets it. The app shows "Phone verified" only when this is set.
alter table public.fm_profiles add column if not exists phone_verified_at timestamptz;
-- Seekers can hide from owners' searches; invites need it on.
alter table public.fm_profiles add column if not exists discoverable boolean not null default true;
-- Seekers can also hide from other seekers' tribe matches (Build your tribe).
alter table public.fm_profiles add column if not exists tribe_open boolean not null default true;
-- Gender (asked at sign-up), and who a seeker is shown to in Build your tribe (other seekers) and The Empty
-- Room Escape (owners): everyone, only women or only men. Both directions count in a tribe match.
alter table public.fm_profiles add column if not exists gender text check (gender in ('male','female'));
alter table public.fm_profiles add column if not exists tribe_show_to text not null default 'all' check (tribe_show_to in ('all','female','male'));
alter table public.fm_profiles add column if not exists escape_show_to text not null default 'all' check (escape_show_to in ('all','female','male'));
create or replace function public.fm_shows_to(p_pref text, p_gender text) returns boolean
language sql immutable as $$ select coalesce(p_pref, 'all') = 'all' or p_pref = p_gender $$;

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

-- ------------------------------------------------------------ rate limits --
-- Stops anyone sweeping the app with a script: each fm_ function that hands out listings, people or
-- party/sale pages counts calls per account (or, signed out, per network address) per hour and per day,
-- and says 'rate-limited' past the limit. Ordinary use stays far below every limit.
create table if not exists public.fm_rate (
  who    text not null,          -- the account id, or 'ip:' + network address when signed out
  bucket text not null,
  slot   timestamptz not null,   -- the hour
  n      int not null default 0,
  primary key (who, bucket, slot)
);
alter table public.fm_rate enable row level security;   -- no policies: fm_throttle only

-- The caller's network address. Cloudflare (in front of Supabase) sets cf-connecting-ip and refuses
-- requests that bring their own; the first x-forwarded-for entry can be made up, so it's only a fallback.
create or replace function public.fm_client_ip() returns text
language sql stable set search_path = public as $$
  select coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(h->>'sb-forwarded-for', ''),
                  nullif(trim(regexp_replace(coalesce(h->>'x-forwarded-for', ''), '^.*,', '')), ''), 'unknown')
  from (select coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json as h) x
$$;

create or replace function public.fm_throttle(p_bucket text, p_hour int, p_day int) returns void
language plpgsql security definer set search_path = public as $$
declare v_who text := coalesce(auth.uid()::text, 'ip:' || fm_client_ip()); v_h int; v_d int;
begin
  insert into fm_rate (who, bucket, slot, n) values (v_who, p_bucket, date_trunc('hour', now()), 1)
  on conflict (who, bucket, slot) do update set n = fm_rate.n + 1
  returning n into v_h;
  select coalesce(sum(n), 0) into v_d from fm_rate
   where who = v_who and bucket = p_bucket and slot > now() - interval '24 hours';
  if v_h > p_hour or v_d > p_day then raise exception 'rate-limited'; end if;
  if random() < 0.01 then delete from fm_rate where slot < now() - interval '2 days'; end if;
end $$;

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
-- Where it is on the map, rounded to about a kilometre ({lat, lng}). The exact pin is in
-- fm_listing_private.address_parts and only reaches people the owner accepts.
alter table public.fm_listings add column if not exists geo jsonb;
-- Room-level details for a private room, shared room or flatmate listing, each optional:
-- {washroom: 'attached'|'shared', balcony: true|false, master: true|false}. Whole flats and older listings: null.
alter table public.fm_listings add column if not exists room jsonb;
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
  user_id             uuid references auth.users(id) on delete set null,   -- kept, without the person, if the account is deleted
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  amount_paise        int  not null,
  credits             int  not null,
  status              text not null default 'created' check (status in ('created','paid')),
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------- plans and passes --
-- What people can buy. Prices exclude GST: fm_settings.gst_percent is added at checkout. A plan
-- gives days on one or more passes:
--   room     unlimited requests, and accepted requests don't use a contact
--   tribe    send tribe requests (anyone can accept one for free)
--   escape   owners invite people past the free ones (fm_settings.free_invites per listing)
--   featured a listing shows first in its area (plan is off until enabled)
-- Change a price with: update fm_plans set base_paise = 60000 where id = 'room30';
create table if not exists public.fm_plans (
  id            text primary key,
  name          text not null,
  who           text not null check (who in ('seeker','owner')),
  base_paise    int  not null check (base_paise > 0),
  room_days     int  not null default 0,
  tribe_days    int  not null default 0,
  escape_days   int  not null default 0,
  featured_days int  not null default 0,
  sort          int  not null default 0,
  enabled       boolean not null default true
);
alter table public.fm_plans enable row level security;
insert into public.fm_plans (id, name, who, base_paise, room_days, tribe_days, escape_days, featured_days, sort, enabled) values
  ('room30',    'Room Pass',        'seeker',  50000, 30,  0, 0, 0, 1, true),
  ('tribe7',    'Tribe Pass',       'seeker',  50000,  0,  7, 0, 0, 2, true),
  ('premium',   'Premium',          'seeker', 150000, 60, 14, 0, 0, 3, true),
  ('escape7',   'Escape Pass',      'owner',   50000,  0,  0, 7, 0, 4, true),
  ('featured7', 'Featured listing', 'owner',   19900,  0,  0, 0, 7, 5, false)
on conflict (id) do nothing;
-- FlatMart: a Boost puts one item first for 3 days; a pack is 5 boosts to use any time; a moving-out sale
-- puts all of a seller's items on one shareable page, all shown first until the date they pick (30 days at most).
-- These are for anyone (who = 'any') and give credits, used with fm_market_boost / fm_market_sale_start.
alter table public.fm_plans drop constraint if exists fm_plans_who_check;
alter table public.fm_plans add constraint fm_plans_who_check check (who in ('seeker','owner','any'));
alter table public.fm_plans add column if not exists boosts int not null default 0;
alter table public.fm_plans add column if not exists sales int not null default 0;
insert into public.fm_plans (id, name, who, base_paise, boosts, sales, sort, enabled) values
  ('boost1', 'FlatMart Boost',        'any',  4900, 1, 0, 10, true),
  ('boost5', 'Boost pack · 5 boosts', 'any', 19900, 5, 0, 11, true),
  ('mksale', 'Moving-out sale',       'any', 14900, 0, 1, 12, true)
on conflict (id) do nothing;

-- One row per run of a pass; buying more of the same pass extends the current run.
create table if not exists public.fm_passes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  kind              text not null check (kind in ('room','tribe','escape')),
  starts_at         timestamptz not null default now(),
  ends_at           timestamptz not null,
  order_id          uuid references public.fm_orders(id) on delete set null,
  guarantee_checked boolean not null default false,   -- room: the "nobody accepted" promise has been settled
  created_at        timestamptz not null default now()
);
create index if not exists fm_passes_user on public.fm_passes (user_id, kind, ends_at);
alter table public.fm_passes enable row level security;

alter table public.fm_orders add column if not exists plan text references public.fm_plans(id);
alter table public.fm_orders add column if not exists base_paise int;
alter table public.fm_orders add column if not exists gst_paise int;
alter table public.fm_orders add column if not exists listing_id uuid references public.fm_listings(id) on delete set null;
-- Payment records outlive a deleted account (tax law): the order stays, without the person.
alter table public.fm_orders alter column user_id drop not null;
alter table public.fm_orders drop constraint if exists fm_orders_user_id_fkey;
alter table public.fm_orders add constraint fm_orders_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.fm_settings add column if not exists gst_percent numeric(5,2) not null default 18;
alter table public.fm_settings add column if not exists free_invites int not null default 1;     -- per listing, before Escape Pass
alter table public.fm_settings add column if not exists guarantee_days int not null default 15;  -- Room Pass "nobody accepted" extension
alter table public.fm_listings add column if not exists featured_until timestamptz;

-- Referrals: a friend who signs up from your link (r=<ref_code>) and finishes their profile counts;
-- every 2 friends earn 1 contact, up to 5.
alter table public.fm_profiles add column if not exists ref_code text unique;
alter table public.fm_profiles add column if not exists referred_by uuid references auth.users(id) on delete set null;
alter table public.fm_profiles add column if not exists ref_rewarded boolean not null default false;
alter table public.fm_profiles add column if not exists ref_bonus int not null default 0;

-- Where an account came from (the first visit's utm_* tags, gclid / fbclid, referring site and
-- landing page), saved once by fm_set_attribution. Read only by the team, through fm_source_report.
alter table public.fm_profiles add column if not exists attribution jsonb;
-- FlatMart boosts and moving-out sales bought and not used yet.
alter table public.fm_profiles add column if not exists boost_credits int not null default 0 check (boost_credits >= 0);
-- "Pays on time": months in a row settled up in Flatsplits by the 10th (cached daily by fm_me); shown only if the person opts in.
alter table public.fm_profiles add column if not exists show_on_time boolean not null default false;
alter table public.fm_profiles add column if not exists on_time_months int not null default 0;
alter table public.fm_profiles add column if not exists on_time_at timestamptz;
alter table public.fm_profiles add column if not exists sale_credits int not null default 0 check (sale_credits >= 0);

-- When the caller's pass of this kind runs until (null if none is running).
create or replace function public.fm_pass_until(p_user uuid, p_kind text) returns timestamptz
language sql stable security definer set search_path = public as $$
  select max(ends_at) from fm_passes where user_id = p_user and kind = p_kind and starts_at <= now() and ends_at > now();
$$;

create or replace function public.fm_grant_pass(p_user uuid, p_kind text, p_days int, p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if coalesce(p_days, 0) <= 0 then return; end if;
  select id into v_id from fm_passes where user_id = p_user and kind = p_kind and ends_at > now()
   order by ends_at desc limit 1 for update;
  if v_id is not null then
    update fm_passes set ends_at = ends_at + make_interval(days => p_days) where id = v_id;
  else
    insert into fm_passes (user_id, kind, ends_at, order_id) values (p_user, p_kind, now() + make_interval(days => p_days), p_order);
  end if;
end $$;

-- The Room Pass promise: if no owner accepted any of your requests while it ran, it gets
-- fm_settings.guarantee_days more, once (from the day it ended, or today if that's later).
create or replace function public.fm_room_guarantee(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p fm_passes%rowtype;
begin
  for p in select * from fm_passes where user_id = p_user and kind = 'room' and ends_at <= now()
           and not guarantee_checked and order_id is not null for update loop
    update fm_passes set guarantee_checked = true,
           ends_at = case when exists (select 1 from fm_requests r where r.seeker_id = p_user and r.status = 'approved'
                                         and r.initiated_by = 'seeker' and r.decided_at between p.starts_at and p.ends_at)
                          then ends_at
                          else greatest(ends_at, now()) + make_interval(days => (select guarantee_days from fm_settings)) end
     where id = p.id;
  end loop;
end $$;

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

-- No policies: nobody reads or writes these tables directly through the API, signed in or not (the
-- table rights are taken away at the end of this file too). Everything goes through the fm_ functions,
-- which check who's asking and apply the limits.
drop policy if exists fm_requests_parties on public.fm_requests;
drop policy if exists fm_settings_read on public.fm_settings;
drop policy if exists fm_profiles_self on public.fm_profiles;
drop policy if exists fm_listings_read on public.fm_listings;
drop policy if exists fm_listings_update on public.fm_listings;
drop policy if exists fm_unlocks_self on public.fm_unlocks;
drop policy if exists fm_visits_parties on public.fm_visits;
drop policy if exists fm_orders_self on public.fm_orders;

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
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[], jsonb, jsonb, jsonb, boolean);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[], jsonb, jsonb, jsonb, boolean, jsonb);   -- room details added

drop function if exists public.fm_unlock(uuid);           -- contact now only via an accepted request
drop function if exists public.fm_claim_refund(uuid, text); -- nothing to refund: contacts are used on acceptance

create or replace function public.fm_me()
returns table (credits int, full_name text, phone text, role text, vibe jsonb, occupation jsonb,
               gift_given boolean, packs bigint, pending bigint, interests jsonb, discoverable boolean, tribe_open boolean,
               room_until timestamptz, tribe_until timestamptz, escape_until timestamptz,
               ref_code text, ref_joined int, ref_bonus int, charges_on boolean,
               gender text, tribe_show_to text, escape_show_to text,
               boost_credits int, sale_credits int, sale_code text, sale_title text, sale_until timestamptz,
               on_time_months int, show_on_time boolean, adult_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  perform fm_room_guarantee(auth.uid());
  update fm_profiles f set on_time_months = fm_on_time_months(f.id), on_time_at = now()
   where f.id = auth.uid() and (f.on_time_at is null or f.on_time_at < now() - interval '1 day');
  update fm_profiles f set ref_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
   where f.id = auth.uid() and f.ref_code is null;
  update fm_profiles f set active_at = now() where f.id = auth.uid() and (f.active_at is null or f.active_at < now() - interval '1 hour');
  update fm_profiles f set phone_verified_at = u.phone_confirmed_at
    from auth.users u where f.id = auth.uid() and u.id = f.id and u.phone_confirmed_at is not null and f.phone_verified_at is null;
  return query
  select p.credits, p.full_name, p.phone, p.role, p.vibe, p.occupation, p.gift_given,
         (select count(*) from fm_orders o where o.user_id = p.id and o.status = 'paid'),
         (select count(*) from fm_requests r where r.seeker_id = p.id and r.status = 'pending' and r.initiated_by = 'seeker'),
         p.interests, p.discoverable, p.tribe_open,
         fm_pass_until(p.id, 'room'), fm_pass_until(p.id, 'tribe'), fm_pass_until(p.id, 'escape'),
         p.ref_code, (select count(*)::int from fm_profiles f where f.referred_by = p.id and f.ref_rewarded), p.ref_bonus,
         (select s.charges_enabled from fm_settings s),
         p.gender, p.tribe_show_to, p.escape_show_to,
         p.boost_credits, p.sale_credits, sl.code, sl.title, sl.ends_at,
         p.on_time_months, p.show_on_time, p.adult_at
  from fm_profiles p left join fm_market_sales sl on sl.seller_id = p.id and sl.ends_at > now()
  where p.id = auth.uid();
end $$;

-- Gender, from sign-up (or Account). Only male or female.
create or replace function public.fm_set_gender(p_gender text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if p_gender is null or p_gender not in ('male','female') then raise exception 'bad-gender'; end if;
  update fm_profiles set gender = p_gender where id = auth.uid();
end $$;

-- Who sees me in Build your tribe and in The Empty Room Escape: 'all', 'female' or 'male' (null keeps it).
create or replace function public.fm_set_show_to(p_tribe text, p_escape text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if coalesce(p_tribe, 'all') not in ('all','female','male') or coalesce(p_escape, 'all') not in ('all','female','male') then
    raise exception 'bad-choice';
  end if;
  update fm_profiles set tribe_show_to = coalesce(p_tribe, tribe_show_to), escape_show_to = coalesce(p_escape, escape_show_to)
   where id = auth.uid();
end $$;

-- A seeker's city, areas and budget, so owners in those areas can find and invite them.
create or replace function public.fm_set_search(p_search jsonb, p_discoverable boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update fm_profiles set
    search = jsonb_build_object('city', p_search->>'city',
                                'areas', case when jsonb_typeof(p_search->'areas') = 'array' then p_search->'areas' else '[]'::jsonb end,
                                'budget', case when p_search->>'budget' ~ '^[0-9]{1,7}$' then (p_search->>'budget')::int end,
                                -- What they're looking for: a private room, a shared room or a whole flat ('' = anything).
                                'kind', case when p_search->>'kind' in ('room', 'shared', 'flat') then p_search->>'kind' else '' end,
                                -- When they want to move in: as soon as possible, within 2 weeks, within a month, in 1-3 months.
                                'move_in', case when p_search->>'move_in' in ('asap', '2w', '1m', '3m') then p_search->>'move_in' end),
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
  perform fm_referral_reward(auth.uid());
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

-- Null arguments leave the current value alone. The name is set once, at sign-up, and can't be changed
-- after that (deleting the account and signing up again is the only way; see fm_name_lock). The first
-- time someone becomes a seeker they get the welcome gift of free contacts.
create or replace function public.fm_set_profile(p_name text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_role is not null and p_role not in ('owner','seeker','splits') then raise exception 'bad-role'; end if;
  update fm_profiles
     set full_name = case when coalesce(full_name, '') = ''
                          then coalesce(nullif(left(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), 60), ''), full_name)
                          else full_name end,
         -- Signing in again with "Just Flatsplits & FlatMart" never takes rooms away from a seeker or an owner.
         role      = case when p_role = 'splits' and role in ('owner','seeker') then role else coalesce(p_role, role) end
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
-- How many of the 12 living-style questions someone has answered (the generation isn't one of them).
-- 6 are asked at sign-up and the other 6 later ("Complete your profile"); 6 answers are enough to match.
create or replace function public.fm_vibe_count(p jsonb) returns int
language sql immutable set search_path = public as $$
  select count(*)::int from jsonb_object_keys(case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end) k
  where k in ('sleep','clean','food','cook','smoke','drinks','guests','noise','social','sharing','work','pets');
$$;

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
-- Signed-in only, and counted (fm_throttle): Discover calls it once per search.
-- How quickly an owner answers requests: the median hours from a seeker's request to the owner's yes or
-- no over the last four months, null until they've answered one. Internal; the search and listing
-- functions return it as reply_hours and the app shows "usually replies within a day" from it.
create or replace function public.fm_reply_hours(p_owner uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select round((percentile_cont(0.5) within group (order by extract(epoch from (r.decided_at - r.created_at)) / 3600))::numeric, 1)
  from fm_requests r join fm_listings l on l.id = r.listing_id
  where l.owner_id = p_owner and r.initiated_by = 'seeker' and r.decided_at is not null
    and r.status in ('approved', 'declined') and r.created_at > now() - interval '120 days';
$$;

-- Discover leaves out a home whose owner hasn't opened the app in 30 days: it's probably gone, and a request
-- would go unanswered. Your own homes, homes you've already asked about, and samples always show. A link to the
-- home still opens it (fm_listing_get), and it's back the moment the owner opens the app.
create or replace function public.fm_listing_fresh(p_owner uuid, p_active timestamptz, p_my_request uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return p_owner = auth.uid() or p_my_request is not null or coalesce(p_active, now()) > now() - interval '30 days' or fm_is_sample(p_owner);
end $$;

drop function if exists public.fm_search(text, text, int, text, text);
create or replace function public.fm_search(
  p_city text default null, p_kind text default null,
  p_max_rent int default null, p_gender text default null, p_q text default null)
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], room jsonb, household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint, request_status text, bachelors boolean, status text, geo jsonb,
  featured boolean, reply_hours numeric, owner_active_at timestamptz, owner_verified boolean)
language sql security definer set search_path = public as $$
  select fm_throttle('search', 200, 1000);
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.room, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_requests r where r.listing_id = l.id),
         mine.status, l.bachelors, l.status, l.geo, coalesce(l.featured_until > now(), false), fm_reply_hours(l.owner_id),
         o.active_at, o.phone_verified_at is not null
  from fm_listings l
  join fm_profiles o on o.id = l.owner_id
  left join fm_requests mine on mine.listing_id = l.id and mine.seeker_id = auth.uid()
  where auth.uid() is not null and (l.status = 'active' or l.owner_id = auth.uid())
    and fm_listing_fresh(l.owner_id, o.active_at, mine.id)
    and (p_city is null or l.city = p_city)
    and (p_kind is null or l.kind = p_kind)
    and (p_max_rent is null or l.rent <= p_max_rent)
    and (p_gender is null or p_gender = 'any' or l.gender in ('any', p_gender))
    and (p_q is null or l.locality ilike '%' || p_q || '%' or l.title ilike '%' || p_q || '%')
  order by l.created_at desc
  limit 200;
$$;

-- Homes near a spot picked in the place search (Discover): pinned homes within p_km (1 to 25 km) of it,
-- nearest first, plus homes without a pin whose area is the place's area. Same columns as fm_search.
-- Listings keep a rounded spot (about a kilometre), so distances are approximate.
drop function if exists public.fm_search_near(double precision, double precision, int, text);
create or replace function public.fm_search_near(p_lat double precision, p_lng double precision, p_km int default 5, p_area text default null)
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], room jsonb, household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint, request_status text, bachelors boolean, status text, geo jsonb,
  featured boolean, reply_hours numeric, owner_active_at timestamptz, owner_verified boolean)
language sql security definer set search_path = public as $$
  select fm_throttle('search', 200, 1000);
  with p as (select least(25, greatest(1, coalesce(p_km, 5)))::double precision as km, nullif(trim(coalesce(p_area, '')), '') as area),
  l as (
    select l.*, case when l.geo is not null then 12742 * asin(sqrt(
             power(sin(radians(((l.geo->>'lat')::double precision - p_lat) / 2)), 2)
           + cos(radians(p_lat)) * cos(radians((l.geo->>'lat')::double precision))
           * power(sin(radians(((l.geo->>'lng')::double precision - p_lng) / 2)), 2))) end as dist
    from fm_listings l, p
    where auth.uid() is not null and (l.status = 'active' or l.owner_id = auth.uid())
      and p_lat between 6 and 37 and p_lng between 68 and 98
      and ((l.geo is not null and abs((l.geo->>'lat')::double precision - p_lat) <= p.km / 111.0 + 0.01
                              and abs((l.geo->>'lng')::double precision - p_lng) <= p.km / 100.0 + 0.01)
           or (l.geo is null and p.area is not null and lower(l.locality) = lower(p.area)))
  )
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.room, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_requests r where r.listing_id = l.id),
         mine.status, l.bachelors, l.status, l.geo, coalesce(l.featured_until > now(), false), fm_reply_hours(l.owner_id),
         o.active_at, o.phone_verified_at is not null
  from l cross join p
  join fm_profiles o on o.id = l.owner_id
  left join fm_requests mine on mine.listing_id = l.id and mine.seeker_id = auth.uid()
  where (l.dist is null or l.dist <= p.km) and fm_listing_fresh(l.owner_id, o.active_at, mine.id)
  order by l.dist nulls last, l.created_at desc
  limit 200;
$$;

-- Room details, checked and trimmed to the three known answers; a whole flat has none. Anything else raises.
create or replace function public.fm_clean_room(p_kind text, p_room jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare v jsonb := '{}'; k text;
begin
  if p_room is null or p_kind = 'flat' or jsonb_typeof(p_room) <> 'object' then return null; end if;
  for k in select jsonb_object_keys(p_room) loop
    if k not in ('washroom', 'balcony', 'master') then raise exception 'bad-room-details'; end if;
  end loop;
  if p_room ? 'washroom' then
    if p_room->>'washroom' not in ('attached', 'shared') then raise exception 'bad-room-details'; end if;
    v := v || jsonb_build_object('washroom', p_room->>'washroom');
  end if;
  if p_room ? 'balcony' then
    if jsonb_typeof(p_room->'balcony') <> 'boolean' then raise exception 'bad-room-details'; end if;
    v := v || jsonb_build_object('balcony', (p_room->>'balcony')::boolean);
  end if;
  if p_room ? 'master' then
    if jsonb_typeof(p_room->'master') <> 'boolean' then raise exception 'bad-room-details'; end if;
    v := v || jsonb_build_object('master', (p_room->>'master')::boolean);
  end if;
  return nullif(v, '{}'::jsonb);
end $$;

create or replace function public.fm_post_listing(
  p_kind text, p_title text, p_city text, p_locality text, p_bhk int,
  p_rent int, p_deposit int, p_available_from date, p_gender text,
  p_furnishing text, p_amenities text[], p_description text,
  p_contact_name text, p_contact_phone text, p_address text, p_photos text[] default '{}',
  p_household jsonb default '{}', p_costs jsonb default '{}', p_address_parts jsonb default '{}',
  p_bachelors boolean default true, p_geo jsonb default null, p_room jsonb default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_photo text; v_key text; v_geo jsonb;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if (select role from fm_profiles where id = auth.uid()) is distinct from 'owner' then
    raise exception 'owners-only';
  end if;
  perform fm_throttle('post', 10, 20);
  if coalesce(array_length(p_photos, 1), 0) > 6 then raise exception 'too-many-photos'; end if;
  if char_length(coalesce(p_city, '')) not between 2 and 60 or char_length(coalesce(p_locality, '')) not between 2 and 80
     or char_length(coalesce(p_description, '')) > 1500 or char_length(coalesce(p_contact_name, '')) > 60
     or char_length(coalesce(p_address, '')) > 300 or coalesce(array_length(p_amenities, 1), 0) > 30
     or exists (select 1 from unnest(coalesce(p_amenities, '{}')) a where char_length(a) > 40) then
    raise exception 'too-long';
  end if;
  if jsonb_typeof(coalesce(p_household, '{}')) <> 'object' or pg_column_size(p_household) > 4096
     or jsonb_typeof(coalesce(p_costs, '{}')) <> 'object' or pg_column_size(p_costs) > 1024 then
    raise exception 'bad-details';
  end if;
  if jsonb_typeof(coalesce(p_address_parts, '{}')) <> 'object' or pg_column_size(p_address_parts) > 1024
     or coalesce(p_address_parts->>'pin', '') !~ '^([1-9][0-9]{5})?$' then
    raise exception 'bad-address';
  end if;
  -- The map pin must be in India. Only a rounded copy is public.
  if p_geo is not null then
    if jsonb_typeof(p_geo->'lat') <> 'number' or jsonb_typeof(p_geo->'lng') <> 'number'
       or (p_geo->>'lat')::numeric not between 6 and 37 or (p_geo->>'lng')::numeric not between 68 and 98 then
      raise exception 'bad-location';
    end if;
    v_geo := jsonb_build_object('lat', round((p_geo->>'lat')::numeric, 2), 'lng', round((p_geo->>'lng')::numeric, 2));
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
                           household, costs, bachelors, geo, room)
  values (auth.uid(), p_kind, p_title, p_city, p_locality, p_bhk, p_rent, p_deposit,
          p_available_from, p_gender, p_furnishing, coalesce(p_amenities, '{}'),
          coalesce(p_description, ''), coalesce(p_photos, '{}'),
          coalesce(p_household, '{}'), coalesce(p_costs, '{}'), coalesce(p_bachelors, true), v_geo, fm_clean_room(p_kind, p_room))
  returning id into v_id;
  insert into fm_listing_private (listing_id, contact_name, contact_phone, address, address_parts, address_key)
  values (v_id, p_contact_name, p_contact_phone, p_address, coalesce(p_address_parts, '{}'), v_key);
  perform fm_referral_reward(auth.uid());
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
  perform fm_throttle('request', 60, 200);
  select * into v_me from fm_profiles where id = auth.uid() for update;
  if v_me.role is distinct from 'seeker' then return query select null::text, 'seekers-only'; return; end if;
  if fm_vibe_count(v_me.vibe) < 6 then return query select null::text, 'need-vibe'; return; end if;
  if fm_vibe_count(v_me.vibe) < 6 then return query select null::text, 'vibe-required'; return; end if;
  if coalesce(v_me.occupation->>'type', '') = '' then return query select null::text, 'profile-required'; return; end if;
  select * into v_l from fm_listings where id = p_listing and fm_listings.status = 'active';
  if v_l.id is null then return query select null::text, 'listing-not-found'; return; end if;
  if v_l.owner_id = auth.uid() then return query select null::text, 'own-listing'; return; end if;

  select * into v_req from fm_requests where listing_id = p_listing and seeker_id = auth.uid();
  if v_req.status in ('pending','approved') then return query select v_req.status, null::text; return; end if;
  if v_req.status = 'declined' then return query select v_req.status, 'declined'; return; end if;

  if (select charges_enabled from fm_settings) and fm_pass_until(auth.uid(), 'room') is null then
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
declare v_req fm_requests%rowtype;
begin
  select r.* into v_req from fm_requests r join fm_listings l on l.id = r.listing_id
   where r.id = p_request
     and ((r.initiated_by = 'seeker' and l.owner_id = auth.uid()) or (r.initiated_by = 'owner' and r.seeker_id = auth.uid()))
   for update of r;
  if v_req.id is null then return query select null::text, 'not-found'; return; end if;
  if v_req.status <> 'pending' then return query select v_req.status, 'already-decided'; return; end if;
  if v_req.initiated_by = 'owner' and v_req.created_at < now() - interval '3 days' then return query select 'expired'::text, 'expired'; return; end if;

  if not p_approve then
    update fm_requests set status = 'declined', decided_at = now(),
           seen_by_seeker = (v_req.initiated_by = 'owner'), seen_by_owner = (v_req.initiated_by = 'seeker')
     where id = p_request;
    return query select 'declined'::text, null::text; return;
  end if;

  -- With the AI go-between on and a chat running, the lister's yes waits for the seeker's "Share my number"
  -- (fm_chat_share) before anything is shared.
  if v_req.initiated_by = 'seeker' and fm_chat_on()
     and exists (select 1 from fm_chats c where c.request_id = p_request and c.status = 'open' and not c.seeker_share) then
    update fm_chats set owner_yes = true where request_id = p_request;
    update fm_requests set seen_by_seeker = false where id = p_request;
    return query select 'pending'::text, 'waiting-for-seeker'; return;
  end if;
  return query select * from fm_request_approve(p_request);
end $$;

-- The Empty Room Escape: seekers looking in this listing's city (and area, if they picked
-- areas), with their budget and vibe match. Only the listing's owner can ask.
drop function if exists public.fm_find_seekers(uuid);
-- An owner's invite lapses after 3 days without an answer ('expired' here and in fm_inbox): the owner can
-- invite again, and the lapsed one doesn't use up the free invite. move_in is when they want to move
-- (asap, 2w, 1m, 3m); invites_got / invites_answered say how they treat owners' invites.
create or replace function public.fm_find_seekers(p_listing uuid)
returns table (seeker_id uuid, name text, occupation jsonb, areas jsonb, budget int, match_pct int,
               interests jsonb, vibe jsonb, active_at timestamptz, invite_status text, invite_by text, on_time boolean,
               move_in text, invites_got int, invites_answered int)
language sql security definer set search_path = public as $$
  select fm_throttle('seekers', 60, 300);
  select p.id, split_part(coalesce(p.full_name, ''), ' ', 1), p.occupation,
         coalesce(p.search->'areas', '[]'::jsonb), (p.search->>'budget')::int,
         fm_match(p.vibe, l.household), p.interests, p.vibe, coalesce(p.search_at, p.created_at),
         case when r.initiated_by = 'owner' and r.status = 'pending' and r.created_at < now() - interval '3 days' then 'expired' else r.status end,
         r.initiated_by, p.show_on_time and p.on_time_months >= 3 and p.on_time_at > now() - interval '40 days',
         p.search->>'move_in',
         (select count(*)::int from fm_requests x where x.seeker_id = p.id and x.initiated_by = 'owner'
           and (x.status in ('approved', 'declined') or (x.status = 'pending' and x.created_at < now() - interval '3 days'))),
         (select count(*)::int from fm_requests x where x.seeker_id = p.id and x.initiated_by = 'owner' and x.status in ('approved', 'declined'))
  from fm_listings l
  join fm_profiles p on p.role = 'seeker' and p.discoverable and p.id <> l.owner_id
   and fm_shows_to(p.escape_show_to, (select o.gender from fm_profiles o where o.id = auth.uid()))
   and lower(p.search->>'city') = lower(l.city)
   and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0 or p.search->'areas' ? l.locality)
  left join fm_requests r on r.listing_id = l.id and r.seeker_id = p.id
  where l.id = p_listing and l.owner_id = auth.uid()
    and fm_vibe_count(p.vibe) >= 6
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
  select * into v_s from fm_profiles where id = p_seeker and role = 'seeker' and discoverable
    and fm_shows_to(escape_show_to, (select o.gender from fm_profiles o where o.id = auth.uid()));
  if v_s.id is null then return query select null::text, 'seeker-not-found'; return; end if;
  select * into v_req from fm_requests where listing_id = p_listing and seeker_id = p_seeker;
  if v_req.status in ('approved','declined')
     or (v_req.status = 'pending' and not (v_req.initiated_by = 'owner' and v_req.created_at < now() - interval '3 days')) then
    return query select v_req.status, null::text; return;
  end if;
  if (select count(*) from fm_requests r join fm_listings l on l.id = r.listing_id
       where l.owner_id = auth.uid() and r.initiated_by = 'owner' and r.created_at > now() - interval '1 day') >= 30 then
    return query select null::text, 'daily-limit'; return;
  end if;
  -- Invites that lapsed unanswered don't count against the free invite.
  if (select charges_enabled from fm_settings) and fm_pass_until(auth.uid(), 'escape') is null
     and (select count(*) from fm_requests r where r.listing_id = p_listing and r.initiated_by = 'owner'
           and not (r.status = 'pending' and r.created_at < now() - interval '3 days')) >= (select free_invites from fm_settings) then
    return query select null::text, 'escape-pass-required'; return;
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
  if (select charges_enabled from fm_settings) and fm_pass_until(auth.uid(), 'room') is null then
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
drop policy if exists fm_tribe_parties on public.fm_tribe_links;   -- fm_tribe_* functions only
alter table public.fm_tribe_links add column if not exists kind text not null default 'match';
-- Leaving a tribe: the leaver's bonded links become 'left' (kept, so they aren't suggested to each other again).
alter table public.fm_tribe_links drop constraint if exists fm_tribe_links_status_check;
alter table public.fm_tribe_links add constraint fm_tribe_links_status_check check (status in ('open','bonded','closed','left'));
alter table public.fm_tribe_links add column if not exists left_by uuid;
alter table public.fm_tribe_links add column if not exists left_at timestamptz;

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
     or coalesce(v_me.search->>'city', '') = '' or fm_vibe_count(v_me.vibe) < 6 then
    return 0;
  end if;
  insert into fm_tribe_links (a, b, match_pct)
  select least(v_me.id, p.id), greatest(v_me.id, p.id), fm_match(v_me.vibe, p.vibe)
  from fm_profiles p
  where p.id <> v_me.id and p.role = 'seeker' and p.tribe_open
    and fm_shows_to(p.tribe_show_to, v_me.gender) and fm_shows_to(v_me.tribe_show_to, p.gender)
    and lower(p.search->>'city') = lower(v_me.search->>'city')
    and fm_vibe_count(p.vibe) >= 6
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
               kind text, my_size int, their_size int, on_time boolean, looking text)
language sql security definer set search_path = public stable as $$
  -- 'left' rows: only to the one who stayed, and only until they've seen the notice.
  select t.id, o.id, split_part(coalesce(o.full_name, ''), ' ', 1), o.occupation,
         coalesce(o.search->'areas', '[]'::jsonb), (o.search->>'budget')::int, t.match_pct, o.interests, o.vibe,
         case when t.a = auth.uid() then t.a_yes else t.b_yes end,
         case when t.a = auth.uid() then t.b_yes else t.a_yes end,
         t.status,
         case when t.status = 'bonded' then o.phone end,
         t.created_at, t.bonded_at,
         case when t.a = auth.uid() then not t.seen_a else not t.seen_b end,
         t.kind, cardinality(fm_tribe_members(auth.uid())), cardinality(fm_tribe_members(o.id)),
         o.show_on_time and o.on_time_months >= 3 and o.on_time_at > now() - interval '40 days',
         coalesce(o.search->>'kind', '')
  from fm_tribe_links t
  join fm_profiles o on o.id = case when t.a = auth.uid() then t.b else t.a end
  join fm_profiles me on me.id = auth.uid()
  where (t.a = auth.uid() or t.b = auth.uid()) and t.status <> 'closed'
    and (t.status <> 'open' or t.kind = 'complete'
         or (fm_shows_to(o.tribe_show_to, me.gender) and fm_shows_to(me.tribe_show_to, o.gender)))
    and (t.status <> 'left' or (t.left_by <> auth.uid() and case when t.a = auth.uid() then not t.seen_a else not t.seen_b end))
    and (t.status in ('bonded', 'left') or o.tribe_open)
  order by (t.status = 'bonded') desc, t.match_pct desc
  limit 100;
$$;

-- Take back a yes the other person hasn't answered (Kamal, 9 Nov). The link goes back to unanswered, not to a no:
-- they stop seeing a request from you, and you can still say yes again later. No notification is sent (fm-notify
-- only sends when exactly one side has said yes). Counted (fm_throttle) so yes / take back can't be used to spam.
create or replace function public.fm_tribe_withdraw(p_link uuid) returns text
language plpgsql security definer set search_path = public as $$
declare t fm_tribe_links%rowtype;
begin
  perform fm_throttle('tribe-undo', 10, 30);
  select * into t from fm_tribe_links where fm_tribe_links.id = p_link and (a = auth.uid() or b = auth.uid()) for update;
  if t.id is null then return 'not-found'; end if;
  if t.status <> 'open' then return t.status; end if;
  if not coalesce(case when t.a = auth.uid() then t.a_yes else t.b_yes end, false) then return 'not-asked'; end if;
  if t.a = auth.uid() then update fm_tribe_links set a_yes = null, seen_b = true where id = p_link;
  else update fm_tribe_links set b_yes = null, seen_a = true where id = p_link; end if;
  return 'withdrawn';
end $$;

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
  -- Saying yes first sends a tribe request: that needs a Tribe Pass. Accepting someone's request is
  -- free, and so are the links that complete a tribe of three.
  if t.kind = 'match' and not coalesce(case when t.a = auth.uid() then t.b_yes else t.a_yes end, false)
     and (select charges_enabled from fm_settings) and fm_pass_until(auth.uid(), 'tribe') is null then
    return 'tribe-pass-required';
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

-- Leave my tribe. My bonded links become 'left' (the others get a notice, fm-notify pushes it, and the
-- shared shortlist stops being shared). The tribe's half-agreed "complete your tribe" links go too: if two
-- people are still bonded to each other they stay a tribe, otherwise everyone is on their own again.
-- Returns how many people I left (0 = I wasn't in a tribe).
create or replace function public.fm_tribe_leave() returns int
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was uuid[]; v_n int;
begin
  if v_me is null then raise exception 'not-signed-in'; end if;
  v_was := fm_tribe_members(v_me);
  update fm_tribe_links set status = 'left', left_by = v_me, left_at = now(),
         seen_a = (a = v_me), seen_b = (b = v_me)
   where (a = v_me or b = v_me) and status = 'bonded';
  get diagnostics v_n = row_count;
  delete from fm_tribe_links where status = 'open' and kind = 'complete' and (a = any(v_was) or b = any(v_was));
  return v_n;
end $$;

-- Both sides' requests in one list, newest first. 'incoming' = on my listing,
-- 'outgoing' = mine as a seeker; 'by' says who started it. The seeker's phone reaches the
-- owner only once the request or invite is accepted.
-- An owner's invite lapses 3 days after it was sent: the seeker no longer sees it, the owner sees
-- 'expired' (and can invite again). expires_at is the deadline while it's open.
create or replace function public.fm_inbox()
returns table (id uuid, listing_id uuid, listing_title text, direction text, status text,
               match_pct int, message text, created_at timestamptz, decided_at timestamptz,
               name text, occupation jsonb, vibe jsonb, phone text, unseen boolean, interests jsonb,
               by text, compromise jsonb, orig_match_pct int, on_time boolean, expires_at timestamptz, verified boolean)
language sql security definer set search_path = public stable as $$
  select r.id, r.listing_id, l.title,
         case when l.owner_id = auth.uid() then 'incoming' else 'outgoing' end,
         case when r.initiated_by = 'owner' and r.status = 'pending' and r.created_at < now() - interval '3 days' then 'expired' else r.status end,
         r.match_pct, r.message, r.created_at, r.decided_at,
         case when l.owner_id = auth.uid() then sp.full_name
              when r.initiated_by = 'owner' then split_part(coalesce(pv.contact_name, ''), ' ', 1) end,
         case when l.owner_id = auth.uid() then sp.occupation end,
         case when l.owner_id = auth.uid() then sp.vibe end,
         case when l.owner_id = auth.uid() and r.status = 'approved' then sp.phone end,
         case when l.owner_id = auth.uid() then not r.seen_by_owner and (r.status = 'pending') = (r.initiated_by = 'seeker')
              else not r.seen_by_seeker end,
         case when l.owner_id = auth.uid() then sp.interests end,
         r.initiated_by, r.compromise, r.orig_match_pct,
         case when l.owner_id = auth.uid() then sp.show_on_time and sp.on_time_months >= 3 and sp.on_time_at > now() - interval '40 days' end,
         case when r.initiated_by = 'owner' and r.status = 'pending' then r.created_at + interval '3 days' end,
         case when l.owner_id = auth.uid() then sp.phone_verified_at is not null end
  from fm_requests r
  join fm_listings l on l.id = r.listing_id
  join fm_profiles sp on sp.id = r.seeker_id
  left join fm_listing_private pv on pv.listing_id = r.listing_id
  where (l.owner_id = auth.uid() or r.seeker_id = auth.uid()) and r.status <> 'withdrawn'
    and not (l.owner_id <> auth.uid() and r.initiated_by = 'owner' and r.status = 'pending' and r.created_at < now() - interval '3 days')
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
declare v_order fm_orders%rowtype; v_plan fm_plans%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden'; end if;
  select * into v_order from fm_orders where razorpay_order_id = p_razorpay_order for update;
  if v_order.id is null then raise exception 'order-not-found'; end if;
  if v_order.status = 'paid' then return 0; end if;     -- webhook retries are harmless
  update fm_orders set status = 'paid', razorpay_payment_id = p_razorpay_payment
   where id = v_order.id;
  if v_order.user_id is null then return 0; end if;     -- the account was deleted after checkout: record the payment only
  update fm_profiles set credits = credits + v_order.credits where id = v_order.user_id;
  if v_order.plan is not null then
    select * into v_plan from fm_plans where id = v_order.plan;
    perform fm_grant_pass(v_order.user_id, 'room', v_plan.room_days, v_order.id);
    perform fm_grant_pass(v_order.user_id, 'tribe', v_plan.tribe_days, v_order.id);
    perform fm_grant_pass(v_order.user_id, 'escape', v_plan.escape_days, v_order.id);
    if v_plan.featured_days > 0 then
      update fm_listings set featured_until = greatest(featured_until, now()) + make_interval(days => v_plan.featured_days)
       where id = v_order.listing_id and owner_id = v_order.user_id;
    end if;
    if v_plan.boosts > 0 or v_plan.sales > 0 then
      update fm_profiles set boost_credits = boost_credits + v_plan.boosts, sale_credits = sale_credits + v_plan.sales where id = v_order.user_id;
    end if;
  end if;
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
-- Listing your own folder, so deleting an account can find and remove its photos.
drop policy if exists fm_photos_select_own on storage.objects;
create policy fm_photos_select_own on storage.objects for select to authenticated
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
-- Keys only the server uses (the push function reads them with the service role; nobody else can):
-- 'fcm_service_account' = the Firebase service-account JSON. An Edge Function secret of the same purpose
-- (FCM_SERVICE_ACCOUNT) wins if it's set.
create table if not exists public.fm_server_keys (
  name       text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.fm_server_keys enable row level security;   -- no policies
revoke all on public.fm_server_keys from anon, authenticated;
-- Off until fm_settings.notify_url / notify_secret are set (see README, "Push notifications").
alter table public.fm_settings add column if not exists notify_url text;
alter table public.fm_settings add column if not exists notify_secret text;
revoke all on public.fm_settings from anon, authenticated;   -- fm_me says whether charges are on

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

-- ------------------------------------------------- shortlist (shared in a tribe) --
-- The ♥ shortlist lives on the server, so everyone in a tribe (up to 3 people) sees the homes
-- the others saved, with who saved them.
create table if not exists public.fm_saves (
  user_id    uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.fm_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.fm_saves enable row level security;   -- no policies: fm_save / fm_tribe_saves only

create or replace function public.fm_save(p_listing uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if not coalesce(p_on, false) then
    delete from fm_saves where user_id = auth.uid() and listing_id = p_listing;
    return;
  end if;
  if (select count(*) from fm_saves where user_id = auth.uid()) >= 300 then raise exception 'too-many-saves'; end if;
  insert into fm_saves (user_id, listing_id) values (auth.uid(), p_listing) on conflict do nothing;
end $$;

-- Homes saved by me or anyone in my tribe: who saved each one, and when the others last did.
create or replace function public.fm_tribe_saves()
returns table (listing_id uuid, saved_by text[], mine boolean, others_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.listing_id,
         array_agg(case when s.user_id = auth.uid() then 'You' else coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Your tribe') end
                   order by s.created_at),
         bool_or(s.user_id = auth.uid()),
         max(s.created_at) filter (where s.user_id <> auth.uid())
  from fm_saves s
  join fm_profiles p on p.id = s.user_id
  where s.user_id = any (coalesce(fm_tribe_members(auth.uid()), array[auth.uid()]))
  group by s.listing_id;
$$;

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
-- What the group is for: the flat's household spending, or a trip / house party kept apart from it.
alter table public.fm_split_groups add column if not exists kind text not null default 'flat' check (kind in ('flat','trip','party'));
-- Each member has an invite code: the link (#split/<code>) shows them their balance before they sign in.
alter table public.fm_split_members add column if not exists invite_code text default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
update public.fm_split_members set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) where invite_code is null;
create unique index if not exists fm_split_members_invite on public.fm_split_members (invite_code);
-- Edits are marked on the row; every add, edit, delete and undo is in the group's activity log.
alter table public.fm_split_expenses add column if not exists edited_at timestamptz;
alter table public.fm_split_expenses add column if not exists edited_by uuid references public.fm_split_members(id) on delete set null;
create table if not exists public.fm_split_log (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.fm_split_groups(id) on delete cascade,
  expense_id uuid references public.fm_split_expenses(id) on delete cascade,
  member_id  uuid references public.fm_split_members(id) on delete set null,
  action     text not null check (action in ('add','settle','edit','delete','restore')),
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);
create index if not exists fm_split_log_group on public.fm_split_log (group_id, created_at desc);
alter table public.fm_split_log enable row level security;
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

-- p_kind: 'flat' (household spending), 'trip' (out of the house) or 'party' (at home); trips and parties
-- can include friends from outside the flat and have up to 20 people.
drop function if exists public.fm_split_create(text, text, jsonb);
create or replace function public.fm_split_create(p_name text, p_emoji text, p_members jsonb, p_kind text default 'flat') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_phone text := fm_my_phone(); v_name text; m jsonb;
        v_kind text := case when p_kind in ('trip', 'party') then p_kind else 'flat' end;
begin
  if auth.uid() is null or coalesce(v_phone, '') = '' then raise exception 'not-signed-in'; end if;
  if (select count(*) from fm_split_members where phone = v_phone) >= 30 then raise exception 'too-many-groups'; end if;
  select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Me') into v_name from fm_profiles where id = auth.uid();
  insert into fm_split_groups (name, emoji, created_by, kind)
  values (left(trim(p_name), 60), coalesce(nullif(left(p_emoji, 8), ''), case v_kind when 'trip' then '✈️' when 'party' then '🎉' else '🏠' end), auth.uid(), v_kind)
  returning id into v_id;
  perform fm_throttle('fsnew', 20, 50);
  insert into fm_split_members (group_id, name, phone, upi)
  values (v_id, left(v_name, 40), v_phone, (select upi from fm_split_members where phone = v_phone and upi is not null limit 1));
  -- Other people's UPI IDs aren't copied in: each person's own shows up once they open the group (fm_split_get).
  for m in select * from jsonb_array_elements(case when jsonb_typeof(p_members) = 'array' then p_members else '[]' end) loop
    insert into fm_split_members (group_id, name, phone)
    select v_id, left(trim(m->>'name'), 40), x.phone
    from (select right(regexp_replace(coalesce(m->>'phone', ''), '\D', '', 'g'), 10) as phone) x
    on conflict (group_id, phone) do nothing;
  end loop;
  if (select count(*) from fm_split_members where group_id = v_id) > fm_split_cap(v_id) then raise exception 'too-many-members'; end if;
  return v_id;
end $$;

-- How many people a group can have: 12 in a flat, 20 on a trip or at a party.
create or replace function public.fm_split_cap(p_group uuid) returns int
language sql stable security definer set search_path = public as $$
  select case when kind = 'flat' then 12 else 20 end from fm_split_groups where id = p_group;
$$;

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
  perform fm_throttle('fsadd', 60, 150);
  if (select count(*) from fm_split_members where group_id = p_group) >= fm_split_cap(p_group) then raise exception 'too-many-members'; end if;
  insert into fm_split_members (group_id, name, phone)
  values (p_group, left(trim(p_name), 40), v_phone)
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
  insert into fm_split_log (group_id, expense_id, member_id, action, after)
  select p_group, v_id, v_me, case when e.kind = 'settle' then 'settle' else 'add' end,
         jsonb_build_object('title', e.title, 'amount', e.amount, 'paid_by', e.paid_by, 'splits', e.splits, 'spent_on', e.spent_on, 'category', e.category)
  from fm_split_expenses e where e.id = v_id;
  return v_id;
end $$;

-- Deleting keeps the row for a day so anyone in the group can undo it (fm_split_restore); the log says who.
create or replace function public.fm_split_delete(p_expense uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_group uuid; v_e fm_split_expenses%rowtype;
begin
  select * into v_e from fm_split_expenses where id = p_expense;
  v_group := v_e.group_id;
  if v_group is null or fm_split_me(v_group) is null then raise exception 'not-found'; end if;
  update fm_split_expenses set deleted_at = now() where id = p_expense and deleted_at is null;
  if found then
    insert into fm_split_log (group_id, expense_id, member_id, action, before)
    values (v_group, p_expense, fm_split_me(v_group), 'delete',
            jsonb_build_object('title', v_e.title, 'amount', v_e.amount, 'paid_by', v_e.paid_by, 'splits', v_e.splits, 'spent_on', v_e.spent_on, 'category', v_e.category, 'kind', v_e.kind));
  end if;
end $$;
create or replace function public.fm_split_restore(p_expense uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_e fm_split_expenses%rowtype;
begin
  select * into v_e from fm_split_expenses where id = p_expense;
  if v_e.id is null or fm_split_me(v_e.group_id) is null then raise exception 'not-found'; end if;
  if v_e.deleted_at is null then return; end if;
  if v_e.deleted_at < now() - interval '24 hours' then raise exception 'too-late'; end if;
  update fm_split_expenses set deleted_at = null where id = p_expense;
  insert into fm_split_log (group_id, expense_id, member_id, action, after)
  values (v_e.group_id, p_expense, fm_split_me(v_e.group_id), 'restore', jsonb_build_object('title', v_e.title, 'amount', v_e.amount));
end $$;
-- Change an expense (or a payment's amount and date). Same checks as adding; the log keeps what changed.
create or replace function public.fm_split_edit(p_expense uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_e fm_split_expenses%rowtype; v_me uuid; v_amount bigint; v_before jsonb; v_after jsonb;
begin
  select * into v_e from fm_split_expenses where id = p_expense and deleted_at is null;
  if v_e.id is null then raise exception 'not-found'; end if;
  v_me := fm_split_me(v_e.group_id);
  if v_me is null then raise exception 'not-a-member'; end if;
  if jsonb_typeof(p->'amount') <> 'number' then raise exception 'bad-amount'; end if;
  v_amount := (p->>'amount')::bigint;
  perform fm_split_check(v_e.group_id, v_amount, coalesce((p->>'paid_by')::uuid, v_e.paid_by), coalesce(p->'splits', v_e.splits));
  if v_e.kind = 'settle' and (select count(*) from jsonb_object_keys(coalesce(p->'splits', v_e.splits))) <> 1 then raise exception 'bad-splits'; end if;
  v_before := jsonb_build_object('title', v_e.title, 'amount', v_e.amount, 'paid_by', v_e.paid_by, 'splits', v_e.splits, 'spent_on', v_e.spent_on, 'category', v_e.category);
  update fm_split_expenses set
    title = case when v_e.kind = 'settle' then title else left(coalesce(nullif(trim(p->>'title'), ''), title), 80) end,
    category = case when v_e.kind = 'settle' then category else left(coalesce(nullif(p->>'category', ''), category), 20) end,
    amount = v_amount, paid_by = coalesce((p->>'paid_by')::uuid, paid_by), splits = coalesce(p->'splits', splits),
    spent_on = coalesce((p->>'spent_on')::date, spent_on), edited_at = now(), edited_by = v_me
  where id = p_expense;
  select jsonb_build_object('title', e.title, 'amount', e.amount, 'paid_by', e.paid_by, 'splits', e.splits, 'spent_on', e.spent_on, 'category', e.category)
    into v_after from fm_split_expenses e where e.id = p_expense;
  if v_after <> v_before then
    insert into fm_split_log (group_id, expense_id, member_id, action, before, after) values (v_e.group_id, p_expense, v_me, 'edit', v_before, v_after);
  end if;
end $$;
-- The invite page (#split/<code>), for the person invited, before they sign in: first names and amounts
-- only, never a number. Counted, so codes can't be guessed by trying them all.
create or replace function public.fm_split_invite(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_m fm_split_members%rowtype; v_g fm_split_groups%rowtype; v_net bigint; v_month bigint; v_pays jsonb; v_who text;
begin
  perform fm_throttle('fsinvite', 120, 600);
  select * into v_m from fm_split_members where invite_code = upper(trim(coalesce(p_code, '')));
  if v_m.id is null then return null; end if;
  select * into v_g from fm_split_groups where id = v_m.group_id;
  v_net := fm_split_net(v_m.id);
  select coalesce(sum(coalesce((e.splits->>v_m.id::text)::bigint, 0)), 0) into v_month from fm_split_expenses e
   where e.group_id = v_g.id and e.deleted_at is null and e.kind = 'expense' and date_trunc('month', e.spent_on) = date_trunc('month', current_date);
  -- Who they owe / who owes them: the biggest counter-balances, first names only.
  select jsonb_agg(jsonb_build_object('name', split_part(x.name, ' ', 1), 'net', x.net) order by abs(x.net) desc) into v_pays
  from (select m.name, fm_split_net(m.id) as net from fm_split_members m where m.group_id = v_g.id and m.id <> v_m.id) x
  where (v_net < 0 and x.net > 0) or (v_net > 0 and x.net < 0);
  select split_part(coalesce(p.full_name, m.name), ' ', 1) into v_who from fm_split_members m left join fm_profiles p on right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = m.phone
   where m.group_id = v_g.id and m.id <> v_m.id order by m.created_at limit 1;
  return jsonb_build_object('group_id', v_g.id, 'name', v_g.name, 'emoji', v_g.emoji, 'kind', v_g.kind, 'me', split_part(v_m.name, ' ', 1),
    'phone_tail', right(v_m.phone, 2), 'net', v_net, 'month_share', v_month, 'others', v_pays,
    'members', (select count(*) from fm_split_members m where m.group_id = v_g.id),
    'names', (select jsonb_agg(split_part(m.name, ' ', 1) order by m.created_at) from fm_split_members m where m.group_id = v_g.id and m.id <> v_m.id),
    'invited_by', v_who,
    'on_app', exists (select 1 from fm_profiles p where right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = v_m.phone));
end $$;

create or replace function public.fm_split_bill_save(p_group uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_amount bigint;
begin
  if fm_split_me(p_group) is null then raise exception 'not-a-member'; end if;
  if jsonb_typeof(p->'amount') <> 'number' then raise exception 'bad-amount'; end if;
  v_amount := (p->>'amount')::bigint;
  perform fm_split_check(p_group, v_amount, (p->>'paid_by')::uuid, p->'splits');
  if (select kind from fm_split_groups where id = p_group) <> 'flat' then raise exception 'bills-only-for-flats'; end if;
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
  if coalesce(p_upi, '') <> '' and p_upi !~ '^[a-zA-Z0-9.\-_]{2,255}@[a-zA-Z]{2,64}$' then raise exception 'bad-upi'; end if;
  update fm_split_members set upi = nullif(trim(p_upi), '') where phone = fm_my_phone();
end $$;

-- My groups with my balance, how many new expenses others have added, the kind of group, my share of
-- this month's spending in it, and the other people in it (to pick friends for a trip or party).
drop function if exists public.fm_split_groups();
create or replace function public.fm_split_groups()
returns table (id uuid, name text, emoji text, members bigint, names text[], my_net bigint, unseen bigint, last_at timestamptz,
               kind text, month_share bigint, people jsonb)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.emoji,
         (select count(*) from fm_split_members x where x.group_id = g.id),
         (select array_agg(x.name order by x.created_at) from fm_split_members x where x.group_id = g.id and x.id <> m.id),
         fm_split_net(m.id),
         (select count(*) from fm_split_expenses e where e.group_id = g.id and e.deleted_at is null
            and e.created_at > m.seen_at and e.created_by is distinct from m.id),
         coalesce((select max(e.created_at) from fm_split_expenses e where e.group_id = g.id and e.deleted_at is null), g.created_at),
         g.kind,
         coalesce((select sum(coalesce((e.splits->>m.id::text)::bigint, 0)) from fm_split_expenses e where e.group_id = g.id and e.deleted_at is null
                     and e.kind = 'expense' and date_trunc('month', e.spent_on) = date_trunc('month', current_date)), 0)::bigint,
         coalesce((select jsonb_agg(jsonb_build_object('name', x.name, 'phone', x.phone) order by x.created_at) from fm_split_members x
                     where x.group_id = g.id and x.id <> m.id), '[]'::jsonb)
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
  -- My UPI ID from my other groups, the first time I open this one.
  update fm_split_members set seen_at = now(),
         upi = coalesce(upi, (select x.upi from fm_split_members x where x.phone = fm_my_phone() and x.upi is not null limit 1))
   where id = v_me;
  return jsonb_build_object(
    'group', (select to_jsonb(g) - 'created_by' from fm_split_groups g where g.id = p_group),
    'me', v_me,
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'phone', m.phone, 'upi', m.upi, 'invite_code', m.invite_code,
                 'on_app', exists (select 1 from fm_profiles p where right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = m.phone))
                 order by m.created_at) from fm_split_members m where m.group_id = p_group), '[]'),
    'expenses', coalesce((select jsonb_agg(to_jsonb(e) - 'deleted_at' - 'group_id' order by e.spent_on desc, e.created_at desc)
                 from (select * from fm_split_expenses where group_id = p_group and deleted_at is null
                       order by spent_on desc, created_at desc limit 500) e), '[]'),
    -- Deleted in the last day: anyone can undo (fm_split_restore).
    'deleted', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'amount', e.amount, 'kind', e.kind, 'deleted_at', e.deleted_at,
                 'by', (select l.member_id from fm_split_log l where l.expense_id = e.id and l.action = 'delete' order by l.created_at desc limit 1)) order by e.deleted_at desc)
                 from fm_split_expenses e where e.group_id = p_group and e.deleted_at > now() - interval '24 hours'), '[]'),
    'log', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'expense_id', l.expense_id, 'member_id', l.member_id, 'action', l.action,
                 'before', l.before, 'after', l.after, 'created_at', l.created_at) order by l.created_at desc)
                 from (select * from fm_split_log where group_id = p_group order by created_at desc limit 100) l), '[]'),
    'bills', coalesce((select jsonb_agg(to_jsonb(x) - 'group_id' order by x.day_of_month) from fm_split_bills x where x.group_id = p_group), '[]'));
end $$;

-- ------------------------------------------------------ Pays on time --
-- Months in a row (most recent first, up to 12) in which the person settled up in their flat groups:
-- for every month they had a share of household spending, they owed nothing by the 10th of the next month.
-- Trips and parties don't count. Months with no household spending are skipped; a late month ends the run.
-- Only flat groups with at least one other member who is on the app count, so a group of made-up numbers earns nothing.
-- A month is judged once its 10th-of-next-month has passed (India time).
create or replace function public.fm_on_time_months(p_user uuid) returns int
language plpgsql stable security definer set search_path = public as $$
declare v_phone text; v_today date := (now() at time zone 'Asia/Kolkata')::date; v_month date; v_end date; v_cut date;
        n int := 0; i int; v_had boolean; v_late boolean;
begin
  select right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) into v_phone from fm_profiles where id = p_user;
  if coalesce(v_phone, '') = '' then return 0; end if;
  for i in 1..12 loop
    v_month := (date_trunc('month', v_today) - make_interval(months => i))::date;
    v_end := (v_month + interval '1 month' - interval '1 day')::date;
    v_cut := (v_month + interval '1 month' + interval '9 days')::date;
    continue when v_cut >= v_today;
    select exists (select 1 from fm_split_members m join fm_split_groups g on g.id = m.group_id and g.kind = 'flat'
                   join fm_split_expenses e on e.group_id = g.id and e.deleted_at is null and e.kind = 'expense'
                   where m.phone = v_phone and e.spent_on between v_month and v_end and coalesce((e.splits->>m.id::text)::bigint, 0) > 0
                     and exists (select 1 from fm_split_members o join fm_profiles op
                     on right(regexp_replace(coalesce(op.phone, ''), '\D', '', 'g'), 10) = o.phone where o.group_id = g.id and o.id <> m.id)) into v_had;
    continue when not v_had;
    select exists (select 1 from fm_split_members m join fm_split_groups g on g.id = m.group_id and g.kind = 'flat'
                   where m.phone = v_phone and exists (select 1 from fm_split_members o join fm_profiles op
                     on right(regexp_replace(coalesce(op.phone, ''), '\D', '', 'g'), 10) = o.phone where o.group_id = g.id and o.id <> m.id) and (
                     select coalesce(sum(case when e.paid_by = m.id then e.amount else 0 end - coalesce((e.splits->>m.id::text)::bigint, 0)), 0)
                     from fm_split_expenses e where e.group_id = g.id and e.deleted_at is null
                       and ((e.kind = 'expense' and e.spent_on <= v_end) or (e.kind = 'settle' and e.spent_on <= v_cut))) < -100) into v_late;
    exit when v_late;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.fm_set_show_on_time(p_on boolean) returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  update fm_profiles set show_on_time = coalesce(p_on, false), on_time_months = fm_on_time_months(id), on_time_at = now()
   where id = auth.uid() returning on_time_months into v_n;
  return v_n;
end $$;

-- The Account page's badge box: worked out afresh, so a payment made today counts straight away.
-- (Everywhere else uses the copy fm_me refreshes once a day; a badge not refreshed for 40 days isn't shown.)
create or replace function public.fm_on_time_status() returns table (months int, show boolean)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  return query update fm_profiles set on_time_months = fm_on_time_months(id), on_time_at = now()
   where id = auth.uid() returning on_time_months, show_on_time;
end $$;

-- ----------------------------------------------------------- Party invites --
-- A house party's Flatsplits group can have one invite: a card to share on WhatsApp, a page anyone with
-- the link can open (#party/<code>) to say if they're coming, and a heads-up for the host's flatmates.
-- The address is optional: "at my home" is enough; the host can add the address and directions.
create table if not exists public.fm_parties (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null unique references public.fm_split_groups(id) on delete cascade,
  host_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null unique,
  occasion    text not null default 'party',
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  place       text not null default 'home' check (place in ('home', 'address')),
  address     text,
  directions  text,
  geo         jsonb,
  bring       text,
  note        text,
  chip_in     int check (chip_in between 0 and 100000),
  plus_ones   boolean not null default true,
  flat_group  uuid references public.fm_split_groups(id) on delete set null,
  cancelled   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists public.fm_party_rsvps (
  party_id    uuid not null references public.fm_parties(id) on delete cascade,
  token       text not null,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  answer      text not null check (answer in ('yes', 'maybe', 'no')),
  plus        int not null default 0 check (plus between 0 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (party_id, token)
);
create index if not exists fm_parties_flat_idx on public.fm_parties (flat_group);
alter table public.fm_parties     enable row level security;   -- no policies: fm_party_* only
alter table public.fm_party_rsvps enable row level security;

-- The kinds of get-together a card can be for (the app has the emoji and wording for each).
create or replace function public.fm_party_occasions() returns text[]
language sql immutable as $$
  select array['party','movie','games','potluck','birthday','housewarming','match','festival','karaoke',
               'brunch','chai','terrace','jam','farewell','welcome']
$$;

-- The card and its RSVPs as anyone with the link sees them (first names only; the full guest list with
-- plus-ones is the same, there are no numbers in it). p_token is this browser's RSVP token.
-- fm_party_get is the page (counted, so invite codes can't be guessed by trying them all);
-- fm_party_json is the same thing for the functions below.
create or replace function public.fm_party_json(p_code text, p_token text default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'code', p.code, 'occasion', p.occasion, 'title', p.title, 'starts_at', p.starts_at, 'ends_at', p.ends_at,
    'place', p.place, 'address', case when p.place = 'address' then p.address end,
    'directions', case when p.place = 'address' then p.directions end, 'geo', case when p.place = 'address' then p.geo end,
    'bring', p.bring, 'note', p.note, 'chip_in', p.chip_in, 'plus_ones', p.plus_ones, 'cancelled', p.cancelled,
    'host', split_part(coalesce(h.full_name, ''), ' ', 1),
    'is_host', p.host_id = auth.uid(),
    'group_id', case when exists (select 1 from fm_split_members m where m.group_id = p.group_id and m.phone = fm_my_phone()) then p.group_id end,
    'going', (select count(*) + coalesce(sum(r.plus), 0) from fm_party_rsvps r where r.party_id = p.id and r.answer = 'yes'),
    'maybe', (select count(*) from fm_party_rsvps r where r.party_id = p.id and r.answer = 'maybe'),
    'cant',  (select count(*) from fm_party_rsvps r where r.party_id = p.id and r.answer = 'no'),
    'guests', coalesce((select jsonb_agg(jsonb_build_object('name', r.name, 'answer', r.answer, 'plus', r.plus) order by r.created_at)
                        from fm_party_rsvps r where r.party_id = p.id), '[]'::jsonb),
    'mine', (select jsonb_build_object('name', r.name, 'answer', r.answer, 'plus', r.plus) from fm_party_rsvps r
             where r.party_id = p.id and r.token = p_token))
  from fm_parties p left join fm_profiles h on h.id = p.host_id
  where p.code = upper(trim(p_code));
$$;
create or replace function public.fm_party_get(p_code text, p_token text default null) returns jsonb
language sql security definer set search_path = public as $$
  select fm_throttle('party', 120, 600);
  select fm_party_json(p_code, p_token);
$$;

-- Make or change the invite for a party group (the host, or whoever makes it first, is the host).
create or replace function public.fm_party_save(p_group uuid, p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare v_old fm_parties%rowtype; v_code text; v_starts timestamptz; v_ends timestamptz; v_flat uuid; v_geo jsonb;
        v_place text := case when p->>'place' = 'address' then 'address' else 'home' end;
        v_title text := left(trim(coalesce(p->>'title', '')), 80);
        v_occ text := coalesce(nullif(p->>'occasion', ''), 'party');
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if fm_split_me(p_group) is null then raise exception 'not-a-member'; end if;
  if (select kind from fm_split_groups where id = p_group) <> 'party' then raise exception 'not-a-party'; end if;
  select * into v_old from fm_parties where group_id = p_group for update;
  if v_old.id is not null and v_old.host_id <> auth.uid() then raise exception 'not-the-host'; end if;
  if not v_occ = any (fm_party_occasions()) then raise exception 'bad-occasion'; end if;
  if char_length(v_title) < 2 then raise exception 'bad-title'; end if;
  begin
    v_starts := (p->>'starts_at')::timestamptz; v_ends := nullif(p->>'ends_at', '')::timestamptz;
  exception when others then raise exception 'bad-time';
  end;
  if v_starts is null or v_starts < now() - interval '1 day' or v_starts > now() + interval '1 year' then raise exception 'bad-time'; end if;
  if v_ends is not null and (v_ends <= v_starts or v_ends > v_starts + interval '3 days') then raise exception 'bad-time'; end if;
  if v_place = 'address' and char_length(trim(coalesce(p->>'address', ''))) < 5 then raise exception 'bad-address'; end if;
  if jsonb_typeof(p->'geo') = 'object' and jsonb_typeof(p->'geo'->'lat') = 'number' and jsonb_typeof(p->'geo'->'lng') = 'number'
     and (p->'geo'->>'lat')::numeric between 6 and 37 and (p->'geo'->>'lng')::numeric between 68 and 98 then
    v_geo := jsonb_build_object('lat', round((p->'geo'->>'lat')::numeric, 6), 'lng', round((p->'geo'->>'lng')::numeric, 6));
  end if;
  -- The flat to tell: one of the host's own flat groups.
  v_flat := nullif(p->>'flat_group', '')::uuid;
  if v_flat is not null and not exists (select 1 from fm_split_groups g join fm_split_members m on m.group_id = g.id
                                        where g.id = v_flat and g.kind = 'flat' and m.phone = fm_my_phone()) then v_flat := null; end if;
  if v_old.id is null then
    loop
      v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7));
      exit when not exists (select 1 from fm_parties where code = v_code);
    end loop;
    insert into fm_parties (group_id, host_id, code, occasion, title, starts_at, ends_at, place, address, directions, geo,
                            bring, note, chip_in, plus_ones, flat_group)
    values (p_group, auth.uid(), v_code, v_occ, v_title, v_starts, v_ends, v_place,
            case when v_place = 'address' then left(trim(p->>'address'), 200) end,
            case when v_place = 'address' then nullif(left(trim(coalesce(p->>'directions', '')), 300), '') end,
            case when v_place = 'address' then v_geo end,
            nullif(left(trim(coalesce(p->>'bring', '')), 120), ''), nullif(left(trim(coalesce(p->>'note', '')), 300), ''),
            nullif(greatest(0, least(100000, coalesce((p->>'chip_in')::numeric, 0)::int)), 0),
            coalesce((p->>'plus_ones')::boolean, true), v_flat);
    return v_code;
  end if;
  update fm_parties set occasion = v_occ, title = v_title, starts_at = v_starts, ends_at = v_ends, place = v_place,
         address = case when v_place = 'address' then left(trim(p->>'address'), 200) end,
         directions = case when v_place = 'address' then nullif(left(trim(coalesce(p->>'directions', '')), 300), '') end,
         geo = case when v_place = 'address' then v_geo end,
         bring = nullif(left(trim(coalesce(p->>'bring', '')), 120), ''), note = nullif(left(trim(coalesce(p->>'note', '')), 300), ''),
         chip_in = nullif(greatest(0, least(100000, coalesce((p->>'chip_in')::numeric, 0)::int)), 0),
         plus_ones = coalesce((p->>'plus_ones')::boolean, true), flat_group = v_flat, cancelled = false, updated_at = now()
   where id = v_old.id;
  return v_old.code;
end $$;

-- The invite for a party group, for its members (same shape as fm_party_get).
create or replace function public.fm_party_for_group(p_group uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_code text;
begin
  if fm_split_me(p_group) is null then raise exception 'not-a-member'; end if;
  select code into v_code from fm_parties where group_id = p_group;
  if v_code is null then return null; end if;
  return fm_party_json(v_code);
end $$;

create or replace function public.fm_party_cancel(p_group uuid, p_on boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  update fm_parties set cancelled = coalesce(p_on, true), updated_at = now() where group_id = p_group and host_id = auth.uid();
  if not found then raise exception 'not-the-host'; end if;
end $$;

-- Say if you're coming. Anyone with the link, signed in or not; the token (kept in their browser) lets
-- them change their answer. Up to 200 replies a party.
create or replace function public.fm_party_rsvp(p_code text, p_token text, p_name text, p_answer text, p_plus int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_p fm_parties%rowtype; v_name text := left(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), 30);
begin
  perform fm_throttle('rsvp', 30, 100);
  select * into v_p from fm_parties where code = upper(trim(p_code));
  if v_p.id is null then raise exception 'no-party'; end if;
  if v_p.cancelled then raise exception 'party-cancelled'; end if;
  if coalesce(v_p.ends_at, v_p.starts_at + interval '12 hours') < now() then raise exception 'party-over'; end if;
  if coalesce(p_token, '') !~ '^[A-Za-z0-9_-]{16,64}$' then raise exception 'bad-token'; end if;
  if char_length(v_name) < 1 then raise exception 'bad-name'; end if;
  if p_answer not in ('yes', 'maybe', 'no') then raise exception 'bad-answer'; end if;
  if not exists (select 1 from fm_party_rsvps where party_id = v_p.id and token = p_token)
     and (select count(*) from fm_party_rsvps where party_id = v_p.id) >= 200 then raise exception 'party-full'; end if;
  insert into fm_party_rsvps (party_id, token, user_id, name, answer, plus)
  values (v_p.id, p_token, auth.uid(), v_name, p_answer, case when v_p.plus_ones and p_answer = 'yes' then greatest(0, least(5, coalesce(p_plus, 0))) else 0 end)
  on conflict (party_id, token) do update set name = excluded.name, answer = excluded.answer, plus = excluded.plus,
     user_id = coalesce(excluded.user_id, fm_party_rsvps.user_id), updated_at = now();
  return fm_party_json(v_p.code, p_token);
end $$;

-- Parties at my flat that someone else is hosting (today's and coming up), for the heads-up.
create or replace function public.fm_party_feed()
returns table (code text, occasion text, title text, starts_at timestamptz, ends_at timestamptz, host text, flat text,
               cancelled boolean, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.code, p.occasion, p.title, p.starts_at, p.ends_at, split_part(coalesce(h.full_name, ''), ' ', 1), g.name,
         p.cancelled, p.updated_at
  from fm_parties p
  join fm_split_groups g on g.id = p.flat_group
  left join fm_profiles h on h.id = p.host_id
  where p.host_id <> auth.uid()
    and exists (select 1 from fm_split_members m where m.group_id = p.flat_group and m.phone = fm_my_phone())
    and coalesce(p.ends_at, p.starts_at + interval '12 hours') > now()
  order by p.starts_at;
$$;

-- Push to the host's flatmates when a party is first planned (see fm-notify).
create or replace function public.fm_party_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  -- Called off: everyone from nearby who asked or was accepted is told (nearby parties, part 5).
  if tg_op = 'UPDATE' and new.cancelled and not old.cancelled
     and exists (select 1 from fm_party_requests where party_id = new.id and status in ('pending', 'accepted')) then
    select notify_url, notify_secret into v_url, v_secret from fm_settings;
    if v_url is not null and v_secret is not null then
      perform net.http_post(url := v_url, body := jsonb_build_object('party_id', new.id, 'event', 'cancel_nearby'),
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
    end if;
  end if;
  if new.flat_group is null then return new; end if;
  if tg_op = 'UPDATE' and (new.flat_group is not distinct from old.flat_group and new.starts_at = old.starts_at
                           and new.cancelled = old.cancelled) then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('party_id', new.id, 'event', lower(tg_op)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists fm_parties_notify on public.fm_parties;
create trigger fm_parties_notify after insert or update on public.fm_parties
  for each row execute function public.fm_party_notify();

-- ------------------------------------------------ Nearby parties (Phase 1) --
-- A host can open a party to people nearby: signed-in adults who have switched on "Show me parties nearby",
-- within the host's radius, of the gender the host picked. Before the host accepts someone they see only the
-- area and the distance; the address, the pin and the numbers are shared on accept, as numbers swap on a yes for
-- rooms. Money never goes through the app: the chip-in is paid to the host at the door or by UPI, and alcohol
-- is bring-your-own, never part of the chip-in. Off by default for hosts and for guests.
alter table public.fm_parties add column if not exists open         boolean not null default false;
alter table public.fm_parties add column if not exists guest_limit  int check (guest_limit between 2 and 50);
alter table public.fm_parties add column if not exists entry        text not null default 'free' check (entry in ('free', 'chip'));
alter table public.fm_parties add column if not exists entry_chip   int check (entry_chip between 1 and 5000);
alter table public.fm_parties add column if not exists covers       text[] not null default '{}';
alter table public.fm_parties add column if not exists covers_other text;
alter table public.fm_parties add column if not exists who          text not null default 'all' check (who in ('all', 'female', 'male'));
alter table public.fm_parties add column if not exists radius_km    int not null default 3 check (radius_km between 1 and 5);
alter table public.fm_parties add column if not exists area         text;
alter table public.fm_parties add column if not exists house_rules  text;
-- Private: only the host and accepted guests ever see these (never in fm_party_json or the nearby list).
alter table public.fm_parties add column if not exists near_address text;
alter table public.fm_parties add column if not exists near_geo     jsonb;
create index if not exists fm_parties_open_idx on public.fm_parties (starts_at) where open and not cancelled;

-- What a chip-in can cover (the app has the wording). Alcohol is never one of them.
create or replace function public.fm_party_covers() returns text[]
language sql immutable as $$ select array['food','soft_drinks','snacks','music','games','decor'] $$;
-- Words that mean alcohol, refused in "what it covers" and the house rules' chip-in line.
create or replace function public.fm_party_alcohol(p text) returns boolean
language sql immutable as $$
  select coalesce(p, '') ~* '(alcohol|beer|wine|whisk(e)?y|vodka|rum\M|gin\M|tequila|liquor|booze|daaru|daru|sharab|cocktail|pints?\M|bottles?\M|brew)'
$$;
-- Distance in km between two points (haversine).
create or replace function public.fm_km(a_lat double precision, a_lng double precision, b_lat double precision, b_lng double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(sqrt(power(sin(radians(b_lat - a_lat) / 2), 2)
         + cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lng - a_lng) / 2), 2)))
$$;
-- A {lat, lng} inside India, rounded; null otherwise.
create or replace function public.fm_india_pin(p jsonb) returns jsonb
language sql immutable as $$
  select case when jsonb_typeof(p) = 'object' and jsonb_typeof(p->'lat') = 'number' and jsonb_typeof(p->'lng') = 'number'
               and (p->>'lat')::numeric between 6 and 37 and (p->>'lng')::numeric between 68 and 98
         then jsonb_build_object('lat', round((p->>'lat')::numeric, 6), 'lng', round((p->>'lng')::numeric, 6)) end
$$;

-- The host's nearby settings for a party group (with the private address and pin, for the host only).
create or replace function public.fm_party_open_for_group(p_group uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('open', p.open, 'guest_limit', p.guest_limit, 'entry', p.entry, 'entry_chip', p.entry_chip,
           'covers', to_jsonb(p.covers), 'covers_other', p.covers_other, 'who', p.who, 'radius_km', p.radius_km, 'area', p.area,
           'house_rules', p.house_rules, 'near_address', p.near_address, 'near_geo', p.near_geo)
  from fm_parties p where p.group_id = p_group and p.host_id = auth.uid();
$$;

-- Open a party to people nearby, change it, or close it again (p.open = false). The host only; adults only.
create or replace function public.fm_party_open_save(p_group uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v fm_parties%rowtype; v_limit int; v_chip int; v_covers text[]; v_geo jsonb; v_entry text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('party-open', 20, 60);
  select * into v from fm_parties where group_id = p_group for update;
  if v.id is null then raise exception 'no-party'; end if;
  if v.host_id <> auth.uid() then raise exception 'not-the-host'; end if;
  if not coalesce((p->>'open')::boolean, false) then
    update fm_parties set open = false, updated_at = now() where id = v.id;
    return fm_party_open_for_group(p_group);
  end if;
  if (select adult_at from fm_profiles where id = auth.uid()) is null then raise exception 'age-required'; end if;
  if fm_party_blocked(auth.uid()) then raise exception 'blocked'; end if;
  if not fm_party_vibe_ok(auth.uid()) then raise exception 'need-vibe'; end if;
  if v.cancelled then raise exception 'party-cancelled'; end if;
  if v.starts_at < now() then raise exception 'party-over'; end if;
  begin v_limit := (p->>'guest_limit')::int; exception when others then v_limit := null; end;
  if v_limit is null or v_limit not between 2 and 50 then raise exception 'bad-limit'; end if;
  v_entry := case when p->>'entry' = 'chip' then 'chip' else 'free' end;
  if v_entry = 'chip' then
    begin v_chip := (p->>'entry_chip')::int; exception when others then v_chip := null; end;
    if v_chip is null or v_chip not between 1 and 5000 then raise exception 'bad-chip'; end if;
  end if;
  select coalesce(array_agg(distinct x), '{}') into v_covers
    from jsonb_array_elements_text(case when jsonb_typeof(p->'covers') = 'array' then p->'covers' else '[]'::jsonb end) x
   where x = any (fm_party_covers());
  if fm_party_alcohol(p->>'covers_other') then raise exception 'no-alcohol'; end if;
  v_geo := fm_india_pin(p->'near_geo');
  if v_geo is null then raise exception 'need-pin'; end if;
  if char_length(trim(coalesce(p->>'area', ''))) < 2 then raise exception 'bad-area'; end if;
  if char_length(trim(coalesce(p->>'near_address', ''))) < 5 then raise exception 'bad-address'; end if;
  update fm_parties set open = true, guest_limit = v_limit, entry = v_entry, entry_chip = case when v_entry = 'chip' then v_chip end,
         covers = case when v_entry = 'chip' then v_covers else '{}' end,
         covers_other = case when v_entry = 'chip' then nullif(left(trim(coalesce(p->>'covers_other', '')), 60), '') end,
         who = case when p->>'who' in ('female', 'male') then p->>'who' else 'all' end,
         radius_km = greatest(1, least(5, coalesce(nullif(p->>'radius_km', '')::numeric, 3)::int)),
         area = left(trim(p->>'area'), 60), house_rules = nullif(left(trim(coalesce(p->>'house_rules', '')), 300), ''),
         near_address = left(trim(p->>'near_address'), 200), near_geo = v_geo, updated_at = now()
   where id = v.id;
  return fm_party_open_for_group(p_group);
end $$;

-- Guests: "Show me parties nearby" (off by default) and the pin it measures from.
alter table public.fm_profiles add column if not exists parties_nearby boolean not null default false;
alter table public.fm_profiles add column if not exists party_pin jsonb;
alter table public.fm_profiles add column if not exists party_pin_label text;
-- Requests to join a party from nearby (made and answered in part 3; counted here for spots left).
create table if not exists public.fm_party_requests (
  id           uuid primary key default gen_random_uuid(),
  party_id     uuid not null references public.fm_parties(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  note         text check (char_length(note) <= 120),
  plus         int not null default 0 check (plus between 0 and 3),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn', 'cancelled')),
  checkin_code text,
  checked_in_at timestamptz,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  unique (party_id, user_id)
);
create index if not exists fm_party_requests_user_idx on public.fm_party_requests (user_id);
alter table public.fm_party_requests enable row level security;   -- no policies: fm_party_* only

-- Safety. Each accepted guest gets a check-in code the host confirms at the door. Anyone in a party can report the
-- party or a person in it, and after the party host and guests give each other a thumbs up or down. Two reports
-- (from different people) or three thumbs down block that person from asking to join or hosting until Kamal has
-- looked: see fm_party_review_list() and fm_party_clear() (README, "Nearby parties").
create table if not exists public.fm_party_reports (
  id          uuid primary key default gen_random_uuid(),
  party_id    uuid not null references public.fm_parties(id) on delete cascade,
  reporter    uuid not null references auth.users(id) on delete cascade,
  reported    uuid not null references auth.users(id) on delete cascade,
  reason      text not null check (char_length(reason) between 2 and 300),
  created_at  timestamptz not null default now(),
  unique (party_id, reporter, reported)
);
create table if not exists public.fm_party_ratings (
  party_id    uuid not null references public.fm_parties(id) on delete cascade,
  rater       uuid not null references auth.users(id) on delete cascade,
  ratee       uuid not null references auth.users(id) on delete cascade,
  up          boolean not null,
  created_at  timestamptz not null default now(),
  primary key (party_id, rater, ratee)
);
-- Kamal's review: reports and thumbs down from before cleared_at no longer count.
create table if not exists public.fm_party_reviews (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  cleared_at  timestamptz not null default now(),
  note        text
);
alter table public.fm_party_reports enable row level security;   -- no policies: fm_party_* only
alter table public.fm_party_ratings enable row level security;
alter table public.fm_party_reviews enable row level security;

create or replace function public.fm_party_blocked(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with since as (select coalesce((select cleared_at from fm_party_reviews where user_id = p_user), '-infinity'::timestamptz) t)
  select (select count(distinct reporter) from fm_party_reports, since where reported = p_user and created_at > since.t) >= 2
      or (select count(*) from fm_party_ratings, since where ratee = p_user and not up and created_at > since.t) >= 3;
$$;
create or replace function public.fm_party_thumbs_up(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from fm_party_ratings where ratee = p_user and up;
$$;
-- Is the party over (for thumbs)? Its end, or four hours after it starts.
create or replace function public.fm_party_ended(p_party uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(ends_at, starts_at + interval '4 hours') < now() from fm_parties where id = p_party;
$$;

-- Parties nearby open once someone has answered the vibe questions: a seeker with their answers, or an owner (whose
-- answers describe their home). People on the Flatsplits-and-FlatMart account ('splits') answer them first.
create or replace function public.fm_party_vibe_ok(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' or (role = 'seeker' and fm_vibe_count(vibe) >= 6) from fm_profiles where id = p_user), false);
$$;
-- Places taken by accepted guests and their plus-ones.
create or replace function public.fm_party_taken(p_party uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(1 + plus), 0)::int from fm_party_requests where party_id = p_party and status = 'accepted';
$$;
-- Why this person can't see (or ask to join) this party from nearby; null when they can. The checks, in order:
-- signed in, 18+, switched on with a pin, the party open and coming up and not full, not their own, who can come,
-- and within the host's radius of their pin.
create or replace function public.fm_party_cant_see(p_party uuid, p_user uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare v fm_parties%rowtype; me fm_profiles%rowtype;
begin
  if p_user is null then return 'not-signed-in'; end if;
  select * into me from fm_profiles where id = p_user;
  if me.adult_at is null then return 'age-required'; end if;
  if not fm_party_vibe_ok(p_user) then return 'need-vibe'; end if;
  if not coalesce(me.parties_nearby, false) then return 'opted-out'; end if;
  if fm_party_blocked(p_user) then return 'blocked'; end if;
  if fm_india_pin(me.party_pin) is null then return 'need-pin'; end if;
  select * into v from fm_parties where id = p_party;
  if v.id is null or not v.open or v.near_geo is null then return 'not-open'; end if;
  if v.cancelled then return 'party-cancelled'; end if;
  if v.starts_at < now() then return 'party-over'; end if;
  if v.host_id = p_user then return 'own-party'; end if;
  if fm_party_blocked(v.host_id) then return 'host-blocked'; end if;
  if v.who <> 'all' and v.who is distinct from me.gender then return 'wrong-gender'; end if;
  if fm_km((me.party_pin->>'lat')::float8, (me.party_pin->>'lng')::float8, (v.near_geo->>'lat')::float8, (v.near_geo->>'lng')::float8) > v.radius_km
    then return 'out-of-radius'; end if;
  if fm_party_taken(v.id) >= v.guest_limit then return 'party-full'; end if;
  return null;
end $$;

-- A nearby party as someone who isn't accepted yet sees it: what, when, the area and how far, the chip-in and what it
-- covers, places left, the host's first name and living style (for the vibe type), the house rules. Never the
-- address, the pin or a number. Accepted guests also get those (fm_party_nearby_get, part 3).
create or replace function public.fm_party_near_json(p_party uuid, p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', v.code, 'occasion', v.occasion, 'title', v.title, 'starts_at', v.starts_at, 'ends_at', v.ends_at,
    'area', v.area, 'km', case when fm_india_pin(me.party_pin) is not null then round(fm_km((me.party_pin->>'lat')::float8, (me.party_pin->>'lng')::float8,
                                  (v.near_geo->>'lat')::float8, (v.near_geo->>'lng')::float8)::numeric, 1) end,
    'entry', v.entry, 'entry_chip', v.entry_chip, 'covers', to_jsonb(v.covers), 'covers_other', v.covers_other,
    'guest_limit', v.guest_limit, 'spots_left', greatest(0, v.guest_limit - fm_party_taken(v.id)), 'plus_ones', v.plus_ones,
    'who', v.who, 'house_rules', v.house_rules, 'cancelled', v.cancelled, 'ended', fm_party_ended(v.id),
    'my_rating', (select up from fm_party_ratings where party_id = v.id and rater = p_user and ratee = v.host_id),
    'host', split_part(coalesce(h.full_name, ''), ' ', 1), 'host_vibe', coalesce(h.vibe, '{}'::jsonb),
    'my_request', (select jsonb_build_object('id', r.id, 'status', r.status, 'plus', r.plus, 'note', r.note) from fm_party_requests r
                   where r.party_id = v.id and r.user_id = p_user))
  from fm_parties v left join fm_profiles h on h.id = v.host_id left join fm_profiles me on me.id = p_user
  where v.id = p_party;
$$;

-- Switch "Show me parties nearby" on (with the pin to measure from) or off.
create or replace function public.fm_party_nearby_set(p_on boolean, p_pin jsonb default null, p_label text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_pin jsonb := fm_india_pin(p_pin);
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if coalesce(p_on, false) then
    if (select adult_at from fm_profiles where id = auth.uid()) is null then raise exception 'age-required'; end if;
    if not fm_party_vibe_ok(auth.uid()) then raise exception 'need-vibe'; end if;
    if v_pin is null and fm_india_pin((select party_pin from fm_profiles where id = auth.uid())) is null then raise exception 'need-pin'; end if;
  end if;
  update fm_profiles set parties_nearby = coalesce(p_on, false),
         party_pin = coalesce(v_pin, party_pin), party_pin_label = case when v_pin is not null then nullif(left(trim(coalesce(p_label, '')), 60), '') else party_pin_label end
   where id = auth.uid();
  return (select jsonb_build_object('on', parties_nearby, 'pin', party_pin, 'label', party_pin_label) from fm_profiles where id = auth.uid());
end $$;
create or replace function public.fm_party_nearby_me() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('on', parties_nearby, 'pin', party_pin, 'label', party_pin_label) from fm_profiles where id = auth.uid();
$$;

-- Parties near me, soonest first; also the ones I've asked to join (whatever their state), so I can follow them.
create or replace function public.fm_party_nearby() returns setof jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('party-near', 120, 600);
  return query
    select fm_party_near_json(v.id, auth.uid()) from fm_parties v
     where v.open and (fm_party_cant_see(v.id, auth.uid()) is null
           or exists (select 1 from fm_party_requests r where r.party_id = v.id and r.user_id = auth.uid() and r.status in ('pending', 'accepted')
                      and coalesce(v.ends_at, v.starts_at + interval '12 hours') > now()))
     order by v.starts_at
     limit 50;
end $$;

-- One nearby party as I see it. Once the host has accepted me: the address, the pin and the host's number too.
create or replace function public.fm_party_nearby_get(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v fm_parties%rowtype; r fm_party_requests%rowtype; out jsonb;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('party-near', 120, 600);
  select * into v from fm_parties where code = upper(trim(p_code));
  if v.id is null or not v.open then raise exception 'no-party'; end if;
  select * into r from fm_party_requests where party_id = v.id and user_id = auth.uid();
  if r.id is null and fm_party_cant_see(v.id, auth.uid()) is not null then raise exception 'no-party'; end if;
  out := fm_party_near_json(v.id, auth.uid());
  if r.status = 'accepted' and not v.cancelled then
    out := out || jsonb_build_object('address', v.near_address, 'geo', v.near_geo, 'checkin_code', r.checkin_code, 'checked_in', r.checked_in_at is not null,
      'host_phone', (select right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) from fm_profiles where id = v.host_id));
  end if;
  return out;
end $$;

-- Ask to join: an optional one-line note and plus-ones, who count towards the guest limit.
create or replace function public.fm_party_request(p_code text, p_note text default null, p_plus int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v fm_parties%rowtype; r fm_party_requests%rowtype; v_why text; v_plus int; v_note text := nullif(left(regexp_replace(trim(coalesce(p_note, '')), '\s+', ' ', 'g'), 120), '');
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('party-req', 10, 30);
  select * into v from fm_parties where code = upper(trim(p_code)) for update;
  if v.id is null then raise exception 'no-party'; end if;
  v_why := fm_party_cant_see(v.id, auth.uid());
  if v_why is not null then raise exception '%', v_why; end if;
  select * into r from fm_party_requests where party_id = v.id and user_id = auth.uid();
  if r.status in ('pending', 'accepted') then raise exception 'already-asked'; end if;
  if r.status = 'declined' then raise exception 'declined-before'; end if;
  -- numbers and links go through the accept, not the note
  if v_note ~ '[0-9]{7,}' or v_note ~* '(https?://|www\.|@)' then raise exception 'no-contacts-in-note'; end if;
  v_plus := case when v.plus_ones then greatest(0, least(3, coalesce(p_plus, 0))) else 0 end;
  if fm_party_taken(v.id) + 1 + v_plus > v.guest_limit then raise exception 'not-enough-spots'; end if;
  insert into fm_party_requests (party_id, user_id, note, plus, status) values (v.id, auth.uid(), v_note, v_plus, 'pending')
  on conflict (party_id, user_id) do update set note = excluded.note, plus = excluded.plus, status = 'pending', created_at = now(), decided_at = null;
  return fm_party_near_json(v.id, auth.uid());
end $$;

-- Change my mind: withdraw a request, or drop out after being accepted.
create or replace function public.fm_party_withdraw(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from fm_parties where code = upper(trim(p_code));
  update fm_party_requests set status = 'withdrawn', decided_at = now()
   where party_id = v_id and user_id = auth.uid() and status in ('pending', 'accepted');
  if not found then raise exception 'no-request'; end if;
  return fm_party_near_json(v_id, auth.uid());
end $$;

-- The host's list: who asked, with first name, age group, gender, vibe match and how many parties they've been to.
-- Accepted guests also come with their number.
create or replace function public.fm_party_host_requests(p_group uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
declare v fm_parties%rowtype;
begin
  select * into v from fm_parties where group_id = p_group;
  if v.id is null or v.host_id is distinct from auth.uid() then raise exception 'not-the-host'; end if;
  return query
    select jsonb_build_object('id', r.id, 'status', r.status, 'note', r.note, 'plus', r.plus, 'created_at', r.created_at,
      'name', split_part(coalesce(g.full_name, ''), ' ', 1), 'gen', g.vibe->>'gen', 'gender', g.gender, 'vibe', g.vibe,
      'match', fm_match(h.vibe, g.vibe),
      'parties', (select count(*) from fm_party_requests x join fm_parties y on y.id = x.party_id
                  where x.user_id = r.user_id and x.status = 'accepted' and not y.cancelled and coalesce(y.ends_at, y.starts_at + interval '12 hours') < now()),
      'thumbs_up', fm_party_thumbs_up(r.user_id), 'checked_in', r.checked_in_at is not null, 'ended', fm_party_ended(v.id),
      'my_rating', (select up from fm_party_ratings where party_id = v.id and rater = auth.uid() and ratee = r.user_id),
      'phone', case when r.status = 'accepted' then right(regexp_replace(coalesce(g.phone, ''), '\D', '', 'g'), 10) end)
    from fm_party_requests r join fm_profiles g on g.id = r.user_id left join fm_profiles h on h.id = v.host_id
    where r.party_id = v.id and r.status in ('pending', 'accepted', 'declined')
    order by case r.status when 'pending' then 0 when 'accepted' then 1 else 2 end, r.created_at;
end $$;

-- Accept or decline. On accept both sides get the other's number (and the guest the address), as on a yes for rooms.
-- Accepts stop at the guest limit; once it's reached the party drops out of the nearby list.
create or replace function public.fm_party_decide(p_request uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r fm_party_requests%rowtype; v fm_parties%rowtype;
begin
  select * into r from fm_party_requests where id = p_request for update;
  if r.id is null then raise exception 'no-request'; end if;
  select * into v from fm_parties where id = r.party_id for update;
  if v.host_id is distinct from auth.uid() then raise exception 'not-the-host'; end if;
  if r.status <> 'pending' then raise exception 'already-decided'; end if;
  if v.cancelled then raise exception 'party-cancelled'; end if;
  if coalesce(v.ends_at, v.starts_at + interval '12 hours') < now() then raise exception 'party-over'; end if;
  if coalesce(p_accept, false) then
    if fm_party_taken(v.id) + 1 + r.plus > v.guest_limit then raise exception 'party-full'; end if;
    update fm_party_requests set status = 'accepted', decided_at = now(),
           checkin_code = coalesce(checkin_code, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))) where id = r.id;
  else
    update fm_party_requests set status = 'declined', decided_at = now() where id = r.id;
  end if;
  return (select x from fm_party_host_requests(v.group_id) x where (x->>'id')::uuid = r.id);
end $$;

-- The door: the host types the guest's code.
create or replace function public.fm_party_checkin(p_group uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v fm_parties%rowtype; r fm_party_requests%rowtype;
begin
  perform fm_throttle('party-checkin', 60, 200);
  select * into v from fm_parties where group_id = p_group;
  if v.id is null or v.host_id is distinct from auth.uid() then raise exception 'not-the-host'; end if;
  select * into r from fm_party_requests where party_id = v.id and status = 'accepted' and checkin_code = upper(trim(coalesce(p_code, '')));
  if r.id is null then raise exception 'bad-code'; end if;
  update fm_party_requests set checked_in_at = coalesce(checked_in_at, now()) where id = r.id;
  return jsonb_build_object('id', r.id, 'name', (select split_part(coalesce(full_name, ''), ' ', 1) from fm_profiles where id = r.user_id), 'plus', r.plus,
                            'again', r.checked_in_at is not null);
end $$;

-- Report the party (its host) or, for the host, a person who asked to join. p_request null: the host.
create or replace function public.fm_party_report(p_code text, p_request uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v fm_parties%rowtype; v_who uuid; v_reason text := left(trim(coalesce(p_reason, '')), 300);
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('party-report', 10, 20);
  select * into v from fm_parties where code = upper(trim(p_code));
  if v.id is null then raise exception 'no-party'; end if;
  if char_length(v_reason) < 2 then raise exception 'bad-reason'; end if;
  if p_request is null then
    -- a guest (or someone it was shown to) reports the host
    if not exists (select 1 from fm_party_requests where party_id = v.id and user_id = auth.uid())
       and fm_party_cant_see(v.id, auth.uid()) is not null then raise exception 'not-in-party'; end if;
    v_who := v.host_id;
  else
    if v.host_id <> auth.uid() then raise exception 'not-the-host'; end if;
    select user_id into v_who from fm_party_requests where id = p_request and party_id = v.id;
    if v_who is null then raise exception 'no-request'; end if;
  end if;
  if v_who = auth.uid() then raise exception 'not-yourself'; end if;
  insert into fm_party_reports (party_id, reporter, reported, reason) values (v.id, auth.uid(), v_who, v_reason)
  on conflict (party_id, reporter, reported) do update set reason = excluded.reason;
end $$;

-- After the party: a thumbs up or down. Guests rate the host; the host rates each accepted guest.
create or replace function public.fm_party_rate(p_code text, p_request uuid, p_up boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v fm_parties%rowtype; v_who uuid;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('party-rate', 30, 100);
  select * into v from fm_parties where code = upper(trim(p_code));
  if v.id is null then raise exception 'no-party'; end if;
  if v.cancelled then raise exception 'party-cancelled'; end if;
  if not fm_party_ended(v.id) then raise exception 'not-yet'; end if;
  if p_request is null then
    if not exists (select 1 from fm_party_requests where party_id = v.id and user_id = auth.uid() and status = 'accepted') then raise exception 'not-a-guest'; end if;
    v_who := v.host_id;
  else
    if v.host_id <> auth.uid() then raise exception 'not-the-host'; end if;
    select user_id into v_who from fm_party_requests where id = p_request and party_id = v.id and status = 'accepted';
    if v_who is null then raise exception 'not-a-guest'; end if;
  end if;
  insert into fm_party_ratings (party_id, rater, ratee, up) values (v.id, auth.uid(), v_who, coalesce(p_up, true))
  on conflict (party_id, rater, ratee) do update set up = excluded.up, created_at = now();
end $$;

-- For Kamal (SQL editor or the service key; signed-in users can't call these): who is blocked, and clearing someone.
create or replace function public.fm_party_review_list()
returns table (user_id uuid, name text, phone text, reports bigint, thumbs_down bigint, reasons text, last_at timestamptz, blocked boolean)
language sql stable security definer set search_path = public as $$
  with since as (select u.id, coalesce(rv.cleared_at, '-infinity'::timestamptz) t from fm_profiles u left join fm_party_reviews rv on rv.user_id = u.id),
  rep as (select r.reported u, count(distinct r.reporter) n, string_agg(r.reason, ' | ' order by r.created_at) why, max(r.created_at) last_at
          from fm_party_reports r join since s on s.id = r.reported and r.created_at > s.t group by r.reported),
  thd as (select g.ratee u, count(*) n, max(g.created_at) last_at from fm_party_ratings g join since s on s.id = g.ratee and g.created_at > s.t where not g.up group by g.ratee)
  select p.id, p.full_name, p.phone, coalesce(rep.n, 0), coalesce(thd.n, 0), rep.why, greatest(rep.last_at, thd.last_at), fm_party_blocked(p.id)
  from fm_profiles p left join rep on rep.u = p.id left join thd on thd.u = p.id
  where rep.u is not null or thd.u is not null
  order by fm_party_blocked(p.id) desc, greatest(rep.last_at, thd.last_at) desc;
$$;
create or replace function public.fm_party_clear(p_user uuid, p_note text default null) returns void
language sql security definer set search_path = public as $$
  insert into fm_party_reviews (user_id, cleared_at, note) values (p_user, now(), p_note)
  on conflict (user_id) do update set cleared_at = now(), note = excluded.note;
$$;

-- Notifications through fm-notify: a new request goes to the host; accept and decline go to the guest; when the
-- host calls the party off, everyone who asked or was accepted is told (fm_party_notify, below).
create or replace function public.fm_party_request_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text; v_event text;
begin
  v_event := case when new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from 'pending') then 'request'
                  when tg_op = 'UPDATE' and new.status in ('accepted', 'declined') and old.status = 'pending' then new.status end;
  if v_event is null then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('party_request_id', new.id, 'event', v_event),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists fm_party_requests_notify on public.fm_party_requests;
create trigger fm_party_requests_notify after insert or update of status on public.fm_party_requests
  for each row execute function public.fm_party_request_notify();

-- ------------------------------------------------- new-flat alerts --
-- Who a new listing is for: seekers in its city and areas, still looking (searched in the last 60 days), who'd see
-- its kind (private room or whole flat: no shared rooms; shared room or anything: everything), and with 70%+
-- vibe with the household (whole flats and empty flats always count). "tribe": a whole flat with a bedroom
-- for each member of the seeker's tribe.
create or replace function public.fm_listing_fits(l fm_listings, p fm_profiles) returns boolean
language sql stable set search_path = public as $$
  select p.role = 'seeker' and p.id <> l.owner_id and l.status = 'active'
     and lower(coalesce(p.search->>'city', '')) = lower(l.city)
     and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0 or p.search->'areas' ? l.locality)
     and (coalesce(p.search->>'kind', '') in ('', 'shared') or l.kind <> 'shared')
     and (l.kind = 'flat' or coalesce((l.household->>'residents')::int, 0) = 0 or coalesce(fm_match(p.vibe, l.household), 0) >= 70)
$$;

-- In the app: new homes for me since p_since (at most a week back), newest first.
create or replace function public.fm_listing_alerts(p_since timestamptz)
returns table (id uuid, kind text, title text, locality text, city text, rent int, bhk int, match_pct int, for_tribe boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.kind, l.title, l.locality, l.city, l.rent, l.bhk,
         case when coalesce((l.household->>'residents')::int, 0) > 0 then fm_match(me.vibe, l.household) end,
         l.kind = 'flat' and cardinality(fm_tribe_members(me.id)) > 1 and l.bhk = cardinality(fm_tribe_members(me.id)),
         l.created_at
  from fm_profiles me join fm_listings l on fm_listing_fits(l, me)
  where me.id = auth.uid() and l.created_at > greatest(coalesce(p_since, now() - interval '1 day'), now() - interval '7 days')
  order by l.created_at desc limit 10;
$$;

-- The other way round, for owners: seekers who just started looking where their listing is (city and area, 70%+
-- vibe, not yet in touch). In the app since p_since (at most a week back); fm_seeker_audience is the push
-- version (fm-notify, service role), fired by fm_seeker_notify when a seeker sets or changes their city or areas.
create or replace function public.fm_seeker_alerts(p_since timestamptz)
returns table (seeker_id uuid, name text, listing_id uuid, listing_title text, locality text, match_pct int, budget int, search_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, split_part(coalesce(p.full_name, ''), ' ', 1), l.id, l.title, l.locality, fm_match(p.vibe, l.household), (p.search->>'budget')::int, p.search_at
  from fm_listings l
  join fm_profiles p on p.role = 'seeker' and p.discoverable and p.id <> l.owner_id
   and fm_shows_to(p.escape_show_to, (select o.gender from fm_profiles o where o.id = auth.uid()))
   and lower(p.search->>'city') = lower(l.city)
   and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0 or p.search->'areas' ? l.locality)
  where l.owner_id = auth.uid() and l.status = 'active' and fm_vibe_count(p.vibe) >= 6
    and coalesce(fm_match(p.vibe, l.household), 0) >= 70
    and p.search_at > greatest(coalesce(p_since, now() - interval '1 day'), now() - interval '7 days')
    and not exists (select 1 from fm_requests r where r.listing_id = l.id and r.seeker_id = p.id)
  order by p.search_at desc limit 10;
$$;
create or replace function public.fm_seeker_audience(p_seeker uuid)
returns table (owner_id uuid, listing_id uuid, listing_title text, locality text, match_pct int, budget int)
language sql stable security definer set search_path = public as $$
  select l.owner_id, l.id, l.title, l.locality, fm_match(p.vibe, l.household), (p.search->>'budget')::int
  from fm_profiles p
  join fm_listings l on l.status = 'active' and l.owner_id <> p.id
   and lower(p.search->>'city') = lower(l.city)
   and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0 or p.search->'areas' ? l.locality)
   and fm_shows_to(p.escape_show_to, (select o.gender from fm_profiles o where o.id = l.owner_id))
  where p.id = p_seeker and p.role = 'seeker' and p.discoverable and fm_vibe_count(p.vibe) >= 6
    and coalesce(fm_match(p.vibe, l.household), 0) >= 70
    and not exists (select 1 from fm_requests r where r.listing_id = l.id and r.seeker_id = p.id)
  limit 200;
$$;
alter table public.fm_profiles add column if not exists seeker_alert_at timestamptz;
create or replace function public.fm_seeker_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if new.role is distinct from 'seeker' or not new.discoverable or new.search->>'city' is null or fm_vibe_count(new.vibe) < 6 then return new; end if;
  -- Only when the city or areas change (or the answers just became enough to match), and at most once a day.
  if (old.search->>'city') is not distinct from (new.search->>'city') and (old.search->'areas') is not distinct from (new.search->'areas')
     and not (fm_vibe_count(old.vibe) < 6 and fm_vibe_count(new.vibe) >= 6) then return new; end if;
  if new.seeker_alert_at > now() - interval '1 day' then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  new.seeker_alert_at := now();
  perform net.http_post(url := v_url, body := jsonb_build_object('seeker_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists fm_profiles_seeker_notify on public.fm_profiles;
create trigger fm_profiles_seeker_notify before update of search, vibe on public.fm_profiles
  for each row execute function public.fm_seeker_notify();

-- For fm-notify (service role only): everyone a new listing is for.
create or replace function public.fm_listing_audience(p_listing uuid)
returns table (user_id uuid, match_pct int, for_tribe boolean)
language sql stable security definer set search_path = public as $$
  select p.id,
         case when coalesce((l.household->>'residents')::int, 0) > 0 then fm_match(p.vibe, l.household) end,
         l.kind = 'flat' and cardinality(fm_tribe_members(p.id)) > 1 and l.bhk = cardinality(fm_tribe_members(p.id))
  from fm_listings l join fm_profiles p on fm_listing_fits(l, p)
  where l.id = p_listing and p.search_at > now() - interval '60 days'
  limit 500;
$$;

-- Push them when a listing goes live (see fm-notify).
create or replace function public.fm_listing_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if new.status <> 'active' or (tg_op = 'UPDATE' and old.status = 'active') then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(url := v_url, body := jsonb_build_object('listing_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists fm_listings_notify on public.fm_listings;
create trigger fm_listings_notify after insert or update of status on public.fm_listings for each row execute function public.fm_listing_notify();

-- ------------------------------------------------- Help: grievances and reports --
-- The in-app helper files grievances (about the service) and reports (about a listing, a person or an item) as
-- tickets. The team works them in the Supabase Table Editor: set status and write a reply; the person sees both
-- in "My tickets" and gets a notification. Under India's IT Rules, acknowledge within 24 hours, resolve within 15 days.
create table if not exists public.fm_tickets (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('grievance', 'report')),
  category      text not null,
  subject_type  text check (subject_type in ('listing', 'person', 'item', 'party', 'app')),
  subject_id    text,
  subject_label text,
  message       text not null,
  status        text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  reply         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  seen_at       timestamptz
);
create index if not exists fm_tickets_user_idx on public.fm_tickets (user_id, created_at desc);
create index if not exists fm_tickets_open_idx on public.fm_tickets (status, created_at);
alter table public.fm_tickets enable row level security;   -- no policies: fm_ticket_* only (and the team, as admin)

-- When the team changes the status or the reply, the person sees it as new (and fm-notify pushes it).
create or replace function public.fm_ticket_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status or new.reply is distinct from old.reply then new.updated_at := now(); end if;
  return new;
end $$;
drop trigger if exists fm_tickets_touch on public.fm_tickets;
create trigger fm_tickets_touch before update on public.fm_tickets for each row execute function public.fm_ticket_touch();

create or replace function public.fm_ticket_create(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; v_kind text := p->>'kind'; v_cat text := p->>'category'; v_msg text := trim(coalesce(p->>'message', ''));
        v_type text := nullif(p->>'subject_type', '');
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if v_kind not in ('grievance', 'report') then raise exception 'bad-kind'; end if;
  if v_cat not in ('broker', 'fake', 'scam', 'harassment', 'spam', 'payment', 'account', 'listing', 'privacy', 'bug', 'other') then raise exception 'bad-category'; end if;
  if char_length(v_msg) < 10 then raise exception 'too-short'; end if;
  if v_type is not null and v_type not in ('listing', 'person', 'item', 'party', 'app') then v_type := null; end if;
  if (select count(*) from fm_tickets where user_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then raise exception 'too-many'; end if;
  loop
    v_code := 'FMF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from fm_tickets where code = v_code);
  end loop;
  insert into fm_tickets (code, user_id, kind, category, subject_type, subject_id, subject_label, message)
  values (v_code, auth.uid(), v_kind, v_cat, v_type, left(nullif(p->>'subject_id', ''), 80), left(nullif(trim(coalesce(p->>'subject_label', '')), ''), 120), left(v_msg, 2000));
  return v_code;
end $$;

-- My tickets, newest first. unseen: the team changed it since I last looked.
create or replace function public.fm_my_tickets()
returns table (code text, kind text, category text, subject_label text, message text, status text, reply text,
               created_at timestamptz, updated_at timestamptz, unseen boolean)
language sql stable security definer set search_path = public as $$
  select t.code, t.kind, t.category, t.subject_label, t.message, t.status, t.reply, t.created_at, t.updated_at,
         (t.status <> 'open' or t.reply is not null) and (t.seen_at is null or t.updated_at > t.seen_at)
  from fm_tickets t where t.user_id = auth.uid() order by t.created_at desc limit 50;
$$;

create or replace function public.fm_tickets_seen() returns void
language sql security definer set search_path = public as $$
  update fm_tickets set seen_at = now() where user_id = auth.uid() and (seen_at is null or updated_at > seen_at);
$$;

-- Push the person when their ticket changes (see fm-notify).
create or replace function public.fm_ticket_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if new.status is not distinct from old.status and new.reply is not distinct from old.reply then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(url := v_url, body := jsonb_build_object('ticket_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists fm_tickets_notify on public.fm_tickets;
create trigger fm_tickets_notify after update on public.fm_tickets for each row execute function public.fm_ticket_notify();

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
alter table public.fm_market_items add column if not exists boosted_until timestamptz;
-- Pick-up: either side sets a time once an offer is accepted; collected_at closes the deal (the item is sold).
-- bundle: an offer for everything in the seller's moving-out sale ("take the lot"), made on the sale's first item.
alter table public.fm_market_offers add column if not exists pickup_at timestamptz;
alter table public.fm_market_offers add column if not exists collected_at timestamptz;
alter table public.fm_market_offers add column if not exists bundle boolean not null default false;
alter table public.fm_market_offers add column if not exists bundle_items int;   -- how many things were in the lot when offered
-- A seller's moving-out sale: one page (/#sale/<code>) with all their items, shown first until ends_at.
create table if not exists public.fm_market_sales (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null unique references auth.users(id) on delete cascade,
  code       text not null unique,
  title      text not null check (char_length(title) between 3 and 60),
  ends_at    timestamptz not null,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.fm_market_sales enable row level security;   -- no policies: the fm_market_sale* functions only
-- "Take the lot": one price for everything in the sale (null = not offered).
alter table public.fm_market_sales add column if not exists bundle_price int;

drop function if exists public.fm_market_search(text, text, text);
drop function if exists public.fm_market_search(text, text, text, boolean);
-- Boosted items and items in a moving-out sale come first; boosted_until / sale_code say why. The seller's
-- record (since when, things sold, the on-time badge) and the sale's "take the lot" price come along.
create or replace function public.fm_market_search(p_city text default null, p_category text default null, p_q text default null,
                                                   p_mine boolean default false)
returns table (id uuid, title text, category text, condition text, price int, negotiable boolean, city text, locality text,
               description text, photos text[], moving_by date, status text, created_at timestamptz, bumped_at timestamptz,
               seller_name text, is_mine boolean, my_offer_status text, my_offer int, offer_count bigint,
               boosted_until timestamptz, sale_code text, sale_until timestamptz,
               seller_since timestamptz, seller_sold int, seller_on_time boolean, bundle_price int)
language sql security definer set search_path = public as $$
  select fm_throttle('market', 200, 1000);
  select i.id, i.title, i.category, i.condition, i.price, i.negotiable, i.city, i.locality, i.description, i.photos,
         i.moving_by, i.status, i.created_at, i.bumped_at,
         split_part(coalesce(p.full_name, ''), ' ', 1), i.seller_id = auth.uid(), o.status, o.offer,
         (select count(*) from fm_market_offers x where x.item_id = i.id and x.status in ('pending','accepted')),
         case when i.boosted_until > now() then i.boosted_until end, sl.code, sl.ends_at,
         p.created_at, (select count(*)::int from fm_market_items y where y.seller_id = i.seller_id and y.status = 'sold'),
         coalesce(p.show_on_time and p.on_time_months >= 3 and p.on_time_at > now() - interval '40 days', false), sl.bundle_price
  from fm_market_items i
  left join fm_profiles p on p.id = i.seller_id
  left join fm_market_sales sl on sl.seller_id = i.seller_id and sl.ends_at > now()
  left join fm_market_offers o on o.item_id = i.id and o.buyer_id = auth.uid()
  where (i.status in ('active','reserved') or (i.seller_id = auth.uid() and i.status <> 'removed'))
    and (not coalesce(p_mine, false) or i.seller_id = auth.uid())
    and (p_city is null or i.city = p_city)
    and (p_category is null or i.category = p_category or (p_category = 'free' and i.price = 0))
    and (p_q is null or i.title ilike '%' || p_q || '%' or i.description ilike '%' || p_q || '%')
  order by coalesce(i.status = 'active' and (i.boosted_until > now() or sl.code is not null), false) desc, i.bumped_at desc
  limit 300;
$$;

-- Boost one of my items: first in FlatMart for 3 days (more days if it's already boosted). Uses a boost
-- credit, except while charges are off (everything is free while testing).
create or replace function public.fm_market_boost(p_item uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_until timestamptz;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if not exists (select 1 from fm_market_items where id = p_item and seller_id = auth.uid() and status = 'active') then return 'not-found'; end if;
  if (select charges_enabled from fm_settings) then
    update fm_profiles set boost_credits = boost_credits - 1 where id = auth.uid() and boost_credits > 0;
    if not found then return 'boost-required'; end if;
  end if;
  update fm_market_items set boosted_until = greatest(coalesce(boosted_until, now()), now()) + interval '3 days', bumped_at = now()
   where id = p_item returning boosted_until into v_until;
  return 'boosted';
end $$;

-- Start (or change) my moving-out sale, until the end of p_until (India time), 30 days at most. Starting one
-- uses a sale credit, except while charges are off; changing the title or date of a running sale is free.
drop function if exists public.fm_market_sale_start(date, text);
create or replace function public.fm_market_sale_start(p_until date, p_title text, p_bundle int default null)
returns table (code text, ends_at timestamptz, error text)
language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Kolkata')::date; v_s fm_market_sales%rowtype; v_end timestamptz; v_code text;
        v_title text := left(trim(coalesce(p_title, '')), 60);
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if char_length(v_title) < 3 then return query select null::text, null::timestamptz, 'bad-title'; return; end if;
  if p_bundle is not null and p_bundle not between 1 and 10000000 then return query select null::text, null::timestamptz, 'bad-bundle'; return; end if;
  if p_until is null or p_until < v_today or p_until > v_today + 30 then return query select null::text, null::timestamptz, 'bad-date'; return; end if;
  if not exists (select 1 from fm_market_items where seller_id = auth.uid() and status = 'active') then
    return query select null::text, null::timestamptz, 'no-items'; return;
  end if;
  v_end := ((p_until + 1)::timestamp at time zone 'Asia/Kolkata');
  select * into v_s from fm_market_sales where seller_id = auth.uid() for update;
  if v_s.id is not null and v_s.ends_at > now() then
    if v_end > v_s.started_at + interval '31 days' then return query select null::text, null::timestamptz, 'bad-date'; return; end if;
    update fm_market_sales set title = v_title, ends_at = v_end, bundle_price = p_bundle where id = v_s.id;
    return query select v_s.code, v_end, null::text; return;
  end if;
  if (select charges_enabled from fm_settings) then
    update fm_profiles set sale_credits = sale_credits - 1 where id = auth.uid() and sale_credits > 0;
    if not found then return query select null::text, null::timestamptz, 'sale-required'; return; end if;
  end if;
  if v_s.id is not null then
    update fm_market_sales set title = v_title, ends_at = v_end, started_at = now(), bundle_price = p_bundle where id = v_s.id;
    return query select v_s.code, v_end, null::text; return;
  end if;
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from fm_market_sales where fm_market_sales.code = v_code);
  end loop;
  insert into fm_market_sales (seller_id, code, title, ends_at, bundle_price) values (auth.uid(), v_code, v_title, v_end, p_bundle);
  return query select v_code, v_end, null::text;
end $$;

-- A moving-out sale's page, for anyone with the link (signed in or not): the seller's first name, the
-- items still for sale and when it ends. Nothing private: no number, no exact address.
create or replace function public.fm_market_sale(p_code text) returns jsonb
language sql security definer set search_path = public as $$
  select fm_throttle('sale', 120, 600);
  select jsonb_build_object('code', s.code, 'title', s.title, 'seller', split_part(coalesce(p.full_name, ''), ' ', 1),
    'ends_at', s.ends_at, 'active', s.ends_at > now(), 'is_mine', coalesce(s.seller_id = auth.uid(), false),
    'bundle_price', s.bundle_price,
    'bundle_status', (select o.status from fm_market_offers o join fm_market_items i on i.id = o.item_id
                      where i.seller_id = s.seller_id and o.bundle and o.status = 'accepted' and o.collected_at is null limit 1),
    'my_bundle', (select o.status from fm_market_offers o join fm_market_items i on i.id = o.item_id
                  where i.seller_id = s.seller_id and o.bundle and o.buyer_id = auth.uid() and o.status in ('pending', 'accepted') limit 1),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'category', i.category, 'condition', i.condition,
        'price', i.price, 'negotiable', i.negotiable, 'city', i.city, 'locality', i.locality, 'photos', i.photos, 'status', i.status,
        'moving_by', i.moving_by, 'created_at', i.created_at, 'bumped_at', i.bumped_at) order by i.status = 'reserved', i.bumped_at desc)
      from fm_market_items i where i.seller_id = s.seller_id and i.status in ('active', 'reserved')), '[]'::jsonb))
  from fm_market_sales s join fm_profiles p on p.id = s.seller_id
  where s.code = upper(trim(coalesce(p_code, '')));
$$;

create or replace function public.fm_market_post(
  p_title text, p_category text, p_condition text, p_price int, p_negotiable boolean, p_city text, p_locality text,
  p_description text, p_photos text[] default '{}', p_moving_by date default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_photo text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('mkpost', 20, 60);
  if char_length(coalesce(p_locality, '')) > 80 or char_length(coalesce(p_city, '')) > 60 then raise exception 'too-long'; end if;
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

drop function if exists public.fm_market_offer(uuid, text, int);
drop function if exists public.fm_market_offer(uuid, int, text);
-- p_bundle: an offer for everything in the seller's moving-out sale, at or near its "take the lot" price.
create or replace function public.fm_market_offer(p_item uuid, p_offer int, p_message text, p_bundle boolean default false)
returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_i fm_market_items%rowtype; v_o fm_market_offers%rowtype;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_i from fm_market_items where id = p_item and fm_market_items.status = 'active';
  if v_i.id is null then return query select null::text, 'item-not-available'; return; end if;
  if v_i.seller_id = auth.uid() then return query select null::text, 'own-item'; return; end if;
  if p_offer is null or p_offer < 0 or p_offer > 10000000 then return query select null::text, 'bad-offer'; return; end if;
  if coalesce(p_bundle, false) and (p_offer < 1 or not exists (select 1 from fm_market_sales s where s.seller_id = v_i.seller_id and s.ends_at > now() and s.bundle_price is not null)) then
    return query select null::text, 'no-bundle'; return;
  end if;
  select * into v_o from fm_market_offers where item_id = p_item and buyer_id = auth.uid();
  if v_o.status in ('pending','accepted') then return query select v_o.status, null::text; return; end if;
  if (select count(*) from fm_market_offers o where o.buyer_id = auth.uid() and o.created_at > now() - interval '1 day') >= 30 then
    return query select null::text, 'daily-limit'; return;
  end if;
  insert into fm_market_offers (item_id, buyer_id, offer, message, bundle, bundle_items)
  values (p_item, auth.uid(), p_offer, left(coalesce(p_message, ''), 300), coalesce(p_bundle, false),
          case when coalesce(p_bundle, false) then (select count(*)::int from fm_market_items y where y.seller_id = v_i.seller_id and y.status = 'active') end)
  on conflict (item_id, buyer_id) do update
    set status = 'pending', offer = excluded.offer, message = excluded.message, bundle = excluded.bundle, bundle_items = excluded.bundle_items,
        seen_seller = false, seen_buyer = true, created_at = now(), decided_at = null, pickup_at = null, collected_at = null;
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
  if p_accept then
    update fm_market_items set status = 'reserved' where id = v_o.item_id and status = 'active';
    if v_o.bundle then update fm_market_items set status = 'reserved' where seller_id = auth.uid() and status = 'active'; end if;
  end if;
  return case when p_accept then 'accepted' else 'declined' end;
end $$;

-- Pick-up: either side of an accepted offer sets (or clears) the time; the other side is told.
create or replace function public.fm_market_pickup(p_offer uuid, p_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare v_o fm_market_offers%rowtype; v_seller uuid;
begin
  select o.* into v_o from fm_market_offers o where o.id = p_offer;
  select i.seller_id into v_seller from fm_market_items i where i.id = v_o.item_id;
  if v_o.id is null or (v_seller <> auth.uid() and v_o.buyer_id <> auth.uid()) then raise exception 'not-found'; end if;
  if v_o.status <> 'accepted' or v_o.collected_at is not null then raise exception 'not-accepted'; end if;
  if p_at is not null and (p_at < now() - interval '1 hour' or p_at > now() + interval '30 days') then raise exception 'bad-time'; end if;
  update fm_market_offers set pickup_at = p_at,
         seen_buyer = case when v_seller = auth.uid() then false else seen_buyer end,
         seen_seller = case when v_seller = auth.uid() then seen_seller else false end
   where id = p_offer;
end $$;
-- Collected: the deal is done. The item (all of them, for a bundle) is marked sold.
create or replace function public.fm_market_collected(p_offer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_o fm_market_offers%rowtype; v_seller uuid;
begin
  select o.* into v_o from fm_market_offers o where o.id = p_offer;
  select i.seller_id into v_seller from fm_market_items i where i.id = v_o.item_id;
  if v_o.id is null or (v_seller <> auth.uid() and v_o.buyer_id <> auth.uid()) then raise exception 'not-found'; end if;
  if v_o.status <> 'accepted' then raise exception 'not-accepted'; end if;
  update fm_market_offers set collected_at = coalesce(collected_at, now()), seen_buyer = true, seen_seller = true where id = p_offer;
  update fm_market_items set status = 'sold' where id = v_o.item_id and status in ('active', 'reserved');
  if v_o.bundle then update fm_market_items set status = 'sold' where seller_id = v_seller and status in ('active', 'reserved'); end if;
end $$;

-- What things like this went for: the middle half of accepted offers in the last 6 months for this category,
-- in the city when it has 3 or more, else everywhere. Nothing until there are 3.
create or replace function public.fm_market_price_guide(p_city text, p_category text)
returns table (n int, lo int, hi int, scope text)
language sql stable security definer set search_path = public as $$
  with sold as (
    select o.offer as amt, i.city from fm_market_offers o join fm_market_items i on i.id = o.item_id
    where o.status = 'accepted' and not o.bundle and i.category = p_category and i.price > 0 and o.offer > 0
      and o.decided_at > now() - interval '180 days'),
  c as (select count(*) as n, percentile_cont(0.25) within group (order by amt) as lo, percentile_cont(0.75) within group (order by amt) as hi
        from sold where lower(city) = lower(coalesce(p_city, ''))),
  a as (select count(*) as n, percentile_cont(0.25) within group (order by amt) as lo, percentile_cont(0.75) within group (order by amt) as hi from sold)
  select case when c.n >= 3 then c.n else a.n end::int,
         (round(case when c.n >= 3 then c.lo else a.lo end / 50) * 50)::int, (round(case when c.n >= 3 then c.hi else a.hi end / 50) * 50)::int,
         case when c.n >= 3 then 'city' else 'all' end
  from c, a where greatest(c.n, a.n) >= 3;
$$;

-- Wanted: "Looking for a single bed under ₹3,000 in Baner". Public ones show on FlatMart's Wanted tab;
-- private ones are saved searches. Either way the person is told when a matching item is posted.
create table if not exists public.fm_market_wants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  city        text not null,
  locality    text not null default '',
  category    text not null check (category in ('furniture','beds','appliances','kitchen','electronics','decor','bikes','books','other')),
  max_price   int  not null default 0 check (max_price between 0 and 10000000),
  title       text not null check (char_length(title) between 3 and 80),
  public      boolean not null default true,
  status      text not null default 'open' check (status in ('open','closed')),
  notified_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
alter table public.fm_market_wants enable row level security;
create index if not exists fm_market_wants_city on public.fm_market_wants (city, status, created_at desc);
create or replace function public.fm_market_want_save(p_id uuid, p_city text, p_locality text, p_category text, p_max_price int, p_title text, p_public boolean)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_title text := left(trim(coalesce(p_title, '')), 80);
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  perform fm_throttle('mkpost', 20, 60);
  if char_length(v_title) < 3 or char_length(coalesce(p_city, '')) not between 2 and 60 or char_length(coalesce(p_locality, '')) > 80 then raise exception 'too-long'; end if;
  if p_id is null then
    if (select count(*) from fm_market_wants where user_id = auth.uid() and status = 'open') >= 10 then raise exception 'too-many-wants'; end if;
    insert into fm_market_wants (user_id, city, locality, category, max_price, title, public)
    values (auth.uid(), p_city, trim(coalesce(p_locality, '')), p_category, coalesce(p_max_price, 0), v_title, coalesce(p_public, true))
    returning id into v_id;
    return v_id;
  end if;
  update fm_market_wants set city = p_city, locality = trim(coalesce(p_locality, '')), category = p_category, max_price = coalesce(p_max_price, 0),
         title = v_title, public = coalesce(p_public, true), status = 'open'
   where id = p_id and user_id = auth.uid();
  if not found then raise exception 'not-found'; end if;
  return p_id;
end $$;
create or replace function public.fm_market_want_close(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update fm_market_wants set status = 'closed' where id = p_id and user_id = auth.uid();
$$;
-- Open wants: public ones in the city (all cities when null), plus all of mine.
create or replace function public.fm_market_wants(p_city text default null)
returns table (id uuid, city text, locality text, category text, max_price int, title text, public boolean, status text,
               created_at timestamptz, name text, is_mine boolean)
language sql security definer set search_path = public as $$
  select fm_throttle('market', 200, 1000);
  select w.id, w.city, w.locality, w.category, w.max_price, w.title, w.public, w.status, w.created_at,
         split_part(coalesce(p.full_name, ''), ' ', 1), w.user_id = auth.uid()
  from fm_market_wants w left join fm_profiles p on p.id = w.user_id
  where auth.uid() is not null and w.status = 'open'
    and (w.user_id = auth.uid() or (w.public and (p_city is null or lower(w.city) = lower(p_city))))
  order by w.user_id = auth.uid() desc, w.created_at desc
  limit 200;
$$;
-- Items posted since I last looked that fit one of my open wants (each is reported once).
create or replace function public.fm_market_want_matches()
returns table (want_id uuid, want_title text, id uuid, title text, category text, price int, city text, locality text, photos text[], created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  return query
  select w.id, w.title, i.id, i.title, i.category, i.price, i.city, i.locality, i.photos, i.created_at
  from fm_market_wants w
  join fm_market_items i on i.status = 'active' and i.seller_id <> w.user_id and i.category = w.category
   and lower(i.city) = lower(w.city) and (w.locality = '' or lower(i.locality) = lower(w.locality))
   and (w.max_price = 0 or i.price <= w.max_price) and i.created_at > w.notified_at
  where w.user_id = auth.uid() and w.status = 'open'
  order by i.created_at desc limit 10;
  update fm_market_wants set notified_at = now() where user_id = auth.uid() and status = 'open';
end $$;
-- For fm-notify (service role only): everyone whose open want a new item fits.
create or replace function public.fm_market_want_audience(p_item uuid)
returns table (user_id uuid, want_title text)
language sql stable security definer set search_path = public as $$
  select w.user_id, w.title
  from fm_market_items i
  join fm_market_wants w on w.status = 'open' and w.user_id <> i.seller_id and w.category = i.category
   and lower(w.city) = lower(i.city) and (w.locality = '' or lower(i.locality) = lower(w.locality))
   and (w.max_price = 0 or i.price <= w.max_price)
  where i.id = p_item and i.status = 'active'
  limit 200;
$$;
create or replace function public.fm_market_item_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if new.status <> 'active' then return new; end if;
  select notify_url, notify_secret into v_url, v_secret from fm_settings;
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(url := v_url, body := jsonb_build_object('item_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret));
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists fm_market_items_notify on public.fm_market_items;
create trigger fm_market_items_notify after insert on public.fm_market_items for each row execute function public.fm_market_item_notify();

-- Offers on my items ('incoming') and my offers ('outgoing'). Numbers only once accepted. With the pick-up
-- time, whether it's a bundle (and how many things), and the other side's record (deals done, since when).
drop function if exists public.fm_market_inbox();
create or replace function public.fm_market_inbox()
returns table (id uuid, item_id uuid, item_title text, item_photo text, item_price int, item_status text, category text,
               direction text, status text, offer int, message text, name text, phone text, unseen boolean,
               created_at timestamptz, decided_at timestamptz, pickup_at timestamptz, collected_at timestamptz,
               bundle boolean, bundle_items int, other_deals int, other_since timestamptz)
language sql stable security definer set search_path = public as $$
  select o.id, i.id, i.title, i.photos[1], i.price, i.status, i.category,
         case when i.seller_id = auth.uid() then 'incoming' else 'outgoing' end,
         o.status, o.offer, o.message,
         split_part(coalesce(case when i.seller_id = auth.uid() then b.full_name else s.full_name end, ''), ' ', 1),
         case when o.status = 'accepted' then (case when i.seller_id = auth.uid() then b.phone else s.phone end) end,
         case when i.seller_id = auth.uid() then not o.seen_seller else not o.seen_buyer end,
         o.created_at, o.decided_at, o.pickup_at, o.collected_at, o.bundle, o.bundle_items,
         case when i.seller_id = auth.uid()
              then (select count(*)::int from fm_market_offers x join fm_market_items z on z.id = x.item_id where x.buyer_id = o.buyer_id and x.status = 'accepted' and (x.collected_at is not null or z.status = 'sold'))
              else (select count(*)::int from fm_market_items y where y.seller_id = i.seller_id and y.status = 'sold') end,
         case when i.seller_id = auth.uid() then b.created_at else s.created_at end
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

-- ------------------------------------------------------ sample people (testing) --
-- samples.sql loads sample owners, homes and seekers so a test install feels lived-in. They are
-- accounts with fm_profiles.sample = true and no phone or email, so nobody can sign in as them.
-- They answer straight away: a request to a sample home or an invite to a sample seeker is
-- accepted, a visit is confirmed, and a sample seeker says yes to a tribe match. Accepting never
-- uses a contact, and there is no real number or address to share (the app says so).
-- Remove them all: delete from auth.users where id in (select id from public.fm_profiles where sample);
alter table public.fm_profiles add column if not exists sample boolean not null default false;

create or replace function public.fm_is_sample(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select sample from fm_profiles where id = p_user), false);
$$;

create or replace function public.fm_sample_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'pending' then return new; end if;
  if (new.initiated_by = 'seeker' and fm_is_sample((select owner_id from fm_listings where id = new.listing_id)))
     or (new.initiated_by = 'owner' and fm_is_sample(new.seeker_id)) then
    -- Same as fm_decide accepting, without using one of the seeker's contacts.
    new.status := 'approved';
    new.decided_at := now();
    new.seen_by_seeker := new.initiated_by = 'owner';
    new.seen_by_owner := new.initiated_by = 'seeker';
    insert into fm_unlocks (user_id, listing_id, charged) values (new.seeker_id, new.listing_id, false)
    on conflict (user_id, listing_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists fm_requests_sample on public.fm_requests;
create trigger fm_requests_sample before insert or update of status on public.fm_requests
  for each row execute function public.fm_sample_request();

-- A sample seeker says yes as soon as the other person does; two samples (the third person
-- completing a tribe) are bonded at once.
create or replace function public.fm_sample_tribe() returns trigger
language plpgsql security definer set search_path = public as $$
declare sa boolean := fm_is_sample(new.a); sb boolean := fm_is_sample(new.b);
begin
  if new.status <> 'open' or not (sa or sb) then return new; end if;
  if sa and (sb or new.b_yes) then new.a_yes := true; end if;
  if sb and (sa or new.a_yes) then new.b_yes := true; end if;
  if sa and sb then new.status := 'bonded'; new.bonded_at := now(); end if;
  return new;
end $$;
drop trigger if exists fm_tribe_links_sample on public.fm_tribe_links;
create trigger fm_tribe_links_sample before insert or update on public.fm_tribe_links
  for each row execute function public.fm_sample_tribe();

create or replace function public.fm_sample_visit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'requested' and fm_is_sample((select owner_id from fm_listings where id = new.listing_id)) then
    new.status := 'confirmed';
  end if;
  return new;
end $$;
drop trigger if exists fm_visits_sample on public.fm_visits;
create trigger fm_visits_sample before insert on public.fm_visits
  for each row execute function public.fm_sample_visit();

-- ------------------------------------------------------ plans and referrals --
-- The plans on sale, with GST worked out the same way fm-pay charges it.
drop function if exists public.fm_plan_list();
create or replace function public.fm_plan_list()
returns table (id text, name text, who text, base_paise int, gst_paise int, room_days int, tribe_days int, escape_days int, featured_days int,
               boosts int, sales int)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.who, p.base_paise, round(p.base_paise * s.gst_percent / 100)::int,
         p.room_days, p.tribe_days, p.escape_days, p.featured_days, p.boosts, p.sales
  from fm_plans p cross join fm_settings s where p.enabled order by p.sort;
$$;

-- A new account names who invited them (the r= code in the link they came from): once, within a
-- day of signing up, never themselves.
create or replace function public.fm_set_referrer(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare v_me fm_profiles%rowtype; v_ref uuid;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_me from fm_profiles where id = auth.uid() for update;
  if v_me.referred_by is not null then return 'already'; end if;
  if v_me.created_at < now() - interval '1 day' then return 'too-late'; end if;
  select id into v_ref from fm_profiles where ref_code = upper(trim(p_code));
  if v_ref is null or v_ref = auth.uid() then return 'no-such-code'; end if;
  update fm_profiles set referred_by = v_ref where id = auth.uid();
  perform fm_referral_reward(auth.uid());
  return 'ok';
end $$;

-- A referred friend counts once their profile is done: a seeker's living-style answers, or an
-- owner's first listing. Every 2 friends earn the referrer 1 contact, up to 5.
create or replace function public.fm_referral_reward(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_me fm_profiles%rowtype; v_joined int;
begin
  select * into v_me from fm_profiles where id = p_user;
  if v_me.referred_by is null or v_me.ref_rewarded then return; end if;
  if fm_vibe_count(v_me.vibe) < 6 and not exists (select 1 from fm_listings where owner_id = p_user) then return; end if;
  perform 1 from fm_profiles where id = v_me.referred_by for update;
  update fm_profiles set ref_rewarded = true where id = p_user;
  select count(*) into v_joined from fm_profiles where referred_by = v_me.referred_by and ref_rewarded;
  update fm_profiles set ref_bonus = ref_bonus + 1, credits = credits + 1
   where id = v_me.referred_by and v_joined % 2 = 0 and ref_bonus < 5;
end $$;

-- ------------------------------------------------------ host page and ads --
-- The public "people looking in your area" page: how many real people (no samples) are looking for
-- a room in a city, and in one area of it. They're the people an owner there could invite from the
-- Escape tab (discoverable seekers with their living-style answers, open to that area or to the whole
-- city), active in the last 60 days. Only totals: the mix (budgets, lifestyle) needs 5 or more people,
-- and describes the whole city when the area has fewer. Areas are listed when 2 or more people chose them.
create or replace function public.fm_area_demand(p_city text, p_area text default null) returns jsonb
language sql security definer set search_path = public as $$
  select fm_throttle('demand', 60, 300);
  with s as (
    select nullif(p.search->>'budget', '')::int as budget, p.vibe, p.occupation->>'type' as occ,
           coalesce(p.search->'areas', '[]'::jsonb) as areas,
           coalesce(p.search_at, p.created_at) > now() - interval '7 days' as fresh,
           nullif(trim(p_area), '') is not null
             and (jsonb_array_length(coalesce(p.search->'areas', '[]'::jsonb)) = 0
                  or exists (select 1 from jsonb_array_elements_text(p.search->'areas') a where lower(a) = lower(trim(p_area)))) as here
    from fm_profiles p
    where p.role = 'seeker' and p.discoverable and not p.sample
      and lower(p.search->>'city') = lower(trim(p_city))
      and coalesce(p.search_at, p.created_at) > now() - interval '60 days'
      and fm_vibe_count(p.vibe) >= 6
  ), n as (
    select count(*) as city_n, count(*) filter (where here) as area_n,
           count(*) filter (where fresh) as city_week, count(*) filter (where here and fresh) as area_week from s
  ), pool as (
    select s.* from s, n where s.here or n.area_n < 5
  ), m as (
    select count(*) as n,
           percentile_cont(.25) within group (order by budget) filter (where budget > 0) as b25,
           percentile_cont(.5)  within group (order by budget) filter (where budget > 0) as b50,
           percentile_cont(.75) within group (order by budget) filter (where budget > 0) as b75,
           count(*) filter (where coalesce(budget, 0) = 0) as flexible,
           count(*) filter (where occ = 'working') as working, count(*) filter (where occ = 'student') as student,
           count(*) filter (where vibe->>'gen' = 'z') as gz, count(*) filter (where vibe->>'gen' = 'm') as gm,
           count(*) filter (where vibe->>'gen' = 'g') as gg,
           count(*) filter (where vibe->>'smoke' = '0') as nosmoke, count(*) filter (where vibe->>'food' in ('0','1')) as veg,
           count(*) filter (where vibe->>'sleep' = '0') as early, count(*) filter (where vibe->>'sleep' = '2') as night,
           count(*) filter (where vibe->>'work' = '0') as out_all_day
    from pool
  )
  select jsonb_build_object(
    'city_n', n.city_n, 'area_n', case when nullif(trim(p_area), '') is not null then n.area_n end,
    'city_week', n.city_week, 'area_week', case when nullif(trim(p_area), '') is not null then n.area_week end,
    'mix', case when m.n >= 5 then jsonb_build_object(
      'scope', case when nullif(trim(p_area), '') is not null and n.area_n >= 5 then 'area' else 'city' end, 'n', m.n,
      'budget_p25', round(m.b25 / 500) * 500, 'budget_p50', round(m.b50 / 500) * 500, 'budget_p75', round(m.b75 / 500) * 500,
      'flexible_pct', round(100.0 * m.flexible / m.n), 'working_pct', round(100.0 * m.working / m.n),
      'student_pct', round(100.0 * m.student / m.n), 'genz_pct', round(100.0 * m.gz / m.n),
      'millennial_pct', round(100.0 * m.gm / m.n), 'genx_pct', round(100.0 * m.gg / m.n),
      'nosmoke_pct', round(100.0 * m.nosmoke / m.n), 'veg_pct', round(100.0 * m.veg / m.n),
      'early_pct', round(100.0 * m.early / m.n), 'night_pct', round(100.0 * m.night / m.n),
      'out_pct', round(100.0 * m.out_all_day / m.n)) end,
    'anywhere', (select count(*) from s where jsonb_array_length(s.areas) = 0),
    'areas', (select coalesce(jsonb_agg(jsonb_build_object('area', x.area, 'n', x.n) order by x.n desc, x.area), '[]'::jsonb)
              from (select a as area, count(*) as n from s, jsonb_array_elements_text(s.areas) a
                    group by a having count(*) >= 2 order by count(*) desc, a limit 8) x))
  from n, m;
$$;

-- Where a new account came from, saved on its first sign-in (accounts made in the last day only).
-- Returns true that once, so the app reports the sign-up to the ad platforms exactly once.
create or replace function public.fm_set_attribution(p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_me fm_profiles%rowtype; v jsonb := '{}'::jsonb; k text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_me from fm_profiles where id = auth.uid() for update;
  if v_me.id is null or v_me.attribution is not null or v_me.created_at < now() - interval '1 day' then return false; end if;
  foreach k in array array['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','referrer','landing','first_at'] loop
    if jsonb_typeof(p->k) = 'string' and length(p->>k) > 0 then v := v || jsonb_build_object(k, left(p->>k, 200)); end if;
  end loop;
  update fm_profiles set attribution = v || jsonb_build_object('signed_up_at', now()) where id = auth.uid();
  return true;
end $$;

-- Ad results for the team, by source and campaign (not callable from the app). In the SQL editor:
--   select * from fm_source_report(30);
-- Sign-ups in the last p_days days and what they did since. "unknown" is accounts made before
-- tracking; "direct" came with no tags; gclid / fbclid without utm tags count as google / meta.
create or replace function public.fm_source_report(p_days int default 30)
returns table (source text, campaign text, signups bigint, seekers bigint, owners bigint, hosts_with_room bigint,
               rooms_listed bigint, requests_sent bigint, passes_bought bigint, paid_rupees_incl_gst numeric)
language sql security definer set search_path = public stable as $$
  with u as (
    select p.role,
           case when p.attribution is null then 'unknown'
                when nullif(p.attribution->>'utm_source', '') is not null then lower(p.attribution->>'utm_source')
                when p.attribution ? 'gclid' then 'google' when p.attribution ? 'fbclid' then 'meta'
                when p.attribution ? 'referrer' then 'site:' || (p.attribution->>'referrer') else 'direct' end as source,
           coalesce(nullif(p.attribution->>'utm_campaign', ''), '-') as campaign,
           (select count(*) from fm_listings l where l.owner_id = p.id) as rooms,
           (select count(*) from fm_requests r where r.seeker_id = p.id and coalesce(r.initiated_by, 'seeker') = 'seeker') as reqs,
           (select count(*) from fm_orders o where o.user_id = p.id and o.status = 'paid') as orders,
           (select coalesce(sum(o.amount_paise), 0) from fm_orders o where o.user_id = p.id and o.status = 'paid') as paise
    from fm_profiles p
    where not p.sample and p.created_at > now() - make_interval(days => greatest(p_days, 1))
  )
  select source, campaign, count(*), count(*) filter (where role = 'seeker'), count(*) filter (where role = 'owner'),
         count(*) filter (where rooms > 0), sum(rooms)::bigint, sum(reqs)::bigint, sum(orders)::bigint, round(sum(paise) / 100.0, 2)
  from u group by 1, 2 order by 3 desc, 1, 2;
$$;

-- ------------------------------------------------------------ sign-in codes --
-- Every sign-in code goes through fm_otp_request first. It keeps the abuse limits (one code a minute per
-- number, 5 an hour per number, 40 an hour per network address) and records the channel the person
-- picked: WhatsApp unless they chose SMS. fm-send-otp (Supabase's Send SMS hook) reads it to know how to
-- send, and sends nothing for a number with no request in the last 10 minutes, so calling Supabase's
-- sign-in API directly can't run up the bill.
create table if not exists public.fm_otp_requests (
  id         bigint generated always as identity primary key,
  phone      text not null,                                        -- 10 digits
  channel    text not null check (channel in ('whatsapp', 'sms')),
  ip         text,
  created_at timestamptz not null default now()
);
create index if not exists fm_otp_requests_phone on public.fm_otp_requests (phone, created_at desc);
create index if not exists fm_otp_requests_ip on public.fm_otp_requests (ip, created_at desc);
alter table public.fm_otp_requests enable row level security;
revoke all on public.fm_otp_requests from anon, authenticated;

-- Wrong test-login codes (fm-login), so the private test code can't be guessed: 5 wrong tries an hour per
-- number, 10 per network address and 30 in all; then test login waits. Only fm-login (service role) uses it.
create table if not exists public.fm_login_fails (
  id         bigint generated always as identity primary key,
  phone      text not null,
  ip         text,
  created_at timestamptz not null default now()
);
create index if not exists fm_login_fails_time on public.fm_login_fails (created_at desc);
alter table public.fm_login_fails enable row level security;
revoke all on public.fm_login_fails from anon, authenticated;

-- The private test code, scrambled (bcrypt), so it's in no file and nobody can read it back. Only the
-- server (fm-login, service role) can read the table or ask fm_test_code_ok whether a code matches.
-- Set or change it (SQL editor):
--   insert into public.fm_secrets (name, hash) values ('test_login_code', extensions.crypt('NEWCODE', extensions.gen_salt('bf')))
--   on conflict (name) do update set hash = excluded.hash, updated_at = now();
create table if not exists public.fm_secrets (
  name       text primary key,
  hash       text not null,
  updated_at timestamptz not null default now()
);
alter table public.fm_secrets enable row level security;
revoke all on public.fm_secrets from anon, authenticated;

-- null when no code is set (test login off); otherwise whether p_code is the code.
create or replace function public.fm_test_code_ok(p_code text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select case when s.hash is null then null
              else coalesce(p_code, '') ~ '^[0-9]{6}$' and s.hash = crypt(p_code, s.hash) end
  from (select (select hash from fm_secrets where name = 'test_login_code') as hash) s
$$;

-- The sign-in card's "I am 18 or older" tick travels with every code request; without it no code is sent
-- (fm-send-otp only sends to numbers with a request here, and fm-login only signs in such a number).
drop function if exists public.fm_otp_request(text, text);
create or replace function public.fm_otp_request(p_phone text, p_channel text, p_adult boolean default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
  v_ip text := nullif(fm_client_ip(), 'unknown');
  v_last timestamptz; v_hour int; v_ip_hour int;
begin
  if v_phone !~ '^[6-9][0-9]{9}$' then return jsonb_build_object('error', 'bad-phone'); end if;
  if p_channel is null or p_channel not in ('whatsapp', 'sms') then return jsonb_build_object('error', 'bad-channel'); end if;
  if p_adult is not true then return jsonb_build_object('error', 'age-required'); end if;
  select max(created_at), count(*) into v_last, v_hour from fm_otp_requests where phone = v_phone and created_at > now() - interval '1 hour';
  if v_last > now() - interval '60 seconds' then
    return jsonb_build_object('error', 'too-soon', 'wait', ceil(extract(epoch from v_last + interval '60 seconds' - now()))::int);
  end if;
  if v_hour >= 5 then return jsonb_build_object('error', 'too-many'); end if;
  if v_ip is not null then
    select count(*) into v_ip_hour from fm_otp_requests where ip = v_ip and created_at > now() - interval '1 hour';
    if v_ip_hour >= 40 then return jsonb_build_object('error', 'too-many'); end if;
  end if;
  delete from fm_otp_requests where created_at < now() - interval '2 days';
  insert into fm_otp_requests (phone, channel, ip) values (v_phone, p_channel, v_ip);
  return jsonb_build_object('ok', true);
end $$;

-- The signed-in person confirms they are 18 or older: kept once, with the first time they said so.
create or replace function public.fm_confirm_adult() returns timestamptz
language sql security definer set search_path = public as $$
  update fm_profiles set adult_at = coalesce(adult_at, now()) where id = auth.uid() returning adult_at;
$$;
revoke all on function public.fm_confirm_adult() from public, anon;
grant execute on function public.fm_confirm_adult() to authenticated;

-- --------------------------------------------------------------- ad spend --
-- What each ad channel cost, for the team's ads dashboard (cost per sign-up and per room listed).
-- One row per channel and campaign, per day or per week, copied from Meta Ads Manager or Google
-- Ads: in the Supabase Table Editor, or ask Claude. `campaign` is the same name as the link's
-- utm_campaign tag. Only the team reads it: no app user can.
create table if not exists public.fm_ad_spend (
  id         uuid primary key default gen_random_uuid(),
  day        date not null,
  channel    text not null check (channel in ('Google Ads', 'Facebook ads', 'Instagram ads', 'Other ads')),
  campaign   text not null default '-',
  amount     numeric(12,2) not null check (amount >= 0),   -- rupees, as billed
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists fm_ad_spend_day on public.fm_ad_spend (day);
alter table public.fm_ad_spend enable row level security;
revoke all on public.fm_ad_spend from anon, authenticated;

-- ------------------------------------------------------ deleting an account --
-- Account -> Delete my account. Everything tied to the account goes with it: profile, listings and their
-- private details, requests, invites, visits, saves, tribe links, FlatMart items and offers, passes,
-- push tokens and reports (all "on delete cascade" from auth.users). Payment records stay without the
-- person (tax law). Flatsplits groups stay for their other members as the record of who paid what,
-- under the name and number they added; the person's UPI ID is removed from them. The app deletes
-- the account's photos (its own storage folder) first.
create or replace function public.fm_delete_account() returns void
language plpgsql security definer set search_path = public as $$
declare v_phone text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  v_phone := fm_my_phone();
  if v_phone <> '' then update fm_split_members set upi = null where phone = v_phone; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- --------------------------------------------------------------- security --
-- One listing, and my own, without fishing them out of a search (counted like searches are).
drop function if exists public.fm_listing_get(uuid);
create or replace function public.fm_listing_get(p_id uuid)
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], room jsonb, household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint, request_status text, bachelors boolean, status text, geo jsonb,
  featured boolean, reply_hours numeric, owner_active_at timestamptz, owner_verified boolean)
language sql security definer set search_path = public as $$
  select fm_throttle('listing', 300, 2000);
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.room, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_requests r where r.listing_id = l.id),
         mine.status, l.bachelors, l.status, l.geo, coalesce(l.featured_until > now(), false), fm_reply_hours(l.owner_id),
         (select o.active_at from fm_profiles o where o.id = l.owner_id),
         (select o.phone_verified_at is not null from fm_profiles o where o.id = l.owner_id)
  from fm_listings l
  left join fm_requests mine on mine.listing_id = l.id and mine.seeker_id = auth.uid()
  where auth.uid() is not null and l.id = p_id and (l.status = 'active' or l.owner_id = auth.uid());
$$;

-- How many times a listing was opened by someone other than its owner (the app counts each opening
-- once per sitting), for the owner's numbers on My flat.
alter table public.fm_listings add column if not exists views int not null default 0;
create or replace function public.fm_listing_seen(p_listing uuid) returns void
language sql security definer set search_path = public as $$
  select fm_throttle('seen', 300, 2000);
  update fm_listings set views = views + 1
   where id = p_listing and status = 'active' and auth.uid() is not null and owner_id <> auth.uid();
$$;

-- My listings (whatever their status) and the homes whose owners accepted me (while they're up).
-- For my own: how many people opened and saved them.
drop function if exists public.fm_my_listings();
create or replace function public.fm_my_listings()
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], room jsonb, household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint, request_status text, bachelors boolean, status text, geo jsonb,
  featured boolean, views int, saves bigint, reply_hours numeric)
language sql stable security definer set search_path = public as $$
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.room, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_requests r where r.listing_id = l.id),
         mine.status, l.bachelors, l.status, l.geo, coalesce(l.featured_until > now(), false),
         case when l.owner_id = auth.uid() then l.views end,
         case when l.owner_id = auth.uid() then (select count(*) from fm_saves s where s.listing_id = l.id) end,
         fm_reply_hours(l.owner_id)
  from fm_listings l
  left join fm_requests mine on mine.listing_id = l.id and mine.seeker_id = auth.uid()
  where l.owner_id = auth.uid()
     or (l.status = 'active' and exists (select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()))
  order by l.created_at desc
  limit 200;
$$;

-- Visits: the ones I asked for, and the ones asked for on my listings.
create or replace function public.fm_my_visits() returns setof public.fm_visits
language sql stable security definer set search_path = public as $$
  select v.* from fm_visits v where v.seeker_id = auth.uid() order by v.visit_at limit 200;
$$;
create or replace function public.fm_incoming_visits() returns setof public.fm_visits
language sql stable security definer set search_path = public as $$
  select v.* from fm_visits v join fm_listings l on l.id = v.listing_id
  where l.owner_id = auth.uid() and v.seeker_id <> auth.uid() order by v.visit_at limit 200;
$$;

-- Mark as rented, or reopen. A listing taken down after a broker report stays down.
create or replace function public.fm_set_listing_status(p_listing uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('active', 'closed') then raise exception 'bad-status'; end if;
  update fm_listings set status = p_status where id = p_listing and owner_id = auth.uid() and status <> 'delisted';
  if not found then raise exception 'not-found'; end if;
end $$;

-- Change a listing's public details: the room, the photos, the household. The private part (name,
-- phone, address) stays as posted. A new map pin replaces the old one (p_geo is the rounded public
-- spot, p_pin the exact one for people the owner accepts); without one the pins are kept. A listing
-- taken down after a broker report can't be edited. Same limits as fm_post_listing.
drop function if exists public.fm_update_listing(uuid, text, text, text, text, int, int, int, date, text, text, text[], text, text[], jsonb, jsonb, boolean, jsonb, jsonb);   -- room details added
create or replace function public.fm_update_listing(
  p_listing uuid, p_kind text, p_title text, p_city text, p_locality text, p_bhk int,
  p_rent int, p_deposit int, p_available_from date, p_gender text,
  p_furnishing text, p_amenities text[], p_description text, p_photos text[] default '{}',
  p_household jsonb default '{}', p_costs jsonb default '{}', p_bachelors boolean default true,
  p_geo jsonb default null, p_pin jsonb default null, p_room jsonb default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_photo text; v_geo jsonb;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if not exists (select 1 from fm_listings where id = p_listing and owner_id = auth.uid() and status <> 'delisted') then
    raise exception 'not-found';
  end if;
  perform fm_throttle('edit', 30, 100);
  if coalesce(array_length(p_photos, 1), 0) > 6 then raise exception 'too-many-photos'; end if;
  if char_length(coalesce(p_city, '')) not between 2 and 60 or char_length(coalesce(p_locality, '')) not between 2 and 80
     or char_length(coalesce(p_description, '')) > 1500 or coalesce(array_length(p_amenities, 1), 0) > 30
     or exists (select 1 from unnest(coalesce(p_amenities, '{}')) a where char_length(a) > 40) then
    raise exception 'too-long';
  end if;
  if jsonb_typeof(coalesce(p_household, '{}')) <> 'object' or pg_column_size(p_household) > 4096
     or jsonb_typeof(coalesce(p_costs, '{}')) <> 'object' or pg_column_size(p_costs) > 1024 then
    raise exception 'bad-details';
  end if;
  if p_geo is not null then
    if jsonb_typeof(p_geo->'lat') <> 'number' or jsonb_typeof(p_geo->'lng') <> 'number'
       or (p_geo->>'lat')::numeric not between 6 and 37 or (p_geo->>'lng')::numeric not between 68 and 98 then
      raise exception 'bad-location';
    end if;
    v_geo := jsonb_build_object('lat', round((p_geo->>'lat')::numeric, 2), 'lng', round((p_geo->>'lng')::numeric, 2));
  end if;
  if p_pin is not null and (jsonb_typeof(p_pin->'lat') <> 'number' or jsonb_typeof(p_pin->'lng') <> 'number'
     or (p_pin->>'lat')::numeric not between 6 and 37 or (p_pin->>'lng')::numeric not between 68 and 98) then
    raise exception 'bad-location';
  end if;
  foreach v_photo in array coalesce(p_photos, '{}') loop
    if position('/storage/v1/object/public/fm-photos/' || auth.uid()::text || '/' in v_photo) = 0 then
      raise exception 'bad-photo-url';
    end if;
  end loop;
  update fm_listings set kind = p_kind, title = p_title, city = p_city, locality = p_locality, bhk = p_bhk,
         rent = p_rent, deposit = coalesce(p_deposit, 0), available_from = coalesce(p_available_from, available_from),
         gender = p_gender, furnishing = p_furnishing, amenities = coalesce(p_amenities, '{}'),
         description = coalesce(p_description, ''), photos = coalesce(p_photos, '{}'),
         household = coalesce(p_household, '{}'), costs = coalesce(p_costs, '{}'),
         bachelors = coalesce(p_bachelors, true), geo = coalesce(v_geo, geo), room = fm_clean_room(p_kind, p_room)
   where id = p_listing and owner_id = auth.uid() and status <> 'delisted';
  if not found then raise exception 'not-found'; end if;
  if p_pin is not null then
    update fm_listing_private set address_parts = coalesce(address_parts, '{}')
       || jsonb_build_object('lat', (p_pin->>'lat')::numeric, 'lng', (p_pin->>'lng')::numeric)
     where listing_id = p_listing;
  end if;
end $$;

-- Text people type can't carry HTML: < and > become ‹ and › before anything is saved, so a name, title,
-- message or note can never turn into a script on someone else's screen (the app escapes text as well).
create or replace function public.fm_clean_json(j jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare r jsonb;
begin
  case jsonb_typeof(j)
    when 'string' then return to_jsonb(translate(j #>> '{}', '<>', '‹›'));
    when 'array' then
      select coalesce(jsonb_agg(fm_clean_json(e) order by i), '[]'::jsonb) into r from jsonb_array_elements(j) with ordinality x(e, i);
      return r;
    when 'object' then
      select coalesce(jsonb_object_agg(translate(k, '<>', '‹›'), fm_clean_json(v)), '{}'::jsonb) into r from jsonb_each(j) x(k, v);
      return r;
    else return j;
  end case;
end $$;
create or replace function public.fm_clean_row() returns trigger
language plpgsql set search_path = public as $$
declare j jsonb := to_jsonb(new);
begin
  if j::text !~ '[<>]' then return new; end if;
  return jsonb_populate_record(new, fm_clean_json(j));
end $$;
do $$ declare t text;
begin
  foreach t in array array['fm_profiles', 'fm_listings', 'fm_listing_private', 'fm_requests', 'fm_visits', 'fm_reports',
                           'fm_market_items', 'fm_market_offers', 'fm_market_sales', 'fm_parties', 'fm_party_rsvps',
                           'fm_split_groups', 'fm_split_members', 'fm_split_expenses', 'fm_split_bills', 'fm_tickets'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_clean', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.fm_clean_row()', t || '_clean', t);
  end loop;
end $$;

-- A name is set once, at sign-up, and then stays: fm_set_profile won't change it and neither will anything
-- else. Deleting the account and signing up again is the only way to pick a new one. The team can still
-- correct a name, in one transaction in the SQL editor:
--   select set_config('fm.name_change', 'allow', true); update fm_profiles set full_name = '...' where ...;
create or replace function public.fm_name_lock() returns trigger
language plpgsql set search_path = public as $$
begin
  if coalesce(old.full_name, '') <> '' and new.full_name is distinct from old.full_name
     and coalesce(current_setting('fm.name_change', true), '') <> 'allow' then
    new.full_name := old.full_name;
  end if;
  return new;
end $$;
drop trigger if exists fm_profiles_name_lock on public.fm_profiles;
create trigger fm_profiles_name_lock before update on public.fm_profiles for each row execute function public.fm_name_lock();

-- No table is read or changed directly through the API, signed in or not: only through the fm_ functions.
-- Tables added later start out the same way.
do $$ declare t record;
begin
  for t in select c.oid::regclass as rel from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f') and c.relname like 'fm\_%' loop
    execute format('revoke all on %s from anon, authenticated', t.rel);
  end loop;
end $$;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- The API doesn't hand out a list of its functions and tables (PostgREST's OpenAPI description).
do $$ begin
  execute 'alter role authenticator set pgrst.openapi_mode to ''disabled''';
  perform pg_notify('pgrst', 'reload config');
exception when others then raise notice 'API description left on: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------- on hold --
-- The whole app on hold ("Coming soon"): while fm_settings.on_hold is on, PostgREST refuses every request
-- from the app, signed in or not, with 'on-hold' before it reaches any function (fm_pre_request), and the
-- app shows only its Coming soon screen. The server side (service role: payments, notifications, test
-- sign-in's own checks) carries on. Steps to hold and to lift it, website included: README, "On hold".
alter table public.fm_settings add column if not exists on_hold boolean not null default false;
-- Private preview: numbers in fm_settings.hold_allow get in while everything else waits (README, "On hold").
-- fm_on_hold answers for the caller: true unless the signed-in number (from the token's claims) is on the list.
alter table public.fm_settings add column if not exists hold_allow text[] not null default '{}';
create or replace function public.fm_on_hold() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select s.on_hold and not (
            right(regexp_replace(coalesce(j.c -> 'user_metadata' ->> 'phone', j.c ->> 'phone', ''), '[^0-9]', '', 'g'), 10)
            = any (select right(regexp_replace(a, '[^0-9]', '', 'g'), 10) from unnest(s.hold_allow) a where a ~ '[0-9]'))
          from fm_settings s cross join (select nullif(current_setting('request.jwt.claims', true), '')::jsonb as c) j
          limit 1), false)
$$;
-- Runs as the caller's role (anon / authenticated / service_role) before each API request.
create or replace function public.fm_pre_request() returns void
language plpgsql stable set search_path = public as $$
begin
  -- fm_otp_request stays reachable, so a listed number can ask for its sign-in code (fm-login checks the list).
  if current_user in ('anon', 'authenticated') and fm_on_hold()
     and coalesce(current_setting('request.path', true), '') <> '/rpc/fm_otp_request' then
    raise exception 'on-hold' using hint = 'FindMeFlatMate is coming soon.';
  end if;
end $$;
do $$ begin
  execute 'alter role authenticator set pgrst.db_pre_request to ''public.fm_pre_request''';
  perform pg_notify('pgrst', 'reload config');
exception when others then raise notice 'Hold check not switched on: %', sqlerrm;
end $$;

-- ================================================================== AI go-between --
-- A chat between a seeker and a home's lister, from the moment a request is sent until both sides accept
-- (Kamal, 10 Nov; priorities 00000). Each person writes in their own language and the other reads it in theirs;
-- the AI (functions/fm-chat, the only place that holds the API key) relays and translates. It never answers for
-- anyone. Off until Kamal turns it on:  update fm_settings set ai_chat_enabled = true;
-- The model is set here, in one place:   update fm_settings set ai_chat_model = 'claude-haiku-5-5';
alter table public.fm_settings add column if not exists ai_chat_enabled boolean not null default false;
alter table public.fm_settings add column if not exists ai_chat_model text not null default 'claude-opus-5-5';

create or replace function public.fm_chat_on() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select ai_chat_enabled from fm_settings), false);
$$;

-- One chat per request. owner_yes: the lister accepted inside the chat; seeker_share: the seeker then confirmed
-- "Share my number". Numbers are shared only when both are true (fm_chat_share / fm_decide).
create table if not exists public.fm_chats (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null unique references public.fm_requests(id) on delete cascade,
  listing_id   uuid not null references public.fm_listings(id) on delete cascade,
  seeker_id    uuid not null references auth.users(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'open' check (status in ('open','accepted','closed')),
  seeker_lang  text not null default 'en',
  owner_lang   text not null default 'en',
  clashes      jsonb not null default '[]'::jsonb,
  owner_yes    boolean not null default false,
  seeker_share boolean not null default false,
  closed_by    uuid,
  closed_at    timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists fm_chats_seeker on public.fm_chats (seeker_id);
create index if not exists fm_chats_owner on public.fm_chats (owner_id);

-- body: the sender's own words (after the privacy filter); shown: what the other person reads, in their language
-- (after the filter again). Both people may see both ("Show original").
create table if not exists public.fm_chat_messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.fm_chats(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  shown      text not null,
  lang_from  text,
  lang_to    text,
  created_at timestamptz not null default now()
);
create index if not exists fm_chat_messages_chat on public.fm_chat_messages (chat_id, created_at);

-- Notes only the sender sees: what the privacy filter held back, and the private profile check (Truth Check).
create table if not exists public.fm_chat_notes (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.fm_chats(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('held','truth')),
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- Row-level security: only the two people in a chat can read it, and only while it's open (a closed chat shows
-- "This conversation was closed", never the content). Notes: only their owner. Nobody writes directly; every
-- write goes through the functions below.
alter table public.fm_chats enable row level security;
alter table public.fm_chat_messages enable row level security;
alter table public.fm_chat_notes enable row level security;
drop policy if exists fm_chats_parties on public.fm_chats;
create policy fm_chats_parties on public.fm_chats for select to authenticated
  using (auth.uid() in (seeker_id, owner_id));
drop policy if exists fm_chat_messages_parties on public.fm_chat_messages;
create policy fm_chat_messages_parties on public.fm_chat_messages for select to authenticated
  using (exists (select 1 from fm_chats c where c.id = chat_id and auth.uid() in (c.seeker_id, c.owner_id) and c.status <> 'closed'));
drop policy if exists fm_chat_notes_own on public.fm_chat_notes;
create policy fm_chat_notes_own on public.fm_chat_notes for select to authenticated
  using (user_id = auth.uid() and exists (select 1 from fm_chats c where c.id = chat_id and c.status <> 'closed'));
revoke all on public.fm_chats, public.fm_chat_messages, public.fm_chat_notes from anon;
revoke insert, update, delete on public.fm_chats, public.fm_chat_messages, public.fm_chat_notes from authenticated;
grant select on public.fm_chats, public.fm_chat_messages, public.fm_chat_notes to authenticated;

-- 30 days after a chat closes (or is accepted), it and everything in it is deleted. Runs on every chat call, so
-- nothing older survives the next time anyone uses a chat.
create or replace function public.fm_chat_purge() returns void
language sql security definer set search_path = public as $$
  delete from fm_chats where status in ('closed','accepted') and coalesce(closed_at, created_at) < now() - interval '30 days';
$$;

-- ---------------------------------------------------------------- Privacy Shield --
-- Before both people accept, nothing that would let them reach each other off the app gets through: phone
-- numbers in any format (spaced, dashed, +91, written as words: "nine eight seven...", "double five", Hindi
-- "ek do teen"), emails (also "name at gmail dot com"), links, UPI IDs, social handles, flat and house numbers,
-- street addresses and PIN codes, and payment requests. Deterministic, and run on everything stored, whatever
-- the AI did, so no prompt can talk a number through. Returns the filtered text and the kinds held back.
-- The app has the same rules (shieldText in index.html) for demo mode; both are tested on the same examples.
create or replace function public.fm_chat_shield(p_text text) returns jsonb
language plpgsql immutable set search_path = public as $$
declare
  t text := coalesce(p_text, '');
  held text[] := '{}';
  toks text[]; out text[] := '{}'; i int; j int; n int; d int; w text; mult int; run_start int; run_digits int;
  words jsonb := '{"zero":1,"oh":1,"one":1,"two":1,"three":1,"four":1,"five":1,"six":1,"seven":1,"eight":1,"nine":1,
                   "shunya":1,"ek":1,"do":1,"teen":1,"char":1,"chaar":1,"paanch":1,"panch":1,"chhe":1,"cheh":1,"saat":1,"aath":1,"nau":1}';
  before text;
begin
  -- emails, including "at" / "dot" spelled out
  before := t;
  t := regexp_replace(t, '[A-Za-z0-9._%+-]+(\s+dot\s+[A-Za-z0-9_-]+)*\s*(@|\(at\)|\[at\]|\s+at\s+)\s*[A-Za-z0-9-]+(\s*(\.|\(dot\)|\[dot\]|\s+dot\s+)\s*[A-Za-z]{2,})+', '[email hidden]', 'gi');
  if t <> before then held := held || 'email'::text; end if;
  -- UPI IDs (name@bank)
  before := t;
  t := regexp_replace(t, '[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}\M', '[UPI ID hidden]', 'g');
  if t <> before then held := held || 'upi'::text; end if;
  -- links
  before := t;
  t := regexp_replace(t, '(https?://|www\.)\S+|\m[A-Za-z0-9-]+\.(com|in|co|net|org|io|me|app|link|ly|gg|xyz|page)(/\S*)?\M', '[link hidden]', 'gi');
  if t <> before then held := held || 'link'::text; end if;
  -- social handles: @name, or "insta / ig / snap / telegram ... name"
  before := t;
  t := regexp_replace(t, '(^|\s)@[A-Za-z0-9_.]{2,}', '\1[handle hidden]', 'g');
  t := regexp_replace(t, '\m(insta(gram)?|ig|snap(chat)?|telegram|tg|facebook|fb|twitter|x\.com|linkedin|discord)\M(\s*(id|handle|is|me|on|:|-|@))*\s*[A-Za-z0-9_.]{3,}', '\1 [handle hidden]', 'gi');
  if t <> before then held := held || 'social'::text; end if;
  -- payment requests and payment details
  before := t;
  t := regexp_replace(t, '\m(gpay|google\s*pay|phonepe|phone\s*pe|paytm|bhim|ifsc|neft|imps|rtgs|account\s*(no|number)|a/c)\M[^.!?\n]*', '[payment details held back]', 'gi');
  t := regexp_replace(t, '\m(pay|send|transfer|deposit|give)\M(\s+me|\s+us)?[^.!?\n]{0,25}(₹|\mrs\.?|\minr\M|rupees|\d{3,})[^.!?\n]*', '[payment request held back]', 'gi');
  t := regexp_replace(t, '\m(pay|send|transfer|give)\M[^.!?\n]{0,30}\m(token|advance|booking|deposit)\M[^.!?\n]*', '[payment request held back]', 'gi');
  if t <> before then held := held || 'payment'::text; end if;
  -- flat / house numbers and street addresses, PIN codes
  before := t;
  t := regexp_replace(t, '\m(flat|house|h\.?\s*no|door|apt|apartment|room\s*no|plot|block|tower|wing|villa|unit)\M\.?\s*(no\.?|number|num|#)?\s*[:\-]?\s*#?[A-Za-z]?\s*-?\s*\d{1,5}\s*[A-Za-z]?\M', '[address hidden]', 'gi');
  t := regexp_replace(t, '#\s*\d{1,5}[A-Za-z]?', '[address hidden]', 'g');
  t := regexp_replace(t, '\m\d{1,5}[A-Za-z]?\s*,?\s*(\w+\s+){0,3}(road|rd|street|st|lane|ln|cross|main|marg|avenue)\M', '[address hidden]', 'gi');
  t := regexp_replace(t, '\m[1-9]\d{2}\s?\d{3}\M', '[address hidden]', 'g');
  if t <> before then held := held || 'address'::text; end if;
  -- phone numbers: any run of digit-like words (digits with separators, number words, "double"/"triple")
  -- carrying 7 or more digits
  toks := regexp_split_to_array(t, '\s+');
  n := coalesce(array_length(toks, 1), 0); i := 1; before := t;
  while i <= n loop
    run_start := i; run_digits := 0; mult := 1; j := i;
    while j <= n loop
      w := lower(regexp_replace(toks[j], '[^A-Za-z0-9+]', '', 'g'));
      if toks[j] ~ '^[\d+()\-./,]+$' and toks[j] ~ '\d' then d := length(regexp_replace(toks[j], '\D', '', 'g')) * mult; mult := 1;
      elsif words ? w then d := mult; mult := 1;
      elsif w in ('double','triple') then mult := case w when 'double' then 2 else 3 end; d := 0;
      elsif w in ('plus','dash','hyphen','and') and run_digits > 0 then d := 0;
      else exit; end if;
      run_digits := run_digits + d; j := j + 1;
    end loop;
    if run_digits >= 7 then out := out || '[number hidden]'::text; i := j;
    else
      if toks[i] ~ '\d{7,}' or length(regexp_replace(toks[i], '\D', '', 'g')) >= 7 then out := out || '[number hidden]'::text;
      else out := out || toks[i]::text; end if;
      i := i + 1;
    end if;
  end loop;
  t := array_to_string(out, ' ');
  if t <> regexp_replace(before, '\s+', ' ', 'g') then held := held || 'phone'::text; end if;
  return jsonb_build_object('text', trim(t), 'held', to_jsonb(array(select distinct x from unnest(held) x order by 1)));
end $$;

-- ------------------------------------------------------------- Conflict Detector --
-- Where the seeker's answers and the home's household differ (the same twelve questions as the match), plus
-- budget against rent, shown to both people when the chat starts. Each item: key, the seeker's answer, the home's
-- answer (option numbers, as in VIBE_QS), and level 2 (opposite ends) or 1 (one step apart).
create or replace function public.fm_chat_clashes(p_seeker uuid, p_listing uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with p as (select vibe, search from fm_profiles where id = p_seeker),
       l as (select household, rent from fm_listings where id = p_listing),
       k(key, ord) as (values ('smoke',1),('food',2),('pets',3),('drinks',4),('guests',5),('clean',6),('sleep',7),('noise',8),('work',9),('cook',10),('sharing',11),('social',12)),
       v as (
         select k.key, k.ord, (p.vibe->>k.key)::int as a, (l.household->>k.key)::int as b
         from k, p, l
         where jsonb_typeof(p.vibe->k.key) = 'number' and jsonb_typeof(l.household->k.key) = 'number')
  select coalesce(jsonb_agg(x order by (x->>'level')::int desc, (x->>'ord')::int), '[]'::jsonb) from (
    select jsonb_build_object('key', key, 'seeker', a, 'home', b, 'level', abs(a - b), 'ord', ord) x from v where a <> b
    union all
    select jsonb_build_object('key', 'rent', 'seeker', (p.search->>'budget')::int, 'home', l.rent, 'level', 2, 'ord', 0)
    from p, l where (p.search->>'budget') ~ '^\d+$' and (p.search->>'budget')::int > 0 and (p.search->>'budget')::int < l.rent
  ) s;
$$;

-- ------------------------------------------------------------------ Truth Check --
-- When someone writes something that contradicts their own profile answer ("non-smoker", then "I smoke on the
-- balcony"), only they get a quiet prompt to clarify or update their profile. Never shown to the other person.
-- p_profile: the sender's answers (a seeker's vibe, or the home's household for the lister).
create or replace function public.fm_chat_truth(p_profile jsonb, p_text text) returns jsonb
language plpgsql immutable set search_path = public as $$
declare t text := lower(coalesce(p_text, '')); out jsonb := '[]'::jsonb; a int;
begin
  a := (p_profile->>'smoke')::int;
  if a = 0 and t ~ '\m(i|we)\s+(smoke|vape)' and t !~ '\m(i|we)\s+(don''?t|do not|never|no longer|stopped|quit)\s+(smoke|vape|smoking)' then
    out := out || jsonb_build_object('key', 'smoke', 'answer', a); end if;
  a := (p_profile->>'drinks')::int;
  if a = 0 and t ~ '\m(i|we)\s+(drink|like\s+(a\s+)?(beer|wine|whisky|drinks?)|have\s+(a\s+)?(beer|drink|peg))' and t !~ '\m(i|we)\s+(don''?t|do not|never|no longer)\s+drink' then
    out := out || jsonb_build_object('key', 'drinks', 'answer', a); end if;
  a := (p_profile->>'pets')::int;
  if a is not null and a < 2 and t ~ '\m(my|our)\s+(dog|cat|puppy|kitten|pet)\M|\m(i|we)\s+(have|own)\s+(a\s+)?(dog|cat|puppy|kitten|pet)' then
    out := out || jsonb_build_object('key', 'pets', 'answer', a); end if;
  a := (p_profile->>'food')::int;
  if a is not null and a < 2 and t ~ '\m(i|we)\s+(eat|cook|love|order)\s+(chicken|mutton|fish|meat|non-?veg|prawns|beef|pork)' then
    out := out || jsonb_build_object('key', 'food', 'answer', a); end if;
  if a = 0 and t ~ '\m(i|we)\s+(eat|cook|love)\s+eggs?\M' then
    out := out || jsonb_build_object('key', 'food', 'answer', a); end if;
  a := (p_profile->>'guests')::int;
  if a = 0 and t ~ '(friends|guests|people)\s+(stay|come|sleep)\s+(over\s+)?(often|every\s+weekend|all\s+the\s+time|most\s+weekends)' then
    out := out || jsonb_build_object('key', 'guests', 'answer', a); end if;
  return out;
end $$;

-- ---------------------------------------------------------------- the chat itself --
-- Open (or find) the chat for a request. Either person can; only while the request is waiting, the switch is on,
-- and both are 18+. Returns the chat id or an error word.
create or replace function public.fm_chat_open(p_request uuid, p_lang text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r fm_requests%rowtype; v_owner uuid; c fm_chats%rowtype; v_lang text := lower(left(coalesce(nullif(trim(p_lang), ''), 'en'), 8));
begin
  perform fm_chat_purge();
  if not fm_chat_on() then return jsonb_build_object('error', 'off'); end if;
  select * into r from fm_requests where id = p_request;
  select owner_id into v_owner from fm_listings where id = r.listing_id;
  if r.id is null or auth.uid() is null or auth.uid() not in (r.seeker_id, v_owner) then return jsonb_build_object('error', 'not-found'); end if;
  if exists (select 1 from fm_profiles where id in (r.seeker_id, v_owner) and adult_at is null) then return jsonb_build_object('error', 'adults-only'); end if;
  select * into c from fm_chats where request_id = p_request;
  if c.id is null then
    if r.status <> 'pending' then return jsonb_build_object('error', 'not-waiting'); end if;
    insert into fm_chats (request_id, listing_id, seeker_id, owner_id, clashes, seeker_lang, owner_lang)
    values (p_request, r.listing_id, r.seeker_id, v_owner, fm_chat_clashes(r.seeker_id, r.listing_id),
            case when auth.uid() = r.seeker_id then v_lang else 'en' end, case when auth.uid() = v_owner then v_lang else 'en' end)
    on conflict (request_id) do nothing returning * into c;
    if c.id is null then select * into c from fm_chats where request_id = p_request; end if;
  elsif p_lang is not null then
    update fm_chats set seeker_lang = case when auth.uid() = seeker_id then v_lang else seeker_lang end,
                        owner_lang = case when auth.uid() = owner_id then v_lang else owner_lang end where id = c.id;
  end if;
  return jsonb_build_object('chat', c.id, 'status', c.status);
end $$;

-- The chat as one person sees it. Closed: just that, no content (for either person). Messages carry both the
-- other person's own words (body) and what you read (shown); "held" and "truth" notes are yours only.
create or replace function public.fm_chat_get(p_chat uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c fm_chats%rowtype; me uuid := auth.uid(); other uuid;
begin
  perform fm_chat_purge();
  select * into c from fm_chats where id = p_chat and me in (seeker_id, owner_id);
  if c.id is null then return jsonb_build_object('error', 'not-found'); end if;
  other := case when me = c.seeker_id then c.owner_id else c.seeker_id end;
  if c.status = 'closed' then
    return jsonb_build_object('chat', c.id, 'status', 'closed', 'closed_by_me', c.closed_by = me);
  end if;
  return jsonb_build_object(
    'chat', c.id, 'status', c.status, 'role', case when me = c.seeker_id then 'seeker' else 'owner' end,
    'request', c.request_id, 'listing', c.listing_id,
    'my_lang', case when me = c.seeker_id then c.seeker_lang else c.owner_lang end,
    'their_lang', case when me = c.seeker_id then c.owner_lang else c.seeker_lang end,
    'their_name', (select split_part(coalesce(full_name, ''), ' ', 1) from fm_profiles where id = other),
    'clashes', c.clashes, 'owner_yes', c.owner_yes, 'seeker_share', c.seeker_share,
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'mine', m.sender_id = me, 'body', m.body, 'shown', m.shown,
                  'lang_from', m.lang_from, 'lang_to', m.lang_to, 'at', m.created_at) order by m.created_at)
               from fm_chat_messages m where m.chat_id = c.id), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(jsonb_build_object('kind', n.kind, 'data', n.data, 'at', n.created_at) order by n.created_at)
               from fm_chat_notes n where n.chat_id = c.id and n.user_id = me), '[]'::jsonb));
end $$;

-- Send a message. p_body: the sender's own words; p_shown: what the other person will read (the translation the
-- sender saw and approved, or their own words). Both go through the privacy filter again here, whatever came
-- in, and the profile check runs on the sender's words. 60 messages a day per person. Called by functions/fm-chat
-- with the sender's own sign-in, or by the app directly when nothing needs translating.
create or replace function public.fm_chat_post(p_chat uuid, p_body text, p_shown text default null, p_lang_from text default null,
                                               p_lang_to text default null, p_ai_held jsonb default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c fm_chats%rowtype; me uuid := auth.uid(); sb jsonb; ss jsonb; held jsonb; truth jsonb; prof jsonb; mid uuid;
begin
  if not fm_chat_on() then return jsonb_build_object('error', 'off'); end if;
  select * into c from fm_chats where id = p_chat and me in (seeker_id, owner_id) for update;
  if c.id is null then return jsonb_build_object('error', 'not-found'); end if;
  if c.status <> 'open' then return jsonb_build_object('error', c.status); end if;
  if length(trim(coalesce(p_body, ''))) = 0 then return jsonb_build_object('error', 'empty'); end if;
  if length(p_body) > 1000 or length(coalesce(p_shown, '')) > 2000 then return jsonb_build_object('error', 'too-long'); end if;
  perform fm_throttle('chat', 30, 60);
  sb := fm_chat_shield(p_body);
  ss := fm_chat_shield(coalesce(nullif(trim(p_shown), ''), p_body));
  select coalesce(jsonb_agg(distinct x), '[]'::jsonb) into held
    from jsonb_array_elements_text((sb->'held') || (ss->'held') || coalesce(p_ai_held, '[]'::jsonb)) x;
  insert into fm_chat_messages (chat_id, sender_id, body, shown, lang_from, lang_to)
  values (c.id, me, sb->>'text', ss->>'text', left(p_lang_from, 8), left(p_lang_to, 8)) returning id into mid;
  if jsonb_array_length(held) > 0 then
    insert into fm_chat_notes (chat_id, user_id, kind, data) values (c.id, me, 'held', jsonb_build_object('message', mid, 'held', held));
  end if;
  prof := case when me = c.seeker_id then (select vibe from fm_profiles where id = me) else (select household from fm_listings where id = c.listing_id) end;
  truth := fm_chat_truth(prof, p_body);
  if jsonb_array_length(truth) > 0 then
    insert into fm_chat_notes (chat_id, user_id, kind, data) values (c.id, me, 'truth', jsonb_build_object('message', mid, 'items', truth));
  end if;
  return jsonb_build_object('message', mid, 'shown', ss->>'text', 'held', held, 'truth', truth);
end $$;

-- Either person can leave at any time: the chat closes for both, and its content can't be read any more. The
-- seeker leaving also withdraws a waiting request; the lister leaving declines it.
create or replace function public.fm_chat_close(p_chat uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c fm_chats%rowtype; me uuid := auth.uid();
begin
  select * into c from fm_chats where id = p_chat and me in (seeker_id, owner_id) for update;
  if c.id is null then return 'not-found'; end if;
  if c.status = 'closed' then return 'closed'; end if;
  update fm_chats set status = 'closed', closed_by = me, closed_at = now() where id = c.id;
  update fm_requests set status = case when me = c.seeker_id then 'withdrawn' else 'declined' end, decided_at = now(),
         seen_by_seeker = me = c.owner_id, seen_by_owner = me = c.seeker_id
   where id = c.request_id and status = 'pending';
  return 'closed';
end $$;

-- ------------------------------------------------------- Mutual Consent --
-- Numbers and the address are shared only when both have said yes: the seeker's request is their first yes,
-- the lister accepts (fm_decide), and then the seeker confirms "Share my number" here. Until then nothing unlocks.
-- fm_request_approve is the approval itself (contacts used, the unlock, the request marked approved), shared by
-- fm_decide and fm_chat_share; it can't be called from the app.
create or replace function public.fm_request_approve(p_request uuid) returns table (status text, error text)
language plpgsql security definer set search_path = public as $$
declare v_req fm_requests%rowtype; v_credits int; v_charges boolean;
begin
  select * into v_req from fm_requests where id = p_request for update;
  v_charges := (select charges_enabled from fm_settings) and v_req.initiated_by = 'seeker'
               and fm_pass_until(v_req.seeker_id, 'room') is null;
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
  update fm_chats c set status = 'accepted', closed_at = now() where c.request_id = p_request and c.status = 'open';
  return query select 'approved'::text, null::text;
end $$;

create or replace function public.fm_chat_share(p_chat uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c fm_chats%rowtype; r record;
begin
  select * into c from fm_chats where id = p_chat and seeker_id = auth.uid() for update;
  if c.id is null then return jsonb_build_object('error', 'not-found'); end if;
  if c.status <> 'open' then return jsonb_build_object('error', c.status); end if;
  if not c.owner_yes then return jsonb_build_object('error', 'owner-not-yet'); end if;
  update fm_chats set seeker_share = true where id = c.id;
  select * into r from fm_request_approve(c.request_id);
  if r.error is not null then update fm_chats set seeker_share = false where id = c.id; end if;
  return jsonb_build_object('status', r.status, 'error', r.error);
end $$;

-- ------------------------------------------------------- Compatibility Report --
-- The facts the app has actually checked, for the "Verified" lines of the report: the phone confirmed by a
-- delivered code, the Pays on time badge from Flatsplits, the home's photos, and the 18+ confirmation. Everything
-- else in the report (the answers, anything said in the chat) is labelled Self-reported.
create or replace function public.fm_chat_facts(p_chat uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c fm_chats%rowtype; me uuid := auth.uid(); s fm_profiles%rowtype; o fm_profiles%rowtype; l fm_listings%rowtype;
begin
  select * into c from fm_chats where id = p_chat and me in (seeker_id, owner_id) and status <> 'closed';
  if c.id is null then return jsonb_build_object('error', 'not-found'); end if;
  select * into s from fm_profiles where id = c.seeker_id;
  select * into o from fm_profiles where id = c.owner_id;
  select * into l from fm_listings where id = c.listing_id;
  return jsonb_build_object(
    'seeker', jsonb_build_object('name', split_part(coalesce(s.full_name, ''), ' ', 1), 'phone_verified', s.phone_verified_at is not null,
              'adult', s.adult_at is not null, 'on_time', coalesce(s.show_on_time and s.on_time_months >= 3, false), 'vibe', s.vibe),
    'owner', jsonb_build_object('name', split_part(coalesce(o.full_name, ''), ' ', 1), 'phone_verified', o.phone_verified_at is not null,
              'adult', o.adult_at is not null),
    'home', jsonb_build_object('title', l.title, 'photos', coalesce(array_length(l.photos, 1), 0), 'rent', l.rent, 'deposit', l.deposit,
              'household', l.household, 'costs', l.costs),
    'clashes', c.clashes);
end $$;

-- ------------------------------------------------------- function access --
-- Every fm_ function checks auth.uid() itself; on top of that only signed-in users may
-- call them (fm_me, fm_area_demand, fm_otp_request and the party and sale pages also answer signed-out callers,
-- with nothing private; listings need an account).
-- Trigger functions, the payment webhook's fm_credit_order, the Flatsplits helpers, fm_is_sample, the
-- team's fm_source_report and fm-login's fm_test_code_ok can't be called at all.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'fm\_%' loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.proname in ('fm_handle_new_user','fm_request_notify','fm_tribe_notify','fm_credit_order',
                     'fm_my_phone','fm_split_me','fm_split_check','fm_split_net',
                     'fm_is_sample','fm_sample_request','fm_sample_tribe','fm_sample_visit',
                     'fm_pass_until','fm_grant_pass','fm_room_guarantee','fm_referral_reward','fm_source_report',
                     'fm_test_code_ok', 'fm_on_time_months', 'fm_split_cap', 'fm_party_notify', 'fm_ticket_touch', 'fm_ticket_notify', 'fm_listing_fits', 'fm_listing_audience', 'fm_listing_notify',
                     'fm_tribe_members', 'fm_throttle', 'fm_client_ip', 'fm_clean_json', 'fm_clean_row', 'fm_name_lock', 'fm_party_json', 'fm_reply_hours',
                     'fm_seeker_notify', 'fm_seeker_audience', 'fm_market_item_notify', 'fm_market_want_audience',
                     'fm_party_alcohol', 'fm_km', 'fm_india_pin', 'fm_party_taken', 'fm_party_cant_see', 'fm_party_near_json',
                     'fm_party_blocked', 'fm_party_thumbs_up', 'fm_party_ended', 'fm_party_review_list', 'fm_party_clear', 'fm_party_vibe_ok',
                     'fm_party_request_notify', 'fm_listing_fresh',
                     'fm_request_approve', 'fm_chat_purge', 'fm_chat_clashes') then
      execute format('revoke execute on function %s from authenticated', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
grant execute on function public.fm_me() to anon;
grant execute on function public.fm_area_demand(text, text) to anon;
grant execute on function public.fm_otp_request(text, text, boolean) to anon;
grant execute on function public.fm_test_code_ok(text) to service_role;
grant execute on function public.fm_listing_audience(uuid) to service_role;
grant execute on function public.fm_seeker_audience(uuid) to service_role;
grant execute on function public.fm_market_want_audience(uuid) to service_role;
grant execute on function public.fm_party_review_list() to service_role;
grant execute on function public.fm_party_clear(uuid, text) to service_role;
grant execute on function public.fm_market_sale(text) to anon;
grant execute on function public.fm_party_get(text, text) to anon;
grant execute on function public.fm_split_invite(text) to anon;
grant execute on function public.fm_party_rsvp(text, text, text, text, int) to anon;
-- Every API request runs fm_pre_request first, whatever the role, so all three must be able to.
grant execute on function public.fm_pre_request() to anon, authenticated, service_role;
grant execute on function public.fm_on_hold() to anon, authenticated, service_role;
alter function public.fm_match(jsonb, jsonb) set search_path = public;
alter function public.fm_shows_to(text, text) set search_path = public;
alter function public.fm_party_occasions() set search_path = public;
alter function public.fm_party_covers() set search_path = public;
alter function public.fm_party_alcohol(text) set search_path = public;
alter function public.fm_km(double precision, double precision, double precision, double precision) set search_path = public;
alter function public.fm_india_pin(jsonb) set search_path = public;
