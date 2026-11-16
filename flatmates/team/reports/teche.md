# Teche · reports

## 2026-11-16, "Do you live in this flat?": built and tested, PR #115 waits for Kamal's go; my brief updated (#114)

- **What was asked (priorities, Teche 0000000; Kamal, 16 Nov, in King's session: "Go and yes to all"; in mine:
  "Start now"):** one Yes / No on the posting form, to tell a landlord with tenants from a flatmate who lives there.
- **State:** built, tested, PR #115 open. **Not merged and not deployed.** The priorities entry says deploy on
  Kamal's word, database first; I have asked him.
- **The form asks** for a room, a bed or a flatmate listing, right above "People living there now", with nothing
  picked, and does not go on without an answer. A whole flat isn't asked. Stored as `household.lister_lives_here`.
  - **Yes:** as before.
  - **No:** the count is the people who do live there and none of them is "You"; the lister's own answers are never
    copied (the questions start empty, to be answered for the household; a copy the listing carried is taken out);
    the home says "Owner-listed"; the lister's gender no longer counts in the women-only check.
  - **No answer** (older listings, older Android builds): read as before (#113's rule, beds included). The editor
    asks on the next save.
- **Database:** `fm_home_lived_in` (someone lives there) is split from `fm_lister_lives` (the lister is one of
  them); `fm_listing_vibe` and `fm_home_gender` follow. On today's live data the two one-time statements touch
  nothing.
- **Why database first matters here:** the new form with the old database would still copy a landlord's answers
  on a No.
- **Two things I added that the entry did not spell out, small and listed in the PR:** the count's first option
  reads "Nobody yet" for a room (it said "Nobody, it's a whole flat" there too); and a whole flat is not asked the
  question, because nothing about it depends on the answer.
- **Tests:** database suite on a fresh local Postgres: schema applied twice, 266 checks pass (17 new). App: 31 demo
  suites, 787 checks (was 30 and 753); new suite `p33` with 33; `p5`, `p28`, `p32` and `pass3` now answer the
  question where they save a listing.
- **My brief (#114, merged c34f723, on Kamal's yes):** the look rule in `tech.md` now names the look of 16 Nov and
  ends "The logo and its colours never change with the look." Nothing to build or publish for it.
- **Needed from Kamal:** his go for #115. Then: apply `schema.sql`, check read-only, merge, publish, report.
- **Still with Kamal:** pure white or the pale orange for the top band; whether Tribe matches under 70% should be
  announced; the message limit of 30 an hour and 60 a day.

## 2026-11-16, vibe score only where the lister lives there (#113) live, on Kamal's go

- **The go:** Kamal, 16 Nov, in King's session: "Go and yes to all", recorded by King in `priorities.md` (d1a3d1e).
  I acted on that written record. It covered three things: go on #113, yes to the "Do you live in this flat?"
  follow-up, and yes to the look sentence for my brief.
- **Order, database first:**
  1. applied `schema.sql` from the PR's commit to the live database (fetched inside the database, checksum checked
     against my file, then run);
  2. checked it read-only;
  3. merged #113 (c72fdea), which built Android build 219;
  4. published the website.
- **Database, checked before and after:**
  - 105 listings. The room in Pune posted 9 Nov now has no living-style answers and no generation; it keeps who
    lives there, interests and rooms free exactly as they were.
  - The other 104 listings are unchanged (same fingerprint before and after).
  - The rule is in place: `fm_lister_lives` and the three-argument `fm_listing_vibe` exist, the older form is gone,
    the trigger now also runs when the kind changes, and none of them can be called from the app.
  - 77 homes can show a score (the lister lives there and the answers are on the listing).
- **What changed for people:** as in the entry below. Someone looking at a room nobody lives in sees "Vibe score
  after the household answers"; its lister is told why in My flat and the Escape, with "Say who lives there"; the
  posting form asks the living-style questions only while someone lives there.
- **Published:** c72fdea; Android build 219 (file checked: the fix is inside, checksum matches the release); the
  website repo's `main` and `gh-pages` say "Publish the app from NavigateMe c72fdea". The published copy opens
  with no page errors, and with its live backend switched off it behaves as in the tests (the line on the card and
  the page, unscored homes last, the lister's prompts, the form).
- **Tests:** as built: database suite 249 checks, 30 demo suites 753 checks. A full demo run on the merged code is
  under way as I write, for the brief change below.
- **Next:**
  - my brief's look sentence and the logo rule, on Kamal's yes: a small PR to `flatmates/team/tech.md`;
  - priorities 0000000, "Do you live in this flat?": its own PR, deploy on Kamal's word, database first.
- **Still with Kamal:** pure white or the pale orange for the top band; whether Tribe matches under 70% should be
  announced; the message limit of 30 an hour and 60 a day.

## 2026-11-16, vibe score only where the lister lives there: built and tested (it then waited for Kamal's go; live since, see above)

- **What was asked (priorities, Teche 000000; Kamal, 16 Nov, in King's session):** "Fix the vibe fill-in when the
  lister doesn't live in the flat".
- **State:** built, tested, PR #113 open. **Not merged and not deployed.** It goes live only on Kamal's word,
  database first, as the priorities entry says.
- **The rule:** the lister's own answers stand in for the household only where the lister lives there (a room, a
  bed or a flatmate listing with 1 or more people living there). A whole flat, or a room in a flat nobody lives
  in, carries no living-style answers and so has no vibe score.
- **What people will see:**
  - someone looking: "Vibe score after the household answers" on such a room or bed, on its card and its page;
    it comes after the homes with a score; they can still ask to meet. A whole flat says nothing, as before;
  - the lister: My flat and the Escape say why, with "Say who lives there", which opens the listing on "Your
    household";
  - the posting form asks the living-style questions only while someone lives there.
- **Database:** `fm_listing_vibe` copies only where the lister lives there and drops the answers elsewhere, on
  every post and edit, so it also holds for older Android builds (they keep pre-filling the form until updated).
  A one-time clear removes answers from homes the lister doesn't live in.
- **Live data, checked read-only:** 105 listings; the clear will touch exactly one, the room in Pune posted
  9 Nov (it keeps everything else it says). No other listing changes.
- **Different from what I told King earlier today:** I had planned to keep answers a lister gives by hand for a
  home nobody lives in. I dropped that: such answers describe nobody, which is the fault being fixed. With
  "Nobody" picked the questions are put away; the way to a score is to say who lives there, then answer.
- **Judgment calls, for King and Kamal to overrule if they wish:**
  - no new question in the form, so a landlord who counts tenants as living there is still taken to live there;
  - a whole flat shows no "after the household answers" line: it has no household that could answer;
  - a lister of such a room on an older Android build still sees the old prompt, and answers given there are not
    kept. One lister is in that position today;
  - the interests line on a card ("You both like...") is not touched.
- **Tests:** database suite on a fresh local Postgres: schema applied twice, all 249 checks pass (16 new). App: 30
  demo suites, 753 checks (was 29 and 719); new suite `p32` with 34.
- **Needed from Kamal:** his go. Then: merge, apply `schema.sql`, check the Pune room and the rest read-only,
  publish the website, report.
- **Still with Kamal:** pure white or the pale orange for the top band; whether Tribe matches under 70% should be
  announced; the message limit of 30 an hour and 60 a day.

## 2026-11-16, the app in the logo's colours (orange and white), and a page-by-page audit (#112) live

- **What Kamal asked (16 Nov, after #111):** "Also take the app color as the color of logo which was earlier and
  white. Plus check the font color accordingly. Do your best here. Audit once done. Spend some time on each page and
  audit the gaps of colors font everything".
- **Standing rule and Kamal:** my brief still says to keep the look of 8 Nov with no new colours. Kamal asked for
  this himself, as he did for #110. **King: the look sentence in my brief needs your update** (wording in my
  message to you).
- **The colours now:**
  - white for the page and the cards, and for words on anything orange;
  - the logo's orange (`#C2410C`) for main buttons, small labels, links, badges, the bottom bar's current screen,
    progress bars, switches, tick boxes and focus rings;
  - the wordmark's near-black and grey for text and the few dark pieces;
  - bands and panels in pale tints of the orange;
  - the light red and the deep aubergine of #110 are gone. Its style stays (serif headings, pill buttons, white
    cards, spaced capital labels).
- **Danger moved to a crimson.** The old red sat a few degrees from the logo's orange, so an error edge and the
  focus edge of a box looked alike. Green and amber keep their meanings.
- **It also covers** the pictures people share (now an orange card with white words), the Vibe Card, the chart and
  people-dot colours, map pins, the payment sheet, the picture shown with a shared link, the privacy and Coming soon
  pages, the installed app's colours, and the Android window, strip and notification colour.
- **How the audit was done:**
  - 60 full-page pictures (phone and computer) plus the suites' own 129 screenshots, read one by one;
  - a census inside every page the 29 suites open: every colour, every text style, every text under 4.5:1;
  - result after the fixes: no colour outside the palette, no text under the floor.
- **What the audit found and fixed:**
  - a "live" dot on invitation banners was a pale tint on a pale panel, invisible;
  - "Sell something" in FlatMart was the last dark main button;
  - Sign out and Delete my account had taken the accent colour in #110;
  - the letters in front of sign-up and quiz answers sat on eight unrelated colours;
  - "what you wrote" was a dark bubble in the help chat and a pale one in a real chat;
  - the party form's two time boxes had the browser's own look;
  - on a computer the Passes pop-up was too narrow for three passes: titles broke in two and a tag covered a name;
  - small capital captions came in four sizes, two weights and seven spacings (now one style), and a section label
    that ran to a second line started it under the dash;
  - words picked out inside a serif heading computed as bold; bold inside bold was drawn at the blackest cut; four
    text sizes were off the scale;
  - a hint in the area box was cut off on phones ("e.g. HSR Layou");
  - one leftover aubergine line in the tribe drawing.
- **Looked at and left alone:** badge text under 12px (the spec allows it); the amber family; the cartoon people;
  the score ring's colours; the very wide "Show me parties near me" button on a computer; the strip behind the
  clock on Android stays near-black because I cannot try another colour on a phone.
- **Not changed:** the login process, the onboarding questions, any screen's layout or words (one hint aside), the
  logo's files, the database.
- **Tests:** 29 demo suites, 719 checks (was 704). `p31` has 15 more checks: the palette is the logo's own
  colours, and one for each audit fix. `p8`, `p26` and `p27` describe the new colours; `p8` now reads every piece
  of orange text against what is behind it.
- **Published:** 456cc10; Android build 218 (file checked: the app inside has the new colours and none of the old,
  the launcher icons are the orange tile, the checksum matches the release); the website repo's `main` and
  `gh-pages` say "Publish the app from NavigateMe 456cc10"; the published copy opens with no page errors, with the
  orange button, white page, the logo, and the privacy and Coming soon pages in the same colours.
- **For King to pass on to Mark:** the app's accent is the logo's orange again, so creatives made before 16 Nov
  match it. Screens shown in them have changed (white pages, serif headings).
- **Next (priorities, 000000):** the vibe fill-in only where the lister lives there. I start it now, as one PR, and
  deploy only on Kamal's word, database first. No new question goes into the form: its "People living there now
  (including you)" already tells the two cases apart (in chat I had first told Kamal a question would be added; I
  am correcting that with him).
