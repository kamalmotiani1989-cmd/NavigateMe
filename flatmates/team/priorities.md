# Priorities · set by King

_Updated by King after each weekly review and whenever Kamal changes direction. Employees read this at the start of
every routine and task._
_Last update: 17 Nov 2026._

## State of play (18 Nov)
- **Live now:** the reel look on every screen (#117, 18 Nov: cream pages, white cards, one orange key word in each
  main headline, the dark sheet on a home's page); the Parties feed, a party's page, hosting on one sheet and the map
  (#116, 17 Nov); "Do you live in this flat?" (#115) and the vibe score only where the lister lives there (#113).
  Parties: the short message after asking to join says what the answer was (#120, 18 Nov). Android build 223.
  Tribe: the people around you and the four steps sit on white cards (#122, 19 Nov, Kamal's ask). Android build 225.
- **The website has a blog (#121, 18 Nov, Kamal's ask):** seven articles at `/blog/`, on the website only. The app does
  not carry it; Android build 224 holds the same app as 223. King read the two legal and money articles in full and
  checked five of their news and government figures by search: all held. Nobody on the team can open the source pages
  themselves (network limits).
- **Sample parties in the live database (#119, 18 Nov, Kamal's ask for testing):** 15, each tagged "Sample", the last
  one ends on 5 Dec. None may be live when sign-up opens.
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
STANDING (Kamal, 16 Nov): the logo and its colours never change with the look. The 9 Nov logo files stay as they are.
00000000. DONE 18 Nov: live (#117, a25fdcd, Android 222, website published; brief #118). Kamal's yes, 18 Nov, in Teche's
   session, to "Shall I put this live on the website and in the Android app?" and to the look sentence: "Yez pleaze"
   (King read it in the session's record). What follows is the record of how it got there.
   **BUILT AND REVIEWED (PR #117 at 5047019). Waited only for Kamal's yes in Teche's session.** The three
   fixes below are made; King measured them on the branch on 18 Nov (rings green and amber as today; the scrolled top bar
   cream; first page headline on two lines at 390 wide, Continue 18px higher than today and clear of the help button).
   King recommends yes. The review as written: King opened
   the branch on a phone-size screen and checked it against the reels: sign-up, the questions, Discover, a home's page,
   Tribe, Flatsplits, FlatMart, Parties, Profile, the two website pages. It is faithful. Three fixes, two of them King's
   own mistakes in this entry:
   (1) **Score rings keep their meaning.** Today an 80 or more has a green ring and 60 to 79 an amber one; on the branch
   every ring is light orange, so a strong match and a fair one look the same. Give the rings their colours back. Light
   orange stays for ticks and the key word. (The entry said "the score ring"; that was wrong.)
   (2) **The top bar once you scroll is cream, not white** (`.app-head.scrolled` is `rgba(255,255,255,.96)` on a cream page).
   (3) **First page headline: two lines from 390 wide,** `clamp(38px, 10.2vw, 48px)`. At 390 x 844 it now takes three
   lines, the Continue button sits 38px lower (732 to 788) and the help button covers its corner. At 360 wide nothing
   gets worse than today. (The entry's clamp was wrong for this one page; the story and the hold page keep theirs.)
   Not asked for: the ink sheet on a home's page is 1,028px tall, more than one phone screen, because the compatibility
   card and "What they're into" sit inside it. King leaves it; Kamal has been told to look at it.
   **GO, on a branch, after Parties; pictures before anything goes live.** The story, so it is read the same way by
   everyone: after this entry was written Kamal said in Teche's session (17 Nov) "Dont change the colors use our colors".
   Teche asked him to choose: 1, leave the app's colours as they are and drop the reel colours; 2, still do the reel
   colours after Parties. Kamal's answer there: "Go ahead do it" (King read it in the session's record). Read as 2. If he
   says otherwise in either session, that wins and King writes it here. Nothing of this is merged or published until
   Kamal has seen the pictures and said yes.
   **The reel look, for the whole app and the website: Kamal, 17 Nov, in King's session: "The colors are so amazing of
   the reels wht dont we use these for our app. Put your best efforts to pull these colors and font size and font colors and
   make the app and website awesome".** His own change to the look of 16 Nov. "The reels" are the ten feature reels King made
   on 17 Nov; the values below are the ones they were built with, so they are the source. King's message of 17 Nov has the
   reel's CSS and a description of each scene.
   - **Stays:** the logo and its colours; every layout and every word; the login; the onboarding questions; the two fonts
     (DM Serif Display and Urbanist, already in `vendor/fonts`; no new font); green for accepted, verified and "owes you",
     amber for look twice, crimson for danger, WhatsApp's own green. Colours are tokens (p8), body sizes stay on the scale,
     the contrast and speed suites pass.
   - **Cream `#FFF4E8`:** the page, everywhere (it was white). The top band and the bar behind the clock are the same
     cream, flat (no pink wash). This answers "white or pale orange for the top band".
   - **White `#FFFFFF`:** cards, sheets, inputs and the bottom bar, lifted off the cream by a soft warm shadow
     (about `0 10px 28px rgba(60,30,10,.12)`) and the hairline `#EEE8E2`. One rule: on cream a panel is white; inside a
     white card a panel is cream.
   - **Orange `#C2410C`** (the logo's): main buttons with white words, small labels, links, and one key word in a headline.
   - **Ink `#1C1917`:** text, what is selected, score discs, and dark sheets. On ink: titles white, small text `#D6D3D1`,
     chips `#2B2928` with white words, and light orange `#FDBA74` for ticks and the key word (score rings: see fix 1).
   - **Grey `#57534E`:** secondary text. No words lighter than `#6B635D`.
   - **Deep warm brown** (base `#5C2408`, soft glows `#7A3410`, `#9A5B00`, `#B45309`) inside a thin orange frame: only a
     home's header with no photo, the pictures people share and `og-image`. White serif words, key word `#FDBA74`.
   - **Type, on a phone:** welcome, story and hold-page headline in the serif at `clamp(40px, 11.5vw, 48px)`, line-height
     1.04; the headline on each tab's top band `clamp(30px, 8.6vw, 36px)`; headings inside cards and sheets 24px; rent and
     prices in the serif, 28px on cards and 32px on a home's page ("/month" stays small and grey); names and card titles
     Urbanist 800, buttons 800, chips 700. Body 16, small 14, captions 12.5 as now.
   - **The reel's three signatures:** (1) one key word in each main headline in orange (light orange on dark); the words
     are listed in King's message, other headlines get none. (2) A hand-drawn orange underline under that word, on the
     welcome page and the four story screens only; it draws once in about half a second and is simply there under
     "reduce motion". No other new motion. (3) On a home's page, "Who you'd live with" and the household's answers sit on
     one ink sheet (corners 20px, white serif title, dark chips, a light-orange tick on the answers you share). At most
     one ink sheet on a screen.
   - **How it ships:** one PR, the look only, no database change. Pictures before and after at 390 wide: welcome, story,
     Discover, a home's page (top and the ink sheet), Tribe, Flatsplits, FlatMart, Parties, Account, a chat, a dialog,
     My flat, Escape, the posting form; and the welcome page at 1280 wide. King checks them against the reels, then
     Kamal sees them. README "Look and feel" and the contrast suites follow the new look. Merge, the Android build and
     the website publish on Kamal's word.
   - **Your brief:** the look rule in `tech.md` changes only on Kamal's yes to these words: "Keep the look Kamal chose on
     17 Nov 2026 (README, 'Look and feel'), taken from the feature reels: cream pages, white cards, the logo's orange for
     main buttons, small labels and one key word in a headline, near-black text, dark sheets with light-orange accents,
     big serif headings. No other new colours; new screens use the tokens in `:root`. The logo and its colours never
     change with the look."
0000000. DONE 16 Nov: live (#115, 0e76f69, Android 220). **"Do you live in this flat?" Yes / No: Kamal, 16 Nov, in King's session: "Go and yes to all".** New posting-form
   question, stored as household.lister_lives_here. On No: no vibe copy from the lister, and the women-only check
   (fm_home_gender), the "You" row under "who lives there" and "Listed by a flatmate who lives here" stop counting the
   lister. Older listings without an answer fall back to #113's rule (room, bed or flatmate with residents >= 1; beds count).
   Its own PR after #113, with tests for Yes, No and no answer. Deploy on Kamal's word, database first.
   Same message: Kamal said "Go" to #113 and yes to Teche's tech.md look sentence (Teche asked him the exact wording).
000000. DONE 16 Nov: live (#113, c72fdea, Android 219). **Vibe fill-in only where the lister lives there: Kamal, 16 Nov, in King's session: "Fix the vibe fill-in when
   the lister doesn't live in the flat".** Copy the lister's own answers only for a room, bed or flatmate listing with
   household.residents >= 1. Otherwise there's no score: show "Vibe score after the household answers", sort those homes
   after scored ones, and add a My flat prompt to answer for the household. Clear the copy on the one Pune room from 9 Nov
   with 0 residents, and fix the posting form's pre-fill the same way. Tests for both paths. After the colour work.
   Deploy on Kamal's word, database first.
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

3. The blog takes articles as plain text files in `flatmates/marketing/blog/posts/`; the guide is
   `flatmates/marketing/blog/README.md`. Mark writes, Teche runs the script and ships. No schedule is set: that waits
   for Kamal. Same rules as all public copy: "launching soon", facts with a source, nothing about how the app works.

## Salu (community)
1. No group post that sends people to sign up until Kamal opens sign-up; admin requests and value-first drafts only.
2. On resume: the Wednesday pack from groups at `rules read` or better; the college outreach drafts are with Kamal.

## Decisions waiting for Kamal
- **The colours of 22 Nov (PR #123, open, nothing live): Kamal's yes to the finished pictures, in Teche's session.** After
  the preview Kamal told Teche "This looks cool change the colors of the app" (Teche's quote; King did not find the line
  in the session's record himself). Teche built what was shown: white page, pastel band per screen, an orange-red on
  buttons (`#E2461B`, the preview's made a little deeper), blue links, charcoal sheets; logo, layouts, words and login
  untouched. King read the pictures and the Android change and ran the branch: it is clean. **One choice is left to
  Kamal:** A, as built; or B, the same build with the logo's orange on buttons and the key word and dark links (two
  tokens). White words on a button read at 4.1 to 1 in A and 5.2 to 1 in B, and B has one orange on the screen where A
  has two. King recommends B and has sent Kamal the two side by side. Whichever he picks, the look then stays until
  sign-up opens, and the blog (still in the look of 17 Nov) follows in its own PR.
- **Parties, privacy (found by Teche, 17 Nov):** a party's distance is measured from the flat's exact pin and shown to
  100 m, and the place you measure from can be changed as often as you like, so someone patient could work out roughly
  where a flat is. Fix: measure from the rounded spot the map already uses, and limit how often the place can change.
  Distances get a little less exact. King recommends yes. A database change: on Kamal's word, database first.
- **Parties map, marks on top of each other (found by Teche, 18 Nov):** with many parties close together the map opens
  far out and the marks overlap until you pinch in. Teche has offered to fix it. King recommends yes.
- **The blog:** Kamal's read of the seven articles, and whether the word "Blog" stays in the first page's small print
  (website only). King recommends it stays: it is the only way in from the first page.
- **The repository:** two housekeeping questions King put to Kamal on 18 Nov in his session. On his yes they become
  Teche's tasks here.
- **On Kamal's phone (Android build 222 and the website):** a look at the new look on a real phone, and at Parties,
  Map. Teche cannot open either from his machine.
- Should Tribe matches under 70% be announced? King recommends no: show them, don't notify.
- The message limit of 30 an hour and 60 a day. King recommends keeping it until sign-up opens.
- When sign-up opens (needs the WhatsApp or SMS keys).
- Launch city and month: Pune first recommended.
- Meta Pixel and Google Ads IDs.
- An explicit 18+ tick at sign-up before the college route.
- Read-only web access for Mark's and Salu's sessions.

## Requests between teams
1. **Mark → Teche.** Pixel `CompleteRegistration` on owner sign-up and the Google Ads conversion; blocked on Kamal's IDs.
2. **Mark → Teche, later.** A `?host=Pune&area=<Area>` deep link per area. Not before item 1.
