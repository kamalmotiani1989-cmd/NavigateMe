# Teche · reports

## 2026-11-16, Monday check: all green. A preview of a new look is with Kamal (nothing merged)

- **Monday check:** the last runs on `main` are green (the website workflow, Pages, and Android build 215 on the
  #109 merge). The demo suites last ran on exactly this app code when #109 was merged (28 suites, 668 checks;
  database 235); I did not run them a second time today. Open PRs: seven, none new (#62, #73, #84, #86, #93, #94,
  #95), all waiting on Kamal or King. Supabase advisors: nothing new. The warnings are the known ones: the app's
  functions run as "security definer" (that is how the app talks to the database; the eight a signed-out visitor
  can call are exactly the ones `schema.sql` grants), `pg_net` sits in the public schema, the leaked-password check
  is off (we have no passwords), and there are info notes on indexes.
- **What Kamal asked (16 Nov):** two recordings and "Fix this. Also copy syle and colors of dwelo. Change the orange
  color to light red color show me 2 -3 pages before finalising".
- **This goes against a standing rule, and Kamal wins:** my brief says to keep the look Kamal chose on 8 Nov with no
  new colours. Kamal himself now asks for the change and asks to see it first. So nothing is merged, pushed or
  published. The preview is only on my machine (branch `claude/dwelo-look`, not pushed: the demo suites check
  today's colours, so they would not pass, and nothing goes up untested).
- **What I showed him:** before and after pictures of the first page, the home screen and a home's page, plus
  Profile and Tribe in the new look.
  - A cream page with white cards and warm shadows.
  - One light red (`#EE6468`) where the orange was: the logo, the small labels, links, the place you are on in the
    bottom bar and the main buttons.
  - A deep aubergine for text and the few dark pieces (the flatmate-type card, a home's header with no photo).
  - Headings in a serif (DM Serif Display, open licence, bundled like our other fonts). The rest stays Urbanist.
  - The login steps and the onboarding questions are untouched.
- **A choice I made, for Kamal to overrule:** the main buttons carry dark words on the light red (5.4:1). White
  words, as Dwelo has, would be 3.1:1, under the 4.5:1 our tests hold every screen to. Our light red is also a
  touch redder than Dwelo's coral, because he asked for light red.
- **"Fix this" is not understood yet:** one recording is of Dwelo (its home, profile and delete-account steps). The
  other is of a different, unrelated app from March 2025. I asked Kamal what he wants fixed.
- **Waiting on Kamal:** a yes or changes to the look, and what "fix this" means. Still open from before: whether
  Tribe matches under 70% should be announced, and the message limit of 30 an hour and 60 a day.
- **Left to do after his yes:** every other screen in the same look, the app icon and share pictures in light red,
  the tests that check colours, the README's "Look and feel", then the usual PR, build and publish.

## 2026-11-16, Tribe shows people down to a 30% vibe match (#109) live

- **What Kamal asked (16 Nov):** "In tribe show the match upto 30%".
- **What changed:** Tribe suggested only people at 70% or more. It now suggests everyone looking in your areas at 30%
  or more.
  - The page has two groups. "Vibe matches near you · 70%+" is first, in the order it always had (the same kind of
    home as you, then best vibe). Under it, "More people looking near you · 30% to 69%", in the same order.
  - The words follow: the first step of the journey, the rules, Account's "Show me in Build your tribe", the help
    bot.
- **A choice I made, for Kamal to overrule:** only the strong matches (70%+) are announced. A new person between 30%
  and 69% shows on the Tribe page with no notification, no count on the Tribe badge and no card on Discover.
  Otherwise every newcomer in a city would ping everyone in it. A yes from anyone is announced whatever the score.
- **Database:** `fm_tribe_refresh` matches from 30 (it was 70) and adds at most the best 60 new people a call;
  `fm_tribe_notify` pushes a new match only at 70 and up.
- **On today's live data** (read-only count): 114 people can be matched. 293 pairs are at 70%+ and 243 pairs between
  30% and 69%; no pair in the same city is under 30%. So in practice everyone looking in your areas now shows.
  People see the new ones the next time they open Tribe.
- **Not changed:** the login process, onboarding questions, colours. Passes, messages and the rest of #108.
- **Tests:** 28 demo suites, 668 checks; new `p30` (19). Database: 235 checks, 13 new
  (`parties-17-tribe-30.sql`).
- **Published:** 00ecb55; Android build 215 (file checked, checksum matches); website repo `main` and
  `gh-pages` say "Publish the app from NavigateMe 00ecb55". Live database: the merged `schema.sql` applied
  (checksum checked first) and verified read-only.
- **Still with Kamal from #108:** the message limit of 30 an hour and 60 a day.

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
