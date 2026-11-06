#!/bin/bash
# Runs the demo-mode UI suites against a copy of the app with the live backend switched off (demo data in the
# browser). Needs node + playwright (Chromium) and python3. Usage: flatmates/tests/demo/run.sh [suite ...]
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; APP="$HERE/../.."; OUT="${OUT:-/tmp/fm-demo-tests}"; mkdir -p "$OUT/srv" "$OUT/shots"
sed 's#supabaseUrl:     "https://[a-z0-9]*\.supabase\.co"#supabaseUrl:     ""#' "$APP/index.html" > "$OUT/srv/index.html"
cp -r "$APP/icons" "$APP/vendor" "$APP/media" "$APP/manifest.webmanifest" "$APP/sw.js" "$APP/privacy.html" "$OUT/srv/" 2>/dev/null
(cd "$OUT/srv" && exec python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1) & SRV=$!
for i in $(seq 1 100); do curl -s -o /dev/null http://127.0.0.1:8765/index.html && break; sleep 0.1; done
SUITES="${*:-ob pass3 p5 p6 p7}"; fail=0
for s in $SUITES; do
  out=$(cd "$HERE" && timeout 400 node "$s.test.js" "$OUT/shots" 2>&1); p=$(echo "$out" | grep -c '^PASS'); f=$(echo "$out" | grep -c '^FAIL')
  echo "$s: $p passed, $f failed"; echo "$out" | grep -E '^FAIL|^errors \["' | head -5; fail=$((fail + f))
done
kill "$SRV" >/dev/null 2>&1; echo "total failures: $fail"; exit $((fail > 0))
