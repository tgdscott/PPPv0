#!/usr/bin/env bash
set -e
BASE="${1:-http://localhost:8000}"
echo "==> POST (alias) $BASE/api/media/upload/cover_art  (should 307 to episode_cover)"
curl -sS -i -X POST "$BASE/api/media/upload/cover_art" \
  -F "file=@scripts/alias_test.txt"
echo
echo "(You should see 'HTTP/1.1 307 Temporary Redirect' in the headers above.)"
