# Read Experience — Spec

Web-based reader for restored public-domain texts (Twain corpus) and MkII-framed
material, served from the existing site. Targets: **desktop (mouse + keyboard)** and
**iPad (touch, Safari)**, plus **phone**. Dual purpose: interactive literary education
for students, and a B2B showcase of a continuously-updated intelligence service.
Single-builder constraint: favour low-maintenance choices.

The reader is built **once** as a reusable React component (§10) and consumes a
normalized document model, so every book, essay and letter uses it the same way.

---

## 1. Architecture — three layers of choice

Keeping these separate is the spine of the whole design.

**Layer A — Edition / experience** (page level, "Ways to Experience"). Chooses the
*rendering*: Index, Traditional Read, Young Readers, E-Ink, Sung, Dramatized, … The
reader here **is** "Traditional Read".

**Layer B — Content state** (travels *with* the text). *What text and which annotations*:
SANITIZED vs original, MkII layer on/off, language, illustration style.

**Layer C — Reading controls** (chrome; live only inside a reading mode). *How* it is
shown: theme, typeface, size, contrast, brightness, bookmarks, search, progress, quote,
chat, contents. Meaningless in Index/Sung, so present **only in reading modes**.

> When adding a control, ask *which layer?* Brightness = C. SANITIZED = B (surface it in
> the reader so the student knows which text they read, but it is not a "display" control).

---

## 2. Navigation & menus

Three things are all "lists of places to go" and get conflated — keep them apart:

- **Global site menu** — the existing hamburger (top right). Keep it **unchanged** in the
  reader; do not reinvent it. Consistency is the point. Injected via the `nav` adapter (§10).
- **The Library** (one level up) — the exit almost everyone wants. **Not** buried in the
  hamburger: a one-click breadcrumb on the **left** — `‹ The Library` with the title beside
  it. This is Layer A.
- **Contents (TOC)** — book-internal; belongs in the *reading-tools* cluster (with bookmark,
  search, Aa, MkII), **not** in site nav. (It currently sits in the left slot and competes
  with Library — that is the source of confusion.)

Proposed top bar:
- Desktop / iPad: `‹ The Library · Book · Chapter · [Contents] [★] [Search] [Aa] [Ask MkII] [≡]`
- Phone: top minimal `‹ Library · Title · ≡`; reading tools move into a **bottom sheet**.

---

## 3. Rendering model

**Start with vertical scroll, not pagination.**

| | Pagination (columns / swipe) | Scroll |
|---|---|---|
| iPad Safari cost | High — reflow, dynamic viewport, image breaks fight you | Low — identical on both |
| Maintenance | Heavy for a solo builder | Light |

Mid-path: vertical scroll, chapter-wise loading, hard `max-inline-size` ≈ **60–70ch**.
Move to pagination only if "book feel" becomes a stated requirement.

---

## 4. Input duality

Desktop = mouse + keyboard. iPad/phone = touch, **no hover**.

- Keyboard: arrows / space page step, `j`/`k`, `t` contents, `/` search, `b` bookmark.
- Tap-zones / swipe on touch. **No hover-dependent affordances.**
- Touch targets ≥ 44px. `100svh` (not `100vh`) + `env(safe-area-inset-*)`.

---

## 5. Chrome + orientation

Center-tap (or mouse move on desktop) reveals chrome, otherwise hidden.

- Top bar (§2). Bottom bar: progress (chapter + %).
- **Persistent running title** — a discreet book/chapter marker that **stays visible when
  chrome is hidden**, so the reader never wonders "where am I?". Separate from the top bar.
- **Phone:** reading tools live in a **bottom sheet** within thumb reach — fewer *visible*
  controls, not fewer features. Nothing is removed; it is grouped thumb-friendly.
- Discoverability: clear affordances ("Aa" for display), labels/tooltips that work on touch;
  consider chrome sticky until first interaction, or a one-time hint.

---

## 6. Reading controls (minimum meaningful set)

Theme (light/sepia/dark) · Text size (stepped CSS var) · Typeface (1–2; old-style serif —
prototype: Newsreader + Fraunces) · Contrast/weight (soft/normal/high) · Brightness ·
Contents (chapters only) · Bookmarks (own dropdown, §8.2) · In-text search w/ live highlight ·
Progress (% + chapter) · Position memory (auto-resume).

---

## 7. Ownership — app vs browser

The browser can bookmark a URL and zoom text, but the app should **own** anything that must
(a) persist as a reading preference, (b) sync across devices, or (c) carry book-specific
state. Leave only genuinely generic behaviour (true page zoom for accessibility, print) to
the browser.

- **Position bookmark** (in-book) — app-owned; stays in the book.
- **Saved book / Shelf** — the app's better answer to a browser bookmark: knows your
  position, shows progress, groups all your books, syncs via Firestore. A browser bookmark
  is just a dumb pointer.
- **Type size / theme** — reading *preferences* that travel with the reader across devices;
  browser zoom scales everything (chrome, images, layout), is per-site, and doesn't follow you.

