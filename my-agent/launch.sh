#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

set -a; source .env 2>/dev/null || true; set +a
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ANTHROPIC_API_KEY not set. Put it in ./.env as ANTHROPIC_API_KEY=sk-ant-..."
  exit 1
fi

touch IDS.env
set -a; source IDS.env; set +a

BASE=https://api.anthropic.com/v1
H=(-H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
   -H "anthropic-beta: managed-agents-2026-04-01" -H "content-type: application/json")

jpy() { python3 -c "import json,sys; d=json.JSONDecoder(strict=False).decode(open('$1').read()); print(d$2)"; }

# 1. Model
if [ -z "${MODEL_ID:-}" ]; then
  echo "Fetching models..."
  curl -sS "$BASE/models" "${H[@]:0:4}" -o /tmp/models.json
  MODEL_ID=$(python3 -c "
import json
d=json.load(open('/tmp/models.json'))
opus=[m['id'] for m in d['data'] if 'opus' in m['id']]
print(sorted(opus)[-1] if opus else d['data'][0]['id'])
")
  echo "MODEL_ID=$MODEL_ID" >> IDS.env
  echo "Picked model: $MODEL_ID"
fi

# 2. Environment
if [ -z "${ENV_ID:-}" ]; then
  echo "Creating environment..."
  curl -sS --fail-with-body "$BASE/environments" "${H[@]}" -d @environment.json -o /tmp/env.json
  ENV_ID=$(jpy /tmp/env.json "['id']")
  echo "ENV_ID=$ENV_ID" >> IDS.env
  echo "✅ 📦 environment $ENV_ID"
fi

# 3. Agent
if [ -z "${AGENT_ID:-}" ]; then
  echo "Creating agent..."
  python3 -c "
import json
d = json.load(open('agent.json'))
d['model'] = '$MODEL_ID'
json.dump(d, open('/tmp/agent_payload.json', 'w'))
"
  curl -sS --fail-with-body "$BASE/agents" "${H[@]}" -d @/tmp/agent_payload.json -o /tmp/agent.json
  AGENT_ID=$(jpy /tmp/agent.json "['id']")
  AGENT_VERSION=$(jpy /tmp/agent.json "['version']")
  echo "AGENT_ID=$AGENT_ID" >> IDS.env
  echo "AGENT_VERSION=$AGENT_VERSION" >> IDS.env
  echo "✅ 🤖 agent $AGENT_ID (v$AGENT_VERSION, $MODEL_ID)"
fi

# 4. Session
echo "Creating session..."
VAULT_IDS_JSON="[]"
if [ -n "${VAULT_ID:-}" ]; then
  VAULT_IDS_JSON='["'"$VAULT_ID"'"]'
fi
curl -sS --fail-with-body "$BASE/sessions" "${H[@]}" -d '{
  "agent": "'"$AGENT_ID"'",
  "environment_id": "'"$ENV_ID"'",
  "vault_ids": '"$VAULT_IDS_JSON"',
  "title": "morning-brief run"
}' -o /tmp/session.json
SESSION_ID=$(jpy /tmp/session.json "['id']")
echo "SESSION_ID=$SESSION_ID" >> IDS.env
echo "✅ ▶️ session created $SESSION_ID"

# 5. Kickoff
echo "Sending kickoff event..."
EVT=$(python3 -c "
import json
task = open('first_prompt.txt').read()
rubric = open('outcome.md').read()
print(json.dumps({'events':[{'type':'user.define_outcome','description':task,'rubric':{'type':'text','content':rubric},'max_iterations':3}]}))
")
curl -sS --fail-with-body "$BASE/sessions/$SESSION_ID/events" "${H[@]}" -d "$EVT" -o /tmp/kickoff_resp.json
echo "✅ ▶️ run started $SESSION_ID"
echo ""
echo "Poll status with: ./poll.sh"
echo ""
echo "Console: https://platform.claude.com/workspaces/default/sessions/$SESSION_ID"
