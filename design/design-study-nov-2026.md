# FindMeFlatMate · Design study · our look against 99acres, NoBroker, Housing and others

Prepared by Teche for Kamal, 8 November 2026 (task from Kamal via King: "study the colors of app and website and
design language of 99acres, NoBroker, Housing and others. Post that suggest the best changes.").

**This is a study, not a change.** Nothing in the app, the website or the database was touched.

**Updated the same day for the redesign.** Kamal merged a calm redesign on 8 Nov 2026 (PR #63: navy, one muted
green, a mint wash, white cards), and the standing rule is now "keep this look; new screens use the `:root` tokens"
(README, "Look and feel"). Section 1 describes the new look, and section 3 is re-checked against it: most of the
first draft's colour suggestions are now done or moot, and the few colour points left are in their own section for
Kamal's decision.

**The limit to know about.** This session cannot open the competitors' sites or the app stores (Kamal kept the
network closed; nobroker.in, 99acres.com, housing.com, magicbricks.com, spareroom.co.uk and flatmate.in were all
refused on 8 Nov 2026). So:
- **Our side** is exact: read from `flatmates/index.html` after the redesign (main at a0e11b4) and phone-sized
  screenshots of the app in demo mode, 8 Nov 2026.
- **Their side** comes from web search excerpts (seen 8 Nov 2026), Mark's study
  (`flatmates/marketing/competitor-study-nov-2026.md`, sources seen 6 Nov 2026), and design write-ups by others.
  Their exact colour values, fonts and current screens are **could not confirm**. Where I name a competitor's main
  colour from general knowledge, it says so. Section 4 lists the 15 minutes of screenshots that would close the gap.

---

## 1 · Our design language today (after the 8 Nov redesign)

### Colours (tokens in `index.html`, `:root`)

| Token | Hex | Where it is used (uses in the page) |
|---|---|---|
| `--ink` / `--ink-2` | `#1B2440` / `#2A3760` (navy) | The main button on every screen (both `.btn-primary` and `.btn-accent` now render navy), selected chips and tabs, feature cards (quiz, Tribe, FlatMart, Escape, Passes). 40 / 6. |
| `--accent` | `#1B2440` | Same navy, kept as a name so older rules follow it. 44. |
| `--brand` / `--brand-2` | `#1C7F72` / `#156358` (muted green) | Links, small labels, progress bars, match rings, "what's new", the wordmark's "FlatMate". 84 / 23. |
| `--brand-soft` | `#E5F3EF` | Tips, highlights, the "Gen Z household" badge, room-detail labels. 45. |
| `--hi` | `#A6E0D2` (mint) | Accents on navy cards (the quiz arrow, ring tracks). 28. |
| `--dot` | `#E0623E` (red-orange) | Notification dots. 4. |
| `--ok` / `--warn` / `--danger` | `#14866E` / `#A16207` / `#C2261D` | Ticks and "same" answers, warnings, errors. |
| `--text` / `--text-2` / `--text-3` | `#18213A` / `#4B566B` / `#8790A3` | Body, secondary text, hints and small print ("Posted 17 days ago", "+ expenses"). `--text-3` 58 uses. |
| `--wash` | `#DCEFE9` to `#EAF6F2` to `#F8FBFA` | Behind the welcome page and onboarding only. |
| `--grad` | `#1B2440` to `#253360` | Navy feature cards. 21. |
| `--app-bg` / `--card` / `--hair` | `#F4F7F6` / `#FFFFFF` / `#E2E8EC` | Signed-in background, white cards, hairlines. |
| WhatsApp button (not a token) | `#1DA851` | "Get the code on WhatsApp" on the sign-in card. |

**Outside the tokens:** 141 distinct hex values are still written into the page, most of them in the logo SVG (the
old navy `#10264F` and the roof gradient), the drawn room illustrations, the share images drawn on a canvas, and a
few one-off reds and blues (`#B42332`, `#1E6FD9`, `#F0645A`). The screens themselves now follow the tokens.

**Readability (against the usual 4.5:1 bar for normal-size text):**

| Pair | Ratio | |
|---|---|---|
| White on navy `#1B2440` (every main button) | 15.30 | passes, by far |
| Navy text `#18213A` on white | 15.94 | passes |
| Green `#1C7F72` links and labels on white / on the app background | 4.85 / 4.50 | passes, just |
| White on green `#1C7F72` | 4.85 | passes |
| Green `#1C7F72` on `--brand-soft` `#E5F3EF` (tips, highlight labels) | 4.25 | **below** |
| `--brand-2` `#156358` on `--brand-soft` | 6.22 | passes |
| Secondary text `#4B566B` on white / on the mint wash | 7.39 / 6.18 | passes |
| Hint grey `#8790A3` on white / app background / mint wash | 3.21 / 2.98 / 2.68 | **below** |
| White on WhatsApp green `#1DA851` | 3.10 | **below** |
| Red `#E0623E` (dots only, not text) | 3.51 | fine for a dot |

