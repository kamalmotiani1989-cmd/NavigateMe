# Teche · reports

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

## 2026-11-22, a preview of the app in another app's colours: pictures shown to Kamal, nothing changed

- **What was asked (Kamal, 22 Nov, in my session):** two screenshots of a car-buying app (a home screen with
  pastel tiles, a list screen with an orange button) and "Use these colors and prepare some screens and show me".
  Read as: a preview only. Pictures of our screens in those colours; nothing in the repository, on the website or
  in the Android app changes until he says yes.
- **Done:** eleven phone screens and the first page on a computer, drawn from the app as it is on main with one
  extra layer of colour added in my working folder (not committed anywhere). Kamal has four "today | in these
  colours" pairs (first page, Discover, Parties, Tribe), all eleven screens, and the computer page.
- **The colours, read off his pictures:** a white page and white cards (the cream goes); a bright orange-red
  `#F65D34` for main buttons, badges and the place you are on in the bottom bar; his pastel tiles on the band at
  the top of each screen, lighter at the top, with the white page coming up over the foot again (blue Discover
  and Profile, mint Tribe, yellow Parties, pink Flatsplits, apricot FlatMart), on the three sign-up choices and
  on party covers; the pale blue-grey of his search bar `#E0E9F2` for our search box; his blue `#2269C3` for the
  words you tap that are not buttons; charcoal `#24272C` for words and dark sheets.
- **Kept:** every layout and word, both fonts, the login, the questions, the score rings' green and amber, and
  **the logo with its own orange** (Kamal's standing rule).
- **What I told Kamal plainly:** (1) the logo's orange is deeper than this orange-red, so two oranges sit side by
  side; (2) white words on this orange read at 3.2:1 where today's read at 5.2:1, and our own rule is 4.5:1, so
  going ahead I would deepen the orange a little or keep it for big buttons only; small orange words already use
  a deeper shade, `#C93A12`, which is nearly the logo's own; (3) blue links are new to our app; (4) it would
  replace the look he chose on 17 Nov, on every screen, the two side pages, the pictures people share and the
  Android bars: its own branch and PR, tests and pictures first, as the reel look was done.
- **Tests:** none run; nothing in the repository changed. A check of the preview screens found no old cream or
  brown left on them and no hard-to-read words other than the white words on orange buttons and, at the deepest
  foot of a band, the orange key word.
- **Need from King:** nothing now. If Kamal says yes it is a change to the look rule in my brief and to "Look and
  feel"; I will ask him for the words, as on 16 Nov.
- **Still with Kamal:** yes or no to these colours; a read of the blog's seven articles and its source links;
  whether the word "Blog" stays on the first page; the Parties map's overlapping marks; the Parties distance
  privacy fix; Tribe under 70%; the message limits. The 15 sample parties are still live (the last ends on 5 Dec).

## 2026-11-19, Tribe: the people around you and the four steps on white cards (#122) live

- **What was asked (Kamal, 19 Nov, in my session):** a screenshot of the Tribe screen on his phone with two places
  circled, the picture of the people around you and the row "1 Match, 2 Team up, 3 Bond, 4 Hunt", and "This area
  should have white backgroud which matches the app color". Read as: those two pieces sit on white cards, as the
  app's cards do, instead of straight on the cream. Nothing else on the screen changes.
- **What changed (#122, merged `74c9f74`; style only, 14 lines; no database change):**
  - The people around you: on a phone, a white card (28px corners, the hairline, the soft shadow) inside the cream
    band, in line with the headline. On a narrow phone the drawing keeps its shape, so the card has no empty strip.
  - The four steps: a white card at every size. On the cream the steps still to come could hardly be seen.
  - Inside those cards, cream (the look's one rule): the match label under each person and the disc behind your
    letter. On a computer the picture was already inside the band's white card; there the labels show for the
    first time.
  - Until the list has come in, neither card is there, as before (an empty one would show as a white pill).
  - The cost, said plainly: the card needs room round the drawing, so on a 390-wide phone the headline sits 46px
    lower than it did (27px at 360 wide, the same place at 320). Before, the lowest label ran into "Build your
    tribe", as on Kamal's screenshot. In his phone's browser the steps card sits partly behind the bottom bar
    until he scrolls a little; in the Android app, which has no address bar, both cards show at once on a
    screen like his. Kamal has been told.
- **Live:** Android build 225 (the release on both repositories says "(74c9f74, build 225)"; a real change, the
  Tribe screen in the app has the same two cards). Website `ac46e9e` "Publish the app from NavigateMe 74c9f74" on
  its main and gh-pages, Pages deployed. The published page carries the new rules, and the Tribe screen drawn from
  the published page matches the tested one (pixel for pixel at 390 wide and on a computer; at 360 and 320 only
  the moving ring round the middle differs). The blog is untouched, byte for byte.
- **Tests:** demo 33 suites, 926 checks, all pass (919 before; the seven new ones are in `p31`, now 81). The
  database suite was not run: nothing in the database changes. Looked at, at 390, 360, 320 and 700 wide and on a
  computer: six people, one, nobody yet; your own cartoon in the middle; a teamed-up match and all four steps
  done; less motion.
- **Not checked on a real phone:** I cannot open findmeflatmate.com or the Android app from here.
- **Pictures:** `flatmates/team/reports/shots/tribe-white/` (before and after, phone and computer). Kamal was sent
  the same.
- **Need from King:** nothing.
- **Still with Kamal:** a read of the blog's seven articles and its source links; whether the word "Blog" stays on
  the first page; the Parties map's overlapping marks; the Parties distance privacy fix; Tribe under 70%; the
  message limits. The 15 sample parties are still live (the last ends on 5 Dec).
