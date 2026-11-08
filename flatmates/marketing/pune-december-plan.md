# FindMeFlatMate · Pune, December 2026 · listings plan and target

Prepared 5 November 2026 for Kamal. Scope: one month, Pune only, listers (people with a room to fill).

**Decisions (5 Nov).** Full plan at ₹77,500, all 11 areas. Go-live month open: December or January, Kamal confirms.
Dates below are written for December; for January, shift every date by one month (go-live 1 January, checkpoints
7, 14, 21 and 31 January) and run the "launching soon" teasers from `pune-week-one-content.md` section C through
December instead. Week-one copy, Pune carousel and reel cuts and the teasers are in `pune-week-one-content.md`.
Budgets and copy build on `lister-campaign-pack.md`; the UTM and report details come from `../README.md`
("Ads and tracking"). Nothing here is live until Kamal lifts the hold and pastes it in.

---

## 1 · The target I am accountable for

**400 rooms listed in Pune by 31 December**, counted as "rooms listed" in `fm_source_report`, all sources
(paid and organic), sample accounts excluded. Stretch: 500, which is what the pack's own target of
"under ₹150 per listing in month one" would give from ₹77,500 of spend.

Checkpoints (cumulative rooms listed):

| Date | Rooms listed | What happens if we are under |
|---|---|---|
| Mon 7 Dec | 60 | Expected: week one is the learning phase. Swap the weakest hook, no budget change. |
| Mon 14 Dec | 160 | Move 30% of budget to the cheapest ad set; replace the weakest creative in each set. |
| Mon 21 Dec | 280 | Pause the most expensive ad set, put its money on the cheapest; new hooks for the last 10 days. |
| Thu 31 Dec | 400 | Full post-mortem by 2 January: cost per listing by persona, area and creative, and the January plan. |

Cost per listing I hold myself to: **under ₹200 blended in December** (the pack's ₹150 is the stretch
for a first month with no data).

What I control and will deliver on time: every creative, every copy variant, the weekly test, the
Monday read of the numbers and the budget moves I recommend. The target also depends on four things I
do not control; if one slips, I re-forecast the same day and tell you the new number rather than
pretend:

1. The hold is lifted by **30 November** and the owner page, sign-up and listing flow work on phone.
2. Spend runs as planned (₹2,500 a day) from 1 December and the Pixel's `CompleteRegistration` event
   fires on owner sign-up.
3. The weekly numbers reach me every Monday (one query, section 8).
4. Featured listing stays off (it is, per the spec) so owners are not asked to pay to be seen in month one.

---

## 2 · Before 1 December (checklist, who does what)

| By | What | Who |
|---|---|---|
| 20 Nov | Confirm area list (section 3) and the plan: full (₹77,500) or lean (₹31,000, Instagram only) | Kamal |
| 24 Nov | Pune copy pasted into Meta Ads Manager and Google Ads as drafts, campaigns paused | Kamal, from sections 4 and 5 |
| 24 Nov | Meta Pixel on findmeflatmate.com with `CompleteRegistration` on owner sign-up; Google Ads conversion imported from the same event; auto-tagging on | Tech employee, via Kamal |
| 27 Nov | Test one sign-up from a phone through the owner page with a UTM link; check it shows in `fm_source_report(7)` | Tech employee, via Kamal |
| 28 Nov | Instagram bio, pinned post and launch stories scheduled (section 7) | Kamal, copy in section 7 |
| 30 Nov | Hold lifted; Razorpay can stay in test mode, listing is free | Kamal |
| 1 Dec | Campaigns switched on at 9 am; ad spend entered in `fm_ad_spend` daily or weekly | Kamal |

---

## 3 · Areas, budget and calendar

**Areas (11).** Baner, Balewadi, Aundh, Wakad, Hinjewadi, Kothrud, Kharadi, Viman Nagar, Kalyani Nagar,
Koregaon Park, Magarpatta (the app spells it "Hinjewadi Phase 1" in links). Baner is the area the spec already uses; the other ten are my pick of where
people aged 21 to 35 rent in Pune. Cut to five (Baner, Wakad, Hinjewadi, Kharadi, Viman Nagar) if you
want the ads to learn faster on the same money.

**Targeting.** Meta: pin drops on each area, 2 km radius, Pune only. Google: the same areas as location
targets, presence (not interest). Landing page for every ad: `https://findmeflatmate.com/?host=Pune`
(the owner page for Pune). Copy names the areas; the page shows who is looking.

**Budget (before 18% GST).**

