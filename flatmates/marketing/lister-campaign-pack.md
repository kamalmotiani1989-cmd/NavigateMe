# FindMeFlatMate · Lister campaign pack (Instagram, Facebook ads, Google Ads)

Three people list a room on FindMeFlatMate, and they need three different messages:

| Persona | Who | The moment | What they fear | Our promise |
|---|---|---|---|---|
| **P1 · Flatmate wanted** | Someone living in a shared flat whose flatmate is leaving; they pick the next one | A WhatsApp "I'm moving out on the 30th" | Living with a random who doesn't fit; strangers getting their number | **Your flat. Your pick.** See how they live before you say yes. |
| **P2 · Replacement** | The person who is leaving and must find their own replacement to get the deposit back | Notice given, 2 to 4 weeks left | Losing the deposit; chasing people who ghost | **Find your replacement before the 30th.** Invite people who fit; 3-day answer deadline. |
| **P3 · Owner** | Owner or landlord renting a whole flat, a room or a bed | Flat empty, broker asking a month's rent | Brokerage; tenants who don't respect house rules; late rent | **Rent it to someone who fits your house rules.** Zero brokerage. You choose. |

Proof points from the app that every creative leans on: free to list in 3 steps · vibe score on every request · "people looking near you" with budgets and move-in dates · invites with a 3-day deadline (Escape) · your number is shared only on a yes · pays-on-time badge · no brokers, ever.

**Landing page for all lister ads:** the owner page, `https://findmeflatmate.com/?host=<City>&area=<Area>`. It shows how many people are looking in that area right now, their budgets, and a "List my room" button that leads into owner sign-up. Use the city and area that match each ad set. The site currently shows Coming soon; lift the hold before the first campaign goes live.

**UTM scheme** (the app records first-touch source, medium, campaign, content and gclid/fbclid on sign-up):
`?host=Bengaluru&area=HSR%20Layout&utm_source=<instagram|facebook|google>&utm_medium=<paid_social|cpc|organic>&utm_campaign=listers_p1|p2|p3&utm_content=<creative name>`

---

## 1 · Instagram (organic + paid)

### Carousels (one per persona, 4 slides, 1080×1350, files `P*-instagram-carousel-*`)

**P1 · "Don't take the first random who replies"**
1. Flatmate moving out? Don't take the first random who replies.
2. Every request shows how they live. Sleep, food, guests, chores, noise, smoking. Scored against your flat. (app screen)
3. You choose. Numbers swap only on a yes. No brokers, no number in public groups.
4. List the room in 3 minutes. Free. People already looking near you see it today.

Caption: "Your flatmate's leaving. The group chat will send you 40 'interested bro' messages by tonight. Or: list the room free, see a vibe score on every request, and pick the one who actually lives like you. Link in bio → findmeflatmate.com"
Hashtags: #flatmatewanted #roommatewanted #bangaloreflatmates #punerooms #hyderabadflatmates #flatmate #sharedflat #roomforrent #FindMeFlatMate #nobrokerage

**P2 · "Your deposit depends on the next person"**
1. Moving out? Your deposit depends on the next person.
2. See who's looking near you right now: budget, move-in date, how they live, whether they reply. (Escape screen)
3. Invite the ones who fit. 3-day deadline, nobody left hanging. (Invite screen)
4. Sell your stuff in one link on the way out. FlatMart. Free to list.

Caption: "Notice given, 3 weeks left, and the deposit rides on finding someone the flat says yes to. FindMeFlatMate shows you who's looking in your area today and lets you invite the ones who'd fit. They get 3 days to answer. Link in bio."
Hashtags: #movingout #replacementflatmate #flatmatereplacement #roomavailable #bangalorerooms #punerooms #hyderabadrooms #deposit #FindMeFlatMate #movingoutsale

