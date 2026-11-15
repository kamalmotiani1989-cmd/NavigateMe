# Tests

`demo/` holds the browser suites that run against the app in demo mode (no backend: the demo data in `index.html`).
They cover the welcome page and sign-in card (`welcome`), onboarding (`ob`), the post form and the photo gallery (`pass3`), listing strength, reply speed, compare and
share (`p5`), Escape and FlatMart (`p6`), Flatsplits (`p7`), the short login page (`p25`), the phone's two-layer home and bottom bar (`p26`), the Parties section and the bands on every screen (`p27`), and speed, the one list of every home and the Escape's vibe score (`p28`). Run them all with `tests/demo/run.sh`, or one with
`tests/demo/run.sh p7`; screenshots land in `/tmp/fm-demo-tests/shots`. Every check should pass; a `FAIL` line names
the check, and a suite that stops before its end (an error, or the time limit) counts as a failure too, with its
last words shown.

`p28` is the one suite that runs the page with the live backend switched on (`live.html`, a copy the runner makes):
it swaps the server client for a stand-in (`demo/stub/supabase-stub.js`) that answers every call after 300 ms from
made-up data and writes each call down, and it lets no request reach the real server. That is how the start-up
order and the number of server calls are checked. The suites need Node with Playwright's Chromium installed (`npx playwright install chromium` once) and
python3 for the static server on port 8765.

`demo/og-image.js` is not a suite: it draws `og-image.png`, the picture shown when someone shares the site's link
(how to run it is at the top of the file).

`db/` holds the database checks: `tests/db/run.sh` applies `supabase/schema.sql` twice to a fresh local Postgres (it
must be safe to run again) and then runs the `parties-*.sql` files, which call the functions as different people and
print `PASS` / `FAIL` lines (nearby parties, women-only homes, messages, block and report, avatars, and
`parties-15-listing-vibe.sql` for the living-style answers every listing now carries). How to point it at a local
Postgres is at the top of the script.

The browser-to-database suites (a bridge from the browser to a local Postgres) are not in the repository; the
schema's own checks are described in the README under "Security".
