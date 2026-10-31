# FindMeFlatMate

A flatmate app built around **vibe**: people who live the same way find each other first, and
the room comes second.

## How it flows

1. **Welcome page = sign-in.** A short write-up and the sign-in card, which asks what you came
   for: *post my flat* or *looking for a room*, then their mobile number and a one-time code. Their first name is the first question after sign-in (only asked once per number).
2. **Questions at sign-in, one per screen, required.**
   - Room seekers (19): what they do (working / student / self-employed / between jobs) and
     where, city, the areas they like (pick several), monthly rent budget, 12 living-style
     questions (bedtime, cleanliness, food, cooking, smoking, drinks, guests, noise, time
     together, groceries and chores, weekday routine, pets; smoking, food and pets count double),
     then **music and hobbies** (shown as "you both like", never part of the score).
   - Flat owners (16): how many live there, each flatmate's work or studies and age range, the
     same 12 questions and music/hobbies for the household. The posting form comes prefilled.
3. **Vibe matches.** Discover opens with a "Your vibe matches" row: every home in the city with an
   80%+ match, whatever the area or budget filters say, so a great fit is never missed.
   **Compatibility analysis:** tap the wheel (or "See compatibility analysis") on any home to see
   the score broken down by area of life: daily rhythm, home and chores, lifestyle choices and
   social life. Each of the 12 answers is one bar of a radial chart, with "You" vs "This home" side
   by side and a Same / Close / Different verdict. Owners get the same view for every request.
4. **Welcome gift, on the first request.** Nothing about money on the sign-in page or during
   onboarding. The first time a seeker asks to meet an owner, a gift opens: **5 free contacts**.
5. **Ask to meet, owner approves.** A seeker opens a flat and sends a request: their name, what
   they do, their answers and match %, plus an optional note. The owner gets an in-app
   notification (badge on Requests) and sees the profile with each trait marked as matching or
   clashing. Only when the owner **accepts** do both get each other's number, and the seeker
   gets the address. Declined requests cost nothing.
6. **Contacts are used only on acceptance**, so there are no refunds to manage. A pending request
   holds a contact until the owner replies. After the 5 free ones: **10 contacts for ₹500**.

7. **The Empty Room Escape (owners).** Owners don't have to wait. A tab lists everyone already
   looking for a room in the listing's area (or anywhere in the city), with their first name, what
   they do, budget (and whether it fits the rent) and vibe match, best match first. Filters: budget
   fits, 80%+ vibe, not invited yet. **Invite** sends them the home: the seeker gets a notification,
   sees the photos and details and answers **Yes, let's meet** or **Not for me** in one tap. Yes shares
   numbers and the address both ways and is free for the seeker (no contact used). **Numbers are
   shared only when the seeker accepts.** Seekers can hide themselves in Account
   ("Show me to owners in my areas"). Up to 30 invites per owner per day.

