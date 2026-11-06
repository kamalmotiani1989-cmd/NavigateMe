# Tests

`demo/` holds the browser suites that run against the app in demo mode (no backend: the demo data in `index.html`).
They cover onboarding (`ob`), the post form and the photo gallery (`pass3`), listing strength, reply speed, compare and
share (`p5`), Escape and FlatMart (`p6`) and Flatsplits (`p7`). Run them all with `tests/demo/run.sh`, or one with
`tests/demo/run.sh p7`; screenshots land in `/tmp/fm-demo-tests/shots`. Every check should pass; a `FAIL` line names
the check. The suites need Node with Playwright's Chromium installed (`npx playwright install chromium` once) and
python3 for the static server on port 8765.

The live-backend suites (a local Postgres with the schema applied and a bridge from the browser to it) are not in the
repository; the schema's own checks are described in the README under "Security".
