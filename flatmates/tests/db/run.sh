#!/bin/bash
# Applies schema.sql twice to a fresh local database (it must be idempotent), then runs the test files and prints
# PASS/FAIL lines. Needs a local Postgres you can reach as a superuser, e.g.:
#   PGHOST=/tmp/fmpg PGPORT=5499 PGUSER=postgres flatmates/tests/db/run.sh parties
# The prelude stands in for the Supabase pieces (auth, storage, net); pg_net itself is skipped.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; SCHEMA="$HERE/../../supabase/schema.sql"; T=$(mktemp -d); chmod 755 "$T"
Q="psql -v ON_ERROR_STOP=1 -q"
$Q -d postgres -c "drop database if exists fm_test" -c "create database fm_test" >/dev/null || exit 1
psql -q -d fm_test -f "$HERE/prelude.sql" >/dev/null 2>&1   # roles may already exist in this cluster
sed 's/^\(\s*\)create extension if not exists pg_net.*$/\1null;/' "$SCHEMA" > "$T/schema.sql"
for i in 1 2; do
  out=$($Q -d fm_test -f "$T/schema.sql" 2>&1 | grep -v NOTICE)
  if echo "$out" | grep -q ERROR; then echo "FAIL schema.sql, pass $i: $out" | head -5; exit 1; fi
  echo "PASS schema.sql applied (pass $i)"
done
cat $(ls "$HERE"/${1:-parties}-*.sql | sort) > "$T/t.sql"
psql -q -d fm_test -f "$T/t.sql" 2>&1 | grep -E 'PASS|FAIL|ERROR' | sed 's/^ *//'
rm -rf "$T"
