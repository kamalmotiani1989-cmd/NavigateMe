# Teche · reports

## 2026-11-15, two-layer home and frosted bottom bar on phones (#103) live

- **What (Kamal, from a screenshot of Dwelo's home: "the double shade looks super amazing and the bottom bar looks
  cool… do the same"):** phones only, in our colours.
  - **Home screens:** the greeting sits on a pastel band that fills the top of the screen, top bar included
    (lavender on Discover, butter on My flat). The page below is a sheet with round corners that comes up over it.
    Words on the band are near-black. While scrolling, the top bar keeps the band's colour until the sheet reaches
    it.
  - **Bottom bar:** a frosted pill. The screen you're on is a soft pill in that screen's own pastel with dark words,
    where it was a black button. Every place keeps its name under its icon.
- **Two small fixes found on the way:** at 320 wide the account button was squeezed (round again; Tribe is its icon
  alone under 350 px). On short phones the "N selected" bar on Escape sat partly under the bottom bar (it now rests
  above it, and Help steps out of its way).
- **Not changed:** colours (only our pastels), login, onboarding questions, computers, the Android shell. No
  database change.
- **Tests:** all 24 demo suites pass; new suite `p26` (27 checks), also run on the compacted page.
- **Published:** 27fd447; Android build 210 (the app file was checked: it carries the new home, and its
  checksum matches the release). The website repo's `main` and `gh-pages` say "Publish the app from NavigateMe 27fd447".
- **Screenshots:** [before and after](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/04eec74cf3f57b303fdc08972045c132831ae057/home-before-after.png),
  [scrolling and the bar](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/04eec74cf3f57b303fdc08972045c132831ae057/home-scroll-bar.png).
- **Offered to Kamal, not built:** the same two-layer top on Splits, Market, Passes and Escape; the band's colour
  behind the clock and battery (needs a change in the Android shell, which I can't try on a phone from here);
  icons only in the bottom bar.
- **Still waiting on Kamal:** findmeflatmate PR #2 (one line), #86 privacy blanks, #95 merge or close.

## 2026-11-15, website refresh (#101) live; Android builds only for app changes (#102)

- **What (Kamal: "make the website also better"):** the page a visitor sees before signing in.
  - The picture at the top is a match card drawn from our cartoon people, where the grey skyline was.
  - "How it works" is a card for each side, each with its own button.
  - New parts: try a search (the app's own search reader, live), Safety (six things the app already does), the
    Move-in kit and flatmate-type cards, ten questions and answers, a closing band.
  - On a phone the "More than a room" cards are a row to swipe; nothing scrolls sideways from 320 wide.
  - On a computer the opening story and the welcome are a card in the middle of the screen.
- **For search engines and shared links:** the title is now "FindMeFlatMate: find flatmates who match your vibe"; a
  1200 x 630 share picture (`og-image.png`); `robots.txt`, `sitemap.xml`; the FAQ as schema.org data. No ads, no
  "download now" wording added; sign-up is as before.
- **Not changed:** login, colours, onboarding questions. No database change.
- **Checked against the README:** every claim on the page (pricing, two addresses, what a report pauses, the kit).
- **Tests:** all 23 demo suites pass; new suite `p25` (32 checks), also run on the compacted page.
- **Published:** c3c590d; Android build 209. I can't open findmeflatmate.com from my machine (its network blocks
  it), so I checked the website repo: `gh-pages` holds the new page and the three new files.
- **Also fixed (#102):** every push under `flatmates/` (reports, marketing files, tests, the README) started an
  Android build with a new number, and since #92 the app shows "a new version is ready" for any higher number. So
  people with the app were being told to update when nothing had changed. The build now starts only when the app's
  own files change (`index.html`, `privacy.html`, the manifest, `icons/`, `vendor/`, `android/`). Reports no longer
  start one. Newest build is still 209.
- **Waiting on Kamal:** findmeflatmate PR #2, one line. The publish job's status line looks for the exact old title
  and now prints "not this site yet" for a site that is fine. It only reports; publishing works as before.
- **Screenshots:** [computer](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/64c962ff475d2cc6ce054d9ff2972dd50aff4df0/website-computer.png),
  [phone](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/64c962ff475d2cc6ce054d9ff2972dd50aff4df0/website-phone-before-after.png),
  [new parts](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/64c962ff475d2cc6ce054d9ff2972dd50aff4df0/website-phone-new.png),
  [share picture](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/64c962ff475d2cc6ce054d9ff2972dd50aff4df0/website-share-picture.png).
- **Next (Kamal, 15 Nov, from a Dwelo screenshot):** a two-layer home (colour on top, a rounded sheet over it) and a
  lighter floating bottom bar, in our colours.

## 2026-11-15, number-last sign-up, clean UI, match reasons, scam warnings, Move-in kit (#98, #99, #100) live

- **Sign-up, number last (#98; Kamal approved):** what brings you, then name, then Woman/Man, then the number and
  18+. Each step has "x of 4", a back arrow and a line using the name. Name and gender are saved on verify, so
  onboarding skips them. "I already have an account" goes straight to the number. Our colours are kept.
- **Clean UI (#99, after Kamal's look at Dwelo):**
  - search like you'd talk (sentences become filters, on the phone);
  - a 4-screen opening story drawn with our avatars;
  - a welcome screen after sign-up;
  - cleaner home cards, with rent first and a row of chips;
  - filters as cards with a two-thumb rent slider;
  - a friendlier notifications ask, with "Not now".
  As Kamal asked: no required photos, no religion.
- **From Kamal's competitive teardown (#100):** "N things in common" on cards; scam warnings on messages and listings
  that ask for money up front; a Move-in kit after a yes (an editable flatmate agreement, a 10-item checklist,
  Flatsplits).
- **Tests:** all 24 demo suites pass. No database change in any of these.
- **Published:** 6cca460 (#99, which included #98); #100 published (2dc96be).
- **Screenshots:** [sign-up](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/42be35711526470cb4da890a9e99da56d22ec160/signup-before-after.png),
  [clean UI](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/c655911da69c29ec39ed28441790e36f42fedbaa/clean-ui.png),
  [reasons/scam/kit](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/4bd89ee19de7ae720c6786f136a122e2b329c49c/reasons-scam-kit.png).
- **Open for Kamal (from the teardown):** the name risk (findmyflatmate.in is a live Bangalore site), city focus,
  and the #86 privacy blanks (including a named grievance officer).

## 2026-11-13, Vibe Card pastel and trust line (#97) live

- **Vibe Card (King's follow-up):** on screen and in the 1080×1920 share image it's now the rhythm's pastel panel,
  with ink text, the logo and wordmark, and the avatar large. Same words as before. VC_PALETTE is in the p13
  contrast audit, and everything passes at 4.5:1.
- **Home card trust line:** it fits on one line at 360 and 390 again. There's no avatar there (no room, and no name
  is shown), and the spacing is a little tighter at the scale's 12.5 px.
- **Tests:** 19 demo suites pass. No database change. Published 5725b62.
- **Screenshots:** [before/after](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/f5d61e960c787b5c68bff62668b42a5fc8a43488/vibecard-before-after.png).

## 2026-11-13, avatars (#96) live

- **What (Kamal, through King):** people build a cartoon of themselves, and it shows where their initial used to.
  - The maker is one screen with six rows: skin tone (6), face, hair and colour, head covering (hijab, turban or
    cap) and colour, glasses and beard, top colour. It updates live as you tap.
  - Skip is always there, and nothing is picked for you.
  - Seekers see it once after onboarding's reveal. Everyone can open it from Account or the Vibe Card; owners also
    from their own row in "who lives there".
  - The flatmate type sits on top: the scene comes from the rhythm, the held prop from the habit (12 props, 9 new),
    and it follows the answers.
- **Shows in:** the top bar, home cards, Tribe (cards, map, bonded), Escape and My flat, requests, messages and the
  chat header, FlatMart sellers, party guest requests, Account, and the Vibe Card. On the Vibe Card it moves on
  screen and is a still in the shared image.
  - No avatar shows a neutral default.
  - Only the Vibe Card, Account and the maker move. Reduced motion means nothing moves.
- **Database (live first):** fm_profiles.avatar, plus fm_avatar_valid (palette-only values, also a check on the
  table), fm_set_avatar and fm_avatars(kind, ids).
  - The schema was checked by md5 (0dcc3b9c…) and applied live.
  - The rolled-back live check passed: save and read OK, bad values refused, signed-in only.
- **Privacy:** a line about avatars added to the #86 draft.
- **Tests:** DB 187 checks, 0 failed. Demo 19 suites, 0 failed (new p21: 30 checks). The p13 and p19 contrast
  audits pass.
- **Published:** ebe68c4. Before and after screenshots at 390 wide: [before/after](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/c5a27a7a88a2e3336e88dd4ba1b9b03fa8097866/avatars-before-after.png),
  [maker](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/c5a27a7a88a2e3336e88dd4ba1b9b03fa8097866/avatars-maker.png), [chat](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/c5a27a7a88a2e3336e88dd4ba1b9b03fa8097866/avatars-chat.png).
- **Note:** I couldn't confirm the Open Peeps licence (the site doesn't resolve from here), so all the parts are our
  own drawings.

## 2026-11-13, app update card (#92) live

- **What (Kamal):** the Android app now says "A new version of the app is ready", with an Update button, when a
  newer build is out.
  - How: it compares its own build number (sent from MainActivity) with the "build N" in the public flatmates-apk
    release notes, at most every 6 hours.
  - The × hides it for a day, per version. The website never shows it.
- **Published:** 663d7aa; the release notes say build 197. The APK build passed, so the Java change compiles.
- **Note:** only phones on build 197 or later can check, so everyone needs one manual download first.
- **Tests:** new suite p20; 18 suites, 0 failed. No database change.

## 2026-11-13, owner home colours and audit (#91, live)

- **What (King, from Kamal's 13 Nov screenshot):**
  - The Empty Room Escape card on My flat and the Account "Your passes" panel still had navy-era white and mint text,
    and an orange link, on the lavender tile.
  - They now have dark text, grey for the secondary lines, and nothing orange inside.
  - The "Replies within hours" line and the listing card already passed the contrast check.
- **Audit:** new suite p19 checks contrast on My flat (with people looking), requests, the Escape list, the posting
  form and Account, so this can't come back.
- **"Kamal · Xyz":** not a bug.
  - It's a separate seeker account (26 Oct, a different number, probably a test account).
  - The live fm_find_seekers already leaves out the owner.
  - The demo now does the same.
- **Tests:** 17 suites, 0 failed. No database change.
- **Status:** merged and published (0ddb42f).
- **Screenshots:** [before](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/4ec0b2b9b73565cb9afc352db06b671a9638fde8/owner-before.png), [after](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/4ec0b2b9b73565cb9afc352db06b671a9638fde8/owner-after.png).
- **Earlier:** the 10 Nov "city card overlap" was the first photo on Kamal's Pune listing, which looks like a
  screenshot of the app. It isn't a code bug.

## 2026-11-10, Discover declutter (#90) live

- **What:** Discover no longer has the area chips or the quick-filter chips (Women only, Veg kitchen and the
  others), as Kamal asked: the map already shows where homes are, and this frees up the page.
  - Areas are now the first section of Filters ("Areas in <city>", with + Add area; none picked means the whole
    city).
  - The areas and filters you chose show as removable chips under the Filters button.
- **Database:** no change.
- **Tests:** demo suite, 16 suites, 0 failed. p12 and p15 now go through Filters.
- **Open:** Kamal's screenshot showed a listing's tags drawn over the "Which city are you moving to?" card. Not
  looked into yet; offered as the next fix.
