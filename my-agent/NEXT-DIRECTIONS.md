# Next directions for Morning Brief

## v1 — Wire real email sending
- **What:** Have the agent actually send the email instead of just drafting it.
- **Why deferred:** No email-sending credential (SMTP, SendGrid, Gmail API token) was on hand during this session.
- **How:** Create a vault credential (`environment_variable` type for SMTP/SendGrid, or `mcp_oauth` for Gmail), add the corresponding MCP server or custom tool to the agent, gate it `always_ask` initially so each send is approved, then switch to `always_allow` once trusted. Re-run the existing eval case against the new version before promoting it to the deployment.

## v2 — Tighten sourcing
- **What:** Lock environment networking to only reuters.com and sr.se (currently unrestricted).
- **Why deferred:** Hardening step, not needed while the agent is read-only and using public web search.
- **How:** Switch `environment.json` `networking` to `{"type": "limited", "allowed_hosts": ["reuters.com", "*.reuters.com", "sr.se", "*.sr.se"]}`.

## v3 — Memory of past briefs
- **What:** Give the agent a memory store of past briefs so it avoids re-covering a story already sent.
- **Why deferred:** Not needed for v0; only useful once a few days of real runs exist.
- **How:** Create a `memory_store`, attach it read_write to the deployment's `resources`, instruct the agent to check/update it each run.

## Process habit
- Re-run `evals/` before promoting any new agent version to the deployment.
