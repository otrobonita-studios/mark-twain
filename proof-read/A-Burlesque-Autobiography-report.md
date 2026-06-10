# Proofreading Report: A Burlesque Autobiography

**Working copy:** https://mark.otrobonita.com/read/A-Burlesque-Autobiography (Traditional Read)  
**Date:** 2026-06-09

---

## SUMMARY

- **Witness used:** *Mark Twain's (Burlesque) Autobiography and First Romance.* Sheldon & Co., New York, 1871 (first book edition). Collation based on americanliterature.com transcription (cross-checked against Gutenberg #3166 for key passages). Note: the americanliterature.com text appears to derive from the 1875 collected edition (*Sketches New and Old*) and has its own errors; divergences are flagged with appropriate confidence ratings. The 1871 Sheldon scan at Internet Archive (identifier: MarkTwainsburlesqueAutobiographyAndFirstRomance) was located but the djvu.txt was unavailable at time of check.
- **Findings:** 7 total — **1 structural/provenance · 2 markup leakage · 1 typographic · 2 substitution · 1 UNSURE**
- **Needs human:** Item 5 (Capt. vs Captain), Item 6 ("distinctly" vs "distantly"), Item 7 ("noble old house")
- **Unmatched:** The 2,300-char modern editorial note (Finding 1)

> **Dominant issues:** (1) A modern editorial note written in Twain's voice is embedded at the start of the Traditional Read; (2) the five criminal-ancestor names in ALL-CAPS (RICHARD BRINSLEY TWAIN, JOHN WENTWORTH TWAIN, etc.) are small-caps markup leakage; (3) "TWAIN" in the Native American name is a parallel small-caps rendering issue.

---

## Findings

### [Pre-text — "EXPLAINED BY MARK TWAIN II"] ⚠️ PROVENANCE
- **Flag:** Provenance — ~2,300-character modern editorial note written in the first person as "Mark Twain II" appears before the story text in the Traditional Read
- **Source:** 1871 first edition contains no such note; the passage references events in 2026 ("A century and a half is a wonderful cure for indignation") and the site's own publication history ("They tell me my Burlesque Autobiography is to be split from its companion, the First Romance"), confirming it is a modern composition
- **Suggestion:** Remove entirely from the Traditional Read, or move outside the text column (e.g., an editorial sidebar or footnote); the reader should open on "BURLESQUE AUTOBIOGRAPHY. / Two or three persons having at different times…"
- **Author's choice?** No — this is 2026 site editorial content, not Twain's text
- **Confidence:** High

---

### [Criminal ancestors — ALL-CAPS names] — Markup leakage
- **Flag:** Emphasis fidelity — five ancestor names in ALL-CAPS; small-caps in the 1871 printing rendered as ALL-CAPS by the ingest pipeline
- **Source:** 1871 first edition (corroborated by americanliterature.com transcription): names appear in small capitals — "Richard Brinsley Twain, alias Guy Fawkes; John Wentworth Twain, alias Sixteen-String Jack; William Hogarth Twain, alias Jack Sheppard; Ananias Twain, alias Baron Munchausen; John George Twain, alias Capt. Kydd"
- **Suggestion:** `RICHARD BRINSLEY TWAIN, alias Guy Fawkes; JOHN WENTWORTH TWAIN, alias Sixteen-String Jack; WILLIAM HOGARTH TWAIN, alias Jack Sheppard; ANANIAS TWAIN, alias Baron Munchausen; JOHN GEORGE TWAIN, alias Capt. Kydd` → restore to small caps or mixed case per the 1871 print
- **Author's choice?** No — ALL-CAPS is the Gutenberg plain-text rendering of small caps; the 1871 typesetter used small caps for emphasis on these "alias" names, a standard period convention for wanted-notice styling
- **Confidence:** High

---

### [Native American name — "TWAIN"] — Markup leakage
- **Flag:** Emphasis fidelity — "TWAIN" rendered in ALL-CAPS as part of the full formal name "PAH-GO-TO-WAH-WAH-PUKKETEKEEWIS (Mighty-Hunter-with-a-Hog-Eye) TWAIN"
- **Source:** 1871 edition: the name is formatted as a formal styled name in small caps throughout; the witness transcription reads "Pah-go-to-wah-wah-pukketekeewis (Mighty-Hunter-with-a-Hog-Eye-Twain)"
- **Suggestion:** `PAH-GO-TO-WAH-WAH-PUKKETEKEEWIS (Mighty-Hunter-with-a-Hog-Eye) TWAIN` → restore to mixed case/small caps: *Pah-go-to-wah-wah-pukketekeewis (Mighty-Hunter-with-a-Hog-Eye-Twain)*
- **Author's choice?** No — same small-caps rendering issue as Finding 2
- **Confidence:** High

