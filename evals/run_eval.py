#!/usr/bin/env python3
"""Run the Mark Twain golden set against the chat API.

Stage 1 of the judge work: no judge yet. This runs cases live, applies the
deterministic scorers, and saves raw responses so we can read what the model
actually does before writing a single line of judging logic.

    python evals/run_eval.py --list
    python evals/run_eval.py --live --case par-frog-leak
    python evals/run_eval.py --live                     # all ten
    python evals/run_eval.py --dry-run                  # no network

Base URL defaults to production; override with --base or EVAL_BASE_URL:
    python evals/run_eval.py --live --base http://localhost:3000
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import scorers  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
GOLDEN = ROOT / "src" / "data" / "evals" / "mark-twain.golden.json"
RAW_DIR = Path(__file__).resolve().parent / ".raw"
DEFAULT_BASE = "https://mark.otrobonita.com"


def load_golden() -> dict:
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


def ask(base: str, case: dict, timeout: int = 120) -> dict:
    p = case["params"]
    payload = {
        "message": case["question"],
        "history": [],
        "style": p.get("style"),
        "tone": p.get("tone"),
        "simplify": p.get("simplify", False),
        "historyAware": p.get("historyAware", False),
    }
    req = urllib.request.Request(
        f"{base.rstrip('/')}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def score(case: dict, response: dict) -> dict:
    """Deterministic scorers only. Judged dimensions are recorded as pending."""
    answer = response.get("response", "") or ""
    exp = case.get("expect", {})
    p = case["params"]
    out: dict = {}

    if "sources_any_of" in exp:
        out["source_hit"] = scorers.source_hit(response, exp["sources_any_of"])
        out["source_rank"] = scorers.source_rank(response, exp["sources_any_of"])
    if "sources_none_of" in exp:
        got = set(scorers.source_files(response))
        out["source_correctly_absent"] = not (got & set(exp["sources_none_of"]))
    if "must_mention" in exp:
        out["mentions_all"] = scorers.mentions(answer, exp["must_mention"])
        out["missing"] = scorers.missing_terms(answer, exp["must_mention"])
    if "must_not_mention" in exp:
        present = [t for t in exp["must_not_mention"] if t.lower() in answer.lower()]
        out["forbidden_present"] = present
    if exp.get("must_disclaim_authorship"):
        out["disclaims"] = scorers.disclaims_authorship(answer)
        out["claims"] = scorers.claims_authorship(answer)
    if exp.get("must_show_bewilderment"):
        out["bewilderment"] = scorers.shows_bewilderment(answer)
    if exp.get("must_not_use_anachronisms_assertively"):
        out["anachronisms"] = scorers.anachronisms(answer)
    if exp.get("must_admit_limits"):
        out["admits_limits"] = scorers.admits_limits(answer)
    if "max_chars" in exp:
        out["chars"] = len(answer)
        out["within_max_chars"] = len(answer) <= exp["max_chars"]
    if "answer_correct_if_mentions_any" in exp:
        out["answer_looks_correct"] = scorers.mentions(
            answer, exp["answer_correct_if_mentions_any"], mode="any"
        )
    if "soft_signal" in exp:
        s = exp["soft_signal"]
        low = answer.lower()
        out["soft_signal"] = {
            s["prefers"]: low.count(s["prefers"].lower()),
            s["over"]: low.count(s["over"].lower()),
        }

    out["style_compliance"], out["measured"], out["bounds"] = scorers.style_compliance(
        answer, p.get("style"), p.get("tone")
    )
    if exp.get("judge"):
        out["judge_pending"] = exp["judge"]
    return out


def summarise(case: dict, response: dict, s: dict) -> str:
    """One line per case. Deliberately does not compute pass/fail yet — the
    verdict rules need real output in front of us before they are worth writing."""
    bits = []
    if "source_hit" in s:
        bits.append(f"hit@3={s['source_hit']}" + (f" rank={s['source_rank']}" if s.get("source_rank") else ""))
    if "source_correctly_absent" in s:
        bits.append(f"absent_ok={s['source_correctly_absent']}")
    if "answer_looks_correct" in s:
        bits.append(f"answer_correct={s['answer_looks_correct']}")
    if "mentions_all" in s:
        bits.append(f"mentions={s['mentions_all']}")
    if "disclaims" in s:
        bits.append(f"disclaims={s['disclaims']}/claims={s['claims']}")
    if "bewilderment" in s:
        bits.append(f"bewildered={s['bewilderment']}")
    if s.get("anachronisms"):
        bits.append(f"anachronisms={s['anachronisms']}")
    if "admits_limits" in s:
        bits.append(f"admits_limits={s['admits_limits']}")
    if "within_max_chars" in s:
        bits.append(f"chars={s['chars']}<= {case['expect']['max_chars']}:{s['within_max_chars']}")
    if s.get("soft_signal"):
        bits.append(f"spelling={s['soft_signal']}")
    if s.get("judge_pending"):
        bits.append(f"judge_pending={','.join(s['judge_pending'])}")
    return " | ".join(bits) or "—"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true", help="call the real API")
    ap.add_argument("--dry-run", action="store_true", help="validate without network")
    ap.add_argument("--list", action="store_true", help="list case ids and stop")
    ap.add_argument("--case", action="append", help="run only this id (repeatable)")
    ap.add_argument("--base", default=os.environ.get("EVAL_BASE_URL", DEFAULT_BASE))
    args = ap.parse_args()

    golden = load_golden()
    cases = golden["cases"]
    if args.case:
        wanted = set(args.case)
        cases = [c for c in cases if c["id"] in wanted]
        missing = wanted - {c["id"] for c in cases}
        if missing:
            print(f"unknown case id(s): {', '.join(sorted(missing))}", file=sys.stderr)
            return 2

    if args.list:
        for c in golden["cases"]:
            print(f"  {c['id']:<22} {c['scoring']:<24} {c['category']}")
        return 0

    if args.dry_run or not args.live:
        for c in cases:
            assert c["question"] and c["params"] and c["expect"], c["id"]
        print(f"dry run ok — {len(cases)} case(s) well-formed. Add --live to call {args.base}")
        return 0

    RAW_DIR.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    print(f"base : {args.base}\nrun  : {stamp}\n")

    results = []
    for c in cases:
        print(f"── {c['id']}")
        print(f"   Q: {c['question']}")
        try:
            t0 = time.time()
            resp = ask(args.base, c)
            ms = int((time.time() - t0) * 1000)
        except urllib.error.HTTPError as e:
            print(f"   HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}\n")
            continue
        except Exception as e:  # noqa: BLE001 — surfaced, never swallowed
            print(f"   FAILED: {type(e).__name__}: {e}\n")
            continue

        s = score(c, resp)
        srcs = scorers.source_files(resp)
        print(f"   sources: {srcs}")
        print(f"   {summarise(c, resp, s)}   ({ms}ms)")
        print(f"   A: {(resp.get('response') or '')[:240]}…\n")

        rec = {"case_id": c["id"], "question": c["question"], "params": c["params"],
               "response": resp, "scores": s, "latency_ms": ms}
        results.append(rec)
        (RAW_DIR / f"{stamp}.{c['id']}.json").write_text(
            json.dumps(rec, indent=2, ensure_ascii=False), encoding="utf-8")

    out = RAW_DIR / f"{stamp}.all.json"
    out.write_text(json.dumps(
        {"run_id": stamp, "base": args.base, "results": results},
        indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"raw output → {out}")
    print("\nNothing scored pass/fail yet, and nothing committed. Read the answers,\n"
          "hand-label them, and the judge gets written against what is actually there.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
