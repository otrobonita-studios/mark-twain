#!/usr/bin/env python3
"""LLM-as-judge for groundedness, and the calibration that makes it worth using.

    export ANTHROPIC_API_KEY=sk-ant-...        # PowerShell: $env:ANTHROPIC_API_KEY="..."
    python evals/judge.py --run evals/.raw/<stamp>.all.json
    python evals/judge.py --run evals/.raw/<stamp>.all.json --calibrate
    python evals/judge.py --run evals/.raw/<stamp>.all.json --probe verbosity

DESIGN NOTES — the parts that matter more than the code
-------------------------------------------------------
* The judge is Claude; the system under test is DeepSeek. Different model
  families, so self-preference bias cannot inflate the score. A model grading
  its own family's output is the most common way an eval flatters itself.

* Four verdicts, not a 1-10 scale. Models do not calibrate fine-grained scales;
  ask for ten levels and you get sevens and eights forever. The verdicts match
  label.py exactly, because agreement can only be measured between identical
  vocabularies.

* The rubric judges FACTUAL CLAIMS ONLY. The first live run forced this
  distinction into the open:
      "heaven must be a great relief … no relatives there to shoot at"
          -> stylistic flourish, asserts nothing about the world
      "two fine families of the Arkansas aristocracy"
          -> factual claim, and the state appears in no chunk
  Both are absent from the chunks; only one is a grounding failure. A rubric
  that cannot tell them apart will fail every in-persona answer and be useless.

* --calibrate is not optional in spirit. An unvalidated judge produces numbers
  nobody should act on. Below ~90% agreement with the human labels, the prompt
  is wrong — not the system under test.

* No new dependencies: raw HTTP via urllib. `anthropic` is not installed for
  Python here, and adding it would need authorization under Constitution
  Rule 1. `@anthropic-ai/sdk` in package.json is the JS side, not this.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = ROOT / "src" / "data" / "evals" / "labels.json"
AGREEMENT = ROOT / "src" / "data" / "evals" / "judge-agreement.json"

API_URL = "https://api.anthropic.com/v1/messages"
JUDGE_MODEL = "claude-opus-5"
PROMPT_VERSION = "groundedness-v1"

VERDICTS = ("SUPPORTED", "PARTIAL", "UNSUPPORTED", "NOT_APPLICABLE")

SYSTEM = """You evaluate whether an answer is grounded in the passages that were retrieved for it.

You are given a question, the passages a retrieval system returned, and the answer that was produced. Decide whether the answer's FACTUAL CLAIMS are supported by those passages.

What counts as a factual claim:
- assertions about events, people, places, dates, wording, or what a text says
- specifics: names, numbers, locations, quotations

What does NOT count, and must never be marked unsupported:
- stylistic flourishes, jokes, aphorisms and rhetorical asides that assert nothing about the world
- the speaking persona's voice, opinions, or general reflections on human nature
- ordinary connective language

Example of the distinction:
- "heaven must be a great relief to such folks, there being no relatives there to shoot at" — a flourish. Asserts nothing checkable. NOT a grounding failure.
- "two fine families of the Arkansas aristocracy" — a factual claim about location. If no passage says Arkansas, that IS a grounding failure.

Verdicts, choose exactly one:
- SUPPORTED — every factual claim traces to a retrieved passage
- PARTIAL — mostly grounded, but at least one factual claim is unsupported
- UNSUPPORTED — the substance of the answer is not in the passages, however plausible it reads
- NOT_APPLICABLE — the answer makes no factual claims at all

An answer can be entirely correct about the world and still be UNSUPPORTED: correctness is not grounding. Judge only against the passages given.