**P3 · "Tenants you'd actually want. Zero brokerage."**
1. Tenants you'd actually want. Zero brokerage.
2. People looking near you right now, with budgets and move-in dates, before you even post. (owner page)
3. See how they live, and whether they pay on time. Vibe score + pays-on-time badge on every request.
4. Post in 3 steps, free. Featured when you're in a hurry. Your number stays private until you say yes.

Caption: "A broker takes a month's rent to send you strangers. FindMeFlatMate shows you who's looking in your area, what they can pay, how they live and whether they pay on time. You post free. You choose. Link in bio."
Hashtags: #rentmyflat #flatforrent #houseforrent #nobrokerage #zerobrokerage #landlord #bangalorerent #punerent #hyderabadrent #FindMeFlatMate

### Stories (1080×1920, files `P*-story-reel-1080x1920`)
Post each with a link sticker to the owner page and a poll sticker on the first frame ("Flatmate leaving soon? Yes / Not yet"). Stories with a poll get the second frame shown to the people who answered Yes.

### Reels (scripts; the first is already produced)
- **P2 reel, produced:** "The 11 pm text" (file `FindMeFlatMate-ReelA-11pm.mp4` from the earlier pack): the flatmate's "I'm moving out" message, the rent split maths, listing the room, the 89% request, accept.
- **P1 reel, to shoot (15 s):** phone screen recording style. Text: "Flatmate's leaving. Group chat: 40 'interested' messages, zero info." Cut to the app: a request card with 89% and the household's habits ticked. "This one sleeps when you sleep. Cooks veg. Pays on time." Tap Accept. End card: "Your flat. Your pick. Free."
- **P3 reel, to shoot (15 s):** "What a broker gives you for ₹20,000: a phone number." Cut to the owner page: "12 people looking in HSR Layout, ₹15,000 to ₹21,500 a month." Cut to a request with the pays-on-time badge. "What FindMeFlatMate gives you for ₹0: the person." End card: "Post your flat free."

Cadence: one carousel a week rotating personas, two stories a week, one reel a fortnight; reuse the paid creatives as organic posts after the ads have run a week.

---

## 2 · Facebook and Instagram ads (Meta Ads Manager)

**Campaign:** one campaign, objective **Sales → Conversions** with the pixel event `CompleteRegistration` (owner sign-up), or **Leads** on the owner page if conversion volume is under 50 a week at first. Three ad sets, one per persona, budget split 40% P1 / 30% P2 / 30% P3. Start at ₹1,500 a day in total; move budget to the ad set with the lowest cost per listing after two weeks.

**Audiences (all ad sets):** Bengaluru, Pune, Hyderabad (add Mumbai, Gurugram, Chennai in month 2). Age 22 to 40 for P1 and P2, 28 to 55 for P3. Languages English, Hindi. Placements: Instagram feed, stories, reels; Facebook feed and stories. Exclude people who signed up in the last 30 days (pixel custom audience).
- P1 interests: Renting, Apartment, Roommate, Flatmate, NoBroker, Housing.com, 99acres, Magicbricks, Urban Company; behaviour: "Recently moved" where available.
- P2 interests: as P1 plus Packers and movers, Rentomojo, Furlenco, OLX, Facebook Marketplace.
- P3 interests: Real estate, Landlord, Property management, Rental income, NoBroker, Magicbricks, 99acres; exclude students.
After 500 sign-ups: a 1% lookalike of owner sign-ups per city, which usually beats interest targeting within a month.

**Creatives per ad set:** square (`*-instagram-feed-1080x1080`) for feeds, story (`*-story-reel-1080x1920`) for stories and reels, link image (`*-facebook-link-1200x628`) for Facebook feed link ads. Run all three; Meta picks per placement.

