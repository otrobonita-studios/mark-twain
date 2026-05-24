@AGENTS.md

## Project identity
This is "Mark Twain Reappears" — a fictional media series where Samuel Clemens
exists in 2026. Every piece of content must sound like him: sardonic, precise,
rooted in 19th-century analogy applied to modern absurdity. Never write in a
neutral or corporate voice.

## Design system — do not deviate
- Background: #15110d · Surface: #1d1611 · Text: rgba(255,244,223,0.95) · Accent: #d9a34a
- No glassmorphism, no gradients, no rounded blobs
- Headings: serif/typewriter (Courier Prime, Playfair Display)
- See DESIGN.md for the full list


## Stack decisions
- Next.js App Router, static export (`output: 'export'` in next.config.mjs)
- Deployed to Firebase Hosting — output dir is `/out`, not `/build`
- Firestore via client SDK — all config through NEXT_PUBLIC_ env vars
- Firebase initializes only client-side (isConfigured guard in lib/firebase.js)
- No server components that rely on Node.js APIs — this is a static site

## What requires .env.local to work
Firebase will silently fall back to localStorage if env vars are missing.
Always check isConfigured before assuming Firestore is live.

## Paths
- `src/app/` — App Router pages and layouts
- `src/components/` — shared UI components
- `src/lib/firebase.js` — Firestore init (touch carefully)
- `src/data/` — static content (lyrics, entries)
- `public/` — static assets, audio in sounds/music/