| Channel | Per day | 1 to 31 Dec | Split |
|---|---|---|---|
| Meta, Instagram placements | ₹1,000 | ₹31,000 | P1 40% · P2 30% · P3 30% |
| Meta, Facebook placements | ₹500 | ₹15,500 | same ad sets, Meta picks placement |
| Google Search | ₹1,000 | ₹31,000 | P1 ₹350 · P2 ₹350 · P3 ₹300 a day |
| **Total** | **₹2,500** | **₹77,500** | about ₹91,450 billed with GST |

Lean plan: Instagram only, ₹1,000 a day, ₹31,000. Same ad sets and copy, Google waits until January.

**Calendar.**

| Week | Dates | Paid | Organic |
|---|---|---|---|
| 1 | 1 to 7 Dec | All ad sets on, learning. No changes before day 7. | Launch week: bio, pinned post, 3 stories, 1 reel, 3 posts |
| 2 | 8 to 14 Dec | Test 1: headline "Your flat. Your pick." vs "See who fits before you say yes" (P1) | 3 posts, 1 reel, 2 stories |
| 3 | 15 to 21 Dec | Test 2: Pune-named vs generic primary text (all sets). Budget to the cheapest ad set. | 3 posts, 1 reel, 2 stories |
| 4 | 22 to 31 Dec | Test 3: story vs feed cost per listing. "Replacement by January" angle for P2. | 3 posts, 1 reel, 2 stories, year-end post |

---

## 4 · Meta (Facebook and Instagram) setup, Pune

**Campaign.** Name `listers_pune_dec`. Objective Sales, conversion `CompleteRegistration`; switch to Leads
on the owner page only if under 50 conversions a week after week one. Daily budget ₹1,500 at campaign
level with Advantage campaign budget off, so the ad set split holds.

**URL parameters (every ad, from the spec):**
`utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{site_source_name}}`
Website URL: `https://findmeflatmate.com/?host=Pune`. The report tells Instagram from Facebook by `ig`
in `utm_term`.

**Ad sets (3).** Pune pins as above. Languages English, Hindi, Marathi. Placements: Instagram feed,
stories, reels; Facebook feed and stories. Exclude: anyone who signed up in the last 30 days (Pixel
custom audience) once it has 100 people.

| Ad set | Name | Daily | Age | Interests |
|---|---|---|---|---|
| P1 flatmate wanted | `p1_flatmate_wanted` | ₹600 | 22 to 40 | Renting, Apartment, Roommate, Flatmate, NoBroker, Housing.com, 99acres, Magicbricks, Urban Company |
| P2 replacement | `p2_replacement` | ₹450 | 22 to 40 | P1 list plus Packers and movers, Rentomojo, Furlenco, OLX, Facebook Marketplace |
| P3 owner | `p3_owner` | ₹450 | 28 to 55 | Real estate, Landlord, Property management, Rental income, NoBroker, Magicbricks, 99acres; exclude students |

**Creatives per ad set.** Square `*-instagram-feed-1080x1080` for feeds, `*-story-reel-1080x1920` for
stories and reels, `*-facebook-link-1200x628` for Facebook link ads, plus the reel for that persona
(P1: `L01-40-messages`, P2: `FindMeFlatMate-ReelA-11pm.mp4`, P3: `L08-20000-for-a-phone-number`).
Ad names: `p1_carousel`, `p1_story`, `p1_reel_L01`, and the same pattern for P2 and P3.

**Copy, Pune variants** (primary text; headline 40 characters max; description; CTA Sign up).

P1 · flatmate wanted
- Primary A (Pune): "Your flatmate's moving out of your Baner or Kharadi flat. Don't take the first random who replies. On FindMeFlatMate every request shows how they live (sleep, food, guests, chores) with a vibe score against your flat. You choose. Numbers swap only on a yes. Listing is free."
- Primary B (generic, for test 2): "40 'interested bro' messages in the group chat. Zero information. List your spare room free on FindMeFlatMate and see a vibe score on every request before you reply."
- Primary C: "Pune, pick who you live with. Free listing, vibe score on every request, no brokers, no phone number in public groups."
- Headlines: "Your flat. Your pick. Pune." · "See who fits before you say yes" · "List your Pune room free"
- Description: "Free to list · Vibe score on every request · No brokers"

P2 · replacement
- Primary A (Pune): "Leaving your Wakad or Hinjewadi flat on the 31st? Your deposit depends on who takes your room. FindMeFlatMate shows you who's looking near you right now (budget, move-in date, how they live) and lets you invite the ones who fit. They have 3 days to answer. Free."
- Primary B (generic): "Moving out and need a replacement the flat will say yes to? Invite people who match your flat's vibe, with a 3-day deadline, and sell your stuff in one link on the way out."
- Primary C (week 4): "Notice given, January move? Find your replacement before the new year, not after. Free, no brokers, no ghosting."
- Headlines: "Find your replacement in Pune" · "Invite people who fit. 3-day deadline" · "Moving out? Find your replacement"
- Description: "Free to list · See who's looking near you · Deposit safe"