8. **Build your tribe (seekers).** Two people looking in the same city and areas whose vibes
   match **70%+** are suggested to each other, and both get a notification ("Riya could be your
   flatmate · 82% vibe"). The Tribe tab is the build-up page: a live constellation of your matches
   around you (lines light up as people say yes), a 4-step journey (Match → Team up → Bond → Hunt),
   what a tribe could save in your city, and a card per match with budget, areas, the habits you
   share, interests in common and the compatibility analysis. **Team up** is a yes; the other
   person sees "Riya wants to build a tribe with you". **Numbers are shared only when both say
   yes**, with a celebration screen. A bonded tribe sees its joint budget and **Hunt together**:
   whole flats that welcome bachelors, in any of the tribe's areas, with the rent per person. Asking
   to meet a whole flat pre-fills a note saying you're a tribe. A "no" closes the match quietly for
   both. Seekers can hide from tribe matches in Account.
9. **Bachelors welcome.** Owners mark each listing (on by default). Cards show "Bachelors welcome ·
   no brokers", the listing shows it, and Filters has a "Bachelors welcome" option.

10. **Gen Z, millennials and Gen X.** Seekers say which generation they are; owners say which
    generation their household mostly is (both editable later; "none of these" / "mixed" are options).
    The match score is nudged: **the same generation (Gen Z, millennial or Gen X on both sides) gets
    +10 when the score is under 80**, and **two different generations get −10**. It applies
    everywhere a match is shown (homes, requests, invites, tribes) and the compatibility analysis says
    so ("Gen Z + Gen Z: +10 on the score").
    Ages are still captured as brackets (18–24, 25–30, 31–40, 41–45, 46+) but shown as generations
    everywhere: an electric "⚡ GEN Z" badge, a warm "🥑 Millennial" one, or a retro "📻 Gen X", on each
    flatmate, as "⚡ Gen Z household" on home cards, and next to people in requests, Escape and Tribe.
11. **Several numbers on one phone.** Each mobile number keeps its own answers, drafts and shortlist on
    the device, so signing in with a new number always starts from the beginning. In live mode the
    server's copy of a seeker's answers wins; a seeker with no answers on the server is sent through
    the questions (otherwise the server would refuse their requests).

12. **Compromise.** When an owner declines, the seeker can tap **Compromise and ask again**. They see
    only the answers that clash with that household, can switch any of them for **this home only**
    (their profile and every other match stay the same), and watch the score go up live. Sending is
    allowed once per home and only if the score rises. The owner gets "🤝 Ready to compromise ·
    43% → 80%" with each change listed (was → now), and decides again.
13. **Tribes of up to 3.** Each person can bond with at most two others. When a third person bonds
    with one member, the other two get a "complete your tribe" match and must say yes to each other
    before their numbers are shared. A tribe can never go above 3; full tribes are marked.
14. **No brokers.** An owner can list at most **two different addresses** (several rooms in the same
    flat count once), and a contact number can't front for more than two addresses from any account.
    A seeker whose request the owner accepted can **report a broker** from the contact section; the
    listing is delisted straight away and the owner sees why.

15. **Flatsplits (everyone).** Split rent, bills and groceries with the people you live with, like
    Splitwise but built for a flat. Make a group, add flatmates by mobile number (or in one tap from
    your tribe and the people you've connected with), and add an expense: amount, a category (rent,
    groceries, electricity, Wi-Fi, maid, cook…), who paid, and how to split it: **equally** (tick who's in),
    **exact amounts**, or **by shares** (the bigger room pays 2 shares). Amounts are kept to the paisa, so
    ₹100 three ways is ₹33.34 + ₹33.33 + ₹33.33. Every group shows your balance, "Riya owes you ₹1,240",
    and **who pays whom** in the fewest payments. **Settle up** records a payment; if the other person has
    added their UPI ID, **Pay by UPI** opens your UPI app with the amount filled in, and the person you're
    owed can **remind on WhatsApp**. **Monthly bills** (rent, Wi-Fi, the maid) are set once and added
    automatically on that day every month ("Repeats monthly" on any expense does the same). **This month**
    shows spending by category and who paid, against last month. Anyone in the group can delete an
    expense; people can only be removed once they're settled up. New expenses from others show as a badge
    on Splits and a notification. People who aren't on the app yet get a WhatsApp invite, and they see
    the group as soon as they sign in with that number.
16. **FlatMart (everyone).** An OLX for flatmates: buy and sell furniture, beds, appliances, kitchen
    things, electronics, bikes and books with people nearby, so nobody pays full price to furnish a room
    and nobody dumps a fridge when they move out. Post in a minute: up to 4 photos, category, condition,
    price (or **give it away free**), "open to offers", area, and an optional **moving out by** date.
    Browse by city, category, free stuff or saved (♥) items, search, and sort by newest, price or your areas.
    Buyers **make an offer** (full price, −10% or −20% in one tap, plus a note). Same privacy rule as rooms:
    **numbers are shared only when the seller accepts**, then both get Call and WhatsApp; the item is marked
    reserved, then sold. Sellers can **drop the price**, which moves the item back to the top. Offers have
    their own tab and badge, with a notification for every new offer, acceptance or decline.
    Discover and My flat show a shortcut to both ("You get back ₹1,240", "8 new things for sale near you this week").
    On phones the bottom bar now has six tabs, and Account moved to the avatar at the top right.

17. **Search together as a tribe.** The ♥ shortlist is saved to the server and shared inside a tribe (up to 3
    people). When anyone in the tribe taps ♥, the others see it in Saved under "Shortlisted by Riya", on the
    home's card ("♥ Riya shortlisted this") and in "Your tribe's shortlist" on the Tribe tab, and get a
    notification. **Search together** sets Discover to every tribe member's areas at once.
18. **PAN India.** City pickers list the 10 big cities first, then 45 more under "Other cities", and "Another
    city…" takes any name. Onboarding has an "Other city" option. Areas aren't limited to the built-in lists:
    "+ Add area" (Discover and onboarding) and the area boxes on the post and FlatMart forms search any
    neighbourhood through OpenStreetMap.
19. **Maps with a precise pin.** Owners tap **📍 Pin it on the map** and drag the pin onto their building
    (or search, tap the map, or use "I'm there now"). The exact pin is private: people the owner accepts get
    it with directions in Google Maps. Everyone else sees a circle about a kilometre wide around a rounded
    location. Maps use OpenStreetMap with Leaflet, bundled in `vendor/leaflet` (no API key).
20. **Back button.** The phone's back button closes an open listing or panel first, and on phones the close
    button is a back arrow at the top left.
21. **Vibe Card (flatmate type).** The 12 living-style answers become a type to share: a rhythm from the
    bedtime answer (Early Bird, Midnight or Night Owl) plus the most distinctive habit (Pet Parent, Chef, Host,
    Neat Freak, Bookworm, Social Butterfly, Homebody, Foodie, Introvert, Free Spirit, Go-Getter or All-Rounder),
    e.g. **🦉🍳 The Night Owl Chef**. The card is a story-sized image (1080 × 1920) with the type, a line about
    how they live, six habits and, for a seeker with a city, how many homes there match 80%+.
    - **Share:** Android's share sheet in the app (WhatsApp, Instagram...), the phone's share sheet on the
      website, or download + WhatsApp + copy link on a computer. The link is the website with
      `?vibe=<answers>&n=<first name>`: the 12 answers and the generation, nothing else.
    - **The friend's side:** the website shows "Neha is The Night Owl Chef" and a **1-minute quiz** that needs
      no sign-up (the 12 questions, the generation and an optional first name). The result is their own card
      plus "You and Neha: 87% match", the answers they share and the full compatibility view. "Find
      flatmates who match me" goes to sign-up, which then skips the questions already answered.
    - **In the app:** the end of a seeker's sign-up reveals their type, Discover shows it once (until they
      share or hide it), "How you live" on Account shows it, and **My Vibe Card** in Account settings opens
      it (owners take the quiz for themselves). A signed-in seeker who opens a friend's link sees the match
      straight away.

Demo mode has **100 sample homes**: 12–13 in each of the 8 cities, one per neighbourhood, with
realistic rents, flatmates, interests and per-room expenses (addresses are made up). The other side is simulated: sample owners reply about 6 seconds after a request
(they accept a match of 60% or more), and a sample seeker asks to meet a flat about 8 seconds
after you post it. Sample seekers (24 per city) answer an owner's invite after a few seconds: yes to a
strong match, no to a weak one, and no reply in between. Build your tribe: up to 6 sample seekers who
match your vibe 70%+ appear about 5 seconds after onboarding; a third of them say yes first, and the
rest answer your yes within seconds (yes to a 74%+ match). Two sample owners also invite a new seeker about 12 seconds after onboarding. Flatsplits has a "try it with a sample
flat" button (two flatmates and a month of expenses; one of them adds another expense 15 seconds later), and FlatMart has
80 sample things for sale across the cities. Sample sellers accept an offer of 80% of the price or more after about
6 seconds, and a sample buyer makes an offer about 8 seconds after you post something.

## Notifications and urgency

- **Owner:** a notification the moment someone asks to meet ("Riya wants to meet you · 92% match").
- **Seeker, when accepted:** "Asha said yes! Call now", with how many others asked about the home.
  An orange **Call now, before it's rented out** card stays at the top of Discover and Requests
  until they tap Call, WhatsApp or "I've called". If they haven't called after 2 hours (1 minute
  in demo mode) they get a "Don't lose this room" reminder.
