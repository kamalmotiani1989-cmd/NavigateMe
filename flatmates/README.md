# FindMyFlatMate

A flatmate app built around **vibe**: people who live the same way find each other first, and
the room comes second.

## How it flows

1. **Welcome page = sign-in.** A short write-up and the sign-in card, which asks what you came
   for: *post my flat* or *looking for a room*, then name, mobile and a one-time code.
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
4. **Welcome gift, on the first request.** Nothing about money on the sign-in page or during
   onboarding. The first time a seeker asks to meet an owner, a gift opens: **5 free contacts**.
5. **Ask to meet, owner approves.** A seeker opens a flat and sends a request: their name, what
   they do, their answers and match %, plus an optional note. The owner gets an in-app
   notification (badge on Requests) and sees the profile with each trait marked as matching or
   clashing. Only when the owner **accepts** do both get each other's number, and the seeker
   gets the address. Declined requests cost nothing.
6. **Contacts are used only on acceptance**, so there are no refunds to manage. A pending request
   holds a contact until the owner replies. After the 5 free ones: **10 contacts for ₹500**.

Demo mode has **100 sample homes**: 12–13 in each of the 8 cities, one per neighbourhood, with
realistic rents, flatmates, interests and per-room expenses (addresses are made up). The other side is simulated: sample owners reply about 6 seconds after a request
(they accept a match of 60% or more), and a sample seeker asks to meet a flat about 8 seconds
after you post it.

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

| Who | What | Price |
|---|---|---|
| Owner | Post a listing with photos and flatmates (unlimited) | Free |
| Seeker | Browse, see households, vibe matches, rent and expenses | Free |
| Seeker | Welcome gift: first 5 accepted contacts | Free |
| Seeker | After that: 10 accepted contacts | ₹500 (₹50 each) |

Contacts never expire. To make everything free for a while: set `CHARGES_ON = false` in
`index.html` **and** run `update fm_settings set charges_enabled = false;` in Supabase. The
database decides, so the app can't be tricked into free contacts while charges are on.

## Files

- `index.html`: the whole app (onboarding, browse, requests, approvals, post, pay, visits). No build step.
- `supabase/schema.sql`: tables, row-level security and RPCs. Requests, approvals, contacts and
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

## Install as an app

Once it's served over HTTPS (GitHub Pages at `/flatmates/` works), open it on the phone:
Android Chrome shows **Install app**; on iPhone use Share → **Add to Home Screen**. It opens
full-screen with its own icon. The service worker loads the newest version whenever there's a
connection, so changes show up on the next open.

## Android app (APK)

The app is called **FindMyFlatMate** (logo: a house with a magnifier over three flatmates). The folder, Android
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
