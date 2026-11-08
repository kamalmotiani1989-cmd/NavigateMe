# Priorities · set by King

_Updated by King after each weekly review and whenever Kamal changes direction. Employees read this at the start of
every routine and task._
_Last update: 8 Nov 2026._

## State of play (8 Nov)
- **All work is paused by Kamal (6 Nov), and so are the daily shifts and weekly routines.** Work only on a task Kamal
  or King gives you directly, and stop when it is done.
- **The hold is lifted (Kamal, 8 Nov).** findmeflatmate.com serves the app, the database hold is off, the Android app
  is live. **Sign-up is not open:** sign-in still uses the shared test code until WhatsApp or SMS codes have keys, so
  strangers cannot sign up. Until Kamal says sign-up is open: say "launching soon", never "download now", and no paid
  traffic, no ad spend, no group posts that send people to sign up.
- **Merged 8 Nov:** every open PR (UI batch, photo beautify, room details, site excludes, all marketing and community
  documents). The internal folders are off both public sites.

## Working hours (India time)
**Employees:** every day, 6 to 8 in the morning and 10 at night to midnight, when shifts are running (paused now).
**Kamal:** 6 to 10 in the morning and 10 at night to midnight. Anything for him is ready before 10 pm that day.

## Teche (tech)
1. **Next blocker for real sign-up: the WhatsApp or SMS code keys.** When Kamal resumes you, list exactly what is
   needed from him (which provider, which keys, where he creates them, where they go: edge-function secrets, never the
   repo) and what you test before he opens sign-up. The login process itself does not change.
2. Mark's Pixel and Google Ads conversion wiring waits on Kamal's IDs.
3. Standing rules: login and onboarding questions do not change; the look stays as in the README's "Look and feel"; no secrets; tests before every push.

## Mark (marketing)
1. No "download now" and no paid spend until Kamal opens sign-up. Copy says "launching soon".
2. On resume: the Tuesday content pack; Pune is the recommended first city (Mumbai plan on main for comparison).

## Salu (community)
1. No group post that sends people to sign up until Kamal opens sign-up; admin requests and value-first drafts only.
2. On resume: the Wednesday pack from groups at `rules read` or better; the college outreach drafts are with Kamal.

## Decisions waiting for Kamal
- When sign-up opens (needs the WhatsApp or SMS keys).
- Launch city and month: Pune first recommended.
- Meta Pixel and Google Ads IDs.
- An explicit 18+ tick at sign-up before the college route.
- Read-only web access for Mark's and Salu's sessions.

## Requests between teams
1. **Mark → Teche.** Pixel `CompleteRegistration` on owner sign-up and the Google Ads conversion; blocked on Kamal's IDs.
2. **Mark → Teche, later.** A `?host=Pune&area=<Area>` deep link per area. Not before item 1.