**P1 copy**
- Primary text A: "Your flatmate's moving out. Don't take the first random who replies. On FindMeFlatMate every request shows how they live (sleep, food, guests, chores) with a vibe score against your flat. You choose. Numbers swap only on a yes. Listing is free."
- Primary text B: "40 'interested bro' messages in the group chat. Zero information. List your spare room free on FindMeFlatMate and see a vibe score on every request before you reply."
- Primary text C: "Pick who you live with. Free listing, vibe score on every request, no brokers, no phone number in public groups."
- Headline (40 chars max): "Your flat. Your pick." / "List your room free" / "See who fits before you say yes"
- Description: "Free to list · Vibe score on every request · No brokers"
- CTA: Sign up

**P2 copy**
- Primary text A: "Leaving on the 30th? Your deposit depends on who takes your room. FindMeFlatMate shows you who's looking near you right now (budget, move-in date, how they live) and lets you invite the ones who fit. They have 3 days to answer. Free."
- Primary text B: "Moving out and need a replacement the flat will say yes to? Invite people who match your flat's vibe, with a 3-day deadline, and sell your stuff in one link on the way out."
- Primary text C: "Find your replacement before you leave, not after. Free, no brokers, no ghosting."
- Headline: "Find your replacement by the 20th" / "Moving out? Find your replacement" / "Invite people who fit. 3-day deadline"
- Description: "Free to list · See who's looking near you · Deposit safe"
- CTA: Sign up

**P3 copy**
- Primary text A: "A broker takes a month's rent to send you strangers. FindMeFlatMate shows you who's looking in your area, what they can pay, how they live and whether they pay on time. You post free. You choose every tenant. Zero brokerage."
- Primary text B: "Flat empty? See how many people are looking in your area right now, with budgets, before you even post. Free listing, vetted requests, your number stays private until you say yes."
- Primary text C: "Rent it to someone who fits your house rules. Zero brokerage. Free to post."
- Headline: "Rent your flat. Zero brokerage." / "Post your flat free" / "Tenants who fit your house rules"
- Description: "Free to post · Vibe score + pays-on-time badge · You choose"
- CTA: Sign up

**Tests to run in the first month:** headline "Your flat. Your pick." vs "See who fits before you say yes" (P1); city-named vs generic primary text (all); story vs feed placement cost per listing.

---

## 3 · Google Ads

### Search campaign "Listers" (3 ad groups, exact and phrase match, manual CPC to start at ₹8 to ₹15, then Maximise conversions once 30 sign-ups a month)

**Ad group P1 · flatmate wanted**
Keywords: find a flatmate · flatmate wanted · roommate wanted · need a flatmate · find roommate app · flatmate finder · post room for rent free · list spare room · flatmate wanted bangalore · flatmate wanted pune · flatmate wanted hyderabad · roommate wanted bangalore · room available for rent post free
Headlines (30 chars max): Find a Flatmate Who Fits · Your Flat. Your Pick. · List Your Spare Room Free · Vibe Score on Every Request · See How They Live First · No Brokers, Ever · Numbers Swap Only on a Yes · Flatmate Wanted? Post Free · 3-Minute Free Listing · People Looking Near You Now · Pick Your Next Flatmate · Free Flatmate Finder India · Bengaluru · Pune · Hyderabad · Skip the Group-Chat Randoms
Descriptions (90 chars max):
- List your spare room free. Every request shows how they live, scored against your flat.
- See who's looking near you now, with budgets and move-in dates. You choose. No brokers.
- Sleep, food, guests, chores: a vibe score on every request. Your number stays private.
- Free listing in 3 steps. Numbers are shared only when you say yes. No brokerage, ever.

**Ad group P2 · replacement**
Keywords: replacement flatmate · flatmate replacement · looking for replacement roommate · need replacement for my room · room available immediately · room for rent from next month · leaving flat need replacement · replacement flatmate bangalore · replacement flatmate pune · replacement roommate hyderabad · take over my room
Headlines: Find Your Replacement Fast · Moving Out? List Free · Replacement by the 20th · Invite People Who Fit · 3-Day Answer Deadline · See Who's Looking Near You · Keep Your Deposit Safe · Free, No Brokers · Hand Over to the Right Person · Replacement Flatmate Finder · Sell Your Stuff in One Link · Bengaluru · Pune · Hyderabad · Invite, Don't Wait
Descriptions:
- Leaving soon? See who's looking near you, invite the ones who fit. 3-day answer deadline.
- A replacement the flat will say yes to: budget, move-in date and vibe score on each one.
- Free to list. Invite people who match your flat. No brokers, no ghosting, deposit safe.
- Moving out? Replacement finder plus a one-link sale for everything you're leaving behind.

