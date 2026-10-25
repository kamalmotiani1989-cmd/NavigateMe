-- =====================================================================
-- Navigate Me Flatmates: database schema
-- =====================================================================
-- Business rules this file enforces (in the database, not the browser):
--   * At sign-in everyone picks a role:
--       'owner'  = has a flat, looking for a flatmate -> can post, free
--       'seeker' = looking for a room in a flat       -> pays to unlock
--   * Posting a flat is free (owners only), with up to 6 photos.
--   * The owner's name, phone number and exact address stay hidden.
--     A seeker sees them only after unlocking that listing.
--   * Unlocking a listing costs 1 visit credit. After that it stays
--     unlocked, and the seeker can book visits to it.
--   * Charges can be switched off: fm_settings.charges_enabled = false makes
--     unlocking free (no credits used) and turns off refunds. It starts off.
--   * Unlock-back guarantee: a seeker gets the credit back if the flat was
--     already rented, or the owner hasn't replied 48 hours after the unlock.
--     Once per unlock, at most 2 per pack bought. Two "already rented"
--     reports close the listing.
--   * Credits are sold in packs: 5 unlocks for Rs 500. Only the payment
--     webhook (service_role key) can add credits.
--
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
  kind          text not null check (kind in ('room','flatmate','flat')),
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
-- Shared monthly bills on top of rent: {maintenance, electricity, wifi, help} in rupees.
alter table public.fm_listings add column if not exists costs jsonb not null default '{}';
create index if not exists fm_listings_search on public.fm_listings (status, city, rent);

-- Private part: never readable directly. Released only by fm_contact().
create table if not exists public.fm_listing_private (
  listing_id    uuid primary key references public.fm_listings(id) on delete cascade,
  contact_name  text not null,
  contact_phone text not null,
  address       text not null
);

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

-- One-row app settings. Flip charges on with:
--   update public.fm_settings set charges_enabled = true;
create table if not exists public.fm_settings (
  id boolean primary key default true check (id),
  charges_enabled boolean not null default false
);
insert into public.fm_settings (id) values (true) on conflict (id) do nothing;

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
drop function if exists public.fm_set_name(text);
drop function if exists public.fm_search(text, text, int, text, text);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text);
drop function if exists public.fm_post_listing(text, text, text, text, int, int, int, date,
  text, text, text[], text, text, text, text, text[]);

create or replace function public.fm_me()
returns table (credits int, full_name text, phone text, role text, vibe jsonb)
language sql security definer set search_path = public stable as $$
  select p.credits, p.full_name, p.phone, p.role, p.vibe from fm_profiles p where p.id = auth.uid();
$$;

create or replace function public.fm_set_vibe(p_vibe jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_vibe) <> 'object' or pg_column_size(p_vibe) > 2048 then raise exception 'bad-vibe'; end if;
  update fm_profiles set vibe = p_vibe where id = auth.uid();
end $$;

-- Null arguments leave the current value alone.
create or replace function public.fm_set_profile(p_name text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_role is not null and p_role not in ('owner','seeker') then raise exception 'bad-role'; end if;
  update fm_profiles
     set full_name = coalesce(nullif(left(trim(p_name), 60), ''), full_name),
         role      = coalesce(p_role, role)
   where id = auth.uid();
end $$;

-- Listings with a flag for whether the caller has them unlocked.
create or replace function public.fm_search(
  p_city text default null, p_kind text default null,
  p_max_rent int default null, p_gender text default null, p_q text default null)
returns table (
  id uuid, kind text, title text, city text, locality text, bhk int, rent int,
  deposit int, available_from date, gender text, furnishing text,
  amenities text[], description text, photos text[], household jsonb, costs jsonb, created_at timestamptz,
  is_owner boolean, unlocked boolean, unlock_count bigint,
  unlocked_at timestamptz, refunded boolean)
language sql security definer set search_path = public stable as $$
  select l.id, l.kind, l.title, l.city, l.locality, l.bhk, l.rent, l.deposit,
         l.available_from, l.gender, l.furnishing, l.amenities, l.description,
         l.photos, l.household, l.costs, l.created_at,
         l.owner_id = auth.uid(),
         l.owner_id = auth.uid() or exists (
           select 1 from fm_unlocks u where u.listing_id = l.id and u.user_id = auth.uid()),
         (select count(*) from fm_unlocks u where u.listing_id = l.id),
         mine.created_at, mine.refunded_at is not null
  from fm_listings l
  left join fm_unlocks mine on mine.listing_id = l.id and mine.user_id = auth.uid()
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
  p_household jsonb default '{}', p_costs jsonb default '{}')
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
  insert into fm_listing_private (listing_id, contact_name, contact_phone, address)
  values (v_id, p_contact_name, p_contact_phone, p_address);
  return v_id;
