@AGENTS.md

## Project identity
This is "Mark Twain Reappears" — a fictional media series where Mark Twain
reappears in 2026. Every piece of content must sound like him: sardonic, precise,
rooted in 19th-century analogy applied to modern absurdity. Never write in a
neutral or corporate voice.

## Design system — do not deviate
- Background: #15110d · Surface: #1d1611 · Text: rgba(255,244,223,0.95) · Accent: #d9a34a
- No glassmorphism, no gradients, no rounded blobs
- Headings: serif/typewriter (Courier Prime, Playfair Display)
- See DESIGN.md for the full list


## Stack decisions
- Next.js App Router on **Vercel** (`mark.otrobonita.com`). Route handlers under
  `src/app/api/**` run as Vercel functions, so this is not a static site.
- **Retrieval:** Qdrant (`QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION`; production alias `twain_production`).
  Embeddings via DeepInfra `BAAI/bge-m3`, falling back to Hugging Face.
- **Generation:** DeepSeek (`DEEPSEEK_API_KEY`, a team Shared Environment Variable in Vercel).
  Do not add Gemini or Google Generative AI for `/api/chat` or `/api/research` — see `AGENTS.md`.
  One exception already exists: `src/app/api/agents/agent-twain/route.js` imports `@google/genai`
  and requires `GEMINI_API_KEY`. It predates this rule and is **not** on the mesh path. Do not
  extend it, and do not add Gemini anywhere else.
- **Local generation:** `src/lib/llm-router.js` routes between two providers, not one.
  `LLM_PROVIDER` (`deepseek` | `lmstudio`) wins when set; otherwise Vercel implies DeepSeek and
  everything else falls back to **LM Studio** at `LM_STUDIO_BASE_URL` (default
  `http://127.0.0.1:1234/v1`, model from `LM_STUDIO_MODEL`). `resolveProviderAsync` probes LM
  Studio with an 800 ms timeout and drops to DeepSeek when it does not answer. This is why a
  laptop with no local model still works, and why a deployment target that is neither Vercel nor
  localhost will try to reach a model server that isn't there.
- **Vision:** `completeVision` in `src/lib/llm-router.js` uses Anthropic, because DeepSeek V4 is
  text-only and Blueprint Validator sends drawings through `/api/proxy`. This is the one
  sanctioned exception; see Rule 6.6 in the engineering playbook's `CONSTITUTION.md`.
- **Persistence:** none is currently wired. Supabase is the intended choice; nothing depends on
  it yet. Do not add Firestore, Firebase Auth, or Firebase Storage — Firebase has been removed.
- Dev Server habit: Always ensure the development server (`npm run dev` or equivalent) is running
  and active, especially after executing git pushes or builds.

## Firebase has been removed

`src/lib/firebase.js`, `src/lib/firebase-server.js` and the `firebase` dependency are gone, along
and the `firebase` dependency. The Firebase project they
pointed at (`otrobonita-home-72da6`) no longer existed, and every call site gated on `isConfigured`
and returned early — so these paths had been failing silently in production, which is exactly what
Rule 1.3 forbids.

What the four call sites do now:

| Call site | Before | Now |
|---|---|---|
| `src/app/diary/DiaryClient.js` | merged Firestore entries with static | static entries only |
| `src/app/diary/[slug]/DiaryEntryClient.js` | Firestore lookup for unknown slugs | static entry, else 404 |
| `src/app/rebuild-process/RebuildClient.js` | Firestore write, `localStorage` fallback | `localStorage` only |
| `src/app/api/agents/quote-collector/route.js` | Firestore-backed quote store | `get` serves the static list; `collect` returns 501 |

Behaviour is unchanged from what production actually did, since the Firestore half was already
dead. Two consequences are worth knowing rather than rediscovering:

- The sign-up form on `/rebuild-process` has **no server-side store**. It writes to the visitor's
  own `localStorage` and reports success. That predates this teardown; it is tracked separately.
- `quote-collector`'s `collect` action can no longer persist anything and says so with a 501
  rather than pretending to succeed.

## Deployment targets
Production is **Vercel** (`mark.otrobonita.com`). Two other paths exist in `package.json` and are
easy to mistake for dead code:

- `build:static` — a static export, used by the Hugging Face path below. It works by setting
  `BUILDING_STATIC_EXPORT=true`, which `next.config.mjs` reads to switch on `output: 'export'`.
  The flag was once called `BUILDING_FOR_FIREBASE`; the name made it look like Firebase debris
  and it was deleted during the teardown, which broke the static export silently. Do not remove
  it again — nothing about it is Firebase-related except the old name.
