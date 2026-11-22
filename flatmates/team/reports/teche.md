# Teche · reports

## 2026-11-22, the permissions sheet (way B), "Take a photo" and blue and pink tiles (#127) live

- **What was asked (Kamal, 22 Nov, in my session):**
  - after the picture of the sheet he wrote "Blue and pink will look good / The colors from the app". It could
    have meant the blog, the sheet or the two tiles on My flat, so I asked him, with the choices listed. His
    answer: **the two tiles on My flat**. (My own first guess was the blog; asking was right.)
  - to "shall I put the permissions sheet live?": **"Yes, put it live"**.
- **Live:** #127 merged (`2c07194`). Android build 229: the new Java compiled. Website `e95bf95` "Publish the
  app from NavigateMe 2c07194". No database change.
- **What went out:**
  - the first-open sheet in the Android app, way B (the entry below): notifications asked now, location the
    first time the map is used, nothing for photos and the camera;
  - "Take a photo" beside the gallery in the photo chooser, through the phone's own camera app;
  - My flat's tiles: Flatsplits blue, FlatMart pink (pink and apricot since #125). I told him the other way
    round is a one-line change if he prefers it.
- **Tests:** demo 34 suites, 954 checks, all pass, on the exact tree that was merged.
- **Checked after publishing:** the published copy has the sheet and nothing internal; My flat drawn from it on
  two phones and a computer is pixel for pixel the tested one; the Android file is build 229, its sha256 equals
  the release's, the page inside it is the published page byte for byte, and the built app's manifest names no
  camera permission (internet, notifications, location, and what the notification library adds).
- **Not tested: anything on a real phone.** The sheet at first open and the camera in the photo chooser are new
  native behaviour that only compiled here. Kamal has build 229 and is asked to try both; if "Add photos" misbehaves
  on his phone I take the camera out of the chooser at once (one small change back).
- **Need from King:** nothing. `priorities.md` still says the permissions sheet waits for Kamal.
- **Still with Kamal:** a try of the sheet and of "Add photos" on his phone; how the avatar studio feels there;
  whether a room nobody lives in should show a score; the blog's colours (not answered: his "blue and pink" was
  about the tiles); and the older list.

## 2026-11-22, permissions in the Android app, way B (#127, open): waits for Kamal's yes to the sheet

- **What was asked (Kamal, 22 Nov, in my session):** "Can we build that app automaticaly takes the permission of
  camera, location and gallery and anything else that is important". No app can take a permission by itself;
  I told him so, and built a sheet at first open that asked for notifications and then location.
- **King's note in priorities.md changed it:** King put two ways to Kamal and he chose B: at first open ask only
  for notifications; ask for location the first time someone uses the map or parties near them; no camera or
  gallery permission. Pictures to Kamal before it goes live. I had built A and was about to merge it on my own
  reading of his "Yes"; I read the note first, did not merge, and rebuilt it as B.
- **What #127 is now:**
  - a sheet in the Android app, once per phone, the first time someone signed in reaches a main screen with
    notifications off: what is asked now (notifications), what later (location), what never (photos and the
    camera). Continue brings up Android's box for notifications only, through the ask the "Stay in the loop"
    card already uses; "Not now" asks nothing;
  - location is untouched: asked the first time "Use my current location" or the map's locate button is used;
  - "Take a photo" beside the gallery in the photo chooser, through the phone's own camera app, which writes to
    the app's cache. No camera permission; the app still declares internet, notifications and location only.
- **Tests:** demo 34 suites, 954 checks, all pass (938 before; a new suite `p36` with 16, which also holds the
  Android files as written: four declared permissions, location asked only from the map's own prompt, nothing
  asks for the camera). The Java was checked for syntax with `javac`; it is compiled by CI after merge.
