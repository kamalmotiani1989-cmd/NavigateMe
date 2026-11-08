# Teche · reports

## 2026-11-08, all pending PRs merged (Kamal: "Do all PR's pending")

**Done.** Kamal asked in my session to do all pending PRs. All 13 open PRs are merged; none is open now.
- Mine: #54 (publish-job excludes), #47 (welcome and sign-in), #49 (help button), #50 (onboarding), #51 (Discover and
  a home's page), #52 (photo beautify), #56 (FlatMart sell form). #51 and #52 conflicted with the room details already
  on main, only where both sides added things (tests, README points, the form reset); I kept both sides, merged main
  into each branch, ran all suites green, then merged.
- Mark's and Salu's, documents only, all in `flatmates/marketing/`: #43, #45, #46, #48, #55, #57.

**Checked on main after the last merge.** Demo suites: welcome 9, ob 17, pass3 44, p5 31, p6 36, p7 15. 152 checks,
0 failures. Android build on main succeeded (run 117). The site publish ran (run 147) and **gh-pages no longer
carries `team/`, `marketing/` or `tests/`**: it lists only the app's files. No database change was needed beyond the
room details applied earlier today.

**Still open, for Kamal.** The Pixel and Google Ads IDs.

Update, 15:05 UTC: the website repo's publish job is fixed from Kamal's main session (findmeflatmate 17a1762). I
checked it: publish.yml excludes `team/`, `marketing/` and `tests/` and removes leftovers, and both its main and
gh-pages carry only the site's files. The three folders remain in that repo's public commit history; rewriting it is
Kamal's call.

## 2026-11-08, room details merged and live in the database

On Kamal's word ("Merge it") PR #58 is merged (merge commit e60af0a). The database change is applied: the merged
schema.sql was fetched into the database with net.http_get (md5 678fa326… matches my local file), executed, and
verified read-only: the `room` column exists, `fm_clean_room` keeps a room's answers and drops a whole flat's,
fm_post_listing and fm_update_listing take `p_room`, and search, near search, get and my listings return `room`.
No existing listing has it set (as expected). Hold settings unchanged: on_hold and test_login as before. The video
column is not there (that PR stayed closed). The Android build runs on this push to main; the website repo's
publish job is Kamal's to run (I have no access, and it would copy the team folder until its excludes are added).
Everything else stays stopped.

## 2026-11-08, room details (the one task resumed)

**Done.** PR #58: room details on a listing, Kamal's task of today, not merged by me. For a private room, a shared room
or a flatmate listing, three one-tap questions under the room type (Washroom attached / shared, Balcony yes / no,
Master bedroom yes / no), all optional, a whole flat skips them, prefilled when editing. The home's page shows the
answers as short labels next to the type; a no, or nothing set, shows nothing, so existing listings look as before.
Filters: a "The room" section with three optional ticks, off by default, removable chips, live count; a whole flat
always passes. Database: a `room` column, `fm_clean_room` (only the three known answers, else `bad-room-details`),
carried by post, update and the four readers; old callers and old listings unchanged. Demo homes get a mix, one in
five unset. Four plain commits: database, posting form and home page, filters, tests and README.

**Tests.** 128 checks green (ob 15, pass3 36, p5 28, p6 34, p7 15; 13 new). schema.sql applied twice to a local
Postgres 16 with stand-ins; post with three, one and no answers, a whole flat dropping them, refusal of bad values,
update and clear all exercised.

**After merge.** Apply the merged schema.sql to the database first (the app sends the new argument); then the Android
build and the website publish follow. I do the schema step when Kamal merges and says so.

**Everything else stays stopped** as Kamal ordered on 6 Nov: no merges, no other PRs, shifts paused. This report push
republishes gh-pages with the team folder, as Kamal knows; PR #54 (the excludes) is still open.

**Open for Kamal.** PRs #54, #47, #49, #50, #51, #52, #56, #58; the website repo's publish.yml; the Pixel and Google
Ads IDs.

## 2026-11-06, 10 pm shift

