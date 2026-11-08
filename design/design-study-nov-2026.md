# FindMeFlatMate · Design study · our look against 99acres, NoBroker, Housing and others

Prepared by Teche for Kamal, 8 November 2026 (task from Kamal via King: "study the colors of app and website and
design language of 99acres, NoBroker, Housing and others. Post that suggest the best changes.").

**This is a study, not a change.** Nothing in the app, the website or the database was touched. Suggestions that
change a colour are in their own section at the end, because the standing rule is that colours do not change
without Kamal.

**The limit to know about.** This session cannot open the competitors' sites or the app stores (Kamal kept the
network closed; nobroker.in, 99acres.com, housing.com, magicbricks.com, spareroom.co.uk and flatmate.in were all
refused on 8 Nov 2026). So:
- **Our side** is exact: read from `flatmates/index.html`, `manifest.webmanifest` and phone-sized screenshots of
  the app in demo mode, 6 to 8 Nov 2026.
- **Their side** comes from web search excerpts (seen 8 Nov 2026), Mark's study
  (`flatmates/marketing/competitor-study-nov-2026.md`, sources seen 6 Nov 2026), and design write-ups by others.
  Their exact colour values, fonts and current screens are **could not confirm**. Where I name a competitor's main
  colour from general knowledge, it says so. Section 4 lists the 15 minutes of screenshots that would close the gap.

---

## 1 · Our design language today

### Colours (tokens in `index.html`, `:root`)

| Token | Hex | Where it is used (count of uses in the page) |
|---|---|---|
| `--brand` | `#0E9AA0` (teal) | Primary buttons, top bar, links, selected chips, tab highlight, browser bar (`theme-color`), app icon frame. 70 uses. |
| `--brand-2` | `#0B7C82` (dark teal) | Hover and pressed states, text on light teal. 31 uses. |
| `--brand-soft` | `#E2F5F5` | Light teal fills: selected cards, room-detail labels, info boxes. 31 uses. |
| `--accent` | `#F26B1D` (orange) | "Send request", "Get a Room Pass", Passes tab, search button, "you both like" lines, active filter chips. 50 uses. |
| `--accent-soft` | `#FFF2E8` | Light orange fills (gift pill, active filters). 21 uses. |
| `--ok` | `#0E9F7E` (green) | "Same" answers, ticks, "Bachelors welcome", pays-on-time badge. 31 uses. |
| `--warn` / `--danger` / `--mid` | `#B45309` / `#C2261D` / `#E08A00` | Warnings, errors, "Close" answers. |
| `--text` / `--text-2` / `--text-3` | `#101418` / `#4A5260` / `#8A919C` | Body text, secondary text, hints and "Posted 20 days ago". |
| `--app-bg` / `--card` / `--hair` | `#F3F6F9` / `#FFFFFF` / `#E1E6EC` | Signed-in background, cards, hairlines. |
| `--grad` | `#0E9AA0` to `#0F8EA6` to `#1F6CC4` | Welcome band, onboarding screens, Tribe and Escape headers. 14 uses. |
| Buttons, polished | `#12A9AE` to `#0B858B` (primary), `#FF7E2E` to `#EE5A12` (accent) | Gradients over the flat tokens on signed-in screens. |
| WhatsApp button | `#1DA851` | "Get the code on WhatsApp" on the sign-in card. |

**Colours outside the tokens** (hard-coded, most used): navy `#10264F` (21 uses), yellows `#FFD08A`, `#FFC24D`,
`#FFC86B` (Tribe savings box, flatmate-type name), pink-purple `#B63BA8` with `#F0645A` (the "Gen Z household"
badge gradient), blues `#1E6FD9`, `#1F6CC4`, `#EEF3FD`, greens `#14C08A`. Each section of the app has picked up its
own accent: Flatsplits green, FlatMart orange-to-pink, Passes orange, Tribe blue with yellow.

**Readability (contrast against the usual 4.5:1 bar for normal-size text):**

