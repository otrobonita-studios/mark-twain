# Launching Morning Brief

Resumable, step-by-step. Run `./launch.sh` from this folder. Each step reads `IDS.env` first and skips objects that already exist.

1. Source `.env` (your `ANTHROPIC_API_KEY`)
2. Pick a model (newest Opus-class)
3. Create the 📦 environment from `environment.json` → save `ENV_ID`
4. Create the 🤖 agent from `agent.json` (model filled in) → save `AGENT_ID`, `AGENT_VERSION`
5. Create the ▶️ session, attach the environment
6. Send the kickoff event: `user.define_outcome` with `first_prompt.txt` as the task and `outcome.md` as the rubric, `max_iterations: 3`
7. Poll the session until it's idle with `end_turn`, read the outcome verdict
8. Fetch the output file from `/mnt/session/outputs/`

To re-run on demand later: `./launch.sh` again creates a fresh session against the same agent/environment (steps 3-4 are skipped once IDs exist).

To schedule it (after a passing run): see `deployment.json` and the manual-run test command at the bottom of `launch.sh`.
