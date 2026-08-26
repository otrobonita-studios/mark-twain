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
- **Retrieval:** Qdrant (`QDRANT_URL`, `QDRANT_API_KEY`, collection `twain_test`).
  Embeddings via DeepInfra `BAAI/bge-m3`, falling back to Hugging Face.
- **Generation:** DeepSeek (`DEEPSEEK_API_KEY`, a team Shared Environment Variable in Vercel).
  Do not add Gemini or Google Generative AI — see `AGENTS.md`.
- **Vision:** `completeVision` in `src/lib/llm-router.js` uses Anthropic, because DeepSeek V4 is
  text-only and Blueprint Validator sends drawings through `/api/proxy`. This is the one
  sanctioned exception; see Rule 6.6 in the engineering playbook's `CONSTITUTION.md`.
- **Persistence:** Supabase. Do not add Firestore, Firebase Auth, or Firebase Storage.
- Dev Server habit: Always ensure the development server (`npm run dev` or equivalent) is running
  and active, especially after executing git pushes or builds.

## Firebase is being torn down — do not build on it
`src/lib/firebase.js`, `src/lib/firebase-server.js` and `firestore.rules` are still in the tree,
and four call sites still import them (the diary pages, `/rebuild-process`, and the
quote-collector route). **They are legacy and scheduled for deletion.** Treat them as read-only
history, not as a pattern to follow or extend.

Two things to know before touching them:

1. The Firebase project they point at (`otrobonita-home-72da6`) no longer exists — the Firestore
   API answers `CONSUMER_INVALID`. These paths already fail in production.
2. They fail **silently**. Every call site gates on `isConfigured` and returns early, so the app
   degrades to static content with nothing logged. That contradicts Rule 1.3 (no silent exception
   swallowing) and is the reason the teardown replaces them rather than repairing them.

`next.config.mjs` still carries a dead `BUILDING_FOR_FIREBASE` branch. The flag is never set.

## What requires .env.local to work
Retrieval and generation. `src/app/api/chat/route.js` throws an explicit error when `QDRANT_URL`
or `DEEPSEEK_API_KEY` is missing — that is the intended pattern for anything new. Never add a
fallback that returns plausible-looking output when configuration is absent.

## Paths
- `src/app/` — App Router pages and layouts
- `src/components/` — shared UI components
- `src/lib/llm-router.js` — shared LLM routing behind `/api/proxy` (DeepSeek; Anthropic for vision)
- `src/lib/embeddings.js` — BAAI/bge-m3 embeddings
- `src/lib/firebase.js` — legacy Firestore init, scheduled for deletion. Do not extend.
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