**Library-level "My Shelf"** (right of the Complete-Works search field): *Continue reading*
(latest positions across books), saved books, all bookmarks/quotes grouped per book, and
global reading preferences. So a book's TOC shows only *that* book's bookmarks; the
cross-book view lives at library level. Clean split.

---

## 8. Editorial layer & marks

The reader carries the genuine-Twain vs MkII-framing distinction in the UI. **Two kinds of
marks that look and behave differently:**

### 8.1 Editorial marks (curated, shipped with the edition)
Curator tags passages **debated / ambiguous / hard** (overlapping heavily with what SANITIZED
changes). Each gets an MkII framing note + a **"Discuss with MkII"** entry seeded with the
passage and the editorial angle. Visual: discreet underline / margin glyph, category colour.

### 8.2 Personal marks (the reader's own)
Bookmarks and saved quotes. Visual: the reader's ribbon/marker — **must** be visually
distinct from editorial marks so a student never confuses "the editor's pointer" with "my flag".

**Bookmarks live in their own dropdown from the bookmark icon — not inside Contents.** A long
novel has dozens of chapters, so a bookmark list appended under the chapter list gets pushed
out of view. Separating them also matches the model: Contents = chapter navigation; the
bookmark menu = personal marks. The dropdown has "Bookmark this spot" (toggles current, label
flips to "Remove bookmark here") on top, then a **separately scrollable** list of bookmarks to
jump to (capped height, so any number stays contained). Quick-add via `b`. On **phone** this
dropdown becomes a bottom sheet (same content, thumb-reachable, no risk of clipping the edge).
In React this is a `<BookmarkMenu>` reading its list from the `storage` adapter; at library
level the same data drives the My Shelf cross-book view (§7).

### 8.3 Note visibility — two levels
- **Per-note:** collapse a single note to a reversible inline "MkII" pill (state persists).
- **Whole book:** global master switch (off = raw Twain).
- When categories arrive, the collapsed pill must still carry its category colour.

### 8.4 MkII conversational access
Entry points: toolbar button (free chat) **and** "Ask MkII" on a selection (seeds the passage;
sends chapter + passage as context). Replies are *MkII voice*, badged as such; the persona is
instructed **not** to fabricate verbatim quotations or attribute invented lines to real works.
Backend is a single injected seam (§10) — placeholder in preview, RAG (`mark.otrobonita.com`)
in production. Surface retrieved **sources** as expandable references under each reply.

### 8.5 Select-to-quote
Selection → clean quote card with attribution (Mark Twain · @TwainMkII). Closes the loop to
the social posts.

---

## 9. Illustration style axis (per-book, data-driven)

Books carry different styles by **source material**, so the **book declares available styles in
its manifest** (§10) and the picker is built from that — not a fixed global menu.

Only **Original** is an authentic artefact; the rest are AI renderings and must be labelled.
Two *kinds* of rendering drive how strong the label is:

**Reinterpretation** (fiction, e.g. *Tom Sawyer*) — openly stylised: *Original* (True Williams
engraving, 1876) · *Watercolour* · *Animated*. A cartoon signals "interpretation" itself; a
light corner tag suffices.

**Realization** (non-fiction/travel, e.g. *Following the Equator*) — reconstructs the photograph
the period engraving was made from. *Original* (engraving/half-tone) · *Period Photograph
(reconstructed)* / "As Photographed" (never "Photograph"). **Strongest label of any mode** — a
convincing period photo reads as *evidence*; required: "Reconstruction · no surviving photograph
exists" + a framing note. Extra weight for real people/cultures (ethnographic portraits): an
editorial necessity, exactly what the MkII layer exists to carry.

Naming: **medium-based** (engraving, watercolour, animated, reconstructed photograph), not epoch
words. "Traditional" collides with the edition; "Modern" dates badly.

---

## 10. React component architecture

**Design principle.** One `<Reader>` component, content-type-agnostic. Books, essays and
letters differ only in *data* (a normalized document + manifest) and *config* (feature flags),
never in component code. Config and content, not forks.

### 10.1 Content contract (normalized document)
```ts
type ContentType = 'book' | 'essay' | 'letter' | 'collection';

interface ReaderDocument {
  meta: {
    id: string; type: ContentType; title: string; author: string;
    year?: number; language: string;        // 'en' | 'sv' | ...
    from?: string; to?: string; date?: string;   // letters
  };
  manifest: Manifest;
  sections: Section[];                        // chapters / letters / one essay body
}

interface Section { id: string; title?: string; blocks: Block[]; }

type Block =
  | { kind: 'p';        id: string; text: string; drop?: boolean }
  | { kind: 'heading';  id: string; level: number; text: string }
  | { kind: 'note';     id: string; category: 'mkii'|'debated'|'ambiguous'|'hard';
                        text: string; anchor?: SpanRef }
  | { kind: 'figure';   id: string; styles: IllustrationStyle[]; caption?: string }
  | { kind: 'pullquote';id: string; text: string }
  | { kind: 'meta';     id: string; fields: Record<string,string> };  // letter header

interface IllustrationStyle {
  id: string;                                 // 'original' | 'watercolour' | 'reconstructed-photo'
  label: string; kind: 'authentic'|'reinterpretation'|'realization';
  src: string; framing?: string;              // framing REQUIRED when kind === 'realization'
}
```