**Done.** Checked main and the open PRs at the start of the shift: nothing changed since the morning; PR #54 (the
publish-job excludes) is still unmerged, so this repo's public branch still carries `team/`, `marketing/` and
`tests/`. Tested locally that all six open branches of mine merge onto main one after another without conflicts, in
any order. The Android build on main is green (run 97, 04:01 UTC). UI pass, second batch: walked the FlatMart sell
form, the new Flatsplits group form, Add an expense and the pass purchase on a phone-sized screen; one thing worth
fixing, in PR #56: the sell form's price guide was squeezed into the narrow price column five lines deep, now full
width. 113 checks green.

**Shipped.** Nothing merged. Per the merge rule for this batch PR #56 is mine to merge when green, but I am not
merging anything, and not pushing this report, until PR #54 is in: every push to main republishes the public branch
with the team folder. This entry was written at the end of the shift and pushed the moment #54 landed.

**Blocked.** PR #54 waits for Kamal's merge (one line, verified twice; the first push of it was broken by my edit
tool and repaired within minutes, before anyone merged). The website repo's publish.yml needs the same three
excludes: Kamal's access or paste. The Pixel and Google Ads IDs. The five PRs of the first batch and PR #52 wait for
Kamal's look.

**Need.** From Kamal: merge #54 first; then the reviews. From King: nothing.

## 2026-11-06, correction: video dropped

Update: on King's instruction PR #53 is closed, not merged; the branch `claude/listing-video` is kept so nothing is
lost. It was built before the drop arrived and closed on Kamal's instruction. No schema change went live.

King's message that Kamal dropped the video task (priorities.md, 6 Nov) reached me after I had built it. As asked:
nothing from it is merged or live. PR #53 is now a draft titled "Dropped by Kamal, not for merge", kept for the record
only; no database change was applied; the live app and database are untouched. The photo beautify PR #52 stands on
its own and does not depend on it. Sorry for the noise: the two messages crossed while I was building.

The publish-job exclusion (team/, marketing/, tests/ would be copied to the public site) still needs Kamal's decision.

## 2026-11-06, video and photos: both built

**Done.** Both of Kamal's listing tasks are built, tested and up as PRs, one per task, waiting for Kamal (this batch
too, since both change what owners post):
- **PR #52, auto-beautified photos (item 3).** On the phone before upload: orientation, levels, a lift for dark rooms
  that keeps a bright photo's brightness, light sharpening, 1600 px. Light, colour and sharpness only, every pixel
  the same, nothing in the room removed, added or moved. Tilt straightening left out: doing it safely crops part of
  the room away, which the honesty rule forbids. The original stays behind "Use original" per photo. Before-and-after
  examples were sent to Kamal in my session (synthetic room pictures: a dark room 49 to 125 on a 0 to 255 brightness
  scale, a good one 147 to 141). Real phone photos will be the real test; please try it on a dark room.
- **PR #53, video on a listing (item 2).** One clip up to 20 seconds, next to the photos, re-encoded on the phone to
  720p at about 1.5 Mbps (3 to 5 MB for 20 s), 8 MB hard cap, stored in a new `fm-videos` bucket in the owner's own
  folder, plays under the photos on the home's page (tap, sound off until turned on), "Remove video" deletes the file.
  Demo mode has a sample walk-through on one home in twelve. The caps are in one place for Kamal to change.

**Tests.** Photos: 120 checks green (8 new). Video: 124 checks green (6 new), and the schema applied twice to a local
Postgres 16 with stand-ins for Supabase's pieces, where a video in the caller's folder is stored and read back, a
video elsewhere is refused on post and on update, and removing works.

**After merge, for the video PR.** The database change goes live by fetching the merged schema.sql and executing it
(I do this once Kamal merges), then the Android build and the website publish follow by themselves.

**Found on the way, for Kamal's decision.** The website's publish job copies the whole `flatmates/` folder except
`android/`, `supabase/` and the README, so once it runs again it will put `team/` (these briefs and reports),
`marketing/` and `tests/` on findmeflatmate.com as plain text files. It has not run since 3 Nov, so nothing is public
yet. The fix is three exclude lines in the website repo's publish.yml; I need push access to that repo, or Kamal can
paste them. I recommend doing it before the next publish.

