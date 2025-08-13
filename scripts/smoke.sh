#!/usr/bin/env bash
set -e
BASE="${1:-http://localhost:8000}"
echo "==> GET $BASE/health"
curl -sS "$BASE/health"; echo; echo
echo "==> GET $BASE/api/auth/me (expect 401 if not logged in)"
code=$(curl -s -o /tmp/ppp_me.json -w "%{http_code}" "$BASE/api/auth/me" || true)
cat /tmp/ppp_me.json; echo; echo "HTTP $code"
