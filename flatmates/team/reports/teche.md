# Teche · reports

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

## 2026-11-10, party rules (#88) and block and report (#89) live

- **Party rules, 21+ (#88):** ten rules of our own for parties nearby, with 21 and over only. A guest ticks "I'm 21
  or older, I've read the party rules and I'll follow them" before the first request to join; a host does the same
  before opening a party to people nearby. The server enforces it. The rest of the app stays 18+.
  - Live check (rolled back): a request without the tick gets rules-required; after ticking, it goes on to the
    normal checks.
- **Block and report (#89):**
  - Where: on chats and messages, people's cards, home pages and FlatMart items.
  - Blocking is silent and both ways, enforced on the server: chats close ("You can't message this person"), and
    requests, invites, offers and tribe yeses are refused. Listings, items and parties disappear for each other,
    and they drop out of each other's lists. Account → Blocked people unblocks.
  - Reports keep a copy of what was reported, for two years. Reports from two different people pause messages,
    requests and invites until Kamal reviews (fm_safety_review_list / fm_safety_clear).
  - Message limits: 60 a day, and 10 a day to new people.
  - Live check (rolled back): after a block the listing went, the chat closed for both, the other side saw no
    sign, and the report reached the review list.
- **Merging:** #89 was brought up to date with main by a normal merge commit. The force-push of the rebase was
  refused, and the merged files are identical to the tested ones.
- **Published:** findmeflatmate main says "Publish the app from NavigateMe daa95d8".
- **Waiting on Kamal:** #86 (privacy and security) has lines for chat, block and report, and needs his [TO FILL]s.

## 2026-11-10, in-app messages after a yes: #87 live

- **What:** chat inside the app once people are connected, never before. It works for:
  - an accepted room request or invite (Discover/Escape);
  - a bonded tribe;
  - an accepted FlatMart offer;
  - a Flatsplits group.

  Messages sits under a chat icon in the top bar with an unread count, and a push goes to the others when the app
  is closed.
- **Live:** the database went first (md5-checked). A rolled-back check: a chat opens after a yes, the other side
  sees it unread, a stranger gets nothing, and a waiting request can't open one. Then fm-notify was redeployed
  (version 7), then the merge. Published: findmeflatmate main says "Publish the app from NavigateMe 1ddaedf".
- **Next:** block/report inside a chat before a public launch. #86 (privacy) has the matching lines and waits for
  Kamal's [TO FILL]s.

## 2026-11-10, women-only homes: #85 live; privacy and security pages in #86

- **Women only (#85, live):** Kamal's wife searched "Women only" and kept getting homes open to anyone. Now it shows
  only homes listed Women only that are a whole flat, or where everyone living there is a woman. The lister counts by
  their profile gender, and each flatmate by a new required Woman / Man in the posting form. Older listings that
  don't say who lives there sit in their own block under the results. Mixed and "Anyone" homes never show. A
  "Women-only home" badge appears only when the data supports it. Same for men.
- **Live:** the database went first (md5-checked; a rolled-back check found 104 homes, 14 for women only: 6 confirmed,
  8 not confirmed yet, none open to anyone), then the merge. The site and app are published: findmeflatmate main says
  "Publish the app from NavigateMe fc6c8cf".
- **Privacy (#86, not merged):** the policy is rewritten to the DPDP structure, with every claim checked against the
  code. There's a new security.html, and the gap list is in design/dpdp-gaps.md. Kamal fills the [TO FILL]s
  (entity, grievance officer, address, times, backups, access, city) before merging. Draft for a lawyer's review.

## 2026-11-10, AI go-between: build paused, plan in #84

- **Build paused:** Kamal said "Don't build now, let's discuss". King's STOP reached me after the build was done. Branch
  `claude/ai-go-between` was pushed before I saw it. It has no PR and isn't merged; nothing is live, nothing was spent,
  and no AI was called (tests ran offline: database 154 checks, app 14 suites). The branch is kept for reuse.
- **Plan:** `design/ai-go-between-plan.md`, PR #84, not merged. Rules handle most of it; AI is needed only for
  translation, reading questions and summaries. I recommend claude-haiku-5-5 at about ₹0.38 per enquiry (estimate).
  Eight decisions are waiting for Kamal.
