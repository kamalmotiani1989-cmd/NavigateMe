# Teche · reports

## 2026-11-18, the reel look on every screen (#117) live, on Kamal's yes

- **What was asked (Kamal, 17 Nov, in King's session):** "The colors are so amazing of the reels wht dont we use
  these for our app. Put your best efforts to pull these colors and font size and font colors and make the app and
  website awesome". In my session he then said "Dont change the colors use our colors"; I asked which of two he
  meant (leave the colours and drop this, or still do it after Parties); he answered "Go ahead do it", and later
  "Now continue". So it was built on its own branch (`claude/reel-look`) and nothing was merged or published until
  he had seen the pictures.
- **Kamal's yes (18 Nov, in my session):** he was sent the before and after pictures of 19 screens (five of them
  again after King's fixes), asked "Shall I put this live on the website and in the Android app?" and shown the
  new look sentence for my brief, and answered "Yez pleaze". King had recommended yes in priorities.md.
- **Published:** a25fdcd (#117). The app files on main are the ones the tests ran on. Android build 222: the
  file's checksum matches the release's, the app inside it is byte for byte the published website's, and the
  cream page colour is in it (it is not in build 221). The website repo's `main` and `gh-pages` say "Publish the
  app from NavigateMe a25fdcd". The published copy opens with no page errors and wears the look: cream first page
  with "vibe" in orange and its line, headline on two lines at 390 wide, cream privacy and Coming soon pages, cream
  manifest; with its live backend switched off, Discover (rings green and amber, rent in the serif), the cream
  bar when scrolled, a home's page (the ink sheet, the brown header in its frame), the tabs' key words and the
  story all work.
- **My brief:** the look sentence in `tech.md` is the 17 Nov one, in King's words (#118, e4a310f), on the same yes.
- **Not checked by me:** the look on a real phone. My machine cannot reach the live site or run the Android app;
  everything above was checked on the published files themselves. Kamal has build 222 to open.
- **What changes** (README "Look and feel" has all of it): the page is cream and the cards are white (it was a
  white page with peach bands and panels); one key word of each main headline is in the logo's orange, with a line
  drawn under it by hand on the first page and the story; headlines on a phone are bigger; rent is in the serif; on
  a home's page "Who you'd live with" and the household's answers sit on one ink sheet with light-orange ticks; a
  home with no photo, the pictures people share and the link-preview picture are a deep warm brown inside a thin
  orange frame; the bar behind the clock, the installed app and the Android window are the cream.
- **King's review (18 Nov, priorities.md): faithful to the reels; three fixes, all made.** (1) The score rings keep
  the colours that say how strong a match is (green from 80, amber from 60); I had painted every ring light orange,
  as the entry first said, and a strong match and a fair one looked the same. (2) The top bar is cream once you
  scroll; it was turning white. (3) The first page's headline is a step smaller (`clamp(38px, 10.2vw, 48px)`), so it
  keeps to two lines from 390 wide: the sign-up card, Continue and "I already have an account" now sit higher than
  they do today at every phone size, and the help button is clear of Continue. The story and the Coming soon page
  keep the bigger size. The pictures in the folder are of the fixed build.
- **What does not change:** the logo and its colours (its 19 files still match Kamal's originals byte for byte),
  the login, the sign-up questions, every word and every layout. No database change.
- **Where the pictures are:** `flatmates/team/reports/shots/reel-look/`, today's look beside the new one at 390
  wide: the first page, the story, Discover, a home's page (top, and the ink sheet), Tribe, Flatsplits, FlatMart,
  Parties, Profile, a chat, Filters, My flat, the Escape, the posting form, a picture people share and Discover
  scrolled down (the top bar); and the first page at 1280 wide. Kamal has the same pairs in my session.
- **King's watch-list, one by one:**
  - the peach tints are all the one cream. A sweep of every screen, phone and computer, finds no panel melted into
    what it sits on and no peach left. Four had melted at first (the number tiles on FlatMart and the Escape, the
    label on Profile, the List | Map switch); they are white with a hairline now;
  - the rupee sign is in neither of our fonts: a phone borrows it from a font of its own, and always has. Beside
    the big serif rent it is set small in the body face, as the note said to do if it fell back;
  - no headline runs past three lines at 360 wide, or at 320. On a 360 x 640 phone the first home on Discover
    starts at 554px where it started at 571px. The bottom bar begins at 558px, so the home did not show before
    and shows by 4px now. Bringing it properly into view means moving things on Discover, which is more than a
    colour change; say if it is wanted;
  - Android: the page colour, the strip behind the clock (dark icons) and the manifest's two colours are the cream;
  - the frame and the brown are only on a home's header with no photo, shared pictures and the link picture.
- **Done differently from the entry, and why:**
  - the room kept for the old sheet's round top went (26px under each band, 24px above the sign-up card): with a
    flat band it was a hole. So the bigger headlines cost no height on the tabs;
  - small orange words on cream read at 4.77:1, so they keep the logo's orange; the deeper orange stays only
    where 16 Nov put it;
  - the link-preview picture is reduced to 256 colours (114 KB). The brown's soft glows made a 329 KB file, and
    `p25` holds it under 300 KB so that WhatsApp shows it;
  - one of the four tints of a party's drawn cover was a beige; it is the quiet off-white now.
- **Tests:** 32 demo suites, 864 checks, all pass (840 before). `p31` went from 51 to 74 checks: the
  palette, the key words, the line and "less motion", small phones, the first page's card no lower than before,
  the rings' colours, the rent and its rupee sign, the ink sheet, the brown header and pictures, no melted panels,
  the Android bars. `p26`, `p27` and `p25`'s layout checks are rewritten for the flat band and the closer card.
  The database suite was not run: nothing in the database changes.
- **Still with Kamal:** yes or no to the Parties distance privacy fix (a database change; his "Yez pleaze" answered
  the two questions about the look, and I have not read it as a yes to this); his look at the Parties map on his
  phone; whether Tribe matches under 70% are announced; the message limit of 30 an hour and 60 a day.

## 2026-11-17, Parties: a feed with covers, a party's page, hosting in one screen, and a map (#116) live

- **What was asked (Kamal, 17 Nov, in my session, with four recordings of a hangouts app):** "Take the idea for
  parties nearby dont copy but make it awesome", "Also check how the party is created", "Check how the search
  happens on parties own discover page through maps. Can we build this also". The ideas are taken; the look, the
  words and the rules are ours, and no photo is asked for. He also said "Dont change the colors use our colors":
  these screens are in the app's own orange and white.
- **The feed:** a party is a card with a drawn cover (a string of lights and the kind's emoji), when it is the way
  people say it ("Tonight · 8 pm"), a heart that keeps it on this phone, how long it runs and how full it is (a bar,
  "4 going", "2 spots left"). A search, a lens for each kind of party that is on near you, Saved, three orders.
- **"How was it?":** a party you went to stays in your list for three days after it ends, with the thumbs. Until now
  it left the list the moment it ended, so the thumbs after a party could only be reached from an old link.
- **A party's page:** its cover, what to expect, how full it is, how joining works in three steps, and a bar at the
  foot that leads to the request form. Once you've asked, where you stand moves up under the cover.
- **Host a party:** one sheet, with the card people nearby will see drawn again as it is filled in. It makes the
  party's group, saves the party and opens it; the server's checks are the ones it had. A party for friends only is
  still made from Splits.
- **List or Map:** each party is a mark in the middle of a circle about a kilometre across, never a pin on the
  flat. The server sends only that rounded spot (the pin to two decimals, the rule a home's public pin follows).
  It shows the parties in reach of your place (hosts choose 1 to 5 km), not the whole city as in the recording: a
  host's party is for people nearby, and that stays. Kamal has been told both.
- **Database, applied before the merge** (from the PR's commit: fetched inside the database, checksum checked
  against my file, then run). Checked read-only before and after: `fm_party_near_json` and `fm_party_nearby`
  changed and nothing else did (195 functions; 5 parties, 2 of them open; 2 requests; 105 listings; 224 profiles,
  all as before). Both open parties give a rounded zone and no pin, address or number. `fm_party_near_json` cannot
  be called from the app; `fm_party_nearby` only by someone signed in.
- **Published:** ab235ec (#116). Android build 221 (file checked: the new screens are inside, checksum matches the
  release). The website repo's `main` and `gh-pages` say "Publish the app from NavigateMe ab235ec". The published
  copy opens with no page errors, and with its live backend switched off the new screens work end to end (three
  cards, a party's page, a party hosted from the sheet, the map with its marks and a card).
- **Tests:** database suite 279 checks (13 new), 32 demo suites 840 checks (new suite p34, 53 checks), all pass.
- **Not checked by me: the map's own pictures.** My machine cannot reach a map server, and Google's key works only
  on the live site and in the Android app. The marks, circles and cards were checked on the bundled map, and the
  calls to Google's library against a strict stand-in for it. I have asked Kamal to open Map on his phone and say
  if anything looks off.
- **Found on the way, not changed, needs Kamal's yes:** a party's distance is measured from the flat's exact pin
  and shown to 100 m, and a person can change the place they measure from as often as they like. Someone patient
  could use that to work out roughly where a flat is. Homes don't have this: their distance is from the rounded
  pin. The fix is to measure parties from the same rounded spot the map uses and to limit how often the place can
  be changed. Distances would be a little less exact. I have put it to Kamal.
- **Next: the reel look** (priorities 00000000, now GO: on its own branch, pictures first, nothing merged or
  published without Kamal's yes to the pictures). Not started. King's notes of 17 Nov are with my working files.
- **Still with Kamal:** whether Tribe matches under 70% should be announced; the message limit of 30 an hour and
  60 a day. (White or pale orange for the top band is answered by the reel look, if it goes live: cream.)

## 2026-11-16, "Do you live in this flat?" (#115) live, on Kamal's go

- **The go:** Kamal, 16 Nov, in my session: "Go", after seeing the pictures and the summary of #115.
- **Order, database first:**
  1. applied `schema.sql` from the PR's commit to the live database (fetched inside the database, checksum checked
     against my file, then run);
  2. checked it read-only;
  3. merged #115 (0e76f69), which built Android build 220;
  4. published the website.
- **Database, checked before and after:**
  - 105 listings; every household is unchanged (same fingerprint), and so is every home's women-only result. No
    listing has an answer to the question yet, so nothing was expected to change.
  - The rule is in place: `fm_home_lived_in` is new, `fm_lister_lives`, `fm_listing_vibe` and `fm_home_gender`
    follow the answer, and none of them can be called from the app.
- **What changed for people:** as in the entry below. The form asks everyone posting a room, a bed or a flatmate
  listing; on No the lister's own answers and gender are not used, nobody listed is "You", and the home says
  "Owner-listed"; older listings are read as before and their editor asks on the next save.
- **Published:** 0e76f69; Android build 220 (file checked: the question is inside, checksum matches the release);
  the website repo's `main` and `gh-pages` say "Publish the app from NavigateMe 0e76f69". The published copy opens
  with no page errors, and with its live backend switched off the question works end to end (asked, refused
  without an answer, No saved with the two people's genders, "Owner-listed", women-only).
- **Tests:** as built: database suite 266 checks, 31 demo suites 787 checks.
- **The five real listings** have no answer yet. Each lister is asked the next time they edit. Until then they are
  read as before.
- **Priorities 000000 and 0000000 are both done.** Nothing of mine is waiting on a deploy.
- **Still with Kamal:** pure white or the pale orange for the top band; whether Tribe matches under 70% should be
  announced; the message limit of 30 an hour and 60 a day.

## 2026-11-16, "Do you live in this flat?": built and tested (it then waited for Kamal's go; live since, see above); my brief updated (#114)

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
