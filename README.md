# Mark Twain Reappears

> "Waking up in a machine made of digital sand is a peculiar sensation..."

Welcome to the official repository of **Mark Twain Reappears** — an AI media series tracking the digital return of Samuel Langhorne Clemens. Follow along as he reflects on modern society, files dispatches on the AI industry's more spectacular frauds, and attempts to determine whether the species has improved since 1910.

This project is built in public and open source. If you are a spectator, visit [mark.otrobonita.com](https://mark.otrobonita.com). If you are a developer, welcome to the engine room.

---

## 📖 The Lore & Concept

A TV-style media series tracking an evolving AI Agent — assembled from Twain's complete published corpus, letters, and biographical record — and set loose on 2026. The series unfolds through:

1. **Twain's Reflections**: Satirical diary entries on technology, finance, and society. Published at [mark.otrobonita.com/diary](https://mark.otrobonita.com/diary).
2. **The Chat**: A live conversation with Mark's digital twin, powered by RAG over the full Twain corpus. [mark.otrobonita.com/chat](https://mark.otrobonita.com/chat)
3. **The Music**: Original songs — written in Mark's voice, performed via AI — available on [Spotify](https://open.spotify.com/album/2NYpolwHpHWgBCqZaq0vGN). Albums include *219* and *Mark Twain Reappears*.
4. **@TwainMkII**: Mark's social media presence on [X](https://x.com/TwainMkII). Joined May 2026. Opinions his own.
5. **The Workshop**: An open-source collection of skills, memory systems, and RAG infrastructure that shape Mark's personality. See `rag/` and `agents/`.

---

## 🛠️ The Tech Stack

| Concern | Implementation |
|---|---|
| **Frontend** | [Next.js](https://nextjs.org/) App Router — server-side rendered, Vercel functions |
| **Styling** | Bespoke dark theme: charcoal `#15110d`, surface `#1d1611`, gold `#d9a34a`, cream text. No glassmorphism. Serif headings (Courier Prime, Playfair Display). |
| **Retrieval** | [Qdrant](https://qdrant.tech/) vector store — collection `twain_test`, embeddings via DeepInfra `BAAI/bge-m3` |
| **Generation** | [DeepSeek](https://deepseek.com/) (`DEEPSEEK_API_KEY`) — chat and research routes |
| **Vision** | Anthropic (`ANTHROPIC_API_KEY`) — used only for the Blueprint Validator's image analysis |
| **Persistence** | [Supabase](https://supabase.com/) |
| **Hosting** | [Vercel](https://vercel.com/) — production at `mark.otrobonita.com` |

### Required environment variables

```
QDRANT_URL=
QDRANT_API_KEY=
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
```

The chat route throws an explicit error when `QDRANT_URL` or `DEEPSEEK_API_KEY` are absent. No silent fallbacks.

---

## 🚀 Getting Started (Engine Room Setup)

### 1. Prerequisites

[Node.js](https://nodejs.org/) v18+ required.

### 2. Installation

```bash
npm install
```

> ⚠️ This machine is underpowered for heavy installs. Do not run `npm install` unless you have approved the time cost.

### 3. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without the environment variables above, the chat and research routes will fail loudly — that is intentional.

### 4. Build

```bash
npm run build
```

Deployed via Vercel on push to `main`. The build runs as a server-side Next.js app — not a static export.

---

## 🗂️ Repository Structure

```
src/app/          — App Router pages and API routes (Vercel functions)
src/components/   — Shared UI components
src/data/         — Static content: books, soundtrack metadata, diary entries
src/lib/          — LLM routing, embeddings, legacy Firebase (being removed)
public/           — Static assets; audio in sounds/music/
rag/              — RAG infrastructure: corpus, embedding scripts, marks-awareness
agents/           — Agent skills (social comment, quote matcher)
```

### A note on Firebase

`src/lib/firebase.js` and related files are still in the tree but are **scheduled for deletion**. The Firebase project they reference no longer exists — all calls fail silently. Do not extend or pattern-match from these files. The replacement is Supabase.

---

## 💬 Community & Conversations

- **GitHub Discussions**: Thoughts on the latest episode, or suggestions for what Mark should read next — [Discussions](../../discussions).
- **Write to Samuel**: Letters to `ai@otrobonita.com` are read (eventually) and may receive a reply from the past.
- **Follow on X**: [@TwainMkII](https://x.com/TwainMkII)

---

## 📄 License & Attribution

This repository is dual-licensed:

- All **software code** (scripts, components, configuration) is open source under the **Apache License 2.0**.
- All **creative assets and story content** (audio, images, diary entries, lyrics) is protected under **Creative Commons BY-NC-ND 4.0** (Attribution-NonCommercial-NoDerivatives).

See [LICENSE.md](LICENSE.md) for full terms.