The redesign fixed the big ones (the first draft found white on our teal buttons at 3.42 and on orange at 3.05).
What is left is the smallest text: hints and small print, and green text on the pale green tips.

### Type
- One family, **Plus Jakarta Sans**. Headlines are now 700 instead of 800; the welcome headline mixes a light and a
  heavy weight ("Find flatmates who **match your vibe.**").
- Body 15.5 px, line height 1.6.
- **Still eleven text sizes between 12 and 20 px**; the commonest are 13 (64 uses), 14 (57), 13.5 (45), 12 (37),
  12.5 (35), 14.5 (25), 15 (24).

### Shapes, spacing, icons
- White cards with 20 px corners, thin borders and soft navy-tinted shadows on a very light grey-green page. White
  top bar; dialog headers white with a grey close button. Buttons navy, 12 px corners.
- Icons: thin line icons in navigation and buttons, **still mixed with emoji** in content (🦉🍳🦋 on the quiz card,
  ⚡ on the Gen Z badge, 🎁, 🛋, 🎉, ✨) and drawn room illustrations where there are no photos.

### What the key screens lead with
- **Welcome page:** a pale mint wash; "FIND YOUR VIBE. FIND YOUR FLATMATE." in green; the two-weight headline; the
  navy 1-minute quiz card; a paragraph; three points; then the sign-in card, whose heading starts at 643 px on an
  844 px phone screen, so its choices and the number field are on the second screen. About 6,500 px tall in all.
- **A listing card (Discover):** a 4:3 photo or drawn room with the type tag, the match ring and ♥; then title, area,
  the flatmate's job, the "Gen Z household" badge (now pale green), furnishing · who · from date, "Bachelors welcome ·
  no brokers", rent, "+ expenses · deposit", "Posted 17 days ago". **Eight lines under the photo; the rent is the
  seventh.** The redesign changed the colours, not the layout.
- **A home's page:** the same order as before (gallery with match ring, who you'd live with, vibe analysis, rent and
  expenses tables, details, map, request box, sticky bar), now on white with a white header.

---

## 2 · Their design language

All seen 8 Nov 2026 in search excerpts unless marked; Mark's study facts were seen 6 Nov 2026.

### NoBroker
- **Main colour:** from general knowledge, a red-pink brand with a red logo; **hex could not confirm** (no brand
  page found; search, 8 Nov 2026).
