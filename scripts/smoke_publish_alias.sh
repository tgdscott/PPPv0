#!/usr/bin/env bash
set -e
BASE="${1:-http://localhost:8000}"
echo "==> POST (alias) $BASE/api/episodes/publish/TEST-ID  (follows redirect)"
curl -sS -i -L -X POST "$BASE/api/episodes/publish/TEST-ID" \
  -H "Content-Type: application/json" \
  -d '{"spreaker_show_id":"0","publish_state":"unpublished"}' | sed -n '1,15p'
echo
echo "(Expect a real response from the canonical route: probably 400/404 in dev, but NOT a 404 on the alias itself.)"