P3 · owner
- Primary A (Pune): "A Pune broker takes a month's rent to send you strangers. FindMeFlatMate shows you who's looking in Baner, Kharadi, Viman Nagar and Wakad, what they can pay, how they live and whether they pay on time. You post free. You choose every tenant. Zero brokerage."
- Primary B (generic): "Flat empty? See how many people are looking in your area right now, with budgets, before you even post. Free listing, vetted requests, your number stays private until you say yes."
- Primary C: "Rent it to someone who fits your house rules. Zero brokerage. Free to post."
- Headlines: "Rent your Pune flat. Zero brokerage." · "Post your flat free" · "Tenants who fit your house rules"
- Description: "Free to post · Vibe score + pays-on-time badge · You choose"

---

## 5 · Google Ads setup, Pune

**Campaign.** Search, name `listers_pune`, ₹1,000 a day, manual CPC ₹8 to ₹15 to start, Maximise
conversions once there are 30 sign-ups in a rolling 30 days. Locations: the 11 areas, presence.
Schedule all day, bid +20% Sunday and Monday evenings. Final URL `https://findmeflatmate.com/?host=Pune`;
campaign URL suffix `utm_source=google&utm_medium=cpc&utm_campaign=listers_pune`; auto-tagging on.

Keywords, headlines (30 characters max) and descriptions (90 max): take the three ad groups from
`lister-campaign-pack.md` section 3 as they are, and add these Pune lines to each group.

| Ad group | Add keywords (phrase + exact) | Add headlines |
|---|---|---|
| P1 flatmate wanted (₹350/day) | flatmate wanted pune · roommate wanted pune · flatmate wanted baner · flatmate wanted kharadi · flatmate wanted wakad · flatmate wanted hinjewadi · flatmate wanted viman nagar · flatmate wanted kothrud · room available pune post free | Find a Flatmate in Pune · Pune Flatmate Finder. Free · Baner, Kharadi, Wakad & More · Flatmate Wanted in Pune? Free |
| P2 replacement (₹350/day) | replacement flatmate pune · replacement roommate pune · take over my room pune · room available immediately pune · room from january pune | Replacement Flatmate Pune · Leaving Pune Flat? List Free · Replacement by the 20th · Invite, Don't Wait |
| P3 owner (₹300/day) | rent my flat pune no broker · rent flat pune owner · post property for rent pune free · tenants without brokerage pune · rent out room pune · rent flat baner owner · rent flat kharadi owner · rent flat wakad owner | Rent Your Pune Flat. No Broker · Pune Owners: Post Free · Tenants Who Fit, Zero Broker · Your Number Stays Private |

