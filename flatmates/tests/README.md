# Tests

`demo/` holds the browser suites that run against the app in demo mode (no backend: the demo data in `index.html`).
They cover the welcome page and sign-in card (`welcome`), onboarding (`ob`), the post form and the photo gallery (`pass3`), listing strength, reply speed, compare and
share (`p5`), Escape and FlatMart (`p6`), Flatsplits (`p7`) and the website a visitor sees (`p25`). Run them all with `tests/demo/run.sh`, or one with
`tests/demo/run.sh p7`; screenshots land in `/tmp/fm-demo-tests/shots`. Every check should pass; a `FAIL` line names
the check. The suites need Node with Playwright's Chromium installed (`npx playwright install chromium` once) and
python3 for the static server on port 8765.

`demo/og-image.js` is not a suite: it draws `og-image.png`, the picture shown when someone shares the site's link
(how to run it is at the top of the file).

The live-backend suites (a local Postgres with the schema applied and a bridge from the browser to it) are not in the
repository; the schema's own checks are described in the README under "Security".
