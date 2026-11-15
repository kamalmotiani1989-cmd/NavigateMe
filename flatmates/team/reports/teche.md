# Teche · reports

## 2026-11-15, help bot rebuilt, quicker messaging, the chat fills the screen, Passes by the name (#108) live

- **What Kamal asked (15 Nov):** "Fix the chat bot.. make me more better and make the messaging quicker. Also remove
  the passes from bottom bar and pop up whever the same is required. It should be in profile near the accout name".
  And, on seeing the chat screen: "Why is it showing so much of clank space down".
- **Help bot.** It counted any keyword it saw: "how do I message the owner" got the answer about listing a room,
  and of 30 everyday questions about 5 got a real answer.
  - Now about 60 topics written from the app as it is, with the app's own button names; words have weights (a
    phrase 3, a word 2, a word half the app shares 1); answers are personal (your contacts, your pass, your role).
  - Never a dead end: a close second is offered as "Or: …"; unsure, it gives its best guesses and a person.
  - "room in Pune under 15k" is offered as a search. "It's not working" offers a ticket with the kind filled in.
  - Tried on 265 questions written three ways (plain, messy, short with typos and Hinglish): all land right.
  - Still no AI service (the AI go-between is on hold). It says nothing about how sign-in codes are made; while
    sign-up is open to a few people at a time it says a code may not reach you yet.
- **Messaging.** Measured against the stand-in server at 300 ms a call:
  - opening a chat: blank for two answers (about 0.6 s), now on screen at once and filled after one;
  - sending: the box was locked for two round trips, now the bubble shows at once and the box is free;
  - the other person's message: up to 5 s, now about 2 s; the unread count: every 60 s, now every 20 s.
  - A message that can't go is tried again by itself (1.5 s, then 4 s), then says "Not sent" with Try again and
    Remove. Each message has its own id, so a retry can't send it twice.
  - Database: `fm_thread_get(p_thread, p_after)` gives only what's new and writes the "read" mark only when there
    is something new; `fm_thread_send(p_thread, p_body, p_id)` saves a message once per id and answers with its
    time. Both new arguments have defaults, so the app from before keeps working.
- **The chat screen** fills the screen: messages scroll, newest at the bottom, the box stays at the bottom above
  the keyboard. A short chat sits at the bottom next to the box.
- **Passes:** no tab and no screen. A Passes button by the name in Account (with a pass on: "Room Pass · 13 days
  left"); a pop-up wherever a pass is needed; an old `#plans` link opens the pop-up over the home screen.
- **Not changed:** the login process, onboarding questions, colours. The message limit (30 an hour, 60 a day).
- **Tests:** 27 demo suites, 649 checks; new `p29` (66) for all three, the chat part against the
  stand-in server. Database: 222 checks, 17 new (`parties-16-quick-messages.sql`).
- **Published:** b6a6558; Android build 214 (file checked, checksum matches); website repo `main` and
  `gh-pages` say "Publish the app from NavigateMe b6a6558". Live database: the merged `schema.sql` applied
  (checksum checked first) and verified read-only.
- **For Kamal to decide:** the message limit of 30 an hour and 60 a day may be low for people who chat a lot; say
  the word and I'll raise it.
- **For later, not urgent:** the list of chats (`fm_thread_list`) looks at every conversation to find yours. Live
  has 6 conversations, so it is instant; it needs rewriting before there are thousands. The README's messages
  section said 120 an hour, 600 a day; the code has always been 30 and 60, and the README now says so.

## 2026-11-15, faster app, every home in one list, the Escape's vibe score (#106, #107) live

- **What Kamal asked (15 Nov):** "Can u check the app is slow.. use ur skills and make it better. Also whther the
  vibe matches or not all properties should be shown. Starting with highest vibescore to lowest. Also in escape the
  room vibe score should be visible".
- **Speed.** Measured on a phone-sized browser slowed four times, against a stand-in server (250 ms a call):
  - first thing on screen 1.1 s, now 0.4 s; first homes 1.4 s, now about 1 s (slow connection, 600 ms a call:
    2.2 and 3.4 s, now 0.4 and 1.75 s);
  - server calls at start 17, now 12; going back to a tab was 4 to 8 calls, now none within 20 seconds.
  - Why it was slow: the screen stayed blank while the app asked the server three things one after another ("who
    am I" three times); every tab change asked 4 to 8 things again, some twice; and the typeface came from Google
    Fonts, which had to answer before anything could show. The server itself is quick (the homes list: about 50 ms).
  - What changed: the first screen is drawn at once from what the phone remembers; answers are kept for 20 seconds
    and emptied by any change; the typeface is in `vendor/fonts`. README, "Speed", has the rest, including what to
    do when adding a server function.
- **Discover:** one list of every home in the city, highest vibe score first, with a line saying so. The "Your vibe
  matches" row (80%+ only) and the "Minimum match" filter are gone. Homes that filters or the kind of home picked
  leave out show in a block under the list; only Women only / Men only takes a home off the page.
- **Escape:** every person shows their score with "vibe match" under it, best first.
  - Why it was missing: one live room (Pune, posted 9 Nov) had none of the home's living-style answers, so nobody
    could be scored against it. The posting form took those answers from a copy kept on the phone the account was
    set up on.
  - Database: `fm_listing_vibe` and a trigger put the lister's own answers on a listing that has none, on every
    post and edit; one statement filled that room. All 8 people looking there now have a score (40 to 60%).
  - If nobody can be scored, the Escape says so, with "Add them now".
- **Not changed:** the login process, onboarding questions, colours.
- **Tests:** 26 demo suites, 587 checks; new `p28` (45) runs the real page against a stand-in server and counts the
  calls. Database: 205 checks, 18 new. The runner used to count a suite that stopped on an error as a pass with fewer
  checks; it now fails it.
- **Published:** 90b01f8; Android build 213 (file checked, checksum matches); website repo `main` and `gh-pages` say
  "Publish the app from NavigateMe 90b01f8", and the published copy was run against the stand-in. Live database:
  the merged `schema.sql` applied (checksum checked first) and verified read-only. #107 corrected two lines in the
  README (no build).
- **Choices I made, for Kamal to overrule:** with "Private room" picked, private rooms still come first and the other
  kinds go under "More homes"; a whole flat nobody has answered for has no score and comes last.
- **Privacy page:** Google Fonts is off its list of services (no longer used), date 15 Nov. Noticed while there: the
  page names OpenStreetMap for maps, but the app uses Google Maps when its key is set, which it is. For King and
  Kamal, with #86.
- **For Kamal:** nothing needed. Still open: #86 privacy blanks, #95 merge or close, the host page and the strip
  behind the clock (both raised with #104).

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
