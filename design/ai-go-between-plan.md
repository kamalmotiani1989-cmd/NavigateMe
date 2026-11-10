# AI go-between: "connect before you connect" (plan, not a build)

Teche, 10 Nov 2026, for Kamal via King. On hold: nothing here is built or switched on. This folder is not published.

**The idea.** A seeker asks questions in their own words and language. Their AI asks the lister's AI, which answers at
once from what the lister already gave (vibe answers, listing details, an optional "about my home" note the lister
approved). Anything it can't answer goes to the lister as one batch, answered in their language. The seeker gets a
summary: answers, clashes, open questions, each line labelled **From their profile**, **Answered by <name>** or
**Not answered**. An AI never invents, and never agrees to rent, deposit or dates. Both people can read the whole
AI-to-AI transcript, correct their AI and withdraw. Numbers unlock only when both say yes.

**Short answer.** Most of it needs no AI. The AI parts are small and cheap if we use a small paid model: about
**₹0.40 an enquiry, ~₹400 per 1,000 enquiries a month** (estimate below). Recommendation: Anthropic **claude-haiku-5-5**
for translation, reading questions and summaries; rules for everything else; no free tiers that train on user data.

## 1. What needs no AI (rules and data we already have)

| Part | How, without AI |
|---|---|
| Answers from the profile | 12 vibe answers, rent, deposit, bills, furnishing, who lives there are fixed fields. A question that maps to a field ("Is smoking OK?") is answered from the field and labelled **From their profile**. Mapping a free-typed question to a field is the AI part (§2); the answer itself is not. |
| Privacy Shield | A fixed filter: phone numbers in any form (spaced, +91, in words, "double five", Hindi numbers), emails, links, UPI IDs, handles, flat numbers, addresses, PIN codes, payment requests. Already written and tested (20 tricky examples) on the paused branch `claude/ai-go-between`. Runs before and after any AI, so no prompt can talk a number through. |
| Conflict Detector | Compare the seeker's 12 answers with the home's, plus rent over budget. Already in the app (vibe match, compatibility analysis). |
| Truth Check | Fixed patterns on the sender's own words vs their own answers ("Never" for smoking, then "I smoke"). A private note to that person only. Written and tested on the paused branch. |
| Smart Questions | A fixed list (deposit, notice, bills, overnight guests, kitchen rules) plus their biggest clash, minus what's been asked. AI can phrase them better later; not needed for Phase 1. |
| Consent and unlock | Database rules we already run: numbers only after both yes. The paused branch adds "Share my number" after the lister's yes. |
| Labels | Set by where a line came from, never by the AI: a field → From their profile; the lister's reply → Answered by <name>; nothing → Not answered. Checked facts (phone code, 18+, Pays on time, photos) can carry a Verified tick. |
| Guardrails | The AI's reply is checked by code: it may only quote fields or the lister's words; anything about money or dates that isn't a field is replaced by "Ask <name>". |

## 2. What needs AI

1. **Translation**, both ways (Hindi, Marathi, English first; other Indian languages later).
2. **Understanding free-typed questions**: "can my bf stay over sometimes?" → the guests field, or "not in profile, ask".
3. **Summaries**: turning the answers and clashes into a short, labelled report in the seeker's language.

## 3. Options for the AI parts

Seen 10 Nov 2026. My session can't open ai.google.dev, developers.google.com, developer.chrome.com or bhashini.gov.in
(blocked by its network), so facts marked † come from search-engine extracts of those official pages, not the page itself.

| Option | Cost | Hindi / Marathi | Trains on our users' data? | Limits | Sign-up |
|---|---|---|---|---|---|
| **(a) Bhashini** (Govt of India) | No official rate card found. Reports say the free APIs are for proof-of-concept and paid production use needs a talk with the team. **Unconfirmed.** | Built for all 22 scheduled languages. | No statement found. **Unconfirmed.** | Translation only; can't read questions or summarise. Production terms unclear. | ULCA portal account, then a production agreement. Beware look-alike private sites (bhashini.ai). |
| **(b) Gemini free tier** | Free | Good in general use; not tested by us. | **Yes**: Google's pricing table says free-tier use is "Used to improve our products"; paid tier "No".† | Low limits (sources disagree: ~20 to 1,500 requests a day†). Paid Flash-Lite ~$0.10 / $0.40 per million tokens (third-party sites; not confirmed on Google's page). | Google AI Studio key; billing for paid. |
| **(c) Anthropic claude-haiku-5-5** | $0.10 in / $0.50 out per million tokens (prompts ≤100K) | Good in general; not tested by us on Marathi. | **No**: Commercial Terms say Anthropic won't train on API customer content. | Data processed outside India. | Claude Console account, card, API key saved as a Supabase secret. |
| **(c) Anthropic claude-opus-5-5** | $4 in / $20 out per million tokens | Strongest; ~30x Haiku's price. | No (same terms). | Overkill for this. | Same. |
| **(d) Open-source, self-hosted** (e.g. IndicTrans2 by AI4Bharat) | Model free (MIT licence, commercial use OK). A GPU server: my estimate ₹30,000–60,000 a month. **Unconfirmed.** | Built for 22 Indian languages incl. Hindi, Marathi. | No: runs on our server. | Translation only; we run and patch a server. | None, but needs ops time. |
| **(e) On-device** | Free | Chrome's Translator API lists hi and mr†. Android ML Kit lists Hindi†; Marathi seen in one extract†, translates via English†. | No: stays on the phone. | **Chrome's API is desktop only, not mobile†**, and most of our users are on phones. ML Kit works only in the Android app, not the website; Google calls it for "casual and simple translations"†. | None. |

