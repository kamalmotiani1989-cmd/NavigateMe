# Navigate Me Flatmates

## How it flows

1. **Welcome page = sign-in.** A short write-up and the sign-in card. Nothing else is visible
   until you're in. The card asks what you came for: *post my flat* or *looking for a room*,
   then name, mobile and a one-time code.
2. **Questions, one per screen.** Room seekers: city, all-in budget, when they're moving, then
   8 living-style questions. Flat owners: who lives in the flat, then the same 8 questions about
   their household. Skippable. Seekers end on a match summary; owners go straight to posting
   with their answers prefilled.
3. **The app.** Seekers get Discover (best match spotlighted, every flat with a match ring),
   Saved and Account. Owners get My flat (interest, visit requests) and Post.
4. **Money only inside a flat.** No prices on the welcome page or in Discover. The price shows
   when someone opens a flat and decides to contact the owner.

Only owners can post and only seekers can unlock; the database enforces both. Anyone can
switch from their account page.

## What makes it different

- **Vibe match.** Seekers answer 8 quick living-style questions (bedtime, cleanliness, food,
  smoking, drinks, guests, work, pets). Owners describe their household with the same questions,
  plus who lives there. Every flat shows a match %, what fits and what might clash, and seekers
  can sort by best match.
- **All-in rent.** Owners add the room's share of maintenance, electricity, Wi-Fi and cook/maid.
  Cards lead with the all-in monthly figure; the detail shows the full bill and the move-in amount.
- **Save before you spend.** A free ♥ shortlist, so seekers decide which flats are worth an unlock.
- **Unlocks never expire.** ₹100 a flat, no plans, tiers or brokers.
- **Illustrated rooms.** Listings without photos get a drawn room in place of a blank tile.

## Pricing

| Who | What | Price |
|---|---|---|
| Owner / current tenant | Post a listing with photos (unlimited) | Free |
| Seeker | Browse listings, rent, area, amenities, preferences | Free |
| Seeker | Unlock pack: 5 flats (owner phone, exact address, book visits) | ₹500 (₹100 per flat) |

An unlocked flat stays unlocked; opening it again doesn't use another credit.
Unlocks don't expire. When all 5 are used, the next unlock asks for another ₹500 pack.

**Unlock-back guarantee:** a seeker gets the unlock back if the flat was already rented, or the
owner hasn't replied 48 hours after the unlock. Once per flat, up to 2 per pack bought, and the
contact stays visible. When two seekers report a flat as already rented, it's taken down.

## Files

- `index.html`: the whole app (browse, post, unlock, pay, book visits, account). No build step.
- `supabase/schema.sql`: tables, row-level security and RPCs. The paywall is enforced here,
  so a locked phone number or address never reaches the browser.
- `supabase/functions/fm-pay/index.ts`: Razorpay order creation, payment verification and webhook.
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
   Never put the service_role key in the page.