---

### [Columbus passage — "anchor cable"] — Typographic
- **Flag:** Typographic — hyphen dropped in period compound
- **Source:** 1871 edition / americanliterature.com: *anchor-cable*
- **Suggestion:** `anchor cable hanging limp from the bow` → `anchor-cable hanging limp from the bow`
- **Author's choice?** No — "anchor-cable" is the period compound form; working copy silently modernized
- **Confidence:** High

---

### [Criminal ancestors — "Capt. Kydd" vs "Captain Kydd"] ⚠️ NEEDS HUMAN
- **Flag:** Substitution — abbreviated "Capt." in working copy vs spelled-out "Captain" in witness transcription
- **Source:** Americanliterature.com (collected-edition text): "Captain Kydd"; working copy: "Capt. Kydd"
- **Suggestion:** Verify against 1871 Sheldon scan. If the 1871 text uses "Capt.," working copy is correct; if "Captain," restore.
- **Author's choice?** UNSURE — "Capt. Kydd" (abbreviated) is plausible for the burlesque register; so is "Captain Kydd." Route to human with scan.
- **Confidence:** Low — flag for verification

---

### [Criminal ancestors — "distantly" vs "distinctly"] ⚠️ NEEDS HUMAN
- **Flag:** Substitution — "distantly removed" (working copy) vs "distinctly removed" (witness)
- **Source:** Americanliterature.com: "a branch of it somewhat *distinctly* removed from the honorable direct line"; working copy: "somewhat *distantly* removed"
- **Suggestion:** Verify against 1871 Sheldon scan. "Distantly" (= geographically/genealogically far) makes better semantic sense; "distinctly" (= clearly, obviously) is odd with "removed." "Distantly" may be the correct 1871 reading; "distinctly" could be a collected-edition corruption.
- **Author's choice?** UNSURE — "distantly" is semantically preferable but the witness has "distinctly." Both are real words; this is an easy substitution error in either direction.
- **Confidence:** Low — flag for verification

---

### [Opening — "noble old house"] ⚠️ NEEDS HUMAN
- **Flag:** Substitution — "noble old house" (working copy) vs "noble house" (witness)
- **Source:** Americanliterature.com: "Ours is a noble house, and stretches a long way back into antiquity"; working copy: "Ours is a noble old house, and stretches a long way back into antiquity"
- **Suggestion:** Verify against 1871 Sheldon scan. The word "old" in the working copy may come from a different edition (the Galaxy first printing, 1871, vs the collected Sketches edition).
- **Author's choice?** UNSURE — both "noble house" and "noble old house" are plausible Twain phrasings; the extra "old" may be authentic to the Galaxy/Sheldon text or may be a spurious ingest addition.
- **Confidence:** Medium — flag for verification

---

## Notes on scope

**"George Francis Train"** (working copy) vs "George Francis Twain" (americanliterature.com): the working copy is almost certainly *correct* here. The passage lists real or semi-real figures — Tom Pepper (a proverbial liar), Nebuchadnezzar, Baalam's Ass — and "George Francis Train" was a real and famous 19th-century American eccentric, making the joke work. The americanliterature.com text appears to have silently "corrected" Train → Twain, losing the pun entirely. This is **not a finding against the working copy**.

**"fulness"** (working copy): period spelling, correctly preserved. Americanliterature.com modernizes to "fullness" — working copy is right to keep the 1871 form.

**Family tree diagram** ("OUR FAMILY TREE" in ASCII art): the working copy renders the family tree as ASCII art. The 1871 Sheldon edition included an actual typeset genealogy chart; the ASCII art is a reasonable plain-text representation of the original illustration's structure and is not a textual error.

**"anchor-cable" as the dominant typographic finding:** the 1871 era consistently hyphenated such compounds; the working copy's open "anchor cable" follows the same silent modernization pattern seen throughout the site (cf. "to-day" → "today" in other texts).