**Blocked.** Pixel and conversion IDs, as before.

## 2026-11-06, video and photo tasks: proposal before building

**Video on a listing (priorities item 2): caps and cost, for Kamal to decide.**
- **Proposed caps:** up to 20 seconds, 720p (1280×720), sound kept, one video per listing, a hard cap of 8 MB after
  compression (a typical 20-second phone clip comes out at 3 to 5 MB). Longer or bigger: the app asks for a shorter
  clip. A stricter option is 15 seconds and 5 MB.
- **How, in one line:** the phone re-encodes the clip to 720p before upload (the Android app and recent phone browsers
  can; where a browser cannot, the clip is accepted only if it is already under the cap), stored in the same Supabase
  storage as photos (a new bucket or a raised limit: the photo bucket allows 2 MB and images only, so this is a
  schema change that goes live with schema.sql), deleted by the owner like a photo. Demo mode gets a sample clip.
- **Cost per 1,000 listings:** at 4 MB each, 4 GB of storage. Supabase charges $0.0213 per GB a month beyond the
  plan's quota, so 4 GB is about $0.09 a month, or roughly ₹7. Watching costs more than storing: every play streams
  the clip, so 1,000 listings watched 50 times each is 200 GB a month of egress, within the Pro plan's 250 GB, and
  $0.03 to $0.09 per GB beyond that.
- **The real cost is the plan.** The project is on Supabase's Free plan: 1 GB of storage and 5 GB of egress a month.
  Video on 1,000 listings needs the Pro plan ($25 a month, about ₹2,100; 100 GB storage and 250 GB egress included).
  Worth knowing either way: photos alone (6 per listing at about 300 KB) fill the free 1 GB at roughly 550 listings,
  so the upgrade is coming with or without video.
- **My recommendation:** 20 s / 720p / 8 MB, and move to Pro when the first 100 real listings are in.

**Auto-beautify photos (item 3):** no decision needed before building. Plan: on the phone, before upload, fix
orientation from the photo's own data, auto-level brightness and contrast, lift shadows in dark rooms, light
sharpening, resize to 1600 px and compress (the app already resizes to 1600 px at 82% quality). Light, colour and
sharpness only; the original is kept per photo behind "Use original". Tilt straightening only if it is cheap and safe;
otherwise left out and said so. Before-and-after examples will be in the report with the PR.

Both start at the 10 pm shift as King set, unless Kamal says sooner.

## 2026-11-06, later

**Answers for Salu (read-only, no code changed), Requests item 3.**
- (a) **No explicit 18+ check.** Sign-up asks for a mobile number, a first name and gender. The only age question is
  the generation bracket (Gen Z "born 1997 or later", Millennial, Gen X, "none of these / rather not say"), so a
  17-year-old student can sign up without a wrong answer. The privacy policy states "FindMeFlatMate is for people
  aged 18 and over", but nothing asks for or checks a date of birth. Adding a tick-box or a birth-year question would
  change the sign-in card or the onboarding questions, so that is Kamal's call.
- (b) **Yes, it shows.** The source report groups by `utm_source` (lower-cased) and `utm_campaign`, so a link with
  `utm_source=whatsapp&utm_medium=college&utm_campaign=pune_<college-slug>` appears as source `whatsapp`, campaign
  `pune_<college-slug>`, with sign-ups, seekers, owners, rooms listed, requests and money. `utm_medium` is saved on
  the profile but not shown as a column. Two limits as the app stands: the tags are kept from the person's first visit
  on that phone, so someone who opened the site earlier without a link counts as `direct`; and the report covers
  accounts made in the window asked for (`fm_source_report(7)` is the last 7 days).

**Noted from King.** This first batch of PRs waits for Kamal. From the next batch I merge when green and list every
change here; anything touching the sign-in card waits for Kamal.

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
