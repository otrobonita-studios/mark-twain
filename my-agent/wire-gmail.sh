#!/usr/bin/env bash
# Wires the real Gmail MCP server into the morning-brief agent.
# Requires GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in .env,
# and a completed Google OAuth consent (redirect URI: https://claude.ai/api/mcp/auth_callback)
# which yields an access_token / refresh_token pair (paste those into .env too, see below).
set -euo pipefail
cd "$(dirname "$0")"

set -a; source .env; set +a
set -a; source IDS.env; set +a

: "${GOOGLE_OAUTH_ACCESS_TOKEN:?Set GOOGLE_OAUTH_ACCESS_TOKEN in .env (from the OAuth flow)}"
: "${GOOGLE_OAUTH_REFRESH_TOKEN:?Set GOOGLE_OAUTH_REFRESH_TOKEN in .env}"
: "${GOOGLE_OAUTH_CLIENT_ID:?Set GOOGLE_OAUTH_CLIENT_ID in .env}"
: "${GOOGLE_OAUTH_CLIENT_SECRET:?Set GOOGLE_OAUTH_CLIENT_SECRET in .env}"
: "${GOOGLE_OAUTH_EXPIRES_AT:?Set GOOGLE_OAUTH_EXPIRES_AT in .env (ISO8601)}"

BASE=https://api.anthropic.com/v1
H=(-H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
   -H "anthropic-beta: managed-agents-2026-04-01" -H "content-type: application/json")

jpy() { python3 -c "import json,sys; d=json.JSONDecoder(strict=False).decode(open('$1').read()); print(d$2)"; }

# 1. Vault (create once)
if [ -z "${VAULT_ID:-}" ]; then
  curl -sS --fail-with-body "$BASE/vaults" "${H[@]}" -d '{"display_name":"morning-brief-gmail"}' -o /tmp/vault.json
  VAULT_ID=$(jpy /tmp/vault.json "['id']")
  echo "VAULT_ID=$VAULT_ID" >> IDS.env
  echo "✅ 🔐 vault $VAULT_ID"
fi

# 2. Credential: mcp_oauth, must match agent's mcp_servers[].url exactly
if [ -n "${GMAIL_CREDENTIAL_DONE:-}" ]; then
  echo "Credential already created, skipping (delete GMAIL_CREDENTIAL_DONE from IDS.env to redo)"
else
python3 -c "
import json, os
cred = {
  'display_name': 'Gmail OAuth',
  'auth': {
    'type': 'mcp_oauth',
    'mcp_server_url': 'https://gmailmcp.googleapis.com/mcp/v1',
    'access_token': os.environ['GOOGLE_OAUTH_ACCESS_TOKEN'],
    'expires_at': os.environ['GOOGLE_OAUTH_EXPIRES_AT'],
    'refresh': {
      'token_endpoint': 'https://oauth2.googleapis.com/token',
      'client_id': os.environ['GOOGLE_OAUTH_CLIENT_ID'],
      'refresh_token': os.environ['GOOGLE_OAUTH_REFRESH_TOKEN'],
      'token_endpoint_auth': {
        'type': 'client_secret_post',
        'client_secret': os.environ['GOOGLE_OAUTH_CLIENT_SECRET']
      }
    }
  }
}
json.dump(cred, open('/tmp/cred.json','w'))
"
curl -sS --fail-with-body "$BASE/vaults/$VAULT_ID/credentials" "${H[@]}" -d @/tmp/cred.json -o /tmp/cred_resp.json
echo "✅ 🔐 credential created in vault $VAULT_ID"
echo "GMAIL_CREDENTIAL_DONE=1" >> IDS.env
fi

# 3. Update the agent to a new version with the mcp_servers config (already in agent.json)
python3 -c "
import json, os
d = json.load(open('agent.json'))
d['model'] = os.environ['MODEL_ID']
d['version'] = int(os.environ['AGENT_VERSION'])
json.dump(d, open('/tmp/agent_update.json','w'))
"
curl -sS --fail-with-body "$BASE/agents/$AGENT_ID" "${H[@]}" -d @/tmp/agent_update.json -o /tmp/agent_v2.json
NEW_VERSION=$(jpy /tmp/agent_v2.json "['version']")
sed -i.bak "s/AGENT_VERSION=.*/AGENT_VERSION=$NEW_VERSION/" IDS.env
echo "✅ 🤖 agent $AGENT_ID updated to v$NEW_VERSION with Gmail wired"
echo ""
echo "Next: re-run ./launch.sh (it will create a fresh session against the new version)"
echo "and pass vault_ids: [\"$VAULT_ID\"] when creating the session -- I'll wire that into launch.sh once IDS.env has VAULT_ID."
