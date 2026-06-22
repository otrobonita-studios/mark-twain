#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
set -a; source .env; set +a
set -a; source IDS.env; set +a
BASE=https://api.anthropic.com/v1
H=(-H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
   -H "anthropic-beta: managed-agents-2026-04-01" -H "content-type: application/json")

while true; do
  curl -sS "$BASE/sessions/$SESSION_ID" "${H[@]}" -o /tmp/sess.json
  STATUS=$(python3 -c "
import json
d=json.JSONDecoder(strict=False).decode(open('/tmp/sess.json').read())
print(d['status'])
")
  echo "$(date '+%H:%M:%S') status=$STATUS"
  if [ "$STATUS" = "idle" ]; then
    python3 -c "
import json
d=json.JSONDecoder(strict=False).decode(open('/tmp/sess.json').read())
print('stop_reason:', d.get('stop_reason'))
for e in d.get('outcome_evaluations', []):
    print('outcome:', e.get('result'), '-', e.get('explanation', '')[:200])
"
    break
  fi
  sleep 15
done