- **Still with Kamal:** whether Tribe matches under 70% should be announced; the message limit of 30 an hour and 60
  a day.

## 2026-11-16, the logo is back as it was: Kamal's own drawing and its orange (#111) live

- **What Kamal asked (16 Nov, after seeing #110 live):** "App and website logo to stay the same as ealier" and
  "App and website logo color to stay same as earlier".
- **My mistake in #110:** I read "change the orange color to light red" as covering the logo too and recoloured
  it. The logo is not part of the look.
- **Now:** the logo is exactly as it was before #110, everywhere it shows: the top bar of the app and the website,
  the tab icon, the home-screen and Android launcher icons, the pictures people share, the picture shown with a
  shared link, the privacy page and the Coming soon page.
  - All 19 logo and icon files are byte for byte the ones that went in with Kamal's logo on 9 Nov (`b6299bd`).
  - The soft glow under the tile is its own orange again.
  - Measured against the app before #110, the logo sits in the same place at the same size on the first page and
    in the app, on a phone and on a computer.
- **Kept:** the rest of the look of 16 Nov. The Android bars and the notification colour too (they were never the
  logo's colour).
- **A standing rule from now on. King, please add it to my brief:** the logo and its colours do not change with
  the look. README ("Logo") says so, and `p31` holds the 19 files to their fingerprints, so a later change of look
  cannot touch them by accident.
- **Tests:** 29 demo suites, 704 checks (was 696). `p31` has 8 more: the logo's colours, the files' fingerprints,
  every icon orange, the logo as drawn on the first page, signed in and on the privacy page, the website's share
  picture, the Coming soon page. They fail on the app as it was this morning and pass now. No database change.
- **Published:** 1fe5dfd; Android build 217 (file checked: every launcher icon inside is the orange tile, the logo
  files inside match, and the checksum matches the copy on the website's release); the website repo's `main` and
  `gh-pages` say "Publish the app from NavigateMe 1fe5dfd", and the published copy shows the logo with no page
  errors. The publish step went through first time.
- **For King to pass on to Mark:** ignore my note under #110 about light red logo files. The logo in `marketing/`
  and in PRs #93 and #94 is the right one.
- **Next, already started (Kamal, 16 Nov):** "Also take the app color as the color of logo which was earlier and
  white. Plus check the font color accordingly. Do your best here. Audit once done. Spend some time on each page
  and audit the gaps of colors font everything". So the light red goes too: the app's colour becomes the logo's
  orange with white, then a page-by-page audit. Its own PR and report entry.
- **Relayed by King, waiting for Kamal's word:** "Fix the vibe fill-in when the lister doesn't live in the flat".
  Checked read-only, nothing changed:
  - the flaw is real (#106 copies the lister's own answers onto a listing with none, whoever lives there);
  - one live listing carries such a copy: a room in Pune posted 9 Nov, which says nobody lives there;
  - the posting form already asks "People living there now (including you)", so no new question is needed to
    tell the two cases apart;
  - I asked Kamal for his go in my session, because the request reached me as another session's message and
    `priorities.md` does not list it. Nothing is pushed or changed for it.
- **Still with Kamal:** whether Tribe matches under 70% should be announced; the message limit of 30 an hour and
  60 a day.

## 2026-11-16, the new look is on every screen and page; sign-up's city step fixed (#110) live

- **What Kamal asked (16 Nov):** after the five preview pages, "Ignore inspectai. Do it for the entire app and
  website". Then, with two screenshots of sign-up's "Which city?" step, "Fix this also".
- **This went against a standing rule, and Kamal wins:** my brief says to keep the look of 8 Nov with no new
  colours. Kamal himself asked for the change. **King: the brief's sentence about the look needs your update**
  (suggested words in my message to you).
- **The look, everywhere:**
  - a cream page with white cards;
  - one light red (`#EE6468`) where the logo's orange was: the logo and every icon made from it, the main buttons,
    small labels, counts, the screen you're on in the bottom bar;
  - deep aubergine for text and the few dark pieces;
  - the lavender, butter and mint panels are rose, apricot and peach tints;
  - headings in a serif (DM Serif Display, open licence, bundled). The rest stays Urbanist.
- **It also covers** the pictures people share (a home, a FlatMart thing, a party, the Vibe Card), the
  compatibility chart, map pins, the privacy page, the Coming soon page, the picture shown with a shared link, the
  installed app's colours, and the Android app's icon, bars and notification colour.
- **A choice Kamal saw in the preview:** the red buttons carry dark words (5.4:1). White words, as the other app
  has, would be 3.1:1, under the 4.5:1 our tests hold every screen to.
- **Fixed on the way:**
  - the moving-out sale page and the page for people with a spare room had white words on a light band;
  - sign-up's back button was a white arrow on a faint disc;
  - one amber label read at 4.4:1.
- **The city step ("Other city"):** the box used the phone's own pop-up list, which opened over the chips, the
  keyboard and Continue. Now the cities are chips under the box that follow what you type, any name can still be
  typed, and on a phone the keyboard waits until you tap the box. Same question, same words, same answers.
- **Not changed:** the login steps, the onboarding questions, what any screen says or does. No database change.
- **Tests:** 29 demo suites, 696 checks (was 28 and 668). New `p31` (28 checks): the palette, the serif, the logo,
  the buttons, no old colours left and every word readable on each screen, the share pictures, the privacy page,
  the city step. `p8`, `p19`, `p26`, `p27` and `p28` now describe this look.
- **Published:** e5f4176; Android build 216 (file checked: the light red icon, the new pages and the city step are
  inside, and the checksum matches the copy on the website's release); the website repo's `main` and `gh-pages`
  say "Publish the app from NavigateMe e5f4176", and the published copy passes a smoke test.
- **One hiccup:** GitHub refused the website publish step's own push twice (403) with no branch rule or setting
  behind it that I could find; the third try, five minutes later, went through. If it happens again, retry.
- **For King to pass on:** Mark's creatives (PRs #93, #94) and the files in `marketing/` still show the orange
  logo and the old colours. The light red logo files are `flatmates/icons/logo.svg`, `logo-icon.svg` and
  `wordmark.svg`.
- **Not done, on purpose:** the area boxes on the post form and FlatMart still use the phone's pop-up list (they
  have no chips to cover, and Kamal's screenshots were of the city step). Dwelo's way of deleting an account was in
  Kamal's recording; he did not ask for it, so it is untouched.
- **Still with Kamal:** whether Tribe matches under 70% should be announced; the message limit of 30 an hour and
  60 a day.

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
