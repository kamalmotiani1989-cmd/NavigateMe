# FindMeFlatMate

A flatmate app built around **vibe**: people who live the same way find each other first, and
the room comes second.

## How it flows

1. **Welcome page = sign-in.** A short write-up, the **flatmate-type quiz** (the bright card under
   the headline) and the sign-in card, which asks what you came for: *post my flat* or *looking for a
   room*, then their mobile number, then a required **"I am 18 or older"** tick (Kamal, 8 Nov). The one-time code comes **on WhatsApp**, or by SMS when they tap
   "Send it by SMS instead"; the code screen can send it again, or by SMS, after a minute. Their first
   name is the first question after sign-in, then **male or female** (each asked only once per number).
   See "Sign-in codes" below.
2. **Questions at sign-in, one per screen, short.** All 12 living-style questions (bedtime,
   cleanliness, food, cooking, smoking, drinks, guests, noise, time together, groceries and chores,
   weekday routine, pets; smoking, food and pets count double), so every new profile has a complete vibe.
   Answers from the flatmate-type quiz aren't asked again.
   - Room seekers: what they do (working / student / self-employed / between jobs) and a line about it,
     generation, city, the areas they like (pick several), monthly rent budget, the 12 questions, and
     **music and hobbies** (shown as "you both like", never part of the score).
   - Flat owners: how many live there, the household's generation and the 12 questions. The posting form
     that follows has the flatmates and music/hobbies, prefilled.
   - **Complete your profile** (accounts from when sign-up asked only 6): the rest on the same screens.
     A card on Discover shows how complete the profile is, Account shows it under "How you live", and a
     reminder comes now and then (at most once a day, 3 in all). "Finish later" saves what's answered.
   - **Gender.** Saved on the profile (`fm_set_gender`). Accounts from before are asked once, in a small
     box ("One quick question"); it can be changed in Account → Gender.
   - **Who can see you** (seekers, Account → Who can find you): in Build your tribe and in The Empty Room
     Escape, separately, **Everyone / Women only / Men only** (`fm_set_show_to`). In a tribe both people's
     choices count, so a match only appears if each shows themselves to the other (`fm_tribe_refresh`,
     `fm_tribe_list`); in Escape an owner only finds and invites seekers who show themselves to the owner's
     gender (`fm_find_seekers`, `fm_invite`). Someone with no gender set only sees people set to Everyone.
3. **Vibe matches.** Discover opens with a "Your vibe matches" row: every home in the city with an
   80%+ match, whatever the area or budget filters say, so a great fit is never missed.
   **Compatibility analysis:** tap the score (or "See the full compatibility analysis") on any home: the
   score with a plain verdict ("A strong fit", "Could work, with a chat"), the four areas of life (daily
   rhythm, home and chores, lifestyle choices, social life) as bars, **Where you click** (answers that are
   the same) and **Talk about these** (the biggest differences, both answers shown), then every answer,
   "You" vs "This home", with a Same / Close / Different verdict, and shared interests. On a home's page the
   household's habits are marked ✓ (same as you) or ! (very different). Owners get the same view for every
   request.
4. **Welcome gift, on the first request.** Nothing about money on the sign-in page or during
   onboarding. The first time a seeker asks to meet an owner, a gift opens: **5 free contacts**.
5. **Ask to meet, owner approves.** A seeker opens a flat and sends a request: their name, what
   they do, their answers and match %, plus an optional note. The owner gets an in-app
   notification (badge on Requests) and sees the profile with each trait marked as matching or
   clashing. Only when the owner **accepts** do both get each other's number, and the seeker
   gets the address. Declined requests cost nothing.
6. **Contacts are used only on acceptance**, so there are no refunds to manage. A pending request
   holds a contact until the owner replies. After the 5 free ones: **10 contacts for ₹500**.