end $$;

-- Spend 1 credit to unlock a listing. Free if already unlocked or own listing.
create or replace function public.fm_unlock(p_listing uuid)
returns table (unlocked boolean, charged boolean, credits int)
language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_credits int; v_role text;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select owner_id into v_owner from fm_listings where id = p_listing and status = 'active';
  if v_owner is null then raise exception 'listing-not-found'; end if;

  select p.credits, p.role into v_credits, v_role from fm_profiles p where p.id = auth.uid() for update;
  if v_owner <> auth.uid() and v_role is distinct from 'seeker' then raise exception 'seekers-only'; end if;

  if v_owner = auth.uid() or exists (
       select 1 from fm_unlocks u where u.user_id = auth.uid() and u.listing_id = p_listing) then
    return query select true, false, v_credits; return;
  end if;

  if not coalesce((select charges_enabled from fm_settings), false) then
    insert into fm_unlocks (user_id, listing_id, charged) values (auth.uid(), p_listing, false);
    return query select true, false, coalesce(v_credits, 0); return;
  end if;

  if coalesce(v_credits, 0) < 1 then
    return query select false, false, coalesce(v_credits, 0); return;
  end if;

  update fm_profiles set credits = fm_profiles.credits - 1 where id = auth.uid();
  insert into fm_unlocks (user_id, listing_id) values (auth.uid(), p_listing);
  return query select true, true, v_credits - 1;
end $$;

-- Unlock-back guarantee. Returns the new balance.
create or replace function public.fm_claim_refund(p_listing uuid, p_reason text)
returns table (refunded boolean, credits int, error text)
language plpgsql security definer set search_path = public as $$
declare v_unlock fm_unlocks%rowtype; v_used int; v_packs int; v_credits int;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if p_reason not in ('rented','no_reply') then raise exception 'bad-reason'; end if;
  select * into v_unlock from fm_unlocks
   where user_id = auth.uid() and listing_id = p_listing for update;
  select p.credits into v_credits from fm_profiles p where p.id = auth.uid() for update;

  if v_unlock.user_id is null then return query select false, v_credits, 'not-unlocked'; return; end if;
  if v_unlock.refunded_at is not null then return query select false, v_credits, 'already-refunded'; return; end if;
  if not v_unlock.charged then return query select false, v_credits, 'was-free'; return; end if;
  if p_reason = 'no_reply' and v_unlock.created_at > now() - interval '48 hours' then
    return query select false, v_credits, 'too-early'; return;
  end if;
  select count(*) into v_used from fm_unlocks where user_id = auth.uid() and refunded_at is not null;
  select count(*) into v_packs from fm_orders where user_id = auth.uid() and status = 'paid';
  if v_used >= 2 * v_packs then return query select false, v_credits, 'limit-reached'; return; end if;

  update fm_unlocks set refunded_at = now(), refund_reason = p_reason
   where user_id = auth.uid() and listing_id = p_listing;
  update fm_profiles set credits = fm_profiles.credits + 1 where id = auth.uid();
  if p_reason = 'rented' and (select count(*) from fm_unlocks
        where listing_id = p_listing and refund_reason = 'rented') >= 2 then
    update fm_listings set status = 'closed' where id = p_listing;
  end if;
  return query select true, v_credits + 1, null::text;
end $$;

-- Owner contact and exact address, only for the owner or an unlocker.
create or replace function public.fm_contact(p_listing uuid)
returns table (contact_name text, contact_phone text, address text)
language sql security definer set search_path = public stable as $$
  select pv.contact_name, pv.contact_phone, pv.address
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