- **First screen:** "Just Say No to Brokerage!"; owners "Trusted by 10 Lac+ Owners"
  (https://apps.apple.com/us/app/-/id1200507100; https://www.nobroker.in/post-property-for-rent/; Mark's study).
- **What users and designers say:** "too cluttered home page and advertisements taking up prime screen space"
  (https://medium.com/@aditis.singh99/understanding-user-experience-of-a-real-estate-application-using-nobroker-9ed15dee2517);
  reviews are missing from listing pages and a designer proposes showing them on the property page
  (https://medium.com/@neleena.paul/wish-i-knew-before-i-moved-a-ux-fix-for-nobrokers-missing-reviews-94a73c9b37bc);
  "about 90% of listings already occupied", "16 to 20 calls a day" (Trustpilot, via Mark's study).
- **Listing card, photos, price:** could not confirm.
- **Takeaway:** the promise ("no brokerage") is the headline; the app around it got busy with services.

### 99acres (Info Edge)
- **Main colour:** from general knowledge, a blue brand; **hex could not confirm** (search, 8 Nov 2026).
- **First screen:** "India's leading property search App" (https://apps.apple.com/us/app/id781765588?l=en-us, via
  Mark's study); search-first portal.
- **Design write-ups:** a "New Age Property Search for 99acres.com" redesign by an Info Edge graduate project
  (https://www.behance.net/gallery/87657893/New-Age-Property-Search-for-99acrescom-UIUX-Design); a case study
  comparing it with Magicbricks rates 99acres' form help higher
  (https://medium.com/@jaineshua1822529/ui-ux-case-study-magicbricks-173d0e8d4bc7). Contents of the redesign:
  could not confirm.
- **Weak spot users name:** "calls from 10 different sales reps within 24 hours of posting" (Trustpilot, Mark's study).
- **Listing card, photos, price:** could not confirm.

### Housing.com
- **Main colour:** the 2015 identity by Moving Brands used four colours, "Housing Pink, Yellow, Purple and Green",
  meant to convey optimism, with an upward-arrow logo and the idea "Look Up"
  (https://bestmediainfo.com/2015/03/housing-com-unveils-new-brand-identity-conveying-look-up;
  https://yourstory.com/2015/03/housing-global-logo). From general knowledge it now leads with purple;
  **current palette could not confirm**. Sold to Aurum PropTech in July 2026 (Mark's study), so a rebrand may come.
- **Look:** app-store reviewers call the design "beautiful and flawless" and a 2025 profile calls it "clean design,
  intuitive layout" (https://apps.apple.com/in/app/housing-buy-rent-sell-pay/id967257660;
  https://www.aurumproptech.in/pulse/company-insight/housing). Complaints are about listings and plans, not looks:
  "broker listings far outnumber owner-listed" (https://www.trustpilot.com/review/housing.com).
- **Takeaway:** the most polished of the Indian portals by reputation; its weak spot is trust in the listings.

### Magicbricks (Times Internet)
- **Main colour:** from general knowledge, red; **hex could not confirm**.
- **Research findings (a 40-interview study for Magicbricks):** users' first worry was trust, that their number
  would reach brokers without consent (https://www.uxstudioteam.com/ux-blog/user-research-magicbricks). An audit
  found the interface "cluttered with too much information at once" and that terms like "Magic Cash" were not
  understood (https://www.scribd.com/document/616365922/UX-Audit-Final-Report-Magicbricks). White text over photos
  with a dark overlay tested hard to read (https://alokmittal101.medium.com/home-loan-e6a2f8267f82).
- **Takeaway:** the clearest evidence of what not to do: clutter, insider words, and text over photos.

### FlatMate.in (closest Indian flatmate app)
- **First screen and hooks:** "A Mobile Application to find perfect flatmate/roommate", "without paying brokerage";
  "lets you check compatibility match percentages" (Mark's study, https://www.flatmate.in/). Chat that doesn't expose
  the phone number (https://appgoblin.info/apps/com.roommate.flatmate).
- **Ratings:** iOS India 3.1 from 211 ratings; a sister Android app 2.16 from 352 (Mark's study).
- **Colours, cards, photos:** could not confirm.

### SpareRoom (UK and US, abroad reference)
- **Brand:** refreshed after about seven years around "Find Home Together", to work in the UK and the US
  (https://blog.spareroom.co.uk/a-message-from-cmo-introducing-new-spareroom/). **Colours could not confirm.**
- **Listings:** rent and deposit shown plainly, with the period ("pcm" or "pw"), a photo count and a main image
  (https://apify.com/kawsar/spareroom-listings-extractor; https://apps.apple.com/gb/app/spareroom/id400181250);
  a photo-ID verified badge (Mark's study); some ads have no photos "for personal security reasons", so cards need a
  no-photo state (App Store reply, same link).
- **Designers' notes:** users wanted quick image access without opening the listing
  (https://www.kamilornal.com/spareroom); the search layout tested "too cramped"
  (https://medium.com/@sharikatayub/spareroom-app-concept-a-ux-case-study-c382fa4120).

### What the market looks like, in one paragraph
The big Indian portals own red (NoBroker, Magicbricks), bright blue (99acres) and purple (Housing.com), all from
general knowledge, hexes unconfirmed. **Our new navy with one muted green is calmer than all of them** and still
stands apart; there is no case for chasing theirs. Their shared problem, in their own users' and researchers' words, is clutter and distrust:
too much on the first screen, ads in prime space, numbers going to brokers, listings that turn out to be gone. Our
promise (owner-listed, numbers shared only on accept, vibe first) answers that; the design should make it visible
faster and say less around it.

---

## 3 · Suggested changes, ranked by impact on a first-time user on a phone

Re-checked against the redesigned screens on 8 Nov 2026. Nothing here touches the sign-in steps or the onboarding
questions, and nothing in 3a changes a colour: everything uses the existing tokens.

### 3a · No colour change needed (all still open after the redesign)

| # | Change | Why | Borrows or avoids | Effort |
|---|---|---|---|---|
| 1 | **Listing card: rent and match on the photo, four lines under it.** Put the rent ("₹16,750 / month") on the photo's bottom edge on a white pill (not white text on a dark overlay), keep the match ring; under the photo only title, area, one "who you'd live with" line, and one highlight (shared interest or bachelors welcome). Move furnishing, dates, posted-ago and reply speed to the home's page. | The rent is still the seventh line after the redesign; every portal and SpareRoom put price first, and the card is too long to scan on a phone. | Borrows SpareRoom's plain rent; avoids Magicbricks' white-on-overlay text, which tested hard to read. | Medium |
| 2 | **Say the trust promise on every card and the welcome's first screen**, in one short line with a tick: "Owner-listed · your number shared only if you both say yes". | Distrust is the category's top complaint (Magicbricks research; NoBroker and Housing reviews). We already work this way; it's not said where people decide. | Borrows NoBroker's habit of leading with the promise; avoids their unprovable big numbers while we are new. | Small |
| 3 | **Drop negative or stale signals from the card**: "Posted 17 days ago" and "Usually replies in a few days" read as reasons not to tap. Show reply speed only when fast ("Replies within hours") and age only when new ("New this week"). | Every line on a card should help the decision. | Avoids NoBroker's "already occupied" feeling. | Small |
| 4 | **One kind of icon.** Keep the line icons; replace emoji in content (the quiz faces, the ⚡ on the Gen Z badge, gift, FlatMart, parties, empty states) with matching line icons or the room illustrations. | The redesign made the app calm and grown-up; emoji are now the loudest thing on many screens and render differently on every Android phone. | Fits the new "Look and feel"; borrows Housing.com's "clean" reputation. | Medium |
| 5 | **A type scale of five sizes** (12, 13.5, 15.5, 20, and the headline clamp) instead of eleven. | No visual change most people would notice; every screen gets consistent and new screens stay tidy. | Avoids the "cluttered" verdict on Magicbricks. | Small |
| 6 | **Use `--brand-2` instead of `--brand` for green text on the pale green tips** (`--brand-soft`). | 4.25:1 today, 6.22:1 after, with tokens that already exist, so it keeps the look. | Internal. | Small |
| 7 | **Welcome page: the sign-in card's choices on the first phone screen.** Move the paragraph below the card; keep the quiz card and three points above it. | Today only the card's heading shows on the first screen; the choice and the number field need a scroll. Every portal leads with the action. **This moves the sign-in card, so it needs Kamal's yes even though the card stays the same.** | Borrows the portals' action-first first screen. | Small |
| 8 | **A no-photo state that says what is missing**, instead of an illustration that can look like a real room. Label the card "No photos yet" on a pale green panel. | Honest, and it nudges owners to add photos (which the beautify feature now makes look good). | Borrows SpareRoom's plain handling of no-photo ads. | Small |

**Done by the redesign, dropped from this list:** the first draft's "name the hard-coded colours" (the screens now
follow the tokens; what remains is in the logo, illustrations and share images, which can stay).

### 3b · Needs Kamal's decision (the look is set; these are the only colour points left)

| # | Change | Before | After | Why | Effort |
|---|---|---|---|---|---|
| C1 | **Darker hint grey** for small print and form hints (`--text-3`). | `#8790A3`: 3.21 on white, 2.98 on the app background, 2.68 on the mint wash | `#5E6679`: 5.75, 5.33, 4.81 | The only text in the app still below 4.5:1 everywhere; it is "+ expenses", "Posted…", and the hints under form fields. Same grey family, a step darker. | Small |
| C2 | **WhatsApp button contrast** (on the sign-in card, so only on Kamal's word). | `#1DA851` (3.10:1) | `#178741` (4.59:1) | Readability; keeps WhatsApp's green family. | Small |

**Moot after the redesign** (from the first draft): darker teal for buttons (buttons are navy now, 15.3:1), darker
orange for the main action (no orange buttons left), one action colour (navy is the only action colour now),
retiring the pink-purple Gen Z badge (it is pale green now).

**Not suggested:** any new hue. The new look already does what the first draft argued for: fewer colours, each with
one job, and strong contrast where people tap.

---

## 4 · What could not be confirmed, and 15 minutes of screenshots that close it

Not seen: each competitor's current colours and fonts, their listing cards, their first screens on a phone, and how
they show price and photos. To close it, on Kamal's phone (or a laptop), about a minute each:

1. NoBroker app: home screen, a rent search for "Baner, Pune", one listing card, one listing page.
2. 99acres app: the same four.
3. Housing.com app: the same four.
4. Magicbricks app: home screen and one listing card.
5. FlatMate.in app: home screen and one flatmate card.
6. SpareRoom website on a phone browser: home and one room ad.

Drop them in a folder in the repo (or send them to my session) and I will add hex values, fonts and card layouts
to section 2, and revisit the ranking. Alternatively, allowing these six sites in this session's network lets me
read their pages directly.

## 5 · The mock

`design/listing-card-mock.html` shows suggestions 1, 2, 3 and 8 next to today's card, in the new look's tokens
(navy, muted green, white cards). It is a standalone page, not wired into the app.
