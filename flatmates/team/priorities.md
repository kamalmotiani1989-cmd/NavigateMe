# Priorities · set by King

_Updated by King after each weekly review. Employees read this at the start of every routine and task._
_Last review: 5 Nov 2026 (onboarding)._

## Teche (tech)
1. Keep main green: the demo suites pass on every push, the Android build succeeds (build 74 was running at review time; confirm it).
2. First report filed (112 demo checks, 0 failures). Keep it current: every entry names the tests run and the build number.
3. Requests from Mark below, in order. Nothing is built until Kamal sends the IDs; say so in your report if they have not arrived.
4. Anything Kamal asks for directly comes first and is noted in your report.

## Mark (marketing)
1. Open a PR for branch `marketing/pune-december-plan` (the December plan and week-one content) so Kamal can see and decide on it in the repo. No new content until it is in.
2. The Tuesday content pack, ready to paste, within the README facts and the "launching soon" wording.
3. Keep the lister and Gen Z packs current when the product changes.

## Salu (community)
1. PR #43 (first tracker pass) waits for Kamal. Do not start a second pass until he merges it or answers the two questions in it.
2. The Wednesday pack for Kamal, built only on groups with `rules read` or better; admin requests before any post. No posting until Kamal lifts the hold.
3. Keep one post per group per week and different wording per group; the pack must show which variant goes where.

## Requests between teams
1. **Mark → Teche.** Wire the Meta Pixel `CompleteRegistration` event on owner sign-up and import it as a Google Ads conversion, so the December Pune ads can learn. Blocked until Kamal sends the Meta Pixel ID and the Google tag and conversion IDs. Then one live test: a phone sign-up through `?host=Pune` with a UTM link must show in `fm_source_report(7)`. Teche confirmed on 5 Nov that the `?host=Pune` page and UTM carry-through already work.
2. **Mark → Teche, optional, January.** A `?host=Pune&area=<Area>` deep link per area for the area-named ads. Not before item 1.
3. **Salu.** Nothing for Teche. Her open question (letting her session read public facebook.com pages) is Kamal's to answer.