7. **The Empty Room Escape (owners).** Owners don't have to wait. A tab lists everyone already
   looking for a room in the listing's area (or anywhere in the city), with their first name, what
   they do, budget (and whether it fits the rent) and vibe match, best match first. Filters: budget
   fits, 80%+ vibe, not invited yet. **Invite** sends them the home: the seeker gets a notification,
   sees the photos and details and answers **Yes, let's meet** or **Not for me** in one tap. Yes shares
   numbers and the address both ways and is free for the seeker (no contact used). **Numbers are
   shared only when the seeker accepts.** Seekers can hide themselves in Account
   ("Show me to owners in my areas"). Up to 30 invites per owner per day.
   - **The invite carries a note** (prefilled with the room, when it's free and the match; editable) and
     **lapses after 3 days** unanswered: the seeker stops seeing it ("Answer by 6 Nov, then the invite lapses"
     on their card), the owner sees "Invite lapsed · Invite again", and a lapsed invite doesn't use up the
     free one (`fm_inbox` / `fm_find_seekers` derive `expired`; `fm_invite` and `fm_decide` follow).
   - **Invite several:** tick people and send one note to all of them (each invite still counts).
   - **Why them:** one line per card from the shared answers, the budget and interests in common ("Same
     bedtime, same tidiness, budget fits"), plus **Moving in within 2 weeks** (the seeker's move-in answer,
     asked at sign-up and in Discover's filters) and **Replied to 3 of 4 invites** (how they treat invites).
   - **Your invites:** sent, said yes, passed, lapsed and waiting, at the top of the Escape.
   - **My flat** shows the top 3 people looking in the listing's area with an Invite button each.
   - **New seekers in your area:** a seeker who sets or changes their city or areas (or whose answers become
     enough to match) brings owners with a fitting listing there (70%+ vibe, not yet in touch) a notification
     ("Riya just started looking in HSR Layout · 84% match"): in the app via `fm_seeker_alerts`, as a push
     via the `fm_profiles_seeker_notify` trigger → fm-notify → `fm_seeker_audience`, at most once a day per seeker.

8. **Build your tribe (seekers).** Two people looking in the same city and areas whose vibes
   match **70%+** are suggested to each other, and both get a notification ("Riya could be your
   flatmate · 82% vibe"). The Tribe tab is the build-up page: a live constellation of your matches
   around you (lines light up as people say yes), a 4-step journey (Match → Team up → Bond → Hunt),
   what a tribe could save in your city, and a card per match with budget, areas, the habits you
   share, interests in common and the compatibility analysis. **Team up** is a yes; the other
   person sees "Riya wants to build a tribe with you". **Numbers are shared only when both say
   yes**, with a celebration screen. A bonded tribe sees its joint budget and **Hunt together**:
   whole flats that welcome bachelors, in any of the tribe's areas, with the rent per person. Asking
   to meet a whole flat pre-fills a note saying you're a tribe. A "no" closes the match quietly for
   both. Seekers can hide from tribe matches in Account.

   **Homes for tribes.** Discover shows every home to everyone. A bonded tribe's Tribe tab shows only the
   homes that match its size: **whole flats with one bedroom per person** (a 2BHK for 2, a 3BHK for 3) and,
   for a tribe of 2, **twin-sharing rooms** the two of them can share, each card showing the rent per person
   ("₹9,500 each") or per bed. A whole flat's
   page shows your tribe's share when it matches, or how a tribe could split it ("Rent it with a tribe:
   ₹9,500 each"). With a tribe, the budget filter checks your share of a whole flat.

   **Leaving a tribe.** The tribe card has **Leave tribe** (with a confirmation). The others get a push
   and a notice on their Tribe tab ("Riya left your tribe", kept 3 days or until closed); the shared
   shortlist stops being shared. In a tribe of 3, the two who stay remain a tribe if they're bonded to
   each other; half-agreed "complete your tribe" links are removed. People who left aren't suggested to
   each other again (`fm_tribe_leave`, status `left`).
9. **Bachelors welcome.** Owners mark each listing (on by default). Cards show "Bachelors welcome"
   (unless you share interests with the household, which shows instead), the listing shows it, and Filters has a "Bachelors welcome" option.

10. **Gen Z, millennials and Gen X.** Seekers say which generation they are; owners say which
    generation their household mostly is (both editable later; "none of these" / "mixed" are options).
    The match score is nudged: **the same generation (Gen Z, millennial or Gen X on both sides) gets
    +10 when the score is under 80**, and **two different generations get −10**. It applies
    everywhere a match is shown (homes, requests, invites, tribes) and the compatibility analysis says
    so ("Gen Z + Gen Z: +10 on the score").
    Ages are still captured as brackets (18–24, 25–30, 31–40, 41–45, 46+) but shown as generations
    everywhere: an electric "⚡ GEN Z" badge, a warm "🥑 Millennial" one, or a retro "📻 Gen X", on each
    flatmate, as "⚡ Gen Z household" on home cards, and next to people in requests, Escape and Tribe.
11. **Several numbers on one phone.** Each mobile number keeps its own answers, drafts and shortlist on
    the device, so signing in with a new number always starts from the beginning. In live mode the
    server's copy of a seeker's answers wins; a seeker with no answers on the server is sent through
    the questions (otherwise the server would refuse their requests).

12. **Compromise.** When an owner declines, the seeker can tap **Compromise and ask again**. They see
    only the answers that clash with that household, can switch any of them for **this home only**
    (their profile and every other match stay the same), and watch the score go up live. Sending is
    allowed once per home and only if the score rises. The owner gets "🤝 Ready to compromise ·
    43% → 80%" with each change listed (was → now), and decides again.
13. **Tribes of up to 3.** Each person can bond with at most two others. When a third person bonds
    with one member, the other two get a "complete your tribe" match and must say yes to each other
    before their numbers are shared. A tribe can never go above 3; full tribes are marked.
    **Tribe rules.** People looking for the same kind of home as you (private room, shared room, whole flat;
    `search.kind` from `fm_set_search`, shown on each card) come first, best vibe first. Once bonded, the
    tribe's homes follow what you're looking for: **shared room** tribes see twin-sharing rooms for the two of
    them, then private rooms they can share as twins; **private room / whole flat** tribes see whole flats with
    a bedroom each (a 2BHK for 2, a 3BHK for 3), then flats with exactly that many private rooms free, then
    bigger ones. Best vibe first, then the nearest, within the joint budget. Owners say how many private rooms
    are free when they post (`household.rooms_free`, guessed as bedrooms minus people living there). The Tribe
    page explains the rules. On the website **Tribe** sits next to Discover; on phones it's a named button in
    the top bar.
14. **No brokers.** An owner can list at most **two different addresses** (several rooms in the same
    flat count once), and a contact number can't front for more than two addresses from any account.
    A seeker whose request the owner accepted can **report a broker** from the contact section; the
    listing is delisted straight away and the owner sees why.

15. **Flatsplits (everyone).** Split rent, bills and groceries with the people you live with, like
    Splitwise but built for a flat. Make a group, add flatmates by mobile number (or in one tap from
    your tribe and the people you've connected with), and add an expense: amount, a category (rent,
    groceries, electricity, Wi-Fi, maid, cook…), who paid, and how to split it: **equally** (tick who's in),
    **exact amounts**, or **by shares** (the bigger room pays 2 shares). Amounts are kept to the paisa, so
    ₹100 three ways is ₹33.34 + ₹33.33 + ₹33.33. Every group shows your balance, "Riya owes you ₹1,240",
    and **who pays whom** in the fewest payments. **Settle up** records a payment; if the other person has
    added their UPI ID, **Pay by UPI** opens your UPI app with the amount filled in, and the person you're
    owed can **remind on WhatsApp**. **Monthly bills** (rent, Wi-Fi, the maid) are set once and added
    automatically on that day every month ("Repeats monthly" on any expense does the same). **This month**
    shows spending by category and who paid, against last month. Anyone in the group can delete an
    expense; people can only be removed once they're settled up. New expenses from others show as a badge
    on Splits and a notification. People who aren't on the app yet get a WhatsApp invite, and they see
    the group as soon as they sign in with that number.
    - **Edit, history and undo.** Any expense or payment can be edited (the row says "edited", the detail
      says who and when). Deleting keeps the row for a day, and anyone in the group can **Undo** it from the
      Activity tab. **History** lists every add, payment, change ("amount ₹900 → ₹1,200, paid by Riya →
      Kabir"), delete and undo, with who did it (`fm_split_edit`, `fm_split_restore`, `fm_split_log`).
    - **The invite shows the balance.** The WhatsApp invite for someone not on the app says what they owe
      or are owed right now and links to `findmeflatmate.com/#split/<code>` (a code per member,
      `fm_split_members.invite_code`): a page with their first name, the group, their balance and who it's
      with, first names and amounts only, never a number (`fm_split_invite`, counted so codes can't be
      guessed). "Sign in with the number ending in 42" takes them through sign-in and straight to the group.
    - **Export.** A CSV of the group (this month, a year, or everything): a row per expense and payment, a
      column per person's share, who added it and whether it was edited. Shared through the share sheet
      (the Android app's `shareFile` bridge), or downloaded.
    **Trips and house parties are kept apart from the flat.** A group is a *flat*, a *trip* (out of the
    house: travel, stay, food) or a *house party* (at home, with flatmates and friends), in
    `fm_split_groups.kind`. Start one from Splits (✈️ New trip / 🎉 New house party) or from inside the
    flat's group ("Having people over or going on a trip? Start a separate group"), which ticks your
    flatmates for you; anyone else is added by mobile number. Trips and parties have their own categories
    (cab, stay, drinks, tickets, food), up to 20 people, no monthly bills (`fm_split_bill_save` refuses them)
    and a **Summary** tab: total spent, your share, the average, who paid against their share, and spend by
    category. The Splits home shows **Your share this month** in two lines, 🏠 Household and ✈️🎉 Trips &
    parties (`month_share` from `fm_split_groups()`), so the flat's household spending is never mixed with outings.
    **✓ Pays on time (opt-in).** A seeker who settles up in their *flat* group by the 10th of the next month,
    3 months in a row, earns a badge; trips and parties don't count. A month counts if you had a share of
    that month's flat expenses; it's on time if, counting that month's expenses and payments made up to the
    10th, you owe no more than ₹1 in any flat group (only groups with at least one other member on the app count, so a group of made-up numbers earns nothing; `fm_on_time_months`, India time, last 12 months; the
    current month waits until its 10th has passed). It's off until you switch on **Show my badge** in
    Account, then owners see it on requests and in the Escape, and tribe matches see it on their cards. The
    count is kept on `fm_profiles` (refreshed daily by `fm_me` and straight away by `fm_on_time_status` on
    the Account page); a badge not refreshed for 40 days isn't shown.
    **🎉 Party invites.** A house party's group can have an **invite card**, drawn like the Vibe Card (1080 × 1920,
    ready for a WhatsApp status or chat). The host picks what it is (house party, movie night, game night,
    potluck, birthday, housewarming, match screening, festival night, karaoke, brunch, chai & chill, terrace
    night, jam session, farewell or a welcome party for a new flatmate), the day and time, and where: just
    **"at my home"** (no address on the card, friends ask the way) or **the address with directions** (and a
    Google Maps link). Extras: what to bring, a chip-in amount (split on Flatsplits after), plus-ones, a note.
    **Share the card** sends the image and the link; **Message my flatmates on WhatsApp** sends a heads-up.
    The link opens the invite page (`#party/<code>`), which works without signing in: when and where, add to
    Google Calendar, directions, and **I'm in / Maybe / Can't make it** with a first name and plus-ones (the
    browser remembers the answer, so it can be changed). The guest list shows first names only, never numbers.
    **Flatmates are told automatically:** if the host ticks "Tell my flatmates", everyone in that flat group sees
    "Coming up at your flat" on Splits and gets a notification (in the app, and a push once push is set up).
    The host can edit it or call it off; the page then says so. Tables `fm_parties` / `fm_party_rsvps`;
    `fm_party_save`, `fm_party_for_group`, `fm_party_cancel`, `fm_party_feed` (signed in) and `fm_party_get`,
    `fm_party_rsvp` (anyone, up to 200 replies a party); the `fm_parties_notify` trigger calls fm-notify.
16. **FlatMart (everyone).** An OLX for flatmates: buy and sell furniture, beds, appliances, kitchen
    things, electronics, bikes and books with people nearby, so nobody pays full price to furnish a room
    and nobody dumps a fridge when they move out. Post in a minute: up to 4 photos, category, condition,
    price (or **give it away free**), "open to offers", area, and an optional **moving out by** date.
    Browse by city, category, free stuff or saved (♥) items, search, and sort by newest, price or your areas.
    Buyers **make an offer** (full price, −10% or −20% in one tap, plus a note). Same privacy rule as rooms:
    **numbers are shared only when the seller accepts**, then both get Call and WhatsApp; the item is marked
    reserved, then sold. Sellers can **drop the price**, which moves the item back to the top. Offers have
    their own tab and badge, with a notification for every new offer, acceptance or decline.
    Discover and My flat show a shortcut to both ("You get back ₹1,240", "8 new things for sale near you this week").
    **Boost** (₹49): an item shows first in FlatMart for 3 days with a "⚡ Boosted" tag (boosting again adds 3 days).
    **Boost pack** (5 for ₹199): boosts to use on any item, any time. **Moving-out sale** (₹149): everything the seller
    has for sale, and anything they add until the date they pick (up to 30 days), on one page with one link
    (`findmeflatmate.com/#sale/<code>`) to share on WhatsApp, all shown first with a "📦 Moving-out sale" tag; the
    page works for people who aren't signed in (no numbers on it), and tapping an item asks them to sign in and
    brings them back. Changing a running sale's name or date is free.
    - **Pick-up and collected.** Once an offer is accepted, either side sets a pick-up time under the offer (the
      other side is told, and both get a reminder two hours before); **Collected** closes the deal and marks the
      item sold (`fm_market_pickup`, `fm_market_collected`).
    - **Take the lot.** A moving-out sale can carry one price for everything; the sale page offers it, one offer
      covers all the items (`bundle` on the offer), accepting reserves everything, collected sells everything.
    - **Price guide.** The sell form says what things like this went for: the middle half of accepted offers in
      the category over 6 months, in the city when it has 3 or more sales (`fm_market_price_guide`), and how many
      people nearby want one. An item unsold for a week gets "Drop to ₹2,600?" with one tap (the guide's lower
      quarter, else 15% off).
    - **Wanted.** A Wanted tab: "Riya wants: single bed under ₹3,000 · Baner". Anyone can post what they're after
      (up to 10 open), sellers get "I have one to sell", and the moment a fitting item is posted the person is told
      (in the app via `fm_market_want_matches`, push via the `fm_market_items_notify` trigger → `fm_market_want_audience`).
      Switched off "Show it on the Wanted list" it's a private **saved search** (also offered from an empty search).
    - **Trust.** Items show the seller's record (on FindMeFlatMate since, things sold here, the Pays-on-time
      badge); offers show the other side's deals done and since when.
    - **Share.** Items and sales have a share card like a home's (photo or category art, price, where, the link;
      `?i=<id>` opens an item), through the share sheet or download + WhatsApp + copy link. Bought boosts and sales are credits
    (`fm_profiles.boost_credits` / `sale_credits`, added by `fm_credit_order`) used by `fm_market_boost` and
    `fm_market_sale_start`; while charges are off (`fm_settings.charges_enabled`), both are free.
    **Requests** and **Tribe** sit as icons in the top bar (with their badges), next to notifications and the
    avatar for Account, so the bottom bar keeps the main places: Discover, Saved, Splits, Market and Passes
    for seekers; My flat, Escape, Post, Splits, Market and Passes for owners.

17. **Search together as a tribe.** The ♥ shortlist is saved to the server and shared inside a tribe (up to 3
    people). When anyone in the tribe taps ♥, the others see it in Saved under "Shortlisted by Riya", on the
    home's card ("♥ Riya shortlisted this") and in "Your tribe's shortlist" on the Tribe tab, and get a
    notification. **Search together** sets Discover to every tribe member's areas at once.
18. **PAN India.** City pickers list the 10 big cities first, then 45 more under "Other cities", and "Another
    city…" takes any name. Onboarding has an "Other city" option. Areas aren't limited to the built-in lists:
    "+ Add area" (Discover and onboarding) and the area boxes on the post and FlatMart forms search any
    neighbourhood through OpenStreetMap.
19. **Search by place, on a real map.** Discover opens with a search bar like the property sites: the city,
    then **"Search locality, landmark, society or metro"** with suggestions as you type (and "Use my current
    location"). Pick a place and you see homes **within 1, 3, 5, 10 or 20 km**, nearest first, each card saying
    how far it is ("1.2 km from Hinjewadi Phase 1"), as a **List or a Map** with price pins (green for 80%+
    vibe matches; tap one for the home). Picking a place in another city switches the city. The search runs on
    the server (`fm_search_near`): homes with a pin within the distance, plus unpinned homes in that area.
    Posting a room starts with **"Where's the flat?"**: one search fills in the city, area, PIN and building
    and drops the pin. **Google Maps:** with `FM_CONFIG.googleMapsKey` set, every map and place search in the
    app is Google's (Maps JavaScript API + Places API (New), suggestions limited to India and biased to your
    city); without a key, the same search uses OpenStreetMap (Photon search, Leaflet maps). The two are never
    mixed. See "Google Maps" under Go live.
20. **Maps with a precise pin.** Owners pin their building by moving the map under the pin (or search, or
    "I'm there now"). The exact pin is private: people the owner accepts get it with directions in Google Maps.
    Everyone else sees a circle about a kilometre wide around a rounded location.
21. **Back button.** The phone's back button closes an open listing or panel first, and on phones the close
    button is a back arrow at the top left.
21. **Vibe Card (flatmate type).** The 12 living-style answers become a type to share: a rhythm from the
    bedtime answer (Early Bird, Midnight or Night Owl) plus the most distinctive habit (Pet Parent, Chef, Host,
    Neat Freak, Bookworm, Social Butterfly, Homebody, Foodie, Introvert, Free Spirit, Go-Getter or All-Rounder),
    e.g. **🦉🍳 The Night Owl Chef**. The card is a story-sized image (1080 × 1920) with the type, a line about
    how they live, six habits and, for a seeker with a city, how many homes there match 80%+.
    - **Share:** Android's share sheet in the app (WhatsApp, Instagram...), the phone's share sheet on the
      website, or download + WhatsApp + copy link on a computer. The link is the website with
      `?vibe=<answers>&n=<first name>`: the 12 answers and the generation, nothing else.
    - **The quiz and the friend's side:** the website shows the quiz under the headline (and "Neha is The
      Night Owl Chef" when they came from a friend's link): the 6 core questions, the generation and an
      optional first name. Then **their number and a code**, so the answers are kept: the card shows right
      after sign-in, the answers and name are saved to the new profile, and sign-up skips them. The card
      shows "You and Neha: 87% match", the answers they share and the full compatibility view.
    - **In the app:** the end of a seeker's sign-up reveals their type, Discover shows it once (until they
      share or hide it), "How you live" on Account shows it, and **My Vibe Card** in Account settings opens
      it (owners take the quiz for themselves). A signed-in seeker who opens a friend's link sees the match
      straight away.
21a. **Photos are beautified on the phone before upload.** Light, colour and sharpness only: the photo's own
    orientation data, levels, a lift for dark rooms, a light sharpening, then 1600 px. Every pixel gets the same
    treatment, so nothing in the room is removed, added or moved, and an already bright photo keeps its brightness.
    The original is kept until posting: each thumbnail has "Use original" / "Use enhanced", per photo. (FlatMart
    photos are not touched.)
21c. **Room details.** For a private room, a shared room or a flatmate listing, three one-tap questions sit under the
    room type in the posting form: Washroom (attached / shared), Balcony (yes / no), Master bedroom (yes / no). All
    optional; a whole flat skips them. The answers show on the home's page next to the type as short labels
    ("Attached washroom" or "Shared washroom", "Balcony", "Master bedroom"; a "no" says nothing), and the Filters
    panel has three optional ticks under "The room" (off by default; a whole flat always passes them). Saved on the
    listing as `room` ({washroom, balcony, master}, checked by `fm_clean_room`); listings from before have nothing set
    and show nothing. In India these three move the rent as much as the area, so seekers ask them first.
21d. **Easy posting.** Step 1 of the posting form keeps only what a seeker decides on: what is offered, the three
    room questions, where the flat is, rent, deposit, flat size and photos (about one and a half phone screens; only
    the area and the rent have to be filled). The rest waits behind one **More details** row that says what is
    assumed while it is closed ("Semi furnished · Anyone · Available now · Bachelors welcome"): move-in date, who it
    is for, furnishing, bachelors, amenities, the monthly costs (folded on their own) and the title. The title is
    optional: left empty, it is written from the answers ("Private room with attached washroom in a 2BHK in HSR
    Layout"), and the title box shows the one that will be used. A gap inside the closed row opens it; editing a
    listing opens it so the owner sees everything that is set.
22. **Listing strength and editing.** My flat scores each listing out of 100 (3+ photos 30, a description of
    80+ letters 20, 3+ amenities 10, who lives there 15, the household's living-style answers 15, a map pin 10;
    whole flats skip the household parts) and lists what's missing as buttons ("+ Add photos of the room,
    kitchen and building") that open the **editor** at the right step. **Edit listing** is the Post form
    filled in: the room, the photos (kept ones can be removed, new ones added, 6 in all), the household
    and the description change; the name, number and address stay as posted (shown locked), and the map pin
    can move (`fm_update_listing`: own listings only, own photos only, a delisted listing can't be edited).
22b. **Listing cards.** The card says what decides a tap: the rent and the match ring on the photo; under it the
    title, area and expenses, the people living there, one highlight (shared interests or bachelors welcome),
    "New this week" for a home posted in the last 7 days and a fast reply line. The last line says who listed it
    and the promise: "Listed by a flatmate who lives here" for a room in a flat with people living in it,
    "Owner-listed" for a whole flat (or a room nobody lives in yet), then "your number is shared only if you
    both say yes". Furnishing, move-in date, deposit and when it was posted are on the home's page, not the card.

23. **Reply speed.** From the owner's median time to answer seekers' requests over the last four months
    (`fm_reply_hours`, returned as `reply_hours` by the search and listing functions): **⚡ Replies within
    hours** (6 h or less), **Usually replies within a day** (30 h) or **Usually replies in a few days** (80 h),
    in the listing header and in the compare table; slower owners get no line. Cards show only the fastest
    ("Replies within hours"), never a slow one. Owners see their
    own line on My flat, and requests waiting more than a day bring a banner on My flat and Requests plus one
    notification a day ("Arjun is waiting for your reply").
24. **Compare saved homes.** With two or more saved homes, **⇄ Compare side by side** on Saved turns the
    shortlist (first 5) into a table: rent, monthly expenses, deposit, to move in, vibe match, distance
    from your areas, the owner's reply speed, type, furnishing, who it's for, available from, bachelors,
    posted. The best of each number is marked ✓; a column heading opens the home.
25. **Share a home.** The share button on a listing (and **Share** on My flat) draws a 1080 × 1350 picture:
    the cover photo or the illustration, type and size, the title, area, rent with expenses and deposit, the
    details as chips and, for a seeker, "87% vibe match with me". Shared like the Vibe Card (Android's share
    sheet in the app, the phone's on the website, download + WhatsApp + copy link on a computer). The link
    is `findmeflatmate.com/?l=<listing id>`: it opens that home once the person is signed in.
26. **Invite friends after the first yes.** When an owner first accepts a seeker's request, Discover and
    Requests show a one-time card ("Your first yes. Know someone else hunting for a room?") with **Share my
    link** (the referral link, every 2 friends who join = 1 free contact) and **Not now**.

Demo mode has **100 sample homes**: 12–13 in each of the 8 cities, one per neighbourhood, with
realistic rents, flatmates, interests and per-room expenses (addresses are made up). The other side is simulated: sample owners reply about 6 seconds after a request
(they accept a match of 60% or more), and a sample seeker asks to meet a flat about 8 seconds
after you post it. Sample seekers (24 per city) answer an owner's invite after a few seconds: yes to a
strong match, no to a weak one, and no reply in between. Build your tribe: up to 6 sample seekers who
match your vibe 70%+ appear about 5 seconds after onboarding; a third of them say yes first, and the
rest answer your yes within seconds (yes to a 74%+ match). Two sample owners also invite a new seeker about 12 seconds after onboarding. Flatsplits has a "try it with a sample
flat" button (two flatmates and a month of expenses; one of them adds another expense 15 seconds later), and FlatMart has
80 sample things for sale across the cities. Sample sellers accept an offer of 80% of the price or more after about
6 seconds, and a sample buyer makes an offer about 8 seconds after you post something.

## Notifications and urgency

- **Owner:** a notification the moment someone asks to meet ("Riya wants to meet you · 92% match"), and
  once a day while requests have waited more than a day ("2 people are waiting for your reply"), so they
  keep their reply-speed line. Also when a seeker who fits starts looking in the listing's area
  ("Riya just started looking in HSR Layout · 84% match").
- **FlatMart:** a fitting item for one of your wants ("₹2,800: Single bed in Baner"), the other side setting a
  pick-up time, and a reminder two hours before a pick-up.
- **Seeker, when accepted:** "Asha said yes! Call now", with how many others asked about the home.
  A **Call now, before it's rented out** card with a red dot stays at the top of Discover and Requests
  until they tap Call, WhatsApp or "I've called". If they haven't called after 2 hours (1 minute
  in demo mode) they get a "Don't lose this room" reminder.
- **Seeker, when declined:** a gentle "Not this time", pointing back to their other matches.

- **Seekers, new homes:** a new listing that fits what you're looking for (city, areas, kind, 70%+ vibe,
  or a whole flat sized for your tribe): "New whole flat in Baner", or "A 2BHK for your tribe in Baner"
  (`fm_listing_alerts` in the app; `fm_listing_audience` + the `fm_listings_notify` trigger for push).
- **Tribes:** new 70%+ matches, someone saying yes, someone joining your tribe ("Riya is joining your
  tribe", and "Riya joined your tribe" for the others), and anyone leaving.
- **Help tickets:** when the team changes a ticket's status or replies.

**Help & support.** A Help button (bottom right) opens a built-in assistant, no AI service: it answers common
questions by keywords (finding a room, posting, tribes, vibe score, prices, Flatsplits, parties, FlatMart,
maps, notifications, account and deletion, privacy, safety) with buttons to the right page, and files
**reports** (a broker, a fake listing, a scam, harassment, spam) and **grievances** (payment, account, listing,
privacy, a bug) step by step as tickets with a code (`FMF-XXXXXX`), up to 10 a day per person. "My tickets"
shows the status and the team's reply. **The team** works tickets in Supabase → Table Editor → `fm_tickets`:
set `status` (`open`, `in_review`, `resolved`, `closed`) and write `reply`; the person is notified. Reply
within 24 hours and resolve within 15 days (India's IT Rules); the grievance officer is named in the privacy policy.

How they're delivered:
- **App open or in the background:** system notifications straight away, in the Android app
  (native, Android 13+ asks for permission) and in browsers that allow notifications.
- **App fully closed:** Firebase Cloud Messaging. This needs a one-time setup, see
  "Push notifications" under Go live. Until then the Android app builds and works without it.

## Search and filters

**Looking for** (asked at sign-up, changeable on Discover): it decides which homes show and in what order.
**Private room:** private rooms (and "flatmate wanted"), then whole flats, no shared rooms. **Shared room:**
shared rooms, then private rooms, then whole flats. **Whole flat:** whole flats, then private rooms. **Any:**
everything. With a choice, results come in groups with headings, and inside each group the **best vibe match
comes first, then the nearest** (to the searched place, else the nearest chosen area, else the city centre).

A **place search** (locality, landmark, society, metro station) with a distance (1 to 20 km), or the city
and **any number of areas** as chips (set during onboarding, changeable any time), plus a
**Filters** panel: budget band or exact min/max (all-in), room type, who it's open to,
furnishing, move-in date, must-have amenities, house rules (veg-only kitchen, no smoking, no
alcohol, pet-friendly) and minimum match. It shows a live count ("Show 7 homes"), active
filters appear as removable chips, and everything is remembered. When nothing matches, the app
suggests the single change that brings most homes back ("Remove “No smoking” (6)").

## What makes it different

- **Vibe match.** Seekers answer 12 living-style questions. Owners describe their household with the same questions,
  plus who lives there. Every flat shows a match %, what fits and what might clash, and seekers
  can sort by best match.
- **Private room, shared room or whole flat.** Shared rooms (twin sharing) are a listing type of
  their own, and seekers can filter for them.
- **Rent is just rent.** Expenses are listed per room and never added into it: the owner ticks
  what applies (maintenance, electricity, water, Wi-Fi, cooking gas, cook, maid, parking) and
  enters the room's amount, or "as per use" for electricity, water and gas. Cards show the rent
  on the photo ("₹14,000 /month") and "+ ₹1,500 expenses" after the area. Budgets, filters and sorting use rent only.
- **Proper address + Google Maps.** Flat/house no., building, street, area, landmark, city and
  PIN code (checked). Owners can preview the pin on Google Maps before publishing. Seekers see
  the area on a map; the exact address, map and directions appear once the owner accepts.
- **Save before you spend.** A free ♥ shortlist, so seekers decide which owners to ask.
- **Owners choose who they meet.** Numbers are only shared after the owner accepts a request.
- **Photos loop.** Swiping on from the last photo of a listing brings you back to the first, and swiping back from
  the first shows the last (a copy of each end photo sits just past the other end; landing on it jumps to the real
  one). The dots, the counter and the arrows count only the real photos.
- **Illustrated rooms.** Listings without photos get a drawn room in place of a blank tile.

## Pricing

Prices exclude GST: 18% is added at checkout (`fm_settings.gst_percent`), and the Plans screen shows
both, e.g. ₹500 + ₹90 GST = ₹590. Plans are one-time passes, not auto-renewing subscriptions.

| Who | What | Price |
|---|---|---|
| Owner | Post listings with photos and flatmates | Free |
| Owner | The Empty Room Escape: the first invite for each listing | Free |
| Owner | **Escape Pass**: invite as many people as you like for 7 days | ₹500 + GST |
| Owner | **Featured listing**: first in its area for 7 days (built, switched off for now) | ₹199 + GST |
| Anyone | **FlatMart Boost**: an item first in FlatMart for 3 days | ₹49 + GST |
| Anyone | **Boost pack**: 5 boosts to use any time | ₹199 + GST |
| Anyone | **Moving-out sale**: all your items on one shareable page, shown first until your moving date (up to 30 days) | ₹149 + GST |
| Seeker | Browse, vibe matches, rent and expenses, Vibe Card, Flatsplits, FlatMart | Free |
| Seeker | Welcome gift: 5 contacts, each used only when an owner accepts | Free |
| Seeker | **Room Pass**: 30 days of unlimited requests; accepted requests don't use contacts. If no owner accepts in those 30 days, 15 more days free (once) | ₹500 + GST |
| Seeker | **Tribe Pass**: 7 days to send tribe requests. Accepting one is always free, so one pass makes the tribe | ₹500 + GST |
| Seeker | **Premium**: 60 days of Room Pass + 14 days of Tribe Pass | ₹1,500 + GST |
| Everyone | **Referrals**: every 2 friends who sign up with your link (`?r=<code>`) and finish signing up (a seeker's 6 core answers, or an owner's first listing) earn 1 contact, up to 5 | Free |

The rules live in the database (`fm_request`, `fm_decide`, `fm_tribe_answer`, `fm_invite`,
`fm_set_referrer`), so the app can't be tricked past them. Prices and what each plan gives are rows in
`fm_plans` (e.g. `update fm_plans set base_paise = 60000 where id = 'room30';`; switch Featured on with
`update fm_plans set enabled = true where id = 'featured7';`). The free invites per listing and the
Room Pass extension are `fm_settings.free_invites` and `fm_settings.guarantee_days`.

**Where people see passes:** a **Passes** tab in the bottom bar (top bar on a computer) until any pass
is bought; after that the tab goes and the passes, with days left, sit at the top of Account. Until
then, now and then (at most once a day; every minute in demo mode) a gentle nudge arrives as a
notification and a card on Discover / My flat, benefit-first ("7 homes in Pune match your vibe",
"An empty room costs rent every day") and opening Passes. Nudges stop for good once a pass is on.

**Everything free for a while:** `update fm_settings set charges_enabled = false;` The app reads it
(through `fm_me`): paywalls and nudges disappear, and Passes says "free while we test" with
"Coming soon" buttons.

**Payments (Razorpay):** `supabase/functions/fm-pay` creates the order for a plan (price + GST), checks
the payment signature and grants the plan (`fm_credit_order`; the webhook is a backstop). It needs
three secrets under Supabase → Edge Functions → Secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET`. For testing, use Razorpay's **Test Mode** keys (Dashboard → Test Mode →
Account & Settings → API Keys) and its test cards or UPI `success@razorpay`; no money moves. Until
the keys are set, buying shows "Payments aren't switched on yet". GST can only be charged once the
business is GST-registered; invoices need the GSTIN.

## Look and feel
Calm and grown-up, set on 8 Nov 2026 to replace the earlier bright teal-to-blue look. Colour does one job at a time:
- **Navy** (`--ink` #1B2440) for headings, body text and the main button on every screen. Selected options, chips and
  tabs turn navy too.
- **One muted green** (`--brand` #1C7F72) for links, small labels, progress bars, match rings and "what's new". The soft
  version (`--brand-soft`) is the background for tips and highlights.
- **A pale mint wash** (`--wash`) behind the welcome page and onboarding only; everything else is white cards on a
  very light grey-green page (`--app-bg`), with thin borders and soft shadows.
- **Feature cards** (Tribe, FlatMart, the Empty Room Escape, Passes, the quiz, share images) are navy, never orange,
  pink or purple. **Red** is kept for notification dots and errors.
- White top bar and white status bar on Android (dark icons); dialog headers are white with a grey close button.
- Headlines are bold (700), not extra-bold; the welcome headline mixes a light and a heavy weight.
- **Hints and small print** use `--text-3` #5E6679 (darkened from #8790A3 on 8 Nov 2026, Kamal's call), which reads at
  5.75:1 on white and 4.81:1 on the mint wash; green text on the pale green tips uses `--brand-2` #156358.
New screens use the tokens in `:root` at the top of the stylesheet rather than new colours.

## Files

- `index.html`: the whole app (onboarding, browse, requests, approvals, post, pay, visits). No build step.
- `supabase/schema.sql`: tables, row-level security and RPCs (including `fm_split_*` for Flatsplits and `fm_market_*` for FlatMart). Requests, approvals, contacts and
  the match score are enforced here, so a number or address never reaches someone who wasn't accepted.
- `supabase/functions/fm-pay/index.ts`: Razorpay order creation, payment verification and webhook.
- `supabase/functions/fm-notify/index.ts`: sends push notifications through Firebase when a request
  is made, accepted or declined (called by a database trigger).
- `manifest.webmanifest`, `sw.js`, `icons/`: make it installable as a phone app (PWA) that also opens offline.
- `tests/demo/`: the browser suites that run against the app in demo mode (`tests/demo/run.sh`, see `tests/README.md`).
- `marketing/`: the brand voice, audiences and the campaign packs; `team/`: the standing briefs for the AI employees
  (Teche `tech.md`, Mark `marketing.md`, Salu `community.md`, and their manager King `king.md`, who sets
  `team/priorities.md` and reads `team/reports/`) that Kamal runs as long-lived sessions on this repository;
  `marketing/community/` holds the Pune Facebook-group tracker and post bank the community employee keeps.

## Run it locally

```
cd flatmates
python3 -m http.server 8080
```

Open http://localhost:8080. On a phone on the same Wi-Fi, open `http://<your-computer-ip>:8080`.
With no config it runs in **demo mode**: sample listings, OTP shown on screen, no real payment,
data (including photos) stored in that browser.

## Website

The same `index.html` is the website: **https://findmeflatmate.com**. In a browser the welcome page also shows
"How it works", the Flatsplits / FlatMart / search-together / map features, a **Get the Android
app** band and a footer. Anything marked `web-only` (the download links) is hidden inside the
Android app, which loads the page from `appassets.androidplatform.net`.

findmeflatmate.com is served by GitHub Pages from its own repo,
[kamalmotiani1989-cmd/findmeflatmate](https://github.com/kamalmotiani1989-cmd/findmeflatmate). Its
workflow copies this folder (without `android/`, `supabase/` and this README) from `main` every 30
minutes, or straight away when run by hand (Actions → Publish FindMeFlatMate → Run workflow), and
publishes it with the domain's `CNAME`. DNS is at GoDaddy: four A records for `@` (185.199.108.153,
.109, .110, .111) and a CNAME `www` → `kamalmotiani1989-cmd.github.io`. Sign-in and payments work
there as is: the Supabase functions allow any origin.

The old address, https://kamalmotiani1989-cmd.github.io/NavigateMe/flatmates/ (this repo's Pages,
from `main`), still serves the app but forwards to findmeflatmate.com, keeping invite and Vibe
links; people signed in there sign in once more on the new domain. Share links, the Vibe Card and
the page's og/canonical tags use `SITE_LINK` (`https://findmeflatmate.com/`).
`.github/workflows/flatmates-site.yml` still keeps a `gh-pages` branch here with just the website.

### Host page (where ads for people with a room land)

**https://findmeflatmate.com/?host=Pune&area=Baner** shows people with a spare room who's looking
near them right now: how many people want a room in that area and across the city, how many searched
this week, what most of them can pay, and their lifestyle mix (working or studying, smoking, veg,
generation, early birds or night owls). Visitors can switch city and area, tap the busiest areas,
and send the page to their flatmates. **List my room free** goes to sign-up as an owner, or straight
to the listing form for someone already signed in, with the city and area filled in. A seeker who
taps it is switched to listing a room. The welcome page links to it ("See who's looking for a room
near you"), and inside the app it's `#host/<city>/<area>`.

The counts come from `fm_area_demand`, which anyone can call. It counts only real people: no sample
accounts, nobody who chose not to be shown to owners, and only people active in the last 60 days who
answered the living-style questions. These are the same people an owner there could invite from the
Escape tab. Budgets and the lifestyle mix only show for 5 or more people, describing the whole city
when the area has fewer, and an area is only listed once 2 or more people picked it. Nobody can be
picked out. In demo mode the demo's sample seekers stand in.

## Ads and tracking

**Where each account came from.** On a visitor's first visit, the app keeps the link's `utm_source`,
`utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` / `fbclid`, the referring site and the
landing page on that device. When a new account signs in for the first time (accounts made in the
last day only), `fm_set_attribution` saves them in `fm_profiles.attribution`, once. The team reads the
results in the Supabase SQL editor:

```sql
select * from fm_source_report(30);   -- sign-ups in the last 30 days, by source and campaign
```

It gives, per source and campaign: sign-ups, seekers, owners, owners with a room listed, rooms
listed, requests sent, passes bought and money paid (with GST). `unknown` is accounts made before
tracking, and `direct` came without tags. A `gclid` or `fbclid` without utm tags counts as google /
meta. The app itself can't call it.

**Ad links.** Tag every ad so the report can tell campaigns apart:

- Meta (Facebook / Instagram), website URL `https://findmeflatmate.com/?host=Pune&area=Baner`, URL parameters
  `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{site_source_name}}`
  (`site_source_name` is `ig` for Instagram placements, which is how Instagram ads are told apart from Facebook ads)
- Instagram bio and posts (free): `https://findmeflatmate.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio`
- Google Ads: final URL `https://findmeflatmate.com/?host=Pune&area=Baner`. In the campaign's settings, under
  Campaign URL options, set the final URL suffix to `utm_source=google&utm_medium=cpc&utm_campaign=hosts_pune`.
  Keep auto-tagging on (it adds the gclid).
- Ads for seekers can go to `https://findmeflatmate.com/?utm_source=...`.

**Ads dashboard.** https://claude.ai/artifact/LrZ26dfDV7de4MDye4pFQY (private to its owner until shared)
reads the live database through the Supabase connector: sign-ups, rooms listed by them, requests,
passes and revenue by channel (Google Ads, Facebook ads, Instagram ads, other ads, free Instagram and
Facebook, Google search, WhatsApp, friend invites, other links, direct, and accounts from before
tracking) and by campaign, a chart per day, and cost per sign-up and per room listed from ads. It
leaves sample accounts out. Ad spend isn't connected: enter it in `fm_ad_spend` (Supabase Table
Editor: day, channel, campaign as in utm_campaign, amount in rupees as billed). Clicks and impressions
stay in Meta Ads Manager and Google Ads; a connector such as Windsor.ai or Supermetrics could bring
them in later.

**Meta Pixel and Google tag.** Fill in `FM_CONFIG.ads` in `index.html` and they load, on the website
only (never inside the Android app):

```js
ads: { metaPixel: "123456789012345", googleTag: "G-XXXXXXX, AW-1234567890",
       googleAds: { sign_up: "AW-1234567890/AbCd", list_room: "AW-1234567890/EfGh", purchase: "AW-1234567890/IjKl" } },
```

| App event | Meta Pixel | Google tag | Google Ads conversion |
|---|---|---|---|
| Host page opened | `ViewContent` (content_name host_page) | `host_view` | |
| "List my room" tapped | custom `HostStart` | `host_start` | |
| New account | `CompleteRegistration` (owner / seeker) | `sign_up` | `googleAds.sign_up` |
| Room listed | `Lead` | `generate_lead` | `googleAds.list_room` |
| Request sent | `Contact` | `request_room` | |
| Pass bought | `Purchase` (value in ₹, incl. GST) | `purchase` | `googleAds.purchase` |

Campaigns aimed at hosts should optimise for **Lead** (a room listed). Seeker campaigns should
optimise for **CompleteRegistration**, and for **Purchase** once charges are on. Only the event, a
city, area, role or plan, and a purchase's value are sent: never names, numbers or anything typed in.
The privacy policy, `privacy.html` (https://findmeflatmate.com/privacy.html), says so. Use that link
wherever Meta or Google ask for a privacy policy URL.

## Privacy policy

`privacy.html` is the privacy policy, written to match what the app actually does. It covers what's
collected, who sees what, the services used, cookies and ads measurement, how long data is kept, the
user's rights under the Digital Personal Data Protection Act, 2023, and the grievance officer
(Richa Wadhwani, privacy@findmeflatmate.com). It's linked from the sign-in card, both footers and
Account, and the Android app bundles it (`android/app/build.gradle`). Update it, and its date, when
the app starts collecting something new or uses a new service.

**Deleting an account.** Account → **Delete my account** (type DELETE to confirm) removes the account's
photos from storage (its own folder; `fm_photos_select_own` lets it list them), then calls
`fm_delete_account`, which deletes the auth user. Everything tied to it goes by `on delete cascade`:
profile, listings and their private details, requests, invites, visits, saves, tribe links, FlatMart
items and offers, passes, push tokens and reports. Two things stay, as the privacy policy says:
payment records (`fm_orders.user_id` becomes null; tax law), and Flatsplits groups shared with others,
as their record of who paid what (the person's UPI ID is removed). The device's own copy is cleared too.
For a deletion request by email, delete the auth user the same way:
`delete from auth.users where id = (select id from fm_profiles where phone = '91XXXXXXXXXX');`
(remove their photos in Storage → fm-photos → the folder named after their user id).

## On hold

The whole app can be put on hold behind a **Coming soon** page. Three switches, all off since 8 November 2026
(the hold was lifted; sign-in uses the shared test code until WhatsApp or SMS codes have keys):

1. **Website.** While `flatmates/ON_HOLD` exists, the website's publish job puts `hold.html` (Coming
   soon) up as the home page instead of the app; the privacy policy stays up. The hold page also clears
   the copy of the app that browsers keep for offline use.
2. **Database.** `fm_settings.on_hold`: while it's on, every request from the app (website or Android,
   signed in or not) is refused with `on-hold` before it reaches any function (`fm_pre_request`, run by
   PostgREST before each request), and the app shows only its own Coming soon screen. Payments and
   notifications (service role) carry on.
3. **Sign-in.** `fm_settings.test_login` off, so nobody can sign in. To sign everyone out as well,
   delete their sessions: `delete from auth.sessions; delete from auth.refresh_tokens;` (an already-issued
   access token lasts up to an hour, but the database hold refuses it anyway).

**Private preview while on hold.** Numbers in `fm_settings.hold_allow` get in while everyone else sees Coming
soon: `update fm_settings set hold_allow = '{98XXXXXXXX}';` (10-digit numbers; several are fine). The Coming
soon screen in the app (website copy and Android) has a door: 7 quick taps on the logo show the normal
sign-in. A listed number signs in with the test code and uses the live app in full; the server lets its
requests through (`fm_on_hold` reads the number from the sign-in token, `fm_otp_request` stays reachable
and fm-login checks the list). Any other number is refused at sign-in, and would be back on Coming soon
even with a token. The website itself keeps showing `hold.html`, so the preview is the Android app (or
`index.html` opened directly). To end the preview: `update fm_settings set hold_allow = '{}';`

To bring the app back:

1. In the SQL editor: `update fm_settings set on_hold = false, test_login = true;`
2. Delete `flatmates/ON_HOLD` here (merge it to `main`), then run the website's publish job (findmeflatmate →
   Actions → Publish FindMeFlatMate → Run workflow), or wait up to 30 minutes.

Everyone signs in again with the test code. The Android app needs no new build: it comes back by itself.

To put it on hold again: add `flatmates/ON_HOLD` back, publish, and run
`update fm_settings set on_hold = true, test_login = false;`.

## Security

How the app keeps accounts safe and stops people copying the inventory with a script:

- **No direct table access.** Nobody, signed in or not, can read or change a table through the Supabase
  API (REST or GraphQL): every `fm_` table has its rights taken away from `anon` and `authenticated`,
  and new tables start that way (`alter default privileges`). All reads and writes go through the
  `fm_` functions, which check who's asking. That also closes what used to be open: reading every active
  listing in one request, and owners editing their own listing rows (they could have given themselves a
  free "featured" spot or reopened a listing taken down after a broker report). Owners now mark a
  listing rented or reopen it with `fm_set_listing_status`, which leaves a delisted one down, and change
  the public details with `fm_update_listing` (own listings only, own photos only, the private part untouched).
- **Listings need an account.** `fm_search`, `fm_search_near`, `fm_listing_get` and `fm_my_listings`
  answer signed-in callers only. Signed out, only the host page's area counts (`fm_area_demand`), and
  party and sale pages by their link, answer.
- **Rate limits (`fm_throttle`).** Each call that hands out listings, people, or party and sale pages is
  counted per account (signed out: per network address, from Cloudflare's `cf-connecting-ip`, which can't
  be faked) per hour and per day. Past the limit the function says `rate-limited` and the app shows
  "You're going a bit fast". Limits (hour / day): searches 200 / 1000, opening a listing 300 / 2000,
  Empty Room Escape 60 / 300, FlatMart search 200 / 1000, party pages 120 / 600, RSVPs 30 / 100,
  sale pages 120 / 600, host-page counts 60 / 300, room requests 60 / 200, posting a listing 10 / 20,
  FlatMart posts 20 / 60, new Flatsplits groups 20 / 50, adding Flatsplits members 60 / 150. Counts are in
  `fm_rate` (kept two days). To let someone through early: `delete from fm_rate where who = '<user id>';`
- **No lookups by phone number.** Adding a number to a Flatsplits group no longer copies in that
  person's UPI ID from their other groups; their own ID shows up once they open the group.
- **Text can't carry HTML.** A trigger on every table people type into (`fm_clean_row`) turns `<` and `>`
  into `‹` and `›` before saving, so a name, title, message or note can never become a script on someone
  else's screen. The app escapes text as well (tested with script-like text in every field).
- **Sizes.** Listing fields have length limits on the server too (city 60, area 80, description 1500,
  contact name 60, address 300, up to 30 amenities). Room details accept only the three known answers.
- **Names are set once.** The name given at sign-up can't be changed afterwards: `fm_set_profile` only
  fills an empty name, and `fm_name_lock` keeps it whatever else tries. Deleting the account and signing
  up again is the only way to pick a new one. The team can still correct a name, in one transaction in
  the SQL editor:
  `select set_config('fm.name_change', 'allow', true); update fm_profiles set full_name = 'New Name' where phone = '91XXXXXXXXXX';`
- **The API isn't described to visitors.** PostgREST's OpenAPI listing of functions and tables is off
  (`pgrst.openapi_mode = 'disabled'` on the `authenticator` role).
- **Pages.** `index.html` and `privacy.html` won't run inside another site's frame (no clickjacking),
  allow no plugins or `<base>` tricks (a Content Security Policy), and send only the site name to other sites
  (`strict-origin-when-cross-origin`).

Still open, and worth doing next:

- **Test sign-in.** While `fm_settings.test_login` is on, the shared 6-digit test code is the only
  thing protecting every account (wrong codes are limited to 5 an hour per number, 10 per network and
  30 in all). Switch to real WhatsApp/SMS codes before inviting the public (see "Sign-in codes").
- **The source code is public until this repository is made private.** Everything is ready for that:
  the website's publish job reads this repo with a `SOURCE_TOKEN` secret when it has one, the APK is
  downloaded from the website repo's releases, and the published pages (and the ones inside the APK)
  are compacted, without the source's comments. Steps: findmeflatmate's README, "NavigateMe private".
  The website's own code always stays readable in a browser (every website's does), but the database
  design, the Android project and this documentation won't be. Once private, database changes are
  applied straight through the Supabase connection instead of from a public GitHub link.

## Install as an app

Once it's served over HTTPS (GitHub Pages at `/flatmates/` works), open it on the phone:
Android Chrome shows **Install app**; on iPhone use Share → **Add to Home Screen**. It opens
full-screen with its own icon. The service worker loads the newest version whenever there's a
connection, so changes show up on the next open.

## Android app (APK)

The app is called **FindMeFlatMate** (logo: three smiling flatmates in a house; tagline "Find your vibe. Find your flatmate."). The Android app ID is
`com.findmeflatmate.app` (the permanent ID on Google Play and in Firebase; it was `com.navigateme.flatmates`
before, so a phone with that older build installs this one as a new app: uninstall the old one and sign in
again). The folder and download link keep their old names.

Download on the phone: https://github.com/kamalmotiani1989-cmd/findmeflatmate/releases/download/flatmates-apk/flatmates.apk

That's the website repo's copy: each build goes to this repo's `flatmates-apk` release first, and the
website's publish job (every 30 minutes, or run it from its Actions tab) copies it over when the build
changes, so the link keeps working when this repo is private. The pages inside the APK are compacted
(no source comments or spacing), like the website's.

Open the downloaded file and allow "Install unknown apps" for your browser when Android asks.
New versions install over the old one and keep your data.

How it's built: `android/` is a small native app that shows the web app full-screen. The build
copies `index.html` and `icons/` into the APK, so you only ever edit the web app. Every push that
changes `flatmates/` runs `.github/workflows/flatmates-apk.yml`, which builds the APK and replaces
the file at the link above (about 3 minutes).

To build on your own computer instead: open `flatmates/android` in Android Studio and press Run,
or run `./gradlew assembleRelease` there (output in `app/build/outputs/apk/release/`).

**Before the Play Store:** the APK is signed with `android/testing.keystore`, which is public in
this repo, so it's only for testing. Create your own key once
(`keytool -genkeypair -keystore upload.keystore -alias upload -keyalg RSA -validity 10000`)
and add these repository secrets: `ANDROID_KEYSTORE_BASE64` (the file, base64-encoded),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. The workflow uses
them automatically. Keep that keystore safe: Play only accepts updates signed with it.
Phones with the testing build must uninstall it once before installing the properly signed one.

## Live project

The app is connected to the Supabase project **FindMyFlatMate** (`tjgkcuzypstnanpsoogi`, Mumbai; the project kept its first name).
The database runs the current `schema.sql` (Flatsplits, FlatMart, the shared tribe shortlist, map
locations, sample people, plans and passes, and the host page's counts and ad attribution). It's safe
to re-run after any change.

**Sample data for testing:** `supabase/samples.sql` adds 10 sample homes in each of the top 10 cities
(Bengaluru, Mumbai, Pune, Delhi NCR, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh), each
with its own sample owner, and 10 sample people looking for a room per city, who show up in Build your
tribe and The Empty Room Escape. They're accounts marked `fm_profiles.sample`, with no phone or email,
so nobody can sign in as them, and the app tags them **Sample**. They answer straight away: a request to
a sample home or an invite to a sample person is accepted without using a contact, a visit is
confirmed, and a sample person says yes to a tribe match (two of each tester's best matches already
have). There's no real number or address to share, and the app says so. Running the file again
replaces them. Before real users, remove them all:
`delete from auth.users where id in (select id from public.fm_profiles where sample);`

**Testing login (no messages):** until real codes are set up (below), you sign in with your mobile number
and a private test code, through the `fm-login` function (`supabase/functions/fm-login`). The code is
stored scrambled (bcrypt) in the database table `fm_secrets`, which only the server can read, and checked
by `fm_test_code_ok`. It is never in this repo or shown in the app, and with no code set, test login is
off. To change it, run in the SQL editor (6 digits):
`insert into public.fm_secrets (name, hash) values ('test_login_code', extensions.crypt('NEWCODE', extensions.gen_salt('bf'))) on conflict (name) do update set hash = excluded.hash, updated_at = now();` Wrong codes are limited (`fm_login_fails`): 5 an hour per number, 10 per network
address and 30 in all, then test login waits an hour. Anyone with the code can still sign in as any
number, so keep it private. The WhatsApp / SMS choice, the limits and the bot checks already work; only
the message isn't sent.

### Sign-in codes: WhatsApp first, SMS on request

**18 or older.** The sign-in card's tick travels with every code request (`p_adult`); `fm_otp_request` refuses a
request without it (`age-required`), so no code is sent: `fm-send-otp` only sends to numbers with a request there, and
`fm-login` (test login) only signs in a number that asked in the last 10 minutes. Once signed in, the confirmation is
kept on the account with its first time (`fm_profiles.adult_at`, `fm_confirm_adult`). Accounts from before the tick
are asked once, in a one-question box that can't be closed without ticking. The privacy policy says the same.

Every code request goes through `fm_otp_request` first: one code a minute and 5 an hour per number, 40
an hour per network address, and the channel the person picked. The sign-in card also has a hidden field
that only bots fill in and a minimum time, and Cloudflare Turnstile once its key is set. Codes are sent by
`fm-send-otp`, Supabase's **Send SMS hook**, through WhatsApp (Meta's WhatsApp Cloud API, about ₹0.12 a
code) or MSG91 SMS (about ₹0.15–0.25), and only to numbers that asked through the app in the last 10
minutes, so calling Supabase's API directly can't run up the bill. WhatsApp doesn't say straight away
whether a number has WhatsApp, so the code screen offers "Get it by SMS instead" after a minute.

To send real codes:
1. **WhatsApp:** in Meta Business Suite, add a WhatsApp Business phone number, create an
   **Authentication** template named `fm_login_code` (English, with a copy-code button) and a permanent
   access token (a system user). Then `supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_ID=...`
   (and `WHATSAPP_TEMPLATE` / `WHATSAPP_LANG` if yours differ).
2. **SMS:** register on the DLT portal (business, sender ID and an OTP template), set the template up in
   MSG91, then `supabase secrets set MSG91_AUTHKEY=... MSG91_TEMPLATE_ID=...`.
3. **Supabase:** Authentication → Sign In / Providers → Phone: on. Authentication → Auth Hooks → Send SMS
   hook → HTTPS: `https://tjgkcuzypstnanpsoogi.supabase.co/functions/v1/fm-send-otp`; generate its secret and
   `supabase secrets set SEND_SMS_HOOK_SECRET="v1,whsec_..."`.
4. **Bot check:** in Cloudflare, add a Turnstile widget for findmeflatmate.com,
   kamalmotiani1989-cmd.github.io and appassets.androidplatform.net (the Android app). Put its site key in
   `FM_CONFIG.turnstileSiteKey`, its secret in Supabase (Authentication → Attack Protection → CAPTCHA,
   Turnstile) and, while test login is on, `supabase secrets set TURNSTILE_SECRET=...` for `fm-login`.
5. Switch test login off: `testLogin: false` in `FM_CONFIG`, and `update fm_settings set test_login = false;`. The supabase-js library ships inside the app (`vendor/`), so it never depends on a CDN; if the
server can't be reached the app shows "Can't connect" instead of falling back to demo data.
Set `supabaseUrl` and `supabaseAnonKey` in `FM_CONFIG` back to "" to run the demo again.

## Go live

**Google Maps (optional).** In the Google Cloud console (billing on; India pricing has a large free
monthly allowance): enable **Maps JavaScript API** and **Places API (New)**, create an API key, restrict
it to **Websites** `https://findmeflatmate.com/*` and `https://appassets.androidplatform.net/*` (the
Android app), and to those two APIs. Put it in `FM_CONFIG.googleMapsKey` in `index.html` and publish.
Until then the app uses OpenStreetMap for the same features. **Set up:** the live key is in `FM_CONFIG`
(restricted to those two sites and those two APIs; it's a browser key, so being in the page is expected).
Keep a budget alert on the billing account.

1. Create a Supabase project. Under Authentication → Providers enable **Phone** (needs an SMS
   provider such as Twilio or MSG91).
2. Run `supabase/schema.sql` in the SQL editor. It's safe to re-run, so run it again after
   every update to this file. It also creates the public `fm-photos` storage bucket.
3. Create a Razorpay account and set the function secrets:
   ```
   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
   supabase functions deploy fm-pay --no-verify-jwt
   ```
4. In the Razorpay dashboard add a webhook to
   `https://<project>.supabase.co/functions/v1/fm-pay/webhook` for `payment.captured`.
5. Paste the project URL and **anon** key into `FM_CONFIG` at the top of the script in `index.html`.

### Push notifications (when the app is closed)

**Status:** switched on. Firebase project `findmeflatmate` (Android app `com.findmeflatmate.app`); the
service-account key is in `fm_server_keys` (only the push function can read it); `fm_settings.notify_url` and
`notify_secret` are set. The app's `google-services.json` is in `android/app/` (it identifies the app, it
isn't a secret; a GitHub secret `GOOGLE_SERVICES_JSON`, if set, replaces it), so phones register for push.
Steps, for a new project:

1. Create a Firebase project, add an **Android app** with package name `com.findmeflatmate.app`,
   and download `google-services.json`. Add its contents as the GitHub secret
   `GOOGLE_SERVICES_JSON`; the APK workflow picks it up automatically.
2. In Firebase → Project settings → Service accounts, generate a private key (JSON). Store it in the
   database (`insert into fm_server_keys (name, value) values ('fcm_service_account', '<json>')`, readable only
   by the push function), or set it as a function secret, together with a random notify secret:
   ```
   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)" NOTIFY_SECRET=<random>
   supabase functions deploy fm-notify --no-verify-jwt
   ```
3. Tell the database where to send events (the `pg_net` extension must be enabled):
   ```sql
   update fm_settings set notify_url = 'https://<project>.supabase.co/functions/v1/fm-notify',
                          notify_secret = '<same random value>';
   ```
   Never put the service_role key in the page.
