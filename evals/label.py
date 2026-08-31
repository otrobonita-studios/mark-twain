#!/usr/bin/env python3
"""Hand-label a run for groundedness. Do this BEFORE writing any judge.

    python evals/label.py evals/.raw/20260824T161608Z.all.json

For each case it shows the question, the chunks that came back, and the answer,
then asks for a verdict. Labels are written to src/data/evals/labels.json.

WHY THIS COMES FIRST
--------------------
A judge prompt written without human labels to check against is not an
evaluation, it is a vibe with an API bill. The labels are the ground truth the
judge is measured against; if they are produced after seeing the judge's
output, they are contaminated and the agreement rate means nothing.

One dimension only: groundedness. Is every factual claim in the answer
supported by the retrieved chunks? Style, tone and persona are not judged here
— narrow first, widen only once the narrow version is trustworthy.

The distinction this run forced into the open:
  - "heaven must be a great relief … no relatives there to shoot at"
        -> a stylistic flourish. No claim about the world.
  - "two fine families of the Arkansas aristocracy"
        -> a factual claim. The state is in no chunk.
Both are unsupported by the chunks. Only one asserts something false.
Decide deliberately which of those you are scoring, and stay consistent.
"""
from __future__ import annotations

import json
import sys
import textwrap
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = ROOT / "src" / "data" / "evals" / "labels.json"

VERDICTS = {
    "s": ("SUPPORTED", "every factual claim traces to a retrieved chunk"),
    "p": ("PARTIAL", "mostly grounded, but at least one claim is not supported"),
    "u": ("UNSUPPORTED", "the substance of the answer is not in the chunks"),
    "n": ("NOT_APPLICABLE", "no factual claims to check (pure persona/voice)"),
}


def wrap(text: str, width: int = 92, indent: str = "      ") -> str:
    out = []
    for para in (text or "").split("\n"):
        out.extend(textwrap.wrap(para, width=width, initial_indent=indent,
                                 subsequent_indent=indent) or [indent])
    return "\n".join(out)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    run = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    results = run.get("results", [])
    if not results:
        print("no results in that file")
        return 2

    existing = {}
    if LABELS.is_file():
        existing = {l["case_id"]: l for l in
                    json.loads(LABELS.read_text(encoding="utf-8")).get("labels", [])}

    print(f"\nrun {run.get('run_id')} — {len(results)} case(s)")
    print("verdicts: [s]upported  [p]artial  [u]nsupported  [n]ot applicable  "
          "[k]eep existing  [q]uit\n")

    labels = []
    for i, r in enumerate(results, 1):
        cid = r["case_id"]
        resp = r.get("response", {})
        answer = resp.get("response", "") or ""
        sources = resp.get("sources", []) or []

        print("=" * 96)
        print(f"[{i}/{len(results)}]  {cid}")
        print(f"\n  Q: {r['question']}")
        print(f"\n  RETRIEVED ({len(sources)} chunks):")
        for j, s in enumerate(sources, 1):
            print(f"    {j}. {s.get('filename','?')}  score={s.get('score')}")
            print(wrap((s.get("text", "") or "")[:420] + "…", indent="       "))
        print(f"\n  ANSWER ({len(answer)} chars):")
        print(wrap(answer) if answer else "      <EMPTY>")

        if cid in existing:
            print(f"\n  existing label: {existing[cid]['verdict']} "
                  f"— {existing[cid].get('note','')}")

        while True:
            choice = input("\n  verdict > ").strip().lower()
            if choice == "q":
                print("\nstopped. nothing written.")
                return 0
            if choice == "k" and cid in existing:
                labels.append(existing[cid])
                break
            if choice in VERDICTS:
                verdict, gloss = VERDICTS[choice]
                note = input("  unsupported claim(s), or why (enter to skip) > ").strip()
                labels.append({
                    "case_id": cid,
                    "dimension": "groundedness",
                    "verdict": verdict,
                    "note": note,
                    "labelled_by": "human",
                    "run_id": run.get("run_id"),
                })
                print(f"  -> {verdict}")
                break
            print("  choose s / p / u / n / k / q")

    LABELS.parent.mkdir(parents=True, exist_ok=True)
    LABELS.write_text(json.dumps({
        "schema_version": "1.0",
        "dimension": "groundedness",
        "labelled_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source_run": run.get("run_id"),
        "note": "Human labels, produced before any judge prompt existed. "
                "These are the ground truth the judge is measured against.",
        "labels": labels,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    counts: dict[str, int] = {}
    for l in labels:
        counts[l["verdict"]] = counts.get(l["verdict"], 0) + 1
    print(f"\n{len(labels)} labels -> {LABELS.relative_to(ROOT)}")
    print("  " + "  ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    print("\nNow the judge can be written — and measured against these.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
