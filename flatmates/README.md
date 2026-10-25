# Navigate Me Flatmates

People already renting a flat post their spare room (or look for a flatmate) for free.
Seekers browse everything free, and pay only to contact the owner and visit.

## Pricing

| Who | What | Price |
|---|---|---|
| Owner / current tenant | Post a listing (unlimited) | Free |
| Seeker | Browse listings, rent, area, amenities, preferences | Free |
| Seeker | Unlock pack: 5 flats (owner phone, exact address, book visits) | ₹500 (₹100 per flat) |

An unlocked flat stays unlocked; opening it again doesn't use another credit.
Unlocks don't expire. When all 5 are used, the next unlock asks for another ₹500 pack.

## Files

- `index.html`: the whole app (browse, post, unlock, pay, book visits, account). No build step.
- `supabase/schema.sql`: tables, row-level security and RPCs. The paywall is enforced here,
  so a locked phone number or address never reaches the browser.
- `supabase/functions/fm-pay/index.ts`: Razorpay order creation, payment verification and webhook.

## Run it

Open `flatmates/index.html` in a browser (or visit `/flatmates/` on the GitHub Pages site).
With no config it runs in **demo mode**: sample listings, OTP shown on screen, no real payment,
data stored in the browser.

## Go live

1. Create a Supabase project. Under Authentication → Providers enable **Phone** (needs an SMS
   provider such as Twilio or MSG91).
2. Run `supabase/schema.sql` in the SQL editor.
3. Create a Razorpay account and set the function secrets:
   ```
   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
   supabase functions deploy fm-pay --no-verify-jwt
   ```
4. In the Razorpay dashboard add a webhook to
   `https://<project>.supabase.co/functions/v1/fm-pay/webhook` for `payment.captured`.
5. Paste the project URL and **anon** key into `FM_CONFIG` at the top of the script in `index.html`.
   Never put the service_role key in the page.
