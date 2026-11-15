# Teche · reports

## 2026-11-15, website repo PR #2 merged (status message), on Kamal's yes

- **What:** findmeflatmate PR #2 is merged (8679471). One line in the last step of its `publish.yml`: the step now
  knows the site by how its title starts, so it stops printing "not this site yet" for a site that is fine.
- **Who merged, and why me:** priorities says Kamal merges there. He tried on his phone and found no merge button:
  his phone's browser is signed in to GitHub with a different account from `kamalmotiani1989-cmd` (in his screenshot
  the picture at the top right is not the PR author's), and an account that can't write to the repo is shown no
  merge button. I asked him; he chose "Yes, merge it". Merged on that yes, not on my own.
- **Checked:** ran `publish.yml` once (run 141, passed). Its summary now reads "(FindMeFlatMate)" for all three
  addresses. The site's files are unchanged; Android build 212 is unchanged (same checksum).
- **Good to know:**
  - The website repo's `main` and `gh-pages` are both 8679471, the merge, until the next app change is published;
    after that they say "Publish the app from NavigateMe <sha>" again.
  - "status: errored" in the job's summary is not a failure. Every publish starts two Pages builds (one from its
    push, one it asks for); the first is replaced by the second and shows as cancelled, the second passes. The
    build for 8679471 passed.
- **For Kamal:** nothing. Still open: #86 privacy blanks, #95 merge or close, the host page and the strip behind
  the clock (both raised with #104).

## 2026-11-15, Tribe and Saved change places on phones (#105) live

- **What (Kamal: "Interchange the position of tribe and saved or shortlisted buttons on the app"):** on phones Tribe
  is a tab in the bottom bar where Saved was (mint when you're on it, with its count), and Saved is a round heart
  button in the top bar where the Tribe button was (black when you're on it). The bottom bar for someone looking is
  Discover, Tribe, Parties, Splits, Market, Passes. On a computer both stay tabs in the top row.
- **Not changed:** what the two screens do; owners and Flatsplits-only accounts (they have neither). No database
  change.
- **Tests:** all 25 demo suites pass; `p26` (31 checks) covers the swap.
- **Published:** 6dbe1a7; Android build 212 (file checked: checksum matches). The website repo's `main` and
  `gh-pages` say "Publish the app from NavigateMe 6dbe1a7".
- **Screenshot:** [before and after](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/d107412349b44e8234239f1517ede1b9694b7746/tribe-saved.png).
- **For Kamal:** he asked for the steps to merge findmeflatmate PR #2; I gave them (open the PR, Merge pull request,
  Confirm merge). Still open: #86 privacy blanks, #95 merge or close, the host page and the strip behind the clock
  (both raised with #104).

## 2026-11-15, clean login page, Parties as its own section, two layers on every screen (#104) live

- **What Kamal asked (15 Nov):** "Make parties near by a seperate section all together and an amazing one. Also work
  on the entire design and UI interface… make the app and website look amazing. The double color shade looks super
  amazing and the bottow bar looks cool. Reduce the information on the login page of website and app as people might
  copy the same. Make it more clean."
- **Login page (website and app), short on purpose:** the headline, one line, the sign-up card, a row of our cartoon
  people and one line of small print. On a phone it went from 8,767 px long to 1,303. The sections that explained
  the app (how it works, try a search, safety, more than a room, the questions, the closing band, the FAQ data for
  search engines) are off the page; what the app does is shown after sign-in. Two layers: the words on a lavender
  band, the card on the sheet. **The sign-up card and its steps are untouched.** `p25` now fails if a feature is
  named on this page outside the card.
  - This undoes most of the morning's website refresh (#101). The title, the share picture, robots.txt and the
    sitemap stay.
- **Parties, its own section:** a Parties tab for everyone (butter). Before it's on: what it is in three lines and
  the switch. Once on: your requests first, then the parties near you as cards, with Today / This weekend / Free
  entry, the parties you're hosting, "Host a party", the rules, and a way to switch it off. Nearby parties no longer
  show inside Splits; Account keeps the switch. The rules are unchanged (off by default, 21 and over, the address
  only after a yes). No database change.
- **Two layers on every main screen (phones):** each screen opens on its own pastel band with the sheet over it.
  Account shows the name first, the passes under it. The old teal "N selected" bar on Escape is near-black now.
- **Not changed:** the login process, onboarding questions, colours (our pastels only), the database, the Android
  shell, the host page, the privacy page, computers' layout.
- **Tests:** all 25 demo suites pass. `p25` rewritten (20 checks), new `p27` (32 checks: Parties and every band),
  `p9` (35) now runs on the Parties screen. `p25` and `p27` also pass on the compacted page.
- **Published:** c5320a0; Android build 211 (file checked: checksum matches, it carries Parties and the short login
  page). The website repo's `main` and `gh-pages` say "Publish the app from NavigateMe c5320a0".
- **For Mark and Salu:** the website no longer explains features, so posts shouldn't point people to it for "how it
  works". Screenshots of the app need retaking (new tab, new tops on every screen).
- **Screenshots:** [login, phone](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/9da057c0ecf43f2a15a0e27432a282c848838203/login-phone.png),
  [login, computer](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/9da057c0ecf43f2a15a0e27432a282c848838203/login-computer.png),
  [Parties](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/9da057c0ecf43f2a15a0e27432a282c848838203/parties.png),
  [Splits and Market](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/9da057c0ecf43f2a15a0e27432a282c848838203/bands.png),
  [Tribe and Account](https://raw.githubusercontent.com/kamalmotiani1989-cmd/NavigateMe/9da057c0ecf43f2a15a0e27432a282c848838203/bands2.png).
- **Not done, for Kamal to decide:** the band's colour behind the clock and battery (needs an Android shell change
  I can't try on a phone); the host page (`#host`) still lists who's looking near an area, which is also public.
- **Still waiting on Kamal:** findmeflatmate PR #2 (one line), #86 privacy blanks, #95 merge or close.

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
