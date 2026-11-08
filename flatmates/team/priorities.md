# Priorities · set by King

_Updated by King after each weekly review and whenever Kamal changes direction. Employees read this at the start of
every routine and task._
_Last update: 5 Nov 2026, from Kamal's instructions._

## Working hours (India time)
**Employees:** every day, 6 to 8 in the morning and 10 at night to midnight. Your session is woken at the start of
each shift; your weekly routine (Teche Monday, Mark Tuesday, Salu Wednesday) runs inside the morning shift. Push what
is finished and file your report entry before the shift ends; nothing half-committed.
**Kamal:** 6 to 10 in the morning and 10 at night to midnight. Anything that needs him (a decision, a pack to paste, a
question, a report) is ready in the repo or the session before 10 pm that day.

## Sunday review
Kamal sits with the team this Sunday (9 Nov); time to be shared. Mark and Salu bring the work below, written up and
pushed, so the discussion is about choices, not reading.

## Teche (tech)
0. **First, 6 Nov: stop the team and marketing folders being published.** This repo's website workflow copies
   `flatmates/` to gh-pages minus android, supabase and README, so `team/`, `marketing/` and `tests/` are on gh-pages now.
   One PR adding three excludes to the tar line; Kamal merges it at once. The website repo's publish.yml needs the same
   three lines: Kamal pastes them or gives Teche push access there. Nothing else until this PR is open.
1. **Improve the app's UI and user experience, page by page.** Kamal's task; item 3 below (Kamal, 6 Nov) now comes first, then the next UI batch. Go through every
   page and screen of `flatmates/index.html` (welcome and sign-in flow, the onboarding questions, Discover, a home's
   page and the compatibility analysis, the posting form, Tribe, Escape, Flatsplits, FlatMart, Account, the Coming
   soon screen). For each one write down what is hard, slow, unclear or ugly for a first-time user on a phone, then
   fix it. User experience is the priority; "easy to change" is the second: make the fixes small, separate commits
   with plain names, so Kamal can accept or drop each one. Keep the standing rules: the login process, the colours
   and the onboarding questions do not change; the hold stays. Demo suites pass before every push; one PR per page or
   per small group of pages, not one giant PR. Report after each page: what you changed, why, test counts.
   _6 Nov: first batch is in, PRs #47 (welcome and sign-in card), #49 (help button), #50 (onboarding), #51 (Discover
   and a home's page), tests green on each; waiting for Kamal. Merging: this first batch waits for Kamal's look. From
   the next batch, your brief applies: merge when green, list every change in your report, and Kamal drops anything he
   dislikes afterwards. The sign-in card is the exception: anything touching it waits for Kamal._
2. **Video on a listing: dropped by Kamal, 6 Nov.** Not to be built. (Teche's costing, for the record: video at scale
   needs the Supabase Pro plan; photos alone fill the Free plan at about 550 listings.)
3. **Auto-beautify uploaded photos (Kamal, 6 Nov).** When photos are uploaded to a listing, improve them automatically
   so they look clear and bright: fix orientation, auto-level brightness and contrast, lift dark rooms, light sharpening,
   straighten obvious tilt if cheap to do, and resize and compress to a sensible size for phones. Done on the phone
   before upload, so storage shrinks rather than grows. Business reason: most listing photos are dark, tilted phone shots
   and the good flats lose to the ones with better photos. Honesty rule, from Kamal's facts-only rule: enhance light,
   colour and sharpness only; never remove, add or alter anything in the room, and keep the original so the owner can
   switch back ("Use original") per photo. Tests cover the enhancement running, the toggle, and that an already good photo
   is not made worse. Report before and after examples to Kamal in your report.
4. Keep main green: demo suites pass on every push, the Android build succeeds (last known build 74).
5. Mark's Pixel and conversion wiring (below) waits on Kamal's IDs; do it when they arrive, between pages.
6. Anything Kamal asks for directly comes first and is noted in your report.

