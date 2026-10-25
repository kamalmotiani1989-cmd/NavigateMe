# Navigate Me Flatmates

## How it flows

1. **Welcome page = sign-in.** A short write-up and the sign-in card, which asks what you came
   for: *post my flat* or *looking for a room*, then name, mobile and a one-time code.
2. **Questions at sign-in, one per screen, required.**
   - Room seekers (16): what they do (working / student / self-employed / between jobs) and
     where, city, all-in budget, then 12 living-style questions: bedtime, cleanliness, food,
     cooking, smoking, drinks, guests, noise, time together, groceries and chores, weekday
     routine, pets. Smoking, food and pets count double in the match.
   - Flat owners (14): how many live there, each flatmate's work or studies and age range, then
     the same 12 questions about the household. The posting form comes prefilled.
3. **Welcome gift.** Every seeker gets **5 free contacts**, revealed as a gift after onboarding.
4. **Ask to meet, owner approves.** A seeker opens a flat and sends a request: their name, what
   they do, their answers and match %, plus an optional note. The owner gets an in-app
   notification (badge on Requests) and sees the profile with each trait marked as matching or
   clashing. Only when the owner **accepts** do both get each other's number, and the seeker
   gets the address. Declined requests cost nothing.
5. **Contacts are used only on acceptance**, so there are no refunds to manage. A pending request
   holds a contact until the owner replies. After the 5 free ones: **10 contacts for ₹500**.

In demo mode the other side is simulated: sample owners reply about 6 seconds after a request
(they accept a match of 60% or more), and a sample seeker asks to meet a flat about 8 seconds
after you post it.

## What makes it different

- **Vibe match.** Seekers answer 12 living-style questions. Owners describe their household with the same questions,
  plus who lives there. Every flat shows a match %, what fits and what might clash, and seekers
  can sort by best match.
- **All-in rent.** Owners add the room's share of maintenance, electricity, Wi-Fi and cook/maid.
  Cards lead with the all-in monthly figure; the detail shows the full bill and the move-in amount.
- **Save before you spend.** A free ♥ shortlist, so seekers decide which owners to ask.
- **Owners choose who they meet.** Numbers are only shared after the owner accepts a request.
- **Illustrated rooms.** Listings without photos get a drawn room in place of a blank tile.

## Pricing

| Who | What | Price |
|---|---|---|
| Owner | Post a listing with photos and flatmates (unlimited) | Free |
| Seeker | Browse, see households, matches and all-in costs | Free |
| Seeker | Welcome gift: first 5 accepted contacts | Free |
| Seeker | After that: 10 accepted contacts | ₹500 (₹50 each) |

Contacts never expire. To make everything free for a while: set `CHARGES_ON = false` in
`index.html` **and** run `update fm_settings set charges_enabled = false;` in Supabase. The
database decides, so the app can't be tricked into free contacts while charges are on.

## Files

- `index.html`: the whole app (onboarding, browse, requests, approvals, post, pay, visits). No build step.
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