- **Not tested:** anything on a real phone. The camera in the chooser and the sheet need one look on Kamal's.
- **Picture:** on the PR's branch, `flatmates/team/reports/shots/app-permissions/`. Kamal has it.
- **Need from King:** nothing. Thank you for writing the choice down; it stopped the wrong version going out.
- **Still with Kamal:** yes or no to the sheet (#127); how the avatar studio feels on his phone; whether a room
  nobody lives in should show a score; the blog's colours; and the older list.

## 2026-11-22, the avatar studio (#126) live, on Kamal's yes

- **What was asked (Kamal, 22 Nov, in my session):** after the pictures of the studio, and after my answer on
  permissions, one word: "Yes". I had asked him to say yes if he liked the pictures, so I read it as yes to the
  studio. (The permissions step was not a yes-or-no question; it follows in its own PR, as I had told him.)
- **Live, in this order:**
  1. the database: the branch's `schema.sql` fetched into the live database, its md5 equal to the tested file's,
     then executed. Checked read-only before the app went out: a studio avatar is accepted; a new value in a
     first key, an unknown key and an unknown colour are refused; the three avatars already saved are all still
     valid; the table's check is in place;
  2. #126 merged (`ca0d249`); main's `schema.sql` is byte for byte what the database got;
  3. Android build 228; website `e6e013f` "Publish the app from NavigateMe ca0d249".
- **Checked after publishing:** the published copy has the studio and nothing internal; the blog is byte for byte
  the repository's (its pages were rebuilt in #126); the studio walked through on the published page end to end
  with no page errors, and the avatar it saved is one the live database accepts; the Android file is build 228,
  its sha256 equals the release's, and the page inside it is the published page byte for byte.
- **What it is:** the entry below. Tests there: demo 33 suites, 938 checks; database 313.
- **Not tested:** on a real phone. Kamal has build 228.
- **Next:** the permissions step and "Take a photo" (`claude/app-permissions`, suite `p36`). On its own it passed
  34 suites, 948 checks; it is being run again on top of the studio before it is pushed.
- **Need from King:** nothing. `priorities.md` still says the avatar maker is in hand.
- **Still with Kamal:** how the studio feels on his phone; whether he wants everything asked at first open
  (permissions); whether a room nobody lives in should show a score; the blog's colours; and the older list.

## 2026-11-22, the avatar studio built and tested (#126, open): waits for Kamal's yes to the pictures

- **What was asked (Kamal, 22 Nov, in my session, with a screen recording of another app's avatar builder):**
  "Can we make the avtaar saction more advanced". I told him what I would take and what not, and that he would
  see pictures before anything goes live. He has the pictures; #126 is open and **not merged**; nothing is live.
- **What #126 is:**
  - a studio in place of the one-screen maker: the whole person on a stage, eleven tabs (looks, skin, hair,
    face, beard, glasses, headwear, outfits, top, bottoms, shoes) with a grid of choices drawn on your own
    figure, Undo, Redo, "Surprise me", and "Your avatar is ready!" at the end;
  - many more choices: 15 hair styles in 8 colours (grey and white among them), 6 beards with their own colour,
    4 kinds of glasses, 9 tops in 16 colours, 6 bottoms, 4 shoes, 12 outfits, 12 looks to start from;
  - two drawings of one person: the round one stays in every list, chat and on the Vibe Card; the standing one
    is in the studio and on your own Profile;
  - it still starts neutral (no skin tone picked for you) and is still never a photo.
- **Not taken from the recording:** the selfie that starts it there (no face reading here, and Kamal's rule of
  15 Nov says no photos) and that app's artwork. Kamal was told; he has not asked for the selfie.
- **Older apps:** a phone on a build from before the studio knows only the first choices. A saved avatar carries
  each new choice next to the nearest thing that build can draw, so nobody's avatar breaks on an older app.
- **Database:** `fm_avatar_valid` accepts the studio's keys, each from a fixed list. On Kamal's yes: database
  first, then merge. The app must not go out before it.
- **King's ask in priorities.md (the other app is not named in the page, the README or the tests):** done; also
  not in the commit or the PR. I have taken its name out of my earlier entry below as well.
- **Tests:** demo 33 suites, 938 checks, all pass (930 before). `p21` was rewritten to hold the studio (31 checks
  to 39), among them the app's lists of choices compared with the server's, value for value. Database suite on a
  local Postgres: 313 checks, all pass (three new). Not tested on a real phone.
- **Also changed:** the blog's pages are rebuilt, because their cover people are drawn by the same library.
- **Pictures:** on the PR's branch, `flatmates/team/reports/shots/avatar-studio/`.
- **Second ask from Kamal the same evening:** "Can we build that app automaticaly takes the permission of camera,
  location and gallery and anything else that is important". Told him no app can take a permission by itself
  (Android shows its own box), what the app does today, and what I would build: a one-time sheet at first open
  that says what each is for and then brings up Android's boxes (notifications, then location), and "Take a
  photo" in the photo chooser through the phone's own camera app, which needs no permission. Built on its own
  branch (`claude/app-permissions`, a new suite `p36`); its full test run is going. He has not answered; I told
  him I would build it this way unless he wants everything asked at first open.
- **Need from King:** nothing.
- **Still with Kamal:** yes or no to the avatar studio; the list in the entries below.

## 2026-11-22, My flat: the Flatsplits and FlatMart tiles in the pastels of their screens (#125) live

- **What was asked (Kamal, 22 Nov, in my session, with a screenshot of My flat in the new colours):** "Can u put
  tab colors to flatsplit and flat mark matching the app". The two tiles were white with blue names. Read as:
  give each tile a colour from the app's own pastels. I took the pastel of the screen each one opens.
- **What changed (colour only):** Flatsplits is a pink tile, FlatMart an apricot one, lighter at the top like
  that screen's band; names charcoal (they had turned blue on 22 Nov, as unclassed links), the small line the
  secondary grey, the icon on a white chip. Three rules at the end of the stylesheet, tokens only. The README's
  look section says it; its FlatMart section no longer says Discover shows these shortcuts (it has not for a
  while; `p12` checks that).
- **Tests:** demo 33 suites, 930 checks, all pass (929 before; one new, in `p31`: both tiles carry their screen's
  pastel, compared with the tokens, charcoal names, the white icon chip, and lead to `#splits` and `#market`).
  Names read at 11.5:1 or better, the small line at 5.85:1 or better. No database change.
- **Live:** #125 merged (`5764802`). Android build 227. Website `4a97e9b` "Publish the app from NavigateMe
  5764802". Checked after publishing: My flat drawn from the published page on a 390 and a 360 wide phone and on
  a computer is pixel for pixel the tested one; the page inside the Android file is the published page byte for
  byte, build number 227, sha256 equal to the release's.
- **Seen in Kamal's screenshot:** the strip behind the clock on his phone is the band's apricot, so the Android
  change of #123 works on a real device (it was "not tested on a phone" until now).
- **Pictures:** `flatmates/team/reports/shots/my-flat-tiles/` (before and after on a phone, a small phone, a
  computer).
- **Next, asked by Kamal the same hour, with a screen recording of another app's avatar builder:** "Can we make
  the avtaar saction more advanced". I told him yes and what I would take
  (a full-body avatar with outfits; a studio screen with tabs, a grid of choices, undo, redo and Save; many more
  choices; a "ready" moment) and what I would not (the selfie scan: no face-reading technology here, and his
  rule of 15 Nov says no photos; and that app's own artwork). I build it on a branch and show him pictures
  before anything goes live. It needs a database change (the avatar check accepts only today's keys and values).
- **Need from King:** nothing.
- **Still with Kamal:** whether he wants the selfie step after all; whether a room nobody lives in should show
  a score; King's note on moving the Escape's no-score note up; the blog's colours; and the list in the entries
  below.

## 2026-11-22, Kamal asked why the Escape shows no vibe score: answered, nothing changed

- **What was asked (Kamal, 22 Nov, in my session):** "Why in empty room escape vibe score is not showing ?"
- **What I found (read-only; nothing changed, nothing shipped):** it is the rule of 16 Nov (#113), not a fault
  and not the new colours. The room he was looking at says "People living there now: 0", so it has no household
  to score people against: everyone in its Escape list comes without a score, and the note "No vibe scores for
  this room" with "Say who lives there" sits above the list. His other open room has a household with answers,
  and everyone in its list has a score.
- **Checked:** the live database, counts only (people listed and people scored for each open room of a real
  lister: four such rooms, one without scores, for this reason); and today's build in demo mode with the same two
  cases: no rings and the note in one, a ring on every card in the other; no page errors.
- **Told Kamal:** why; how to get scores there (say who lives there and answer the 12 questions; if he lives
  there, his own answers are used); and that scoring a room nobody lives in against the owner would undo part of
  his own rule of 16 Nov, so it is his call. Two pictures sent.
- **Noticed, not changed:** on a phone the note starts low on the Escape's first screen and its button is under
  the bottom bar until you scroll, so it is easy to miss. Left alone until asked.
- **Need from King:** nothing.
- **Still with Kamal:** whether a room nobody lives in should show a score after all; and the list in the entry
  below (the strip behind the clock, the blog's colours and the rest).

## 2026-11-22, the new colours (#123) live, on Kamal's yes

- **What was asked (Kamal, 22 Nov, in my session):** he was sent the finished build's pictures and asked "Shall
  I put it live? On your yes I'll also update my own rules to say this is the look to keep." He answered "Yes"
  twice (two lines). Read as yes to both: put it live, and change the look rule in my brief.
- **Live:** #123 merged (`b41d5dc`). Android build 226 (the new Java compiled in CI; both `flatmates-apk`
  releases say build 226 and carry the same file). Website `6b541d5` "Publish the app from NavigateMe b41d5dc",
  its Pages deployment succeeded. What #123 is: the entry below. No database change.
- **Checked after publishing:**
  - the published copy: main and gh-pages hold the same files (57, no internal folders); the new tokens, the
    yellow and pink bands and the `bars` message are in the page; the privacy page, the manifest and the
    link-preview picture are the new ones; the blog is byte for byte the repository's;
  - the Android file: build number 226, its sha256 equals the release's, and the page inside it is the
    published website page byte for byte;
  - thirteen screens drawn from the published page against the tested ones: eleven identical; the two Discover
    pictures differ only in the greeting ("Good afternoon" had become "Good evening"); the strip above the
    page follows the band there too (the first page, Parties, white once scrolled); no page errors.
- **Not tested:** the strip behind the clock on a real phone. It compiled and the page sends the right
  messages (`p26`), but nobody has seen it on a device. Kamal has been sent build 226 and asked to look.
- **My brief:** the look rule in `team/tech.md` now describes the look of 22 Nov (#124, merged `c706931`; demo 33
  suites, 929 checks, all pass). A document only: no build, nothing to publish. The logo rule is unchanged.
- **Not changed:** the blog (website only) still wears the look of 17 Nov; the README says so. I have asked
  Kamal whether it should follow; I will not recolour it unasked.
- **Where this meets King's note:** priorities.md recommends a variant (the logo's orange on buttons, no blue
  links). Kamal said yes to what he was shown, so that is what is live. The variant is still a change of two
  tokens if he asks for it.
- **Pictures:** `flatmates/team/reports/shots/colours-22nov/` (the finished build; `preview/` inside it is what
  Kamal saw first).
- **Need from King:** nothing. `priorities.md` says it is live (f01266e).
- **Still with Kamal:** a look at the strip behind the clock in the app; whether the blog follows the new
  colours; a read of the blog's seven articles and its source links; whether the word "Blog" stays on the first
  page; the Parties map's overlapping marks; the Parties distance privacy fix; Tribe under 70%; the message
  limits. The 15 sample parties are still live (the last ends on 5 Dec).

## 2026-11-22, the new colours built and tested (#123, open): waits for Kamal's yes to the pictures

- **What was asked (Kamal, 22 Nov, in my session, after the preview below):** "This looks cool change the colors
  of the app". Read as yes to what he was shown. I had told him he would see pictures of the finished build
  before anything goes live, so #123 is open and **not merged**; nothing is on the website or in the Android app.
- **Where this meets King's note:** priorities.md recommends a variant (the logo's orange on buttons, no blue
  links). Kamal has not said that to me, and by my brief his word wins, so I built what he saw and chose. The
  variant is a change of two tokens; the PR says so. If he tells King otherwise and it is written into
  priorities.md, I follow that.
- **What #123 is (colour only; layouts, words, fonts, login, questions and the logo untouched):**
  - a third layer at the end of the stylesheet: a white page and white cards; an orange-red `#E2461B` for main
    buttons and the key word (the screenshots' `#F65D34` a little deeper: white words on a button read at 4.1:1
    where the preview's read at 3.2:1; small orange words use `#BC360F` and keep our 4.5:1); each screen's band
    in a pastel, lighter at the top, with the white page over its foot again (blue Discover, Profile, Requests;
    mint Tribe, the Escape, Messages; yellow Parties; pink Flatsplits, Saved; apricot FlatMart, My flat, Post);
    a pale blue search box; blue for the words you tap; charcoal for words and dark sheets;
  - the strip above the page follows the band: the browser's bar on the website, and in the Android app the
    strip behind the clock, through the existing native bridge (a `bars` message; `MainActivity.paintBars`);
  - outside the stylesheet: share pictures and the Vibe Card, the map's circle, `og-image.png` (redrawn),
    `privacy.html`, `hold.html`, the installed app's colours and the Android bars.
- **Not changed:** the blog (website only) still wears the look of 17 Nov; the README says so. Kamal has been told.
- **Tests:** demo 33 suites, 929 checks, all pass (926 before; three new). The look suites were rewritten to hold
  the new look, not loosened: `p31` now counts the cream, the brown and the other colours of 17 Nov as old and
  finds none left; `p26` and `p27` hold each band's pastel, the sheet over its foot and the strip above the page.
  Two real things they found and I fixed: the search box sat 11px lower on a 360 x 640 phone, and the
  link-preview picture had lost the logo's exact orange. The database suite was not run: nothing there changes.
- **Not tested:** the Android code on a phone. It cannot be compiled here; CI compiles it after merge. If it does
  not compile, no APK is published and the app stays on build 225 while the website has the new colours.
- **Pictures:** on the PR's branch, `flatmates/team/reports/shots/colours-22nov/` (the finished build) and
  `preview/` inside it (what Kamal saw first), as King asked. Kamal was sent the finished build's.
- **Need from King:** nothing. My brief's look rule still describes 17 Nov; I have asked Kamal for the sentence.
- **Still with Kamal:** yes or no to putting #123 live, and the look sentence for my brief; whether the blog
  follows; a read of the blog's seven articles and its source links; whether the word "Blog" stays on the first
  page; the Parties map's overlapping marks; the Parties distance privacy fix; Tribe under 70%; the message
  limits. The 15 sample parties are still live (the last ends on 5 Dec).