- **Seeker, when declined:** a gentle "Not this time", pointing back to their other matches.

How they're delivered:
- **App open or in the background:** system notifications straight away, in the Android app
  (native, Android 13+ asks for permission) and in browsers that allow notifications.
- **App fully closed:** Firebase Cloud Messaging. This needs a one-time setup, see
  "Push notifications" under Go live. Until then the Android app builds and works without it.

## Search and filters

City, then **any number of areas** as chips (set during onboarding, changeable any time), plus a
**Filters** panel: budget band or exact min/max (all-in), room type, who it's open to,
furnishing, move-in date, must-have amenities, house rules (veg-only kitchen, no smoking, no
alcohol, pet-friendly) and minimum match. It shows a live count ("Show 7 homes"), active
filters appear as removable chips, and everything is remembered. When nothing matches, the app
suggests the single change that brings most homes back ("Remove “No smoking” (6)").

## What makes it different

- **Vibe match.** Seekers answer 12 living-style questions. Owners describe their household with the same questions,
  plus who lives there. Every flat shows a match %, what fits and what might clash, and seekers
  can sort by best match.
- **Private room, shared room or whole flat.** Shared rooms (twin sharing) are a listing type of
  their own, and seekers can filter for them.
- **Rent is just rent.** Expenses are listed per room and never added into it: the owner ticks
  what applies (maintenance, electricity, water, Wi-Fi, cooking gas, cook, maid, parking) and
  enters the room's amount, or "as per use" for electricity, water and gas. Cards show
  "₹14,000/month rent · + ₹1,500 expenses". Budgets, filters and sorting use rent only.
