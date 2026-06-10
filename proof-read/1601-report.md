# Proofreading Report: 1601

**Working copy:** https://mark.otrobonita.com/read/1601 (Traditional Read)  
**Date:** 2026-06-09

---

## SUMMARY

- **Witness used:** Franklin J. Meine (ed.), *1601. Conversation, as it was by the Social Fireside, in the Time of the Tudors.* The Bibliophile Club of Chicago, 1939. (The working copy is self-evidently the Meine edition; the 1880 Cleveland printing [4 copies] and 1882 West Point printing [50 copies] are not digitally accessible. Gutenberg #3190 is Meine-lineage and corroborates the text but is not an independent authority.)
- **Findings:** 3 total — **2 structural/provenance · 1 substitution/OCR · 0 markup · 0 caps · 0 typographic · 0 punctuation · 0 OCR · 0 emphasis**
- **Needs human:** Item 3 (quene/queene inconsistency — may be intentional Twain variation)
- **Unmatched:** None

> **Dominant issue:** The "Traditional Read" presents the entire Franklin J. Meine 1939 scholarly edition verbatim, including Meine's Introduction (~34,000 characters), his "Footnotes to Frivolity," historical Notes, and Bibliography. Only the Conversation itself — approximately 12,400 characters — is Twain's text. The editorial apparatus, which accounts for roughly 82% of the page's word count, should not appear in a presentation billed as the "Original text as published."

---

## Findings

### [Structure — Meine Introduction embedded in Traditional Read] ⚠️ STRUCTURAL / PROVENANCE
- **Flag:** Structural completeness — the Traditional Read opens with approximately 34,000 characters of Franklin J. Meine's editorial Introduction before reaching Twain's text
- **Source:** Meine 1939 edition, pp. v–xlii: the Introduction is signed "FRANKLIN J. MEINE" and is unambiguously editorial commentary written in 1939 — it is not Twain's text and did not appear in any printing during Twain's lifetime
- **Suggestion:** Remove or relocate the entire Introduction section (everything from the opening of the article through the "FRANKLIN J. MEINE" byline). The Traditional Read should begin at "THE FIRST PRINTING Verbatim Reprint / [Date, 1601.] / CONVERSATION, AS IT WAS BY THE SOCIAL FIRESIDE, IN THE TIME OF THE TUDORS." followed immediately by the [Mem.—…] framing note and the Conversation
- **Author's choice?** No — the Introduction is Meine's scholarship, not Twain's writing. Its presence inside the reader text misrepresents the provenance of the edition and buries Twain's actual text after 34K chars of editorial matter
- **Confidence:** High

---

### [Structure — Meine apparatus (Footnotes, Notes, Bibliography) appended to Conversation] ⚠️ STRUCTURAL / PROVENANCE
- **Flag:** Structural completeness — the Traditional Read appends three sections of Meine's editorial apparatus after the Conversation ends:
  1. **"FOOTNOTES To Frivolity"** (~2,400 chars) — Meine's historical character notes on the Elizabethan figures in the piece
  2. **Notes section** (~16,400 chars) — extended scholarly annotation
  3. **Bibliography** (~3,800 chars) — Meine's scholarly bibliography
- **Source:** Meine 1939 edition: all three sections are Meine's editorial work; none appeared in the 1880 or 1882 printings. The Footnotes section opens with Meine's own prose: "The historical consistency of 1601 indicates that Twain must have given the subject considerable thought."
- **Suggestion:** Remove or relocate all material from "FOOTNOTES To Frivolity" through the end of the Bibliography. The Conversation — Twain's text — ends at "lo his member felle, and would not rise again." That is the natural close of the Traditional Read.
- **Author's choice?** No — this is Meine's editorial apparatus, not Twain's writing
- **Confidence:** High

---

### [Conversation ¶ — "that poor ass, Lille"] — Substitution / OCR
- **Flag:** Substitution — "Lille" for "Lyly" (John Lyly, c. 1553–1606, Elizabethan playwright and author of *Euphues*, the originator of "Euphuism")
- **Source:** Meine 1939 edition / Gutenberg #3190: the passage reads *"pupils of that poor ass, Lyly, himself"* — the reference is specifically to John Lyly because the surrounding passage mocks the ladies' "Euphuistic" dainty-wrought phrases, and the Queen herself is called "ye very flower of ye Euphuists." The joke only works with Lyly's name.
- **Suggestion:** `that poor ass, Lille, himself` → `that poor ass, Lyly, himself`
- **Author's choice?** No — "Lille" is a French city and is nonsensical in context. The error is likely an OCR or transcription misread of "Lyly" (easily confused with "Lyle" → "Lille" in OCR pipelines). The literary reference is unambiguously John Lyly.
- **Confidence:** High

---

### [Throughout — "quene" / "queene" inconsistency] — Typographic ⚠️ NEEDS HUMAN
- **Flag:** Typographic — spelling of the word varies between "quene" (4 instances) and "queene" (8 instances) without apparent pattern
- **Source:** Meine 1939 edition (verify): Twain's pseudo-Elizabethan pastiche deliberately uses inconsistent archaic spellings throughout, so some variation may be intentional. The four "quene" instances are concentrated in the latter half of the text (roughly positions 10,000–12,000 in the Conversation), while "queene" dominates the first half.
- **Suggestion:** Verify against a physical scan of the Meine 1939 printing. If the Meine text is consistent, the working copy has an OCR drift. If Meine is itself inconsistent, the variation is authentic Twain and should stand.
- **Author's choice?** UNSURE — intentional variation is plausible given the text's pastiche character, but the late-text clustering of "quene" is suspicious. Route to human.
- **Confidence:** Low — flag for verification

---

## Notes on scope

**The Conversation text is otherwise clean.** No markup leakage was found: the only ALL-CAPS words in the Conversation are "YESTERNIGHT" (the diary-entry section header, authentic to the Meine layout) and "IV" in "King Henry IV." (correct Roman numeral). The single instance of "to-day" is correctly hyphenated. The "wh" abbreviation used twice for "with" ("holde converse wh ye low," "wh ye weighte") is authentic period pastiche and should stand.

**On the witness problem:** The 1880 Cleveland and 1882 West Point printings are effectively inaccessible digitally. Any edition claiming to restore Twain's earliest text of 1601 should note that the Meine 1939 is the most authoritative *accessible* source, while being transparent that it is a scholarly edition from 58 years after composition, not a facsimile of the earliest printings.

**Structural priority:** The provenance findings (Items 1 and 2) are far more significant than any textual error. A reader opening the "Traditional Read" encounters approximately 34,000 characters of 1939 scholarship before reaching Twain's 12,400-character text. This is a fundamental presentation issue regardless of the textual accuracy of the Conversation itself.
