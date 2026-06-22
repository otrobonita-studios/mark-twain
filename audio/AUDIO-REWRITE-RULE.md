# Audio Rewrite Rule — Three-Voice Tagging for Voicebox

## The pattern, established from the sample

**Olivia (Narrator)** reads all frame and structural material:
- Title, subtitle, imprint
- The opening epistolary address ("If this book makes you feel...")
- A Note Before We Begin (content warning, crisis resource)
- Section headers: THE ACTORS, PART headers, CHAPTER titles
- Chapter epigraphs (the "Adapted from..." citation + the quoted original Twain passage)

**Mark Two** reads:
- The Foreword, in full — this is his one moment of direct, unmediated address before the narrative begins, breaking the Olivia frame deliberately
- His own dialogue lines inside each chapter

**Twain** reads:
- His own first-person narration and dialogue inside each chapter (the bulk of every chapter's body text)

## Why this distribution works

Olivia is the constant, archival, unchanging frame — she narrates from outside the story, already dead, having known the real man before any of this. Her voice never warms or shifts; she is structurally separate from the debrief itself, the way the docs describe a flat "archival" baseline voice as a useful contrast tool. Mark Two and Twain are the only two voices inside the debrief, which keeps their two-hander dynamic clean for the listener's ear — exactly as flagged in earlier planning: don't give frame material to Mark Two except the Foreword, which is the deliberate exception that establishes his presence before Twain ever appears.

## Tagging format for each chapter

Using this format, ready to paste into Voicebox's Stories Editor track-per-speaker model:

```
[OLIVIA]
## CHAPTER [N] — [TITLE]
*Adapted from "[Source Text]" ([Year])*
> [Epigraph quote from original Twain text]

[TWAIN]
[Twain's opening narration paragraph(s), up to his first line of dialogue or Mark Two's first interjection]

[MARK TWO]
[Mark Two's dialogue line]

[TWAIN]
[Twain's response]

... (continuing, alternating strictly by speaker change)
```

## Practical Stories Editor application

Per the Voicebox docs on Building Stories: create one Story per chapter (or the whole book as one long Story with chapter markers — test both), with three tracks total spanning the whole project: **Olivia**, **Twain**, **Mark Two**. Drag each tagged block from your generation History onto its corresponding track, in sequence, so the unified playhead plays them back in correct reading order regardless of which track each clip lives on.

For the Foreword specifically: this is the one place Mark Two's track has a clip before any Twain clip exists — worth testing in isolation first, since it's the listener's introduction to his voice profile before Twain's is ever heard.

## Open items requiring your decision

1. **A Final Word** (Mark Two's closing address, "From Mark Two, to you") — does this stay in Mark Two's voice (most likely answer, since it's explicitly his direct address) or does Olivia frame it the way she frames the Foreword's section header?
2. **Exhibits from the Debrief** — the framing/editorial-note text in this section was written in a clinical, archival register. Strong candidate for Olivia's voice throughout, since it's already structurally similar to the chapter epigraphs she already reads. The "What Mark Two Reads Now" subsection (Eve's Diary, Letters from the Earth, A Dog's Tale entries) was written in Mark Two's own first-person reading-note voice — should likely switch to his track for those specific entries.
3. **Behind the Scenes** — contains quoted exchanges between "Jesper" and "Claude" from development sessions. Neither of those is one of the three cast voices. This section may need to sit outside the three-voice system entirely, read by Olivia as pure narration (quoting both sides) rather than attempting to cast a fourth/fifth voice for a chapter that's explicitly about real-world production rather than the fiction.

Want me to go ahead and produce the fully tagged version of Chapter One as a test case, applying this rule, so you can verify the pattern before I run it across all fifteen chapters?
