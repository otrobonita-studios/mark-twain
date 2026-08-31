#!/usr/bin/env python3
"""Verify every claim in the golden set — honestly about what it cannot verify.

    python evals/verify_golden.py            # positive claims only
    python evals/verify_golden.py --live     # also verifies negative claims

WHY TWO MODES
-------------
v1 of this script established "absent from the corpus" by scanning
src/data/books/*.html — 111 documents. The embedding index holds 8,603+
documents outside that directory, including Internet Archive scans that are
not in this repository at all. Two golden cases were built on that blind spot
and both were wrong; one of them would have failed the system for answering
a question correctly.

The lesson is structural, not a bug fix. A negative claim about retrieval
cannot be checked against the repository, because the repository is not the
index. The only authority on what is retrievable is the index itself. So:

  positive claims  ("this text is in this book")   -> checkable offline
  negative claims  ("no indexed document has this") -> requires --live

Offline mode reports negative claims as UNVERIFIED and exits non-zero. That
is deliberate: a verifier that silently certifies what it did not check is
worse than no verifier at all.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GOLDEN = ROOT / "src" / "data" / "evals" / "mark-twain.golden.json"
BOOKS = ROOT / "src" / "data" / "books"
EMBED_STATE = ROOT / "rag" / "data-collection" / "TwainCorpus" / "embed_corpus.state.json"
DEFAULT_BASE = "https://mark.otrobonita.com"
RESEARCH_LIMIT = 20


def normalise(text: str) -> str:
    """Fold variants that silently break literal greps.

    Twain's texts use curly apostrophes: 'Dan’l Webster' (U+2019) does not
    match a search for "Dan'l Webster". Losing a case to punctuation is the
    dullest possible way for an eval to lie to you.
    """
    text = unicodedata.normalize("NFKC", text)
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'), ("—", "-"), ("–", "-")):
        text = text.replace(a, b)
    return re.sub(r"\s+", " ", text)


def plain_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="replace")
    raw = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    return normalise(html.unescape(raw))


def indexed_stems() -> set[str]:
    return {Path(e).stem for e in json.loads(EMBED_STATE.read_text(encoding="utf-8"))}


def research_search(base: str, query: str, limit: int = RESEARCH_LIMIT) -> list[dict]:
    """Ask the live index. This is the only authority on what is retrievable."""
    req = urllib.request.Request(
        f"{base.rstrip('/')}/api/research",
        data=json.dumps({"action": "search", "query": query, "limit": limit}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode("utf-8")).get("results", [])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true",
                    help="verify negative claims against the live index")
    ap.add_argument("--base", default=DEFAULT_BASE)
    args = ap.parse_args()

    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    indexed = indexed_stems()
    on_disk = {p.stem for p in BOOKS.glob("*.html")}
    cache: dict[str, str] = {}

    failures: list[str] = []
    unverified: list[str] = []
    checks = 0

    print(f"golden set : {GOLDEN.relative_to(ROOT)}")
    print(f"on disk    : {len(on_disk)} documents, {len(on_disk & indexed)} of them indexed")
    print(f"index total: {len(indexed)} documents "
          f"({len(indexed - on_disk)} not present in this repository)")
    print(f"mode       : {'LIVE — negative claims checked against /api/research' if args.live else 'OFFLINE — negative claims cannot be checked'}\n")

    for case in golden["cases"]:
        cid = case["id"]
        v = case.get("verify", {})
        notes: list[str] = []
        cid_failed = False

        # ---- positive claims: term must appear in the named file ----------
        if "file" in v:
            path = BOOKS / v["file"]
            if not path.is_file():
                failures.append(f"{cid}: missing source file {v['file']}")
                cid_failed = True
            else:
                text = cache.setdefault(v["file"], plain_text(path).lower())
                for term in v.get("present", []):
                    checks += 1
                    hits = text.count(normalise(term).lower())
                    if hits == 0:
                        failures.append(f"{cid}: {term!r} not found in {v['file']}")
                        cid_failed = True
                    else:
                        notes.append(f"{term!r}x{hits}")
                if v.get("expect_source_stem") and v["expect_source_stem"] not in indexed:
                    checks += 1
                    failures.append(
                        f"{cid}: expected source {v['expect_source_stem']} is not indexed")
                    cid_failed = True

        # ---- negative claims: nothing in the INDEX may contain the term ---
        for term in v.get("absent_from_index", []):
            checks += 1
            if not args.live:
                unverified.append(f"{cid}: {term!r} — absence not checked (needs --live)")
                notes.append(f"{term!r} UNVERIFIED")
                continue
            try:
                results = research_search(args.base, term)
            except Exception as e:  # noqa: BLE001 — surfaced, never swallowed
                failures.append(f"{cid}: /api/research failed for {term!r}: "
                                f"{type(e).__name__}: {e}")
                cid_failed = True
                continue
            needle = normalise(term).lower()
            hit = next((r for r in results
                        if needle in normalise(r.get("payload", {}).get("text", "")).lower()),
                       None)
            if hit:
                failures.append(
                    f"{cid}: {term!r} expected absent but the index returned it in "
                    f"{hit.get('payload', {}).get('filename', '?')} "
                    f"(score {hit.get('score')}). The negative case is not negative.")
                cid_failed = True
            else:
                notes.append(f"{term!r} absent from top-{RESEARCH_LIMIT}")

        if "contract_source" in v:
            notes.append(f"contract: {v['contract_source'].split('—')[-1].strip()}")
        if not v:
            notes.append("no corpus claim — judged case")

        status = "FAIL" if cid_failed else ("????" if any(cid in u for u in unverified) else "ok")
        print(f"  [{status:>4}] {cid:<22} {'; '.join(notes) if notes else '—'}")

    print(f"\n{checks} claims across {len(golden['cases'])} cases")

    if failures:
        print(f"\n{len(failures)} FAILED:")
        for f in failures:
            print(f"  - {f}")
    if unverified:
        print(f"\n{len(unverified)} UNVERIFIED — offline mode cannot check absence:")
        for u in unverified:
            print(f"  - {u}")
        print("\n  The index holds documents this repository does not. Re-run with")
        print("  --live to check these against /api/research before trusting a run.")

    if failures or unverified:
        return 1
    print("all claims hold, positive and negative")
    return 0


if __name__ == "__main__":
    sys.exit(main())