- **Proper address + Google Maps.** Flat/house no., building, street, area, landmark, city and
  PIN code (checked). Owners can preview the pin on Google Maps before publishing. Seekers see
  the area on a map; the exact address, map and directions appear once the owner accepts.
- **Save before you spend.** A free ♥ shortlist, so seekers decide which owners to ask.
- **Owners choose who they meet.** Numbers are only shared after the owner accepts a request.
- **Illustrated rooms.** Listings without photos get a drawn room in place of a blank tile.

## Pricing

Prices exclude GST: 18% is added at checkout (`fm_settings.gst_percent`), and the Plans screen shows
both, e.g. ₹500 + ₹90 GST = ₹590. Plans are one-time passes, not auto-renewing subscriptions.

| Who | What | Price |
|---|---|---|
| Owner | Post listings with photos and flatmates | Free |
| Owner | The Empty Room Escape: the first invite for each listing | Free |
| Owner | **Escape Pass**: invite as many people as you like for 7 days | ₹500 + GST |
| Owner | **Featured listing**: first in its area for 7 days (built, switched off for now) | ₹199 + GST |
| Seeker | Browse, vibe matches, rent and expenses, Vibe Card, Flatsplits, FlatMart | Free |
| Seeker | Welcome gift: 5 contacts, each used only when an owner accepts | Free |
| Seeker | **Room Pass**: 30 days of unlimited requests; accepted requests don't use contacts. If no owner accepts in those 30 days, 15 more days free (once) | ₹500 + GST |
| Seeker | **Tribe Pass**: 7 days to send tribe requests. Accepting one is always free, so one pass makes the tribe | ₹500 + GST |
| Seeker | **Premium**: 60 days of Room Pass + 14 days of Tribe Pass | ₹1,500 + GST |
| Everyone | **Referrals**: every 2 friends who sign up with your link (`?r=<code>`) and finish their profile (a seeker's 12 answers, or an owner's first listing) earn 1 contact, up to 5 | Free |

The rules live in the database (`fm_request`, `fm_decide`, `fm_tribe_answer`, `fm_invite`,
`fm_set_referrer`), so the app can't be tricked past them. Prices and what each plan gives are rows in
`fm_plans` (e.g. `update fm_plans set base_paise = 60000 where id = 'room30';`; switch Featured on with
`update fm_plans set enabled = true where id = 'featured7';`). The free invites per listing and the
Room Pass extension are `fm_settings.free_invites` and `fm_settings.guarantee_days`.

**Where people see passes:** a **Passes** tab in the bottom bar (top bar on a computer) until any pass
is bought; after that the tab goes and the passes, with days left, sit at the top of Account. Until
then, now and then (at most once a day; every minute in demo mode) a gentle nudge arrives as a
notification and a card on Discover / My flat, benefit-first ("7 homes in Pune match your vibe",
"An empty room costs rent every day") and opening Passes. Nudges stop for good once a pass is on.

**Everything free for a while:** `update fm_settings set charges_enabled = false;` The app reads it
(through `fm_me`): paywalls and nudges disappear, and Passes says "free while we test" with
"Coming soon" buttons.