Pune descriptions (one per group, add to the pack's four):
- P1: "Flatmate leaving your Pune flat? List free, see a vibe score on every request, you choose."
- P2: "Leaving a Pune flat? See who's looking in your area, invite the ones who fit. 3-day deadline."
- P3: "Pune owners: see who's looking in your area with budgets, post free, zero brokerage."

Negative keywords, sitelinks, callouts and snippets: as in the pack. Add negatives: pg · paying guest ·
hostel pune · co-living (we are not a PG; those clicks cost and do not list).

---

## 6 · Organic Instagram, December (titles and files; full copy comes each Tuesday)

Link in bio for the month:
`https://findmeflatmate.com/?host=Pune&utm_source=instagram&utm_medium=social&utm_campaign=bio`

| Date | Format | Title | File or screen |
|---|---|---|---|
| Tue 1 Dec | Pinned post | "Pune, we're live. No brokers, ever." | Owner page for Pune, phone screenshot |
| Tue 1 Dec | 3 stories | Poll "Flatmate leaving soon?" · how a request looks · link sticker | P1 story 1080×1920 |
| Wed 2 Dec | Reel | L01 "40 messages, zero information" | `L01-40-messages` |
| Thu 3 Dec | Carousel | P1 "Don't take the first random who replies" | `P1-instagram-carousel-*` |
| Sat 5 Dec | Post | "The listing said 2BHK. It didn't say 5:30 AM." | Ad 1 still, vibe score badge |
| Tue 8 Dec | Post | "Your number stays yours" | Request screen, number hidden |
| Wed 9 Dec | Reel | L05 "Leaving on the 30th?" | `L05-deposit-30th` |
| Thu 10 Dec | Carousel | P2 "Your deposit depends on the next person" | `P2-instagram-carousel-*` |
| Sat 12 Dec | Post | "Three steps, three minutes, free" | Listing flow, step 1 of 3 |
| Tue 15 Dec | Post | "₹20,000 for a phone number?" | Ad 2 still |
| Wed 16 Dec | Reel | L08 "₹20,000 for a phone number?" | `L08-20000-for-a-phone-number` |
| Thu 17 Dec | Carousel | P3 "Tenants you'd actually want. Zero brokerage." | `P3-instagram-carousel-*` |
| Sat 19 Dec | Post | "House rules. Finally, tenants who fit them." | Household questions screen |
| Tue 22 Dec | Post | "Moving in January? Find your people first." (Tribe, seekers) | Tribe match card |
| Wed 23 Dec | Reel | L07 "Sell everything in one link" | `L07-sell-everything-one-link` |
| Sat 26 Dec | Post | "Rent and bills, split in a tap" (Flatsplits) | Flatsplits screen |
| Tue 29 Dec | Post | "Notice given? Replacement before the new year." | Escape invite screen |
| Wed 30 Dec | Reel | L06 "Invite, don't wait" | `L06-invite-dont-wait` |
| Thu 31 Dec | Post | "Pune, month one. Thank you." (real numbers from the report, or no numbers) | Owner page |

Stories twice a week from week 2 (Tue, Fri): poll on frame 1, app screen on frame 2, link sticker to
the owner page. Hashtags per post follow the persona sets in the packs, plus `#punerooms
#puneflatmates #punerent`.

---

## 7 · Launch-week copy (ready to paste)

**Bio (150 characters max):** "Find a flatmate who lives like you. Vibe score on every request. No brokers, ever. Pune first. List your room free ↓"

**Pinned post caption (1 Dec):** "Pune, we're live. Flatmate leaving? Flat empty? List the room free in three steps. Every request shows how they live, scored against your flat, and your number is shared only when you say yes. No brokers, ever. Link in bio. #FindMeFlatMate #punerooms #puneflatmates #flatmatewanted #rentmyflat #nobrokerage #baner #kharadi #wakad #hinjewadi"
Visual: phone screenshot of the owner page for Pune, on-screen text "Pune. Live today. List free."

**Stories (1 Dec).** Frame 1: P1 story image, poll sticker "Flatmate leaving soon? Yes / Not yet". Frame 2
(to Yes voters): request card with vibe score, text "Every request, scored against your flat." Frame 3:
owner page, link sticker to the bio link, text "List your room free. Pune."

**Comment and DM replies (brand voice).**
- "Is it free?" → "Listing is free, always. Seekers get 5 contacts free, then passes from ₹500. No brokerage on either side."
- "Which cities?" → "Pune first this month. Bengaluru, Hyderabad, Mumbai and more are in the app too."
- "Is this a PG?" → "No. Private rooms, shared rooms and whole flats, listed by the people who live there or own them."
- "Will my number be public?" → "No. Numbers swap only after you accept a request, both ways."
- "Android only?" → "Android app and the website for now. iOS is not out yet."

---

## 8 · Measurement and what I need every Monday

Run in the Supabase SQL editor and paste me the output (or a screenshot of the ads dashboard):

```sql
select * from fm_source_report(7);
```

Plus the Meta and Google spend for the week (also entered in `fm_ad_spend`). From that I send you by
Monday evening: rooms listed against the checkpoint, cost per listing by channel and persona, the budget
move for the week, and the test result with the next test.

**Rules I will apply.**
- Learning phase: no edits for the first 7 days unless an ad is rejected or a link is broken.
- Scale: an ad set under ₹150 per listing for 7 days gets +20% budget, taken from the one above ₹250.
- Pause: a creative with no listing after ₹3,000 of spend is replaced, never left running.
- Report: cost per listing, not cost per click, is the only number that moves budget.

---

## 9 · Needs a change in the app (for the tech employee, via Kamal)

**Status 5 Nov, from the tech employee (read-only check, nothing built yet, waiting for Kamal's go-ahead):** items 2
and 3 already work as typed; the app spells the area "Hinjewadi Phase 1", so per-area links use that name. Item 1 is
coded in the app; what is missing is the **Meta Pixel ID** and the **Google tag and conversion IDs** from Kamal's Meta
and Google Ads accounts, then a live check. Kamal: send those two IDs to the tech employee.

1. Pixel `CompleteRegistration` on owner sign-up and a Google Ads conversion from it (needed for the
   Sales objective to learn).
2. Confirm the owner page renders with `?host=Pune` and no `area`, and keeps the UTM tags into sign-up.
3. Optional: a `?host=Pune&area=<Area>` deep link per area for the area-named ads in January.
