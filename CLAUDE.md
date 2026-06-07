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
- Next.js App Router. Serves pages statically via Firebase Hosting (the `/out` directory).
- Dynamic API routes (`/api/...`) use Node.js server environments (e.g. Vercel or Firebase Cloud Functions/App Hosting).
- Firestore via client SDK — all config through NEXT_PUBLIC_ env vars.
- Firebase initializes only client-side with checks (guarded using page level `useEffect` and `isConfigured` checks).
- Firestore Security Rules restrict `subscribers` collection: anonymous users can only `create` entries, they cannot `read`, `update`, or `delete` (defined in `firestore.rules`).
- Dev Server habit: Always ensure the development server (`npm run dev` or equivalent) is running and active, especially after executing git pushes or builds.

## What requires .env.local to work
Firebase will silently fall back to localStorage if env vars are missing.
Always check isConfigured before assuming Firestore is live.

## Paths
- `src/app/` — App Router pages and layouts
- `src/components/` — shared UI components
- `src/lib/firebase.js` — Firestore init (touch carefully)
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