**Payments (Razorpay):** `supabase/functions/fm-pay` creates the order for a plan (price + GST), checks
the payment signature and grants the plan (`fm_credit_order`; the webhook is a backstop). It needs
three secrets under Supabase → Edge Functions → Secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET`. For testing, use Razorpay's **Test Mode** keys (Dashboard → Test Mode →
Account & Settings → API Keys) and its test cards or UPI `success@razorpay`; no money moves. Until
the keys are set, buying shows "Payments aren't switched on yet". GST can only be charged once the
business is GST-registered; invoices need the GSTIN.

## Files

- `index.html`: the whole app (onboarding, browse, requests, approvals, post, pay, visits). No build step.
- `supabase/schema.sql`: tables, row-level security and RPCs (including `fm_split_*` for Flatsplits and `fm_market_*` for FlatMart). Requests, approvals, contacts and
  the match score are enforced here, so a number or address never reaches someone who wasn't accepted.
- `supabase/functions/fm-pay/index.ts`: Razorpay order creation, payment verification and webhook.
- `supabase/functions/fm-notify/index.ts`: sends push notifications through Firebase when a request
  is made, accepted or declined (called by a database trigger).
- `manifest.webmanifest`, `sw.js`, `icons/`: make it installable as a phone app (PWA) that also opens offline.

## Run it locally

```
cd flatmates
python3 -m http.server 8080
```

Open http://localhost:8080. On a phone on the same Wi-Fi, open `http://<your-computer-ip>:8080`.
With no config it runs in **demo mode**: sample listings, OTP shown on screen, no real payment,
data (including photos) stored in that browser.

## Website

The same `index.html` is the website: **https://findmeflatmate.com**. In a browser the welcome page also shows
"How it works", the Flatsplits / FlatMart / search-together / map features, a **Get the Android
app** band and a footer. Anything marked `web-only` (the download links) is hidden inside the
Android app, which loads the page from `appassets.androidplatform.net`.

findmeflatmate.com is served by GitHub Pages from its own repo,
[kamalmotiani1989-cmd/findmeflatmate](https://github.com/kamalmotiani1989-cmd/findmeflatmate). Its
workflow copies this folder (without `android/`, `supabase/` and this README) from `main` every 30
minutes, or straight away when run by hand (Actions → Publish FindMeFlatMate → Run workflow), and
publishes it with the domain's `CNAME`. DNS is at GoDaddy: four A records for `@` (185.199.108.153,
.109, .110, .111) and a CNAME `www` → `kamalmotiani1989-cmd.github.io`. Sign-in and payments work
there as is: the Supabase functions allow any origin.

The old address, https://kamalmotiani1989-cmd.github.io/NavigateMe/flatmates/ (this repo's Pages,
from `main`), still serves the app but forwards to findmeflatmate.com, keeping invite and Vibe
links; people signed in there sign in once more on the new domain. Share links, the Vibe Card and
the page's og/canonical tags use `SITE_LINK` (`https://findmeflatmate.com/`).
`.github/workflows/flatmates-site.yml` still keeps a `gh-pages` branch here with just the website.

### Host page (where ads for people with a room land)

