#!/bin/bash
# Runs the demo-mode UI suites against a copy of the app with the live backend switched off (demo data in the
# browser). Needs node + playwright (Chromium) and python3. Usage: flatmates/tests/demo/run.sh [suite ...]
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; APP="$HERE/../.."; OUT="${OUT:-/tmp/fm-demo-tests}"; mkdir -p "$OUT/srv" "$OUT/shots"
sed 's#supabaseUrl:     "https://[a-z0-9]*\.supabase\.co"#supabaseUrl:     ""#' "$APP/index.html" > "$OUT/srv/index.html"
# live.html: the same page with the live backend left on, for the speed suite (p28), the chat suite (p29) and Tribe (p30), which
# swap the server client for a stand-in (stub/supabase-stub.js) and let no request reach the real server.
cp "$APP/index.html" "$OUT/srv/live.html"
cp -r "$APP/icons" "$APP/vendor" "$APP/manifest.webmanifest" "$APP/sw.js" "$APP/privacy.html" "$APP/og-image.png" "$APP/robots.txt" "$APP/sitemap.xml" "$OUT/srv/" 2>/dev/null
(cd "$OUT/srv" && exec python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1) & SRV=$!
for i in $(seq 1 100); do curl -s -o /dev/null http://127.0.0.1:8765/index.html && break; sleep 0.1; done
SUITES="${*:-welcome ob pass3 p5 p6 p7 p8 p9 p10 p11 p12 p13 p15 p16 p17 p18 p19 p20 p21 p22 p23 p24 p25 p26 p27 p28 p29 p30 p31 p32 p33}"; fail=0
for s in $SUITES; do
  out=$(cd "$HERE" && timeout 400 node "$s.test.js" "$OUT/shots" 2>&1); rc=$?; p=$(echo "$out" | grep -c '^PASS'); f=$(echo "$out" | grep -c '^FAIL')
  # A suite that stops early (an error in the page it drives, or the time limit) prints no FAIL line for what it
  # never reached: that is a failure too, and its last words are shown.
  if [ $rc -ne 0 ]; then f=$((f + 1)); echo "$s: $p passed, $f failed (stopped early, exit $rc)"; echo "$out" | grep -v -E '^PASS|^FAIL' | tail -4
  else echo "$s: $p passed, $f failed"; fi
  echo "$out" | grep -E '^FAIL|^errors \["' | head -5; fail=$((fail + f))
done
kill "$SRV" >/dev/null 2>&1; echo "total failures: $fail"; exit $((fail > 0))