**Quality.** None of these has been tested by us on real flatmate messages. Before choosing, run 50 real-style messages
in Hindi and Marathi through the top two and have a native speaker score them (an afternoon's work; cost under ₹50).

## 4. Cost (estimate, recommended mix: rules + claude-haiku-5-5)

Assumptions: one enquiry = the seeker asks 5 questions; the lister's AI answers each (1 call, ~2,000 tokens in with the
home's details, ~350 out incl. thinking); unknowns go to the lister in one batch and come back (2 translation calls,
~1,200 in / ~500 out each); one summary (~3,000 in / ~700 out). Total ≈ 15,400 tokens in, 3,450 out; +30% for the
newer tokenizer; ₹88 = $1.

| | Per enquiry | Per 1,000 enquiries a month |
|---|---|---|
| claude-haiku-5-5 | ~$0.0043 ≈ **₹0.38** | ~$4.30 ≈ **₹380** |
| claude-opus-5-5 | ~$0.13 ≈ ₹11.50 | ~$130 ≈ ₹11,500 |
| Gemini Flash-Lite, paid (price unconfirmed) | ~$0.0029 ≈ ₹0.26 | ~$2.90 ≈ ₹260 |

Add a ₹1,000/month spending cap in the Claude Console and our own limit (e.g. 3 enquiries a day per seeker).

## 5. Phases

- **Phase 1, seekers only (2–3 weeks):** "Ask this home" on a listing. Answers from the profile at once; the rest to the
  lister as one batch (in their language) with the request. Labelled summary. Shield, conflicts, Truth Check, both-yes
  unlock, withdraw. Behind a switch, off until Kamal turns it on. Reuses the paused branch's filter and consent work.
- **Phase 2, the lister's AI screens seekers:** the lister sets "must-haves" (e.g. no smoking, veg only); their AI asks
  each seeker those questions and ranks requests. It never rejects anyone by itself; the lister decides.

## 6. Risks

- **Privacy / DPDP.** The DPDP Rules were notified in Nov 2025; notice, consent and security duties apply from about
  May 2027 (law-firm summaries; check the gazette). We need: a clear notice before first use, consent that's as easy to
  withdraw, a processor contract with the AI provider, deletion (30 days after the chat ends), and to watch the
  government's list for cross-border transfer limits (Anthropic and Google process outside India).
- **Wrong translations.** "Show original" on every message; the sender sees and can edit the translation; money and dates
  are never translated into promises.
- **AI invents or agrees.** Code checks every answer against fields or the lister's own words; anything else becomes
  "Not answered".
- **Misuse.** Scammers moving people off-app: the shield runs on everything, before and after the AI. Spam: daily limits.
- **Cost runaway.** Spending cap; switch off in one place.

## 7. Decisions for Kamal (my recommendation in bold)

1. Build Phase 1? **Yes, behind a switch, off until you've tried it.**
2. Which AI? **claude-haiku-5-5** (cheap, doesn't train on our data). Not free tiers that train on users' chats.
3. Languages at launch? **English, Hindi, Marathi**; others once a native speaker has checked them.
4. Quality test first? **Yes**: 50 messages, native-speaker scored, before any build.
5. Lister's "about my home" note? **Yes, optional, they approve the exact text.**
6. Keep or delete the paused branch `claude/ai-go-between`? **Keep** (its filter, conflict list and consent work are reused).
7. Spending cap? **₹1,000 a month to start.**
8. You'd supply: a Claude Console account (platform.claude.com), a card, and an API key that you paste into Supabase
   secrets yourself (never in chat).

## Sources (seen 10 Nov 2026)

- Anthropic prices: https://claude.com/pricing (opened directly).
- Anthropic Commercial Terms, no training on customer content: https://www.anthropic.com/legal/commercial-terms and
  https://www.anthropic.com/news/updates-to-our-consumer-terms (search extracts).
- Gemini pricing and "Used to improve our products": https://ai.google.dev/gemini-api/docs/pricing †; Flash-Lite price:
  third-party trackers, e.g. https://www.developersdigest.tech/models/gemini-2-5-flash-lite (unconfirmed).
- Chrome Translator API (languages, desktop only): https://developer.chrome.com/docs/ai/translator-api †
- ML Kit translation languages and English pivot: https://developers.google.com/ml-kit/language/translation/translation-language-support †
- IndicTrans2 (MIT, 22 languages): https://ai4bharat.iitm.ac.in/ and https://aikosh.indiaai.gov.in/home/models/details/indic_trans2.html
- Bhashini pricing and production terms (none official found): https://dev.to/mr_manushukla/22-scheduled-languages-one-app-what-indic-localization-actually-costs-to-ship-in-2026-12ag ; https://www.cdomagazine.tech/aiml/indian-govt-ai-translation-platform-bhashini-gears-up-for-monetization
- DPDP Rules 2025: https://www.india-briefing.com/news/dpdp-rules-2025-india-data-protection-law-compliance-40769.html/ ; https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/

† Official page not reachable from my session; fact taken from a search-engine extract of that page.