| Pair | Ratio | |
|---|---|---|
| White on teal `#0E9AA0` (primary buttons, top bar) | 3.42 | below |
| White on the primary gradient's light end `#12A9AE` | 2.87 | below |
| White on orange `#F26B1D` ("Send request", "Get a Room Pass") | 3.05 | below |
| White on the accent gradient's light end `#FF7E2E` | 2.54 | below |
| White on WhatsApp green `#1DA851` | 3.10 | below |
| Teal `#0E9AA0` text on white (links) | 3.42 | below |
| Orange `#F26B1D` text on white ("You both like Gym") | 3.05 | below |
| Hint grey `#8A919C` on white / on the app background | 3.18 / 2.93 | below |
| Secondary text `#4A5260` on white | 7.87 | passes |
| Dark teal `#0B7C82` (`--brand-2`) | 4.98 | passes |

On a phone outdoors these are the lines people squint at: prices' small print, "Posted 20 days ago", "Usually
replies in a few days", and the button labels.

### Type
- One family, **Plus Jakarta Sans** (Google Fonts, weights 400 to 800), for headings and body.
- Body 15.5 px, line height 1.6. Headings 800 weight, tight letter spacing (-0.025em). Hero headline
  `clamp(34px, 5vw, 58px)`.
- **Eleven text sizes between 12 and 20 px** are in use; the commonest are 13 (65 uses), 14 (57), 13.5 (45), 12 (37),
  12.5 (34), 14.5 (25), 15 (24). Half-pixel steps a person can't tell apart.

### Shapes, spacing, icons
- Cards: white, 20 px corners, soft two-layer shadow on a pale blue-grey background. Buttons: 12 px corners, filled
  gradients with a coloured glow. Chips: fully round, 8 by 14 px padding.
- Icons: thin line icons (SVG, 1.8 to 2.2 stroke) in the navigation and buttons, **mixed with emoji** in content
  (🦉🍳🦋 on the quiz card, 🎁 gift, 🛋 FlatMart, 🎉 parties, ✨, 🔔 in empty states) and drawn room illustrations
  where there are no photos.

### What the key screens lead with
- **Welcome page (website):** a teal-to-blue gradient band; "FIND YOUR VIBE. FIND YOUR FLATMATE."; headline "Find
  flatmates who match your vibe."; the pink 1-minute quiz card; a paragraph; three points ("Matched on 12 lifestyle
  questions", "Meet the people before the room", "No brokers, ever"); then the sign-in card, which starts on the
  second phone screen. Below: how it works, Flatsplits, FlatMart, a map teaser, the Android band. About 6,400 px tall.
- **A listing card (Discover):** a 4:3 photo or drawn room with the room type tag and the match ring on top, ♥ save;
  then title, area, the flatmate's job, a "Gen Z household" badge, "You both like Gym", furnishing · who · from date,
  "Bachelors welcome · no brokers", rent in large type, "+ expenses · deposit", "Posted 20 days ago", "Usually replies
  in a few days". **Eight lines of text under the photo; the rent is the sixth.**
- **A home's page:** photo gallery with the match ring, "Who you'd live with" (traits as ticked chips), the vibe
  analysis box, interests, rent table, expenses table, details grid, amenities, description, the map circle, the
  request box; a sticky bar with rent and the main button.

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
The big Indian portals own red (NoBroker, Magicbricks), blue (99acres) and purple (Housing.com), all from general
knowledge, hexes unconfirmed. **Nobody in the set leads with teal**, so our colour already stands apart; there is no
case for chasing theirs. Their shared problem, in their own users' and researchers' words, is clutter and distrust:
too much on the first screen, ads in prime space, numbers going to brokers, listings that turn out to be gone. Our
promise (owner-listed, numbers shared only on accept, vibe first) answers that; the design should make it visible
faster and say less around it.

---

## 3 · Suggested changes, ranked by impact on a first-time user on a phone

Nothing here touches the sign-in steps or the onboarding questions. Colour changes are in section 3b.

### 3a · No colour change needed

