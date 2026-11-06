# Teche · reports

## 2026-11-06

**Done.** UI pass, page by page, on a phone-sized screen in demo mode (King's priorities, item 1). Four PRs, each
with one plain commit per change so Kamal can drop any of them; none merged, waiting for Kamal:
- PR #47, welcome page and sign-in card: a pasted or auto-filled number ("+91 98765 43210", "098765 43210") is
  tidied to its 10 digits instead of being refused; the old "Please check" toast no longer lingers on the code
  screen; a new welcome test suite (9 checks). Login process, card, choices and colours unchanged.
- PR #49, all pages: the floating help button hides while someone types, so it no longer covers the end of a field.
- PR #50, onboarding: the finale no longer shows an empty "0" ring when there is no match yet; Let's go, Continue
  and the finale buttons are thumb-sized; "See my Vibe Card" stayed readable after a tap (it went white on white).
  Questions, order and wording untouched.
- PR #51, Discover and a home's page: homes on the first screen (the profile, type and shortcut cards now come
  after the vibe-match row); the home page's share button got rewritten into a second back arrow and now shows its
  own icon; with no homes matching, the "No homes match all of that yet" help comes before the nudges.

Looked at and left alone, because they work well on a phone: the compatibility analysis, the posting form (all
three steps), Tribe, Escape, My flat, Requests, Flatsplits (groups and the sample flat), FlatMart (browse and an
item), Account, Passes and the Coming soon screen.

**Tests.** Every push ran `tests/demo/run.sh` green: 121 checks on #47, 113 on #49, 114 on #50, 115 on #51
(main has 112; the new checks are in the same suites). No Android build yet: it runs on merge to main.

**Blocked.** Mark's Pixel and conversion wiring still waits on the Meta Pixel ID and the Google Ads tag and
conversion label from Kamal's accounts (steps sent 5 Nov).

**Need.** From Kamal: review of the four PRs (accept or drop per commit). One question: the brief says merge when
green, the priorities say Kamal accepts or drops each, so I left them open; tell me if you would rather I merge
green PRs myself. From King: nothing.

## 2026-11-05

**Done.** Onboarded on the repo: read the brief and the spec, ran the demo suites on main (ob 15, pass3 24, p5 24, p6 34,
p7 15: 112 checks, 0 failures). Answered Kamal on retiring NavigateMe in favour of findmeflatmate.com: recommended renaming
this repo, removing the Navigate Me AI home page and repointing the website repo's publish job; Kamal said not for now.
Checked Mark's Pune brief (plan section 9) read-only, in demo mode: `?host=Pune` with no area renders ("Anywhere in Pune"),
UTM tags and fbclid survive into sign-up, per-area links work as typed (the app knows "Hinjewadi Phase 1", not "Hinjewadi").
The Pixel CompleteRegistration event and the Google Ads sign-up conversion are already coded; only the IDs are missing.

**Shipped.** Nothing; no code changed. No pushes this session before this report.

**Blocked.** The Pune items need the Meta Pixel ID and the Google Ads tag and conversion label from Kamal's accounts;
I cannot create them. Asked Kamal, with the steps.

**Need.** From Kamal: those IDs, and a go-ahead for the small change (fill the IDs in, add an owner-page test, verify
on the live site). From King: nothing yet.
