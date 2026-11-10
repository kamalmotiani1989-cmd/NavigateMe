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
00000. **ON HOLD (Kamal, 10 Nov: "Don't build now, let's discuss").** Do not build until Kamal says so. Was: **AI go-between before contacts are shared.**
   Six parts: Privacy Shield, Conflict Detector, Smart Questions, Truth Check, Compatibility Report, Mutual Consent.
   The AI relays and translates; it never answers for a person. Behind a feature switch, off until Kamal turns it on.
   Needs Kamal's Anthropic API key as an edge-function secret before it can run live. Full brief in King's message of 10 Nov.
0000. **Push access to the findmeflatmate repo: Kamal, 9 Nov, in King's session: "Approved".** For running its publish
   job after each merge that changes flatmates/, and fixing why its 30-minute schedule stalls (fix as a PR there,
   Kamal merges). No secrets in that repo.
000. **Ship PR #69 (Flatsplits & FlatMart sign-up): Kamal, 9 Nov, in King's session: "Ship PR 69".** Order: database
   first (the live database refuses the new role today), verify read-only, then merge, then the Android build and the
   website publish. This sign-up postpones the 12 vibe questions until the person wants rooms or parties; Kamal accepts
   that change to the onboarding rule.
00. **Nearby parties, Phase 1: Kamal's approval, 8 Nov, in King's session.** His words: "Yes to all 3, build phase 1".
   The three decisions: build Phase 1; the host picks the radius from 1 to 5 km, default 3 km; women-only parties are
   allowed. Phase 1 means no money handled by the app (the chip-in is paid to the host at the door or by UPI),
   alcohol is bring-your-own and never part of the chip-in, and the address and numbers are shared only when the host
   accepts. Full brief in King's message of 8 Nov. One PR, Kamal merges, deploy on his word: app first, then database.
0. **Kamal's approval, 8 Nov, in King's session ("All 4"), from the design study (PR #62):** (1) layout changes 1 to 3
   and 5 to 8 plus the tips token swap; (2) hint grey `#8790A3` to `#5E6679`; (3) WhatsApp button `#1DA851` to `#178741`
   on the sign-in card; (4) the sign-in card moved onto the welcome page's first phone screen, with the card, its steps
   and the code flow unchanged. These are Kamal's own changes to the look and the sign-in card; update README "Look and
   feel" to match. Changes 1 to 3 are already live (PR #64). One PR for the rest; Kamal merges.
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