### 10.2 Manifest (makes the pickers data-driven)
```ts
interface Manifest {
  editions: string[];                         // -> Layer A "Ways to Experience" picker
  contentStates: { sanitized?: boolean; languages: string[]; mkiiLayer: boolean };
  illustrationStyles: string[];               // default set; per-figure overrides in the block
  features: { mkiiChat: boolean; quote: boolean; bookmarks: boolean; search: boolean; contents: boolean };
}
```
The page builds every menu from the manifest, so each work declares its own options (and its
"Unavailable" greys).

### 10.3 Adapters (dependency injection — the swap seams we already built)
```ts
interface StorageAdapter {                    // localStorage in dev, Firestore in prod
  getDocState(docId: string): Promise<DocState>;       // position, bookmarks, collapsedNotes
  setDocState(docId: string, patch: Partial<DocState>): Promise<void>;
  getPrefs(): Promise<ReadingPrefs>;          // global, cross-device (theme/size/font/contrast)
  setPrefs(patch: Partial<ReadingPrefs>): Promise<void>;
}
type MkiiBackend = (messages: ChatMsg[], ctx: { chapter: string; passage?: string }) => Promise<MkiiReply>;
interface NavAdapter { onExitToLibrary(): void; renderGlobalMenu(): React.ReactNode; }
```
`MkiiBackend` = placeholder-vs-RAG seam · `StorageAdapter` = localStorage-vs-Firestore seam
(§7 ownership + cross-device sync) · `NavAdapter` = drops the existing site hamburger in unchanged.

### 10.4 Props contract
```tsx
<Reader
  document={doc}                 // or { documentId, loader }
  initialLocation={loc}          // resume point (cross-device)
  storage={storageAdapter}
  mkii={mkiiBackend}
  nav={navAdapter}               // onExitToLibrary + global menu
  prefs={prefs} onPrefsChange={…}    // controlled; or uncontrolled via storage
  onLocationChange={syncFn}      // feeds My Shelf "continue reading"
/>
```

### 10.5 Composition
- `<Reader>` orchestrator — transient UI state (open panel, chrome visibility), keyboard,
  scroll/progress. Owns nothing persistent directly; goes through adapters.
- Presentational children: `<ReaderChrome>` (‹Library + breadcrumb + tools + global menu;
  bottom progress; running title; phone bottom-sheet), `<Content>`, `<DisplaySettings>`,
  `<Contents>`, `<SearchPanel>`, `<MkiiChat>`, `<QuoteCard>`, `<EditorialMarks>` / `<BookmarkMarks>`.
- `<Content>` uses a **block-renderer registry**: `renderers[block.kind]`. New block types
  (e.g. a letter salutation) = register a renderer; no edits to the core.
- Reading prefs via React **context** so every control reads/writes one source.
- **State ownership:** prefs are global and synced; doc state (position, bookmarks, collapsed
  notes) is per-document, keyed by `meta.id`. Both via the storage adapter — never raw localStorage.

### 10.6 Per-type mapping (same component, different data)
| Type | sections | section.title | extra | features off |
|------|----------|---------------|-------|--------------|
| Book | chapters | chapter names | — | — |
| Essay | 1 (or few) | optional | — | maybe `contents` |
| Letter | 1 | — | `meta` header block (from/to/date) | `contents` |
| Collection | one per letter | date / recipient | per-letter meta | — |

A letter is just a one-section document with a `meta` header block and `contents: false` — no
new component.

---

## 11. Content pipeline

Authoring source (markdown + frontmatter, or restoration/RAG output) → compiled to
`ReaderDocument` JSON at build time (GitHub Actions). The component only ever consumes
normalized JSON; all book/essay/letter diversity is resolved in the compile step. Editorial
marks and the illustration manifest are part of that compiled artefact.

The current HTML file is the **interaction prototype** (proof of feel); §10 is the **production
target** it gets refactored into.

---

## 12. Open questions / next steps

- [ ] Confirm scroll vs pagination after feeling the prototype.
- [ ] Decide typeface(s) and licensing.
- [ ] Editorial-mark data model: how `note.anchor` / `SpanRef` attaches to text spans; category
      vocabulary (debated / ambiguous / hard) and colours; collapsed-pill carrying category.
- [ ] Per-book illustration manifest format (styles, labels, framing notes, "Unavailable").
- [ ] Show RAG sources under MkII replies?
- [ ] "Ask MkII" from a selection: send passage silently vs prefill the input?
- [ ] Firestore schema for `DocState` + `ReadingPrefs` (cross-device) and My Shelf.
- [ ] Phone bottom-sheet contents + sticky-until-first-interaction chrome.

---

*Status: living draft, gathered through the design conversation. Language: English
(repo-oriented); switch to Swedish on request.*