| # | Change | Why | Borrows or avoids | Effort |
|---|---|---|---|---|
| 1 | **Listing card: rent and match on the photo, four lines under it.** Put the rent ("₹21,500 / month") on the photo's bottom edge on a white pill (not white text on a dark overlay), keep the match ring; under the photo only title, area, one "who you'd live with" line, and one highlight (shared interest or bachelors welcome). Move furnishing, dates, posted-ago and reply speed to the home's page. | The rent is the sixth line today; every portal and SpareRoom put price first, and the card is too long to scan on a phone. | Borrows SpareRoom's plain rent; avoids Magicbricks' white-on-overlay text, which tested hard to read. | Medium |
| 2 | **Say the trust promise on every card and the welcome's first screen**, in one short line with a tick: "Owner-listed · your number shared only if you both say yes". | Distrust is the category's top complaint (Magicbricks research; NoBroker and Housing reviews). We already work this way; it's just not said where people decide. | Borrows NoBroker's habit of leading with the promise; avoids their unprovable big numbers while we are pre-launch. | Small |
| 3 | **Drop negative or stale signals from the card**: "Usually replies in a few days" and "Posted 20 days ago" read as reasons not to tap. Show reply speed only when it is fast ("Replies within hours"), and age only when new ("New this week"). | Every line on a card should help the decision; slow-reply and old-age lines mostly hurt good homes. | Avoids NoBroker's "90% already occupied" feeling. | Small |
| 4 | **One kind of icon.** Keep the line icons; replace emoji in content (quiz faces, gift, FlatMart, parties, empty states) with matching line icons or the room illustrations. | Emoji render differently on every Android phone and make the app look less finished next to the drawn rooms. | Borrows Housing.com's "clean" reputation. | Medium |
| 5 | **A type scale of five sizes** (12, 13.5, 15.5, 20, and the headline clamp) instead of eleven. | No visual change most people would notice, but every screen gets consistent and future pages stay tidy. | Avoids the "cluttered" verdict on Magicbricks. | Small |
| 6 | **Name the colours already in use**: turn the hard-coded navy `#10264F`, the yellows and the badge gradient into tokens, without changing any hex. | Makes any later colour decision one line instead of forty, and stops each section inventing its own. | Internal only. | Small |
| 7 | **Welcome page: shorter, and the sign-in card on the first screen on a phone.** Move the paragraph below the card and keep the quiz card and three points above it. | Today a phone visitor scrolls a full screen before they can start. Every portal leads with the action. **This moves the sign-in card, so it needs Kamal's yes even though the card itself stays the same.** | Borrows the portals' search-first first screen. | Small |
| 8 | **A no-photo state that says what is missing and nudges the owner**, instead of an illustration that can look like a real room ("Illustration. The owner hasn't added photos yet." is easy to miss). Label the card "No photos yet". | Honest, and it pushes owners to add photos (which the beautify feature now makes look good). | Borrows SpareRoom's plain handling of no-photo ads. | Small |

### 3b · Needs Kamal's decision (standing rule: colours do not change)

| # | Change | Before | After | Why | Effort |
|---|---|---|---|---|---|
| C1 | **Darker teal for buttons, top bar and links**, same hue. | `#0E9AA0` (3.42:1 with white) | `#0C8389` (4.54:1) | Button labels and links are under the readability bar on every screen. Keep `#0E9AA0` for large areas (gradients, illustrations) where it carries the brand. | Small |
| C2 | **Darker orange for the main action**, same hue. | `#F26B1D` (3.05:1) and gradient `#FF7E2E`→`#EE5A12` | `#C9510C` (4.50:1), flat or a gradient `#D9560F`→`#C9510C` | "Send request" and "Get a Room Pass" are the money buttons and the hardest to read. | Small |
| C3 | **Darker hint grey.** | `#8A919C` (3.18 on white, 2.93 on the app background) | `#636B77` (5.38 on white, 4.96 on the app background) | "Posted…", "+ expenses", form hints are the smallest text. | Small |
| C4 | **One action colour.** Orange only for the one main action on a screen (request, invite, pay); teal for everything else. Today orange also marks shared interests, active filters, the search button and the Passes tab. | Two strong colours compete on most screens | Orange used about 15 times instead of 50 | People learn faster what to tap. | Medium |
| C5 | **Retire the pink-purple "Gen Z" badge gradient** for a teal or neutral badge. | `#B63BA8`→`#F0645A` | `--brand-soft` `#E2F5F5` with `--brand-2` `#0B7C82` text | It is the only pink-purple in the app and pulls the eye on every card more than rent does. | Small |
| C6 | **WhatsApp button text contrast** (on the sign-in card, so only on Kamal's word). | `#1DA851` (3.10:1) | `#178741` (4.59:1) | Readability; keeps WhatsApp's green family. | Small |

**Not suggested:** changing the brand hue. Teal is ours alone in this market (section 2); the gain is in contrast and
in using fewer colours, not a new one.

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

`design/listing-card-mock.html` shows suggestions 1, 2, 3 and 8 next to with today's card, in today's
colours. It is a standalone page, not wired into the app.
