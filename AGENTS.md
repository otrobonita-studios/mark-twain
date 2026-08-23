# Mark Twain — agent rules

## What this repo is

**Mark Twain Reappears** — Next.js site + Digital Twin chat/research APIs over the Twain corpus.  
**Specialist** in the RAG Mesh (`mark-twain`).

**Not** the mesh router. **Not** ragofrags. **Not** space-talks.

## Mesh role

| | |
|---|---|
| Catalog id | `mark-twain` |
| Prod URL | https://mark.otrobonita.com |
| Chat (mesh ask) | `POST /api/chat` `{ "message": "..." }` → `{ "response": "..." }` |
| Research | `POST /api/research` (see `RESEARCH_API.md`) |
| Protocol (mesh) | `mark_twain_chat` |
| Mesh research_path | `/api/research` |

Router: `rag-mesh-router` → `https://router.otrobonita.com`.  
If the UI shows `mark-twain transport error`, the **router failed to reach this API** (HTTP transport). Test **this** app directly:

```bash
curl -s -X POST https://mark.otrobonita.com/api/chat \
  -H 'content-type: application/json' \
  -d '{"message":"hello","style":"brief","tone":"critical","simplify":true,"historyAware":true,"history":[]}'
```

## Dependencies / stack

| Concern | Tech / env |
|---------|------------|
| App | Next.js on **Vercel** |
| Vectors | **Qdrant** — `QDRANT_URL`, `QDRANT_API_KEY`, collection `twain_test` |
| Embeddings | `src/lib/embeddings` (see code; no ad-hoc provider swaps) |
| LLM answers | **DeepSeek** — `DEEPSEEK_API_KEY` (team shared env on Vercel) |
| Optional API gate | `RESEARCH_API_KEY` / mesh `MARK_TWAIN_API_KEY` |
| DNS | Cloudflare → Vercel; not Squarespace hosting |

## Hosting rules

- Production is **Vercel** (`mark.otrobonita.com`).
- Do **not** “fix” API 500s by inventing Firebase/Cloud Run rewrites.
- Dynamic routes under `src/app/api/**` need Node server runtime on Vercel.
- `favicon.ico` 404 is cosmetic unless you add `public/favicon.ico`.

## Do / don’t

**Do**
- Keep chat + research contracts stable for the mesh catalog
- Prefer DeepSeek for generation (playbook)
- Document env in Vercel when adding keys

**Don’t**
- Put the Twain corpus into ragofrags or the mesh host
- Add `GEMINI_API_KEY` / Google Generative AI for answers
- Treat this `AGENTS.md` as generic Next.js tips only — mesh contracts matter

## Related docs

- `RESEARCH_API.md` — research API shapes
- `ARCHITECTURE.md` — product/architecture
- `rag-mesh-router/catalog.yaml` — mesh registration
- `rag-mesh-router/AGENTS.md` — router rules