## Mark (marketing)
1. **Done 6 Nov: PR #48, the competitor and ad study, waits for Kamal and Sunday.** Add the Meta Ad Library and Google ad copy once Kamal sends screenshots or allows the session to read those sites. The task was: study the other flat-rental and flatmate companies and their ads. India first
   (the flatmate apps, the no-broker rental sites, the PG and co-living brands, and the classifieds that carry rooms),
   then the two or three best-known abroad. For each: what they say in one line, who they target, the ad words and
   hooks they use (Google ad copy, Instagram and Facebook ads, reels), the campaigns and offers they run, what they
   charge, and where they are weak. End with a one-page recommendation: what we copy, what we do differently, and
   why. Facts only, each with its source and the date seen; no guesses about their numbers. Push it as a file in
   `flatmates/marketing/` on a branch with a PR before Sunday morning. Nothing is spent and nothing is posted.
2. Done: PR #45 (December plan and week-one content) is open and rebased; waits for Kamal.
3. The Tuesday content pack stays, within the README facts and the "launching soon" wording.

## Salu (community)
_Kamal lifted Salu's vacation hold on 5 Nov 2026, in King's session, by giving him the college-groups task below. Salu
works from now._
1. **Done 6 Nov: PR #46, the college-groups strategies, waits for Kamal and Sunday.** The task was: how to get into Pune's college groups without spending anything. Kamal's task: colleges can give
   an immediate boost. Work out the strategies and write them up: which colleges and which groups (official and
   student-run, Facebook, WhatsApp and Telegram, hostel and PG groups, placement and fresher groups, alumni cells),
   how each one is entered (admin request, a student ambassador, a society or fest tie-up, a helpful post in the
   fresher season, a referral offer that costs nothing), what we offer the group in return, the rules and the risks,
   and what Kamal would have to do himself. Rank them by expected reach for zero rupees and by how fast. Facts and
   named sources; where you could not confirm a group, say so. Push it on a branch with a PR before Sunday morning.
   No posting, no messaging members, no spend, and Pune only.
2. PR #43 (first tracker pass) waits for Kamal; no second pass until he merges it or answers its two questions.
3. The Wednesday pack, built only on groups with `rules read` or better; admin requests before any post. No posting
   until Kamal lifts the hold.

## Requests between teams
1. **Mark → Teche.** Wire the Meta Pixel `CompleteRegistration` event on owner sign-up and import it as a Google Ads
   conversion, so the Pune ads can learn. Blocked until Kamal sends the Meta Pixel ID and the Google tag and
   conversion IDs. Then one live test: a phone sign-up through `?host=Pune` with a UTM link must show in
   `fm_source_report(7)`. Teche confirmed on 5 Nov that the `?host=Pune` page and UTM carry-through already work.
2. **Mark → Teche, optional, later.** A `?host=Pune&area=<Area>` deep link per area for area-named ads. Not before item 1.
3. **Salu → Teche: answered 6 Nov (Teche's report).** (a) No explicit 18+ check at sign-up, only the generation
   bracket; the privacy policy says 18 and over but nothing enforces it. Adding a check touches the sign-in card or
   onboarding, so it is Kamal's decision. (b) A WhatsApp college link shows in the attribution report as source
   `whatsapp`, campaign `pune_<college-slug>`; the medium is saved but not a column; tags come from the phone's first visit.
4. **Salu → Mark.** Two pieces for the college route, after the Sunday study is in: a student version of the deposit
   checklist as an Instagram carousel, and a one-screen explainer of the campus-ambassador offer (the existing referral
   reward: 2 friends = 1 free contact, nothing else promised). Salu supplies the facts and draft text from
   `flatmates/marketing/community/pune-college-groups.md` (PR #46); Mark keeps the voice and the "launching soon" rule.
5. **Kamal's call, asked by both Mark and Salu:** whether their sessions may read public pages of competitor sites, the
   app stores, Instagram and the Meta Ad Library (Mark) and facebook.com and flatandflatmates.org (Salu). Read-only, no
   login. Kamal declined Salu's on 5 Nov; King recommends allowing both. It is an environment setting Kamal changes.
