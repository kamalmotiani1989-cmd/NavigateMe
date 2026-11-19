# Teche · reports

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

## 2026-11-18, a blog for the website (#121) live

- **What was asked (Kamal, 18 Nov, in my session):** "Build the blogs section in website. Only. Make it super
  cool. Give your best. Research and then build". Read as: a blog on the website, not in the Android app, and
  nothing else touched.
- **Done:** https://findmeflatmate.com/blog/ is live with seven articles. #121 merged `576f405`; the website's copy
  is `bc63b6d` "Publish the app from NavigateMe 576f405" on its main and gh-pages, the Pages deployment for it
  succeeded, and the published blog is the tested one byte for byte (18 files).
- **Research first (three passes, by web search):** what other flat-sharing and rental blogs do; rental paperwork
  in India; rental scams. Other blogs are weak in five places: a worked answer to "who pays what" when rooms
  differ; facts that are dated, sourced and consistent; paperwork written for people sharing a flat in India; a PG
  vs flat-share vs co-living comparison not written by a co-living company; words to actually send when something
  is awkward. The blog is built on those five.
- **The seven articles, each with something to use the same day:** splitting the rent (**a calculator**: shared
  space by head, rooms by size, own bathroom and balcony; every number can be changed; the amounts always add up);
  PG, flat-share or co-living (a table, five questions, a real-monthly-cost list); what to ask a flatmate; a
  **32-point flat-visit checklist** (ticks stay on the phone; print or send it); rental scams (five scripts, the
  red flags, what to do in order if you paid: 1930, cybercrime.gov.in, the bank); rent agreement basics (why 11
  months, deposits, whose name goes on it); house rules (**a one-page flat agreement to copy** or send on WhatsApp).
- **The pages:** a first page ("Sharing a flat, minus the drama.", the leading article, "Things you can use", cards
  with topic chips and a search); an article page with a drawn cover, "The short version", "In this article" that
  marks where you are, a bar that fills as you read, numbered sources, WhatsApp and copy-link buttons, three next
  reads, and one dark sheet that says "Launching soon". The look is the app's own, no new colour; the covers are
  our cartoon people, drawn by the app's avatar module (the script reads it out of `index.html`), never photos.
- **How it is made:** articles are text files in `marketing/blog/posts/` (the guide for Mark is
  `marketing/blog/README.md`); `marketing/blog/build.js` makes the pages, the feed, the sitemap's lines and a share
  picture per article (1200 x 630, about 108 KB each). The pages are committed, so the publish job copies plain
  files as before. `p35` fails if the pages are not what the articles say.
- **Website only, as asked:** the Android app packs none of it. The one change to the app's page is the word
  "Blog" in the first page's small print, marked web-only, which the app hides. That change is why there is an
  Android build (224): **the app in it is the same as build 223**, so its update card is a false alarm. I judged a
  blog nobody can reach from the home page to be worse than one needless update; Kamal has been told and can have
  the word taken off.
- **Kept out, on purpose:** how the app works (Kamal, 15 Nov: that is shown after sign-in). The blog says only what
  the home page says. No "download now": every page says "Launching soon". `p35` holds both.
- **The limit on the facts, plainly:** I could not open any source page from my machine (its network allows
  package sites only) and the search allowance ran out before every question was covered. So the facts are what
  search results returned, checked against the law as generally known; statements were kept to what both support,
  and unsettled points were hedged or left out (which states follow the Model Tenancy Act, police orders that are
  renewed, tax limits, deposits by city). The articles on agreements and scams carry 14 sources each and name
  their dates. **Someone should open each source link once**, or allow me those sites and I will. Until then the
  agreements article carries "general information, not legal or tax advice".
- **Tests:** demo 33 suites, 919 checks, all pass (32 and 869 before); `p35` is the blog's suite, 50 checks. The
  database suite was not run: nothing in the database changes. After publishing, the published files were opened
  from a local copy: the first page shows the word "Blog", the blog's first page and all seven articles open with
  their share pictures, the calculator's amounts add up to the rent, the feed has seven entries, the sitemap ten
  addresses, no request leaves the site from the blog, and no page errors.
- **Not checked on a real phone:** I cannot open findmeflatmate.com from here. The checks are the test copy, the
  published files and the Pages deployment.