**https://findmeflatmate.com/?host=Pune&area=Baner** shows people with a spare room who's looking
near them right now: how many people want a room in that area and across the city, how many searched
this week, what most of them can pay, and their lifestyle mix (working or studying, smoking, veg,
generation, early birds or night owls). Visitors can switch city and area, tap the busiest areas,
and send the page to their flatmates. **List my room free** goes to sign-up as an owner, or straight
to the listing form for someone already signed in, with the city and area filled in. A seeker who
taps it is switched to listing a room. The welcome page links to it ("See who's looking for a room
near you"), and inside the app it's `#host/<city>/<area>`.

The counts come from `fm_area_demand`, which anyone can call. It counts only real people: no sample
accounts, nobody who chose not to be shown to owners, and only people active in the last 60 days who
answered the living-style questions. These are the same people an owner there could invite from the
Escape tab. Budgets and the lifestyle mix only show for 5 or more people, describing the whole city
when the area has fewer, and an area is only listed once 2 or more people picked it. Nobody can be
picked out. In demo mode the demo's sample seekers stand in.

## Ads and tracking

**Where each account came from.** On a visitor's first visit, the app keeps the link's `utm_source`,
`utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` / `fbclid`, the referring site and the
landing page on that device. When a new account signs in for the first time (accounts made in the
last day only), `fm_set_attribution` saves them in `fm_profiles.attribution`, once. The team reads the
results in the Supabase SQL editor:

```sql
select * from fm_source_report(30);   -- sign-ups in the last 30 days, by source and campaign
```

It gives, per source and campaign: sign-ups, seekers, owners, owners with a room listed, rooms
listed, requests sent, passes bought and money paid (with GST). `unknown` is accounts made before
tracking, and `direct` came without tags. A `gclid` or `fbclid` without utm tags counts as google /
meta. The app itself can't call it.

**Ad links.** Tag every ad so the report can tell campaigns apart:

- Meta (Facebook / Instagram), website URL `https://findmeflatmate.com/?host=Pune&area=Baner`, URL parameters
  `utm_source=meta&utm_medium=paid&utm_campaign=hosts_pune&utm_content={{ad.name}}`
- Google Ads: final URL `https://findmeflatmate.com/?host=Pune&area=Baner`. In the campaign's settings, under
  Campaign URL options, set the final URL suffix to `utm_source=google&utm_medium=cpc&utm_campaign=hosts_pune`.
  Keep auto-tagging on (it adds the gclid).
- Ads for seekers can go to `https://findmeflatmate.com/?utm_source=...`.

**Meta Pixel and Google tag.** Fill in `FM_CONFIG.ads` in `index.html` and they load, on the website
only (never inside the Android app):

```js
ads: { metaPixel: "123456789012345", googleTag: "G-XXXXXXX, AW-1234567890",
       googleAds: { sign_up: "AW-1234567890/AbCd", list_room: "AW-1234567890/EfGh", purchase: "AW-1234567890/IjKl" } },
```

| App event | Meta Pixel | Google tag | Google Ads conversion |
|---|---|---|---|
| Host page opened | `ViewContent` (content_name host_page) | `host_view` | |
| "List my room" tapped | custom `HostStart` | `host_start` | |
| New account | `CompleteRegistration` (owner / seeker) | `sign_up` | `googleAds.sign_up` |
| Room listed | `Lead` | `generate_lead` | `googleAds.list_room` |
| Request sent | `Contact` | `request_room` | |
| Pass bought | `Purchase` (value in ₹, incl. GST) | `purchase` | `googleAds.purchase` |

Campaigns aimed at hosts should optimise for **Lead** (a room listed). Seeker campaigns should
optimise for **CompleteRegistration**, and for **Purchase** once charges are on. Only the event, a
city, area, role or plan, and a purchase's value are sent: never names, numbers or anything typed in.
The privacy policy, `privacy.html` (https://findmeflatmate.com/privacy.html), says so. Use that link
wherever Meta or Google ask for a privacy policy URL.

## Privacy policy

`privacy.html` is the privacy policy, written to match what the app actually does. It covers what's
collected, who sees what, the services used, cookies and ads measurement, how long data is kept, the
user's rights under the Digital Personal Data Protection Act, 2023, and the grievance officer
(Richa Wadhwani, privacy@findmeflatmate.com). It's linked from the sign-in card, both footers and
Account, and the Android app bundles it (`android/app/build.gradle`). Update it, and its date, when
the app starts collecting something new or uses a new service.

**Deleting an account.** Account → **Delete my account** (type DELETE to confirm) removes the account's
photos from storage (its own folder; `fm_photos_select_own` lets it list them), then calls
`fm_delete_account`, which deletes the auth user. Everything tied to it goes by `on delete cascade`:
profile, listings and their private details, requests, invites, visits, saves, tribe links, FlatMart
items and offers, passes, push tokens and reports. Two things stay, as the privacy policy says:
payment records (`fm_orders.user_id` becomes null; tax law), and Flatsplits groups shared with others,
as their record of who paid what (the person's UPI ID is removed). The device's own copy is cleared too.
For a deletion request by email, delete the auth user the same way:
`delete from auth.users where id = (select id from fm_profiles where phone = '91XXXXXXXXXX');`
(remove their photos in Storage → fm-photos → the folder named after their user id).

## Install as an app

Once it's served over HTTPS (GitHub Pages at `/flatmates/` works), open it on the phone:
Android Chrome shows **Install app**; on iPhone use Share → **Add to Home Screen**. It opens
full-screen with its own icon. The service worker loads the newest version whenever there's a
connection, so changes show up on the next open.

## Android app (APK)

The app is called **FindMeFlatMate** (logo: three smiling flatmates in a house; tagline "Find your vibe. Find your flatmate."). The folder, Android
package (`com.navigateme.flatmates`) and download link keep their old names so installed
copies update in place.

Download on the phone: https://github.com/kamalmotiani1989-cmd/NavigateMe/releases/download/flatmates-apk/flatmates.apk

Open the downloaded file and allow "Install unknown apps" for your browser when Android asks.
New versions install over the old one and keep your data.

How it's built: `android/` is a small native app that shows the web app full-screen. The build
copies `index.html` and `icons/` into the APK, so you only ever edit the web app. Every push that
changes `flatmates/` runs `.github/workflows/flatmates-apk.yml`, which builds the APK and replaces
the file at the link above (about 3 minutes).

To build on your own computer instead: open `flatmates/android` in Android Studio and press Run,
or run `./gradlew assembleRelease` there (output in `app/build/outputs/apk/release/`).

**Before the Play Store:** the APK is signed with `android/testing.keystore`, which is public in
this repo, so it's only for testing. Create your own key once
(`keytool -genkeypair -keystore upload.keystore -alias upload -keyalg RSA -validity 10000`)
and add these repository secrets: `ANDROID_KEYSTORE_BASE64` (the file, base64-encoded),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. The workflow uses
them automatically. Keep that keystore safe: Play only accepts updates signed with it.
Phones with the testing build must uninstall it once before installing the properly signed one.

## Live project

The app is connected to the Supabase project **FindMyFlatMate** (`tjgkcuzypstnanpsoogi`, Mumbai; the project kept its first name).
The database runs the current `schema.sql` (Flatsplits, FlatMart, the shared tribe shortlist, map
locations, sample people, plans and passes, and the host page's counts and ad attribution). It's safe
to re-run after any change.

**Sample data for testing:** `supabase/samples.sql` adds 10 sample homes in each of the top 10 cities
(Bengaluru, Mumbai, Pune, Delhi NCR, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh), each
with its own sample owner, and 10 sample people looking for a room per city, who show up in Build your
tribe and The Empty Room Escape. They're accounts marked `fm_profiles.sample`, with no phone or email,
so nobody can sign in as them, and the app tags them **Sample**. They answer straight away: a request to
a sample home or an invite to a sample person is accepted without using a contact, a visit is
confirmed, and a sample person says yes to a tribe match (two of each tester's best matches already
have). There's no real number or address to share, and the app says so. Running the file again
replaces them. Before real users, remove them all:
`delete from auth.users where id in (select id from public.fm_profiles where sample);`

**Testing login (no SMS):** until phone login has an SMS provider, everyone signs in with their mobile
number and the code **123456**, through the `fm-login` function (`supabase/functions/fm-login`). It
isn't secure: anyone with the code can sign in as any number. Before real users, add an SMS provider
under Authentication → Sign In / Providers → Phone (Twilio, Vonage, MessageBird or Textlocal; Indian
numbers need DLT registration), set `testLogin: false` in `FM_CONFIG`, and run
`update fm_settings set test_login = false;`. The supabase-js library ships inside the app (`vendor/`), so it never depends on a CDN; if the
server can't be reached the app shows "Can't connect" instead of falling back to demo data.
Set `supabaseUrl` and `supabaseAnonKey` in `FM_CONFIG` back to "" to run the demo again.

## Go live

1. Create a Supabase project. Under Authentication → Providers enable **Phone** (needs an SMS
   provider such as Twilio or MSG91).
2. Run `supabase/schema.sql` in the SQL editor. It's safe to re-run, so run it again after
   every update to this file. It also creates the public `fm-photos` storage bucket.
3. Create a Razorpay account and set the function secrets:
   ```
   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
   supabase functions deploy fm-pay --no-verify-jwt
   ```
4. In the Razorpay dashboard add a webhook to
   `https://<project>.supabase.co/functions/v1/fm-pay/webhook` for `payment.captured`.
5. Paste the project URL and **anon** key into `FM_CONFIG` at the top of the script in `index.html`.

### Push notifications (when the app is closed)

1. Create a Firebase project, add an **Android app** with package name `com.navigateme.flatmates`,
   and download `google-services.json`. Add its contents as the GitHub secret
   `GOOGLE_SERVICES_JSON`; the APK workflow picks it up automatically.
2. In Firebase → Project settings → Service accounts, generate a private key (JSON) and set it as a
   function secret, together with a random notify secret:
   ```
   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)" NOTIFY_SECRET=<random>
   supabase functions deploy fm-notify --no-verify-jwt
   ```
3. Tell the database where to send events (the `pg_net` extension must be enabled):
   ```sql
   update fm_settings set notify_url = 'https://<project>.supabase.co/functions/v1/fm-notify',
                          notify_secret = '<same random value>';
   ```
   Never put the service_role key in the page.
