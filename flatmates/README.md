# Navigate Me Flatmates

At sign-in everyone answers one question:

- **"I have a flat, looking for a flatmate"** (owner): posts their flat with up to 6 photos, free.
- **"I'm looking for a room in a flat"** (seeker): browses free, pays to contact owners and visit.

Only owners can post and only seekers can unlock; the database enforces both. Anyone can
switch role from My account (or from the prompt they see when they try the other side's action).

## Pricing

| Who | What | Price |
|---|---|---|
| Owner / current tenant | Post a listing with photos (unlimited) | Free |
| Seeker | Browse listings, rent, area, amenities, preferences | Free |
| Seeker | Unlock pack: 5 flats (owner phone, exact address, book visits) | ₹500 (₹100 per flat) |

An unlocked flat stays unlocked; opening it again doesn't use another credit.
Unlocks don't expire. When all 5 are used, the next unlock asks for another ₹500 pack.

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