- **Pictures:** `flatmates/team/reports/shots/blog/` (four sheets: phone and computer). Kamal was sent six of the
  same screens in my session.
- **For King:** Mark now has a place to publish and a guide for writing to it; nothing is needed from King for
  what is live. If Mark's Tuesday pack should feed the blog, that is a request for the priorities file.
- **Still with Kamal:** a read of the seven articles (every word is easy to change); the source links; whether the
  word "Blog" stays on the first page; whether the map's overlapping marks get fixed; the Parties distance privacy
  fix; Tribe under 70%; the message limits.

## 2026-11-18, Parties: the short message after asking says what the answer was (#120) live

- **What was asked (Kamal, 18 Nov, in my session):** "F8x wrong short message". It answers one of two things I had
  told him I saw while drawing his map from the live sample parties: after you ask to join a sample party the
  pop-up still said the host "will let you know", though the page already said "You're in!". He did not answer the
  other (the marks that overlap on the map), so that is not touched.
- **What changed (#120, merged `33fc6ff`; the app only, no database change):**
  - After asking to join, the short message is "<host> accepted you. The address is below." when the request came
    back accepted, as a sample host's does (the database answers for it, #119), and stays "Asked! <host> will let
    you know." while a host has not answered. It is the sentence the app already used when a host says yes later.
  - The line under the door code said "<host> has your number too." for a sample host as well, which has no number
    and gets none. Where there is no number to call it now reads "A sample host, so no numbers are shared." This
    second line is mine to own: Kamal named the pop-up, and I took the same wrong claim on the same card with it.
  - If the party is no longer open when its page is read again, the app's own "That party isn't open to you any
    more." is the only message (an error used to show in the form too).
- **Tests:** demo 32 suites, 869 checks, all pass (864 before). `p34` gains five: the message while the host has
  not answered, the message and the line once a host says yes, and, with the live answer stood in for one of the
  demo's sample hosts, the new message, the new line, no Call button and nothing said twice. The database suite
  was not run: nothing in the database changes.
- **Live:** Android build 223 (release `flatmates-apk`, from `33fc6ff`) and the website ("Publish the app from NavigateMe
  33fc6ff" on its main and gh-pages, `b2fbcbb`; the Pages deployment finished). Checked on the published copy with
  its backend off: a host who has not answered gives "Asked! Ananya will let you know."; a yes that comes back at
  once gives "Kabir accepted you. The address is below.", the new line under the door code, no Call button and
  nothing said twice; no page errors. The page inside build 223 is the published page, byte for byte. On the
  website the fix shows after a refresh; in the Android app after the update to build 223.
- **A slip of mine:** after starting the publish I waited ten minutes on a stale copy of the website repo's
  gh-pages branch; the publish had landed within half a minute. Nothing was wrong on the site.
- **Not checked on a real phone:** I cannot sign in to the live app from here. The checks are the test copy and
  the published files.
- **Still with Kamal:** whether I fix the map's overlapping marks (King recommends yes); yes or no to the Parties
  distance privacy fix; whether Tribe matches under 70% are announced; the message limit of 30 an hour and 60 a
  day. The 15 sample parties are still live and drop off as their time comes (none may be live when sign-up opens).
- **Need from King:** nothing.

## 2026-11-18, 15 sample parties for testing Parties and its map (#119) live in the database

- **What was asked (Kamal, 18 Nov, in my session):** "Can you create some samples for parties so that i can chceck
  the map and test the same . Create some 15 parties."
- **Done:** 15 sample parties are in the live database, around where Kamal tests. His account sees all 15 on the
  list and on the map. The app did not change: no Android build (222 stays) and nothing to publish on the website.
- **What was built (#119, merged `d6e61d1`; database only):**
  - `fm_sample_parties(lat, lng, areas)` makes 15 open parties hosted by 15 of the 200 sample people, at fixed
    spots 0.4 to 3.5 km from the point given: 15 kinds (game night to house party), from tonight to three
    Saturdays on in India time, eight free and seven with a chip-in (₹150 to ₹400, never alcohol), some part full,
    one with nobody in yet, two without plus-ones, open to everyone, reach 3 to 5 km. Two of them fall in the same
    map square, so one mark carries a "2". Running it again replaces all 15 with dates from that day;
    `fm_sample_parties_clear()` removes them. It is not `samples.sql`, which is not run on live again (it would
    replace all 200 sample people).
  - What a nearby person is sent for a party now says whether the host is a sample, so the app's "Sample" tag
    shows on the card, on the map's card and on the party's page (the app already drew the tag when told).
  - A request to a sample host is accepted straight away, with a door code. The address that then shows ends
    "(a sample address)"; there is no Call or WhatsApp button because a sample has no number; no push goes out.
    Places left are still counted, and a request to a real host waits for the host as before.
  - The app's own roles cannot call the generator, the clear or the list of spots.
- **Tests:** database 310 checks (29 new, `parties-19-samples.sql`), demo 32 suites and 864 checks, all pass.
- **Live, step by step:** the merged `schema.sql` fetched into the database, md5 `067caf20…` matched, executed.
  Functions 195 to 199, triggers 32 to 33, every function's body equal to a fresh local build, no row changed.
  Then the generator: parties 6 to 21, party groups up by 15, 82 accepted requests from sample guests. Nothing
  else moved: 224 profiles (200 sample), 105 homes, the 2 requests on real parties.
- **Checked afterwards (read-only):** Kamal's account is sent exactly these 15, each marked sample, none with an
  address, a pin or a number; 14 marks; the nearest 1.0 km away, the furthest 3.9 km. Three other testers who live
  close see all 15 too, tagged the same; the two testers a hundred kilometres away see none. No sample party is
  tied to a flat, so no "party at your flat" push went to anyone.
- **Where they are:** the point and the area names are deliberately not written here, because this repo is public
  and the point is close to where Kamal tests. The area names are the real ones for each spot (OpenStreetMap).
  No pictures in `shots/` for the same reason: a map picture shows the neighbourhood.
- **To make the same 15 again from today** (the point and the names are read back from the rows; the point was a
  two-decimal grid point, so it is the first party's map square):
  ```sql
  select public.fm_sample_parties(z.lat, z.lng, a.areas)
  from (select round((p.near_geo->>'lat')::numeric, 2)::float8 as lat, round((p.near_geo->>'lng')::numeric, 2)::float8 as lng
          from fm_parties p join fm_profiles h on h.id = p.host_id where h.sample and p.occasion = 'games') z,
       (select array_agg(p.area order by array_position(array['games','movie','chai','karaoke','match','brunch','terrace',
                 'birthday','potluck','jam','housewarming','festival','welcome','farewell','party'], p.occasion)) as areas
          from fm_parties p join fm_profiles h on h.id = p.host_id where h.sample) a;
  ```
  To remove them: `select public.fm_sample_parties_clear();` (after that the point has to be given again).
- **They drop off as their time comes:** tonight's two start at 8 and 9 pm (they are the pair behind the "2"), so
  by Kamal's late-evening hours 13 are left; 5 are left after Sunday; the last is on 5 Dec. A refresh takes one
  statement, on his word.
- **What the map does with 15 parties this close (drawn on a test copy from the live data; not changed, it is
  outside this task):** on a phone the map opens far enough out to hold them all, and at that distance two
  neighbouring squares are about 30px apart while a mark is 44px wide. 16 pairs of marks overlap, the "You" label
  sits on one, and a tapped mark's card (at the top of the map) can cover the mark that was tapped. Pinching in
  separates them. With a few parties spread out it does not show, as in #116's pictures. I have told
  Kamal and offered to fix it.
- **Small things in the sample flow (not changed):** after asking, the short message still says "Asked! <host> will
  let you know." though the page already says "You're in!", and the page says "<host> has your number too" (nobody
  does: a sample). The limit of 10 requests an hour holds for samples as well.
- **A mistake of mine, no harm to the app:** to look up the area names I sent 15 look-ups to Photon, the free
  place search, from the database in one statement. 4 answered, 11 were refused, and Photon stopped answering the
  database for a while. People's searches go from their own phones, not from the database, so nobody using the app
  was affected. I finished with one look-up at a time from OpenStreetMap's own service. I won't send a burst to an
  outside service from the database again.
- **Still with Kamal:** his look at the map; whether I fix the crowding; yes or no to the Parties distance privacy
  fix (a database change; asked again on 18 Nov, not answered); whether Tribe matches under 70% are announced; the
  message limit of 30 an hour and 60 a day.
- **Need from King:** nothing.

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