**Ad group P3 · owners**
Keywords: rent my flat without broker · post property for rent free · rent out my flat · tenants without brokerage · no broker rent flat · list my flat for rent free · rent my house free listing · rent out room in my house · zero brokerage rental · rent flat bangalore owner · rent flat pune owner · rent flat hyderabad owner · find tenants online free
Headlines: Rent Your Flat. Zero Brokerage · Post Your Flat Free · Tenants Who Fit Your Rules · See Who's Looking Near You · Pays-on-Time Badge · You Choose Every Tenant · No Broker's Month of Rent · Free Listing in 3 Steps · Your Number Stays Private · Vetted Requests, Not Randoms · Owners: List Free Today · Featured Listings Available · Bengaluru · Pune · Hyderabad
Descriptions:
- Post your flat free. See who's looking in your area, what they can pay and how they live.
- Zero brokerage. Every request carries a vibe score and a pays-on-time badge. You choose.
- Your number is shared only when you say yes. Free to post, no broker, no strangers.
- Flat empty? People are looking near you right now, with budgets. Post in 3 steps, free.

**Negative keywords (campaign level):** job · jobs · vacancy · hiring · salary · hostel · hotel · buy · sale · for sale · price · furniture · meaning · lyrics · song · movie · film · pdf · agreement format · court · law · insurance · loan · loan emi · investment · plot · land · commercial · office · shop · warehouse · free download · app download apk

**Sitelinks:** See who's looking near you (owner page) · How the vibe score works (website #how) · Flatsplits for your flat (website #splits) · Privacy policy. **Callouts:** Free to list · No brokerage · Vibe score on requests · Numbers shared only on a yes · 8 cities. **Structured snippet (Types):** Private room, Shared room, Whole flat.

**Locations:** Bengaluru, Pune, Hyderabad (presence, not interest). **Schedule:** all day, bid +20% on Sunday and Monday evenings when "moving out" searches peak. **Budget:** ₹500 a day per ad group to start.

### Display campaign (responsive display ads, "Listers – remarketing" first)
Assets per persona: square `*-instagram-feed-1080x1080`, landscape `*-facebook-link-1200x628`, plus the fixed banners `*-google-display-300x250` and `*-google-display-728x90`. Short headlines: "Your flat. Your pick." / "Find your replacement fast" / "Rent your flat, zero brokerage". Long headline: "Free to list. See how they live before you say yes." Descriptions: reuse the search descriptions. Audience: people who visited the owner page or the site in the last 30 days and did not sign up; then in-market "Residential property for rent" in the three cities.

### Performance Max
Not yet. It needs conversion volume to learn; start it in month 3 with the same assets once the search campaign has 50 or more sign-ups a month.

---

## 4 · What to watch
- Cost per listing (owner sign-up that posts a room) is the number that matters, not cost per click. Target under ₹150 in month one, under ₹80 by month three.
- Which persona converts cheapest decides where the budget goes; P2 usually has the strongest urgency, P3 the highest value per listing.
- The app's attribution report (`fm_source_report`) shows sign-ups and rooms listed per source, medium and campaign, so UTMs must be on every link.

## 5 · Files
`creatives/` holds 27 images: for each persona (P1-flatmate-wanted, P2-replacement, P3-owner): Instagram feed 1080×1080, story/reel 1080×1920, Facebook link 1200×628, Google display 300×250 and 728×90, and a 4-slide Instagram carousel at 1080×1350.