- `deploy:hf` — pushes to a Hugging Face Space (`HF_SPACE_URL`).

Neither is the production deploy. A static export cannot serve the route handlers under
`src/app/api/**`, so anything relying on `/api/chat` or `/api/research` does not work there.

## What requires .env.local to work
Retrieval and generation. `src/app/api/chat/route.js` throws an explicit error when `QDRANT_URL`
or `DEEPSEEK_API_KEY` is missing — that is the intended pattern for anything new. Never add a
fallback that returns plausible-looking output when configuration is absent.

## Paths
- `src/app/` — App Router pages and layouts
- `src/components/` — shared UI components
- `src/lib/llm-router.js` — shared LLM routing behind `/api/proxy` (DeepSeek; Anthropic for vision)
- `src/lib/embeddings.js` — BAAI/bge-m3 embeddings
- `src/data/` — static content (lyrics, entries)
- `public/` — static assets, audio in sounds/music/

---

## Spoken narrator voice (Qwen3-TTS workstream)

### What this workstream is
Part of the larger project: a **spoken TTS narrator** whose timbre matches the
Suno-generated "Mark Twain" singing voice. This is a **voice-cloning** task —
the Suno vocal stem (or clips cut from it) is the clone reference.

### Hard-won facts — do NOT relitigate these
- **Use the Base model for cloning.** `Qwen/Qwen3-TTS-12Hz-1.7B-Base`.
  - `...-CustomVoice` **cannot clone** — only preset speakers + instruct style.
  - `...-VoiceDesign` creates a voice from a text description — fallback only.
- **Only 12Hz models are released.** 25Hz described in the paper but never
  published. Do not attempt to download or use 25Hz.
- **Long-form stability:** generate in **sentence/paragraph-sized chunks and
  concatenate**. Do NOT feed a whole chapter in one pass — 12Hz drifts over
  long sequences.
- **Reference clip rules:** 3–10 s, clean, mono. Quality beats length — a clean
  3–5 s clip outperforms a noisy 30 s one. Keep references **under ~30 s**.
  Supplying the **reference transcript** (exact words in the clip) improves
  clone accuracy.

### Singing→speaking risk (main risk)
Cloning a *sung* reference to produce *speech* can leak sing-song prosody or
vibrato. Mitigations in order:
1. Prefer the lower-register, clean reference segment.
2. Push delivery toward speech via generation params / instruct hook.
3. If it still sings, try a different segment, then fall back to VoiceDesign.
4. Best fix: any clip of this voice **speaking** clones to speech far more cleanly.

### Candidate reference clips (`refs/`)
Cut from the Suno stem "Mark Twain's Eve's Diary (Vocals)", 4 s mono each.

| file                           | median F0 | notes                                   |
|--------------------------------|-----------|-----------------------------------------|
| `ref_124s_F0-174.wav`          | ~174 Hz   | **start here** — low-ish, steady, clean |
| `ref_069s_F0-182.wav`          | ~182 Hz   | backup, similar profile                 |
| `ref_030s_F0-234_cleanest.wav` | ~234 Hz   | cleanest signal but high (sung) register|

Fill in the exact sung words of whichever clip you use as `REF_TEXT` in `clone_test.py`.

### Roadmap
1. Confirm the clone API (`clone_test.py` first run prints available methods + signature).
2. Clone test + A/B: generate spoken test lines, listen vs. Suno track, pick best clip.
3. Tune generation params; lock an instruct/style string that reads as Twain (dry, unhurried, folksy).
4. Chunked long-form pipeline: text → sentence/paragraph chunks → clone per chunk → concatenate.
5. Eval harness: WER (Whisper/Qwen3-ASR diff) + predicted MOS + signal hygiene (~−18 to −20 LUFS).
6. Later: word/sentence timestamps for read-along sync.

## How to add a song to the Music Desk (Audio player)
1. Save the audio file in the folder `public/sounds/music/` (e.g. `public/sounds/music/my-song.mp3`).
2. Add the track metadata to the `soundtrack` array in `src/data/soundtrack.js`. Ensure that the `id` of the track matches the `bookSlug` of the book (e.g. `my-song`) if you want the "Sung Edition" to be automatically enabled for that book.

## Package Manager Constraints
- **CRITICAL: NEVER run `npm install`, `yarn`, `pnpm`, or other package manager installation commands without explicit user approval. The package manager operations are too heavy for this machine.**