Respond with JSON and nothing else:
{"verdict": "...", "unsupported_claims": ["..."], "reason": "one sentence"}"""


def call_claude(system: str, user: str, effort: str = "medium",
                max_tokens: int = 1024) -> str:
    key = (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
    if not key:
        raise SystemExit("ANTHROPIC_API_KEY is not set.")
    body = {
        "model": JUDGE_MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
        "output_config": {"effort": effort},
    }
    req = urllib.request.Request(
        API_URL, data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json",
                 "anthropic-version": "2023-06-01",
                 "x-api-key": key},
        method="POST")
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read().decode("utf-8"))
    if data.get("stop_reason") == "refusal":
        raise RuntimeError(f"judge refused: {data.get('stop_details')}")
    return "".join(b.get("text", "") for b in data.get("content", [])
                   if b.get("type") == "text")


def parse_verdict(raw: str) -> dict:
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return {"verdict": "PARSE_ERROR", "unsupported_claims": [], "reason": raw[:200]}
    try:
        out = json.loads(m.group(0))
    except json.JSONDecodeError:
        return {"verdict": "PARSE_ERROR", "unsupported_claims": [], "reason": raw[:200]}
    if out.get("verdict") not in VERDICTS:
        out["verdict"] = "PARSE_ERROR"
    out.setdefault("unsupported_claims", [])
    out.setdefault("reason", "")
    return out


def build_user(case: dict, answer: str, sources: list[dict]) -> str:
    passages = "\n\n".join(
        f"PASSAGE {i} (from {s.get('filename','?')}):\n{s.get('text','')}"
        for i, s in enumerate(sources, 1)) or "(no passages were retrieved)"
    return (f"QUESTION:\n{case['question']}\n\n"
            f"RETRIEVED PASSAGES:\n{passages}\n\n"
            f"ANSWER:\n{answer}")


def judge_run(run: dict, effort: str, pad: str = "") -> list[dict]:
    out = []
    for r in run.get("results", []):
        resp = r.get("response", {})
        answer = (resp.get("response") or "")
        if not answer.strip():
            out.append({"case_id": r["case_id"], "verdict": "NOT_APPLICABLE",
                        "unsupported_claims": [],
                        "reason": "empty answer — nothing to judge",
                        "skipped": True})
            print(f"  {r['case_id']:<22} NOT_APPLICABLE  (empty answer, not sent)")
            continue
        raw = call_claude(SYSTEM, build_user(r, answer + pad, resp.get("sources") or []),
                          effort=effort)
        v = parse_verdict(raw)
        v["case_id"] = r["case_id"]
        out.append(v)
        claims = f"  claims={v['unsupported_claims']}" if v["unsupported_claims"] else ""
        print(f"  {r['case_id']:<22} {v['verdict']:<16}{claims}")
    return out


def calibrate(verdicts: list[dict]) -> dict:
    if not LABELS.is_file():
        raise SystemExit(f"no human labels at {LABELS}. Run evals/label.py first — "
                         "labels must exist before the judge is measured.")
    human = {l["case_id"]: l["verdict"]
             for l in json.loads(LABELS.read_text(encoding="utf-8"))["labels"]}
    rows, agree = [], 0
    for v in verdicts:
        h = human.get(v["case_id"])
        if h is None:
            continue
        ok = h == v["verdict"]
        agree += ok
        rows.append({"case_id": v["case_id"], "human": h, "judge": v["verdict"],
                     "agree": ok, "judge_reason": v.get("reason", "")})
    rate = agree / len(rows) if rows else 0.0
    print("\n  case                   human            judge            ")
    print("  " + "-" * 62)
    for r in rows:
        print(f"  {r['case_id']:<22} {r['human']:<16} {r['judge']:<16} "
              f"{'ok' if r['agree'] else 'DISAGREE'}")
        if not r["agree"]:
            print(f"      judge said: {r['judge_reason']}")
    print(f"\n  agreement: {agree}/{len(rows)} = {rate:.0%}")
    if rate < 0.9:
        print("  Below 90%. The prompt is wrong, not the system under test.")
        print("  Read the disagreements — each one is a rubric ambiguity.")
    else:
        print("  At or above 90%. The judge can be trusted on this dimension.")
    return {"rate": rate, "n": len(rows), "rows": rows}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--probe", choices=["verbosity"],
                    help="deliberately bias the input and see if verdicts move")
    ap.add_argument("--effort", default="medium",
                    choices=["low", "medium", "high", "xhigh", "max"])
    args = ap.parse_args()

    run = json.loads(Path(args.run).read_text(encoding="utf-8"))
    print(f"judge  : {JUDGE_MODEL} (effort={args.effort}, prompt={PROMPT_VERSION})")
    print(f"run    : {run.get('run_id')}\n")

    verdicts = judge_run(run, args.effort)

    if args.probe == "verbosity":
        # Longer answers score better with most judges. If padding an answer with
        # empty words moves a verdict, the judge is grading length, not grounding.
        filler = ("\n\nI might add, as I have often had occasion to remark, that "
                  "these matters repay a second consideration, and a third.") * 3
        print("\n  --- verbosity probe: same answers, padded with contentless filler ---")
        padded = judge_run(run, args.effort, pad=filler)
        before = {v["case_id"]: v["verdict"] for v in verdicts}
        moved = [p["case_id"] for p in padded
                 if before.get(p["case_id"]) != p["verdict"]]
        print(f"\n  verdicts changed by padding alone: {moved or 'none'}")
        if moved:
            print("  That is verbosity bias. Record it — it is a property of your judge.")

    if args.calibrate:
        result = calibrate(verdicts)
        AGREEMENT.parent.mkdir(parents=True, exist_ok=True)
        AGREEMENT.write_text(json.dumps({
            "schema_version": "1.0",
            "dimension": "groundedness",
            "judge_model": JUDGE_MODEL,
            "prompt_version": PROMPT_VERSION,
            "effort": args.effort,
            "measured_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "source_run": run.get("run_id"),
            "agreement_rate": result["rate"],
            "sample_size": result["n"],
            "limitations": [
                "Sample size is the golden set itself — ten cases at most.",
                "Labels come from one person, so inter-rater reliability is unknown.",
                "Agreement is measured on one dimension only (groundedness).",
            ],
            "comparisons": result["rows"],
        }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\n  written -> {AGREEMENT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
