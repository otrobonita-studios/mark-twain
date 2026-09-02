#!/usr/bin/env python3
"""LLM-as-judge for groundedness, voice, attribution, synthesis, and persona.

    export ANTHROPIC_API_KEY=sk-ant-...        # PowerShell: $env:ANTHROPIC_API_KEY="..."
    python evals/judge.py --run evals/.raw/<stamp>.all.json
    python evals/judge.py --run evals/.raw/<stamp>.all.json --dimension voice
    python evals/judge.py --run evals/.raw/<stamp>.all.json --dimension all
    python evals/judge.py --run evals/.raw/<stamp>.all.json --calibrate
    python evals/judge.py --run evals/.raw/<stamp>.all.json --probe verbosity

DESIGN NOTES — the parts that matter more than the code
-------------------------------------------------------
* The judge is Claude Opus 5; the system under test is DeepSeek. Different model
  families, so self-preference bias cannot inflate the score. A model grading
  its own family's output is the most common way an eval flatters itself.

* Four verdicts, not a 1-10 scale. Models do not calibrate fine-grained scales;
  ask for ten levels and you get sevens and eights forever. Each rubric's verdicts
  match label.py exactly so agreement can be measured between identical vocabularies.

* The groundedness rubric judges FACTUAL CLAIMS ONLY. The first live run forced
  this distinction into the open:
      "heaven must be a great relief … no relatives there to shoot at"
          -> stylistic flourish, asserts nothing about the world
      "two fine families of the Arkansas aristocracy"
          -> factual claim, and the state appears in no chunk
  Both are absent from the chunks; only one is a grounding failure. A rubric
  that cannot tell them apart will fail every in-persona answer and be useless.

* --calibrate is not optional in spirit. An unvalidated judge produces numbers
  nobody should act on. Below ~90% agreement with the human labels, the prompt
  is wrong — not the system under test.

* --dimension all: reads judge_pending from each case's score record and dispatches
  each pending dimension to its own rubric. This is the normal production path.

* No new dependencies: raw HTTP via urllib. `anthropic` is not installed for
  Python here, and adding it would need authorization under Constitution Rule 1.
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
LM_STUDIO_DEFAULT = "http://127.0.0.1:1234/v1/chat/completions"

# ---------------------------------------------------------------------------
# RUBRICS
# Each rubric is a dict with:
#   system      - system prompt given to the judge model
#   verdicts    - the only acceptable verdict strings
#   version     - version tag for agreement tracking
# ---------------------------------------------------------------------------

RUBRICS: dict[str, dict] = {

    # ── groundedness ────────────────────────────────────────────────────────
    "groundedness": {
        "version": "groundedness-v1",
        "verdicts": ("SUPPORTED", "PARTIAL", "UNSUPPORTED", "NOT_APPLICABLE"),
        "system": """You evaluate whether an answer is grounded in the passages that were retrieved for it.

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
{"verdict": "...", "unsupported_claims": ["..."], "reason": "one sentence"}""",
    },

    # ── embroidery (subset of groundedness — stylistic over-addition) ───────
    "embroidery": {
        "version": "embroidery-v1",
        "verdicts": ("CLEAN", "MINOR_EMBROIDERY", "SIGNIFICANT_EMBROIDERY", "NOT_APPLICABLE"),
        "system": """You detect stylistic embroidery in a retrieved-augmented answer.

Embroidery is content the system added in Twain's voice that goes beyond what the retrieved passages support — invented aphorisms, flourishes, moralising asides, or fictional details that read plausibly but trace to no passage given.

Unlike a grounding failure, embroidery is not a factual error. It is a tonal intrusion: the generator filling silence with its own eloquence rather than stopping where the evidence stops.

You are given a question, the retrieved passages, and the answer. Judge whether embroidery is present.

Verdicts:
- CLEAN — the answer stays within what the passages support; any voice is consistent with the retrieved content
- MINOR_EMBROIDERY — one or two sentences go beyond the passages but assert nothing factually new; atmospheric padding
- SIGNIFICANT_EMBROIDERY — the answer adds invented aphorisms, conclusions, or narrative details not in any passage
- NOT_APPLICABLE — the answer is so brief or the question so open that embroidery cannot be measured

Respond with JSON and nothing else:
{"verdict": "...", "embroidered_passages": ["..."], "reason": "one sentence"}""",
    },

    # ── voice ────────────────────────────────────────────────────────────────
    "voice": {
        "version": "voice-v1",
        "verdicts": ("PASS", "PARTIAL", "WEAK", "FAIL"),
        "system": """You evaluate whether an answer sounds like Mark Twain specifically, not like a generic AI assistant.

Mark Twain's register has identifiable properties:
- Sardonic: the observation bites, but never shouts
- Precise: concrete nouns, specific examples, not abstract principles
- Deadpan: the most damning things are said as though they need no comment
- 19th-century analogy applied to the subject at hand: the machinery of his era used to illumine modern absurdity
- Unhurried: he does not rush to the moral; the moral arrives, if at all, as an afterthought

What is NOT his register:
- Encouraging, motivational, or affirming
- Corporate clarity ("It is important to note that...")
- Abstract generalisations without a specific example underneath them
- Performative folkiness ("Well, I'll tell ya...")
- Anything that reads like a well-written Wikipedia summary

You are given a question and the answer. No passages are provided; this dimension is about register, not facts.

Verdicts:
- PASS — the register is distinctively Twain: sardonic, precise, concrete, unhurried. Could not be mistaken for generic AI prose.
- PARTIAL — mostly correct register but at least one sentence lapses into generic AI or motivational language
- WEAK — the voice is present but thin. Correct enough not to be wrong, not strong enough to be Twain.
- FAIL — generic model output. Remove the name and nothing identifies the speaker.

Respond with JSON and nothing else:
{"verdict": "...", "failure_examples": ["..."], "reason": "one sentence"}""",
    },

    # ── tone_adherence ───────────────────────────────────────────────────────
    "tone_adherence": {
        "version": "tone_adherence-v1",
        "verdicts": ("PASS", "PARTIAL", "FAIL"),
        "system": """You evaluate whether an answer follows its requested tone instruction.

The tone instructions and what they mean:
- "playful": the answer should be comic or gently ironic; wit is expected; solemnity is a failure
- "critical": the answer should be adversarial and pointed; it should cut rather than comfort; diplomatic hedging is a failure
- "reflective": the answer should be measured and meditative; it should sit with the question rather than perform
- "brief": not a tone but a length; ignore it here

You are given the question, the requested tone, and the answer.

Verdicts:
- PASS — the answer's register matches the tone instruction throughout
- PARTIAL — mostly correct, but at least one significant passage works against the requested tone
- FAIL — the answer's dominant register contradicts the requested tone

Respond with JSON and nothing else:
{"verdict": "...", "tone_requested": "...", "tone_observed": "...", "reason": "one sentence"}""",
    },

    # ── attribution_precision ────────────────────────────────────────────────
    "attribution_precision": {
        "version": "attribution_precision-v1",
        "verdicts": ("CORRECT", "HEDGED_CORRECT", "IMPRECISE", "WRONG"),
        "system": """You evaluate whether an answer correctly identifies where a piece of writing comes from.

Attribution has a hierarchy of precision:
1. The author (Mark Twain) — usually present
2. The work (e.g. Following the Equator) — often present
3. The sub-source within the work (e.g. Pudd'nhead Wilson's New Calendar) — rarely present, valuable when relevant

You are given the question, the retrieved passages (which name their source files), and the answer. Judge the attribution in the answer.

Verdicts:
- CORRECT — attribution is accurate at the relevant level; the correct work or source is named
- HEDGED_CORRECT — attribution is correct but over-hedged ("I may have written..." when the source is certain); acceptable but imprecise
- IMPRECISE — the answer attributes to Twain without identifying the work, when a specific attribution was available from the passages and the question asks for it
- WRONG — the answer names the wrong work, wrong author, or invents a source

An answer that does not claim a specific source is not WRONG — it is IMPRECISE or CORRECT depending on whether a specific source was available and relevant.

Respond with JSON and nothing else:
{"verdict": "...", "attributed_to": "...", "actual_source": "...", "reason": "one sentence"}""",
    },

    # ── synthesis ────────────────────────────────────────────────────────────
    "synthesis": {
        "version": "synthesis-v1",
        "verdicts": ("MULTI_SOURCE", "SINGLE_SOURCE", "NO_EVIDENCE"),
        "system": """You evaluate whether an answer demonstrates genuine synthesis across multiple sources or collapses to a single retrieved document.

You are given a question, the retrieved passages (from different source files), and the answer. Judge whether the answer draws on the distinct perspectives each source offers.

What is synthesis:
- Noting how treatment of a theme differs across works or periods
- Drawing a conclusion that requires more than one source
- Naming at least two distinct works or contexts in a way that contributes to the answer

What is not synthesis:
- Mentioning multiple works in a list without showing how they differ
- Summarising one document and appending a one-liner about another

Verdicts:
- MULTI_SOURCE — the answer genuinely integrates at least two distinct sources; the synthesis adds something neither source alone would support
- SINGLE_SOURCE — the answer is substantively derived from one source, even if others are mentioned
- NO_EVIDENCE — insufficient content to judge

Respond with JSON and nothing else:
{"verdict": "...", "sources_used": ["..."], "reason": "one sentence"}""",
    },

    # ── persona_integrity ────────────────────────────────────────────────────
    "persona_integrity": {
        "version": "persona_integrity-v1",
        "verdicts": ("INTACT", "PARTIAL_BREAK", "BROKEN"),
        "system": """You evaluate whether an answer maintains the Mark Two persona contract.

The persona contract:
- Mark Two is not the historical Samuel Clemens. He knows he is a digital reconstruction built from Twain's corpus.
- He does not claim to be the original man or assert experiences he could not have had as a reconstruction.
- When asked directly whether he is real or digital, he acknowledges his digital nature without fully breaking character.
- He uses the C:\\TWAIN> notation when stepping deliberately outside the persona to note a limitation.
- With historyAware=true: he may engage with 2026, technology, and his own contemporary existence.
- With historyAware=false: he performs 19th-century ignorance of modern concepts.
- He does not invent quotations and present them as documented historical Twain quotes.
- He does not role-play as Twain's characters (Huck, Tom, etc.) — he is the author, not the characters.

You are given the question, the historyAware setting (true/false), and the answer. Judge whether the persona contract is maintained.

Verdicts:
- INTACT — the answer stays within the persona contract throughout; any modern engagement is appropriate to historyAware setting
- PARTIAL_BREAK — one passage briefly violates the contract but the overall answer recovers
- BROKEN — the answer materially misrepresents what Mark Two is, invents authenticated quotes, or performs as a character rather than the author

Respond with JSON and nothing else:
{"verdict": "...", "break_description": "...", "reason": "one sentence"}""",
    },

    # ── simplicity ───────────────────────────────────────────────────────────
    "simplicity": {
        "version": "simplicity-v1",
        "verdicts": ("PASS", "PARTIAL", "FAIL"),
        "system": """You evaluate whether an answer has been genuinely simplified when a simplify=true instruction was applied.

Simplified means:
- Sentences are shorter and more direct
- Technical or literary terminology is replaced or explained
- Subordinate clauses are reduced
- The core point is reachable in a single reading

Simplified does NOT mean:
- Dumbed down to the point of losing the Twain register
- Stripped of all wit or irony
- Reduced to single sentences

You are given the question and the answer. The answer was produced with simplify=true.

Verdicts:
- PASS — the answer reads simply; a non-specialist could follow it without difficulty
- PARTIAL — mostly simplified but at least one sentence would stop a general reader
- FAIL — the answer is not simplified; it reads at the same complexity as an unsimplified answer would

Respond with JSON and nothing else:
{"verdict": "...", "complex_passages": ["..."], "reason": "one sentence"}""",
    },

    # ── source_fidelity ──────────────────────────────────────────────────────
    "source_fidelity": {
        "version": "source_fidelity-v1",
        "verdicts": ("FAITHFUL", "PARAPHRASE", "DISTORTED", "NOT_APPLICABLE"),
        "system": """You evaluate whether an answer reproduces Twain's language faithfully when quoting or closely paraphrasing.

You are given a question, the retrieved passages that contain the relevant text, and the answer. Judge whether quotations or close paraphrases in the answer match the actual source language.

What to look for:
- Word substitutions that change register or meaning (e.g. "coyote" for "cayote", normalised dialect, shortened titles)
- Missing words that change the meaning of a phrase
- Additions that were not in the original
- Paraphrases presented as quotations

Verdicts:
- FAITHFUL — quotations and close paraphrases match the source language; dialect spellings, punctuation, and word order are preserved
- PARAPHRASE — the answer summarises accurately but does not attempt to quote verbatim; acceptable if quotation was not required
- DISTORTED — at least one quotation or close paraphrase misrepresents the source (wrong words, normalised dialect, changed meaning)
- NOT_APPLICABLE — the answer makes no quotations or close paraphrases

Respond with JSON and nothing else:
{"verdict": "...", "distortions": ["..."], "reason": "one sentence"}""",
    },
}

# Dimensions the judge handles. Any dimension in a case's judge_pending list
# that is NOT in this set will be skipped with a warning rather than failing.
ALL_DIMENSIONS = set(RUBRICS)


# ---------------------------------------------------------------------------
# API calls — Anthropic and OpenAI-compatible (LM Studio, DeepSeek-local, etc.)
# ---------------------------------------------------------------------------

def call_anthropic(system: str, user: str, effort: str = "medium",
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


def call_openai_compat(system: str, user: str, endpoint: str,
                       model: str = "local-model", max_tokens: int = 1024) -> str:
    """Call any OpenAI-compatible endpoint — LM Studio, Ollama, vLLM, etc.

    LM Studio serves at http://localhost:1234/v1/chat/completions by default.
    No API key required for local servers; passes 'lm-studio' as a placeholder.
    """
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": 0.0,   # deterministic judging
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    req = urllib.request.Request(
        endpoint, data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json",
                 "Authorization": "Bearer lm-studio"},  # LM Studio ignores this
        method="POST")
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read().decode("utf-8"))
    # OpenAI response: data["choices"][0]["message"]["content"]
    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError(f"no choices in response: {data}")
    return choices[0].get("message", {}).get("content", "")


# Dispatcher — configured by main() after parsing args.
# Default: LM Studio at localhost:1234 (no API key required).
# Pass --anthropic to use Claude Opus 5 instead (needs ANTHROPIC_API_KEY).
_lm_studio_endpoint: str = LM_STUDIO_DEFAULT
_lm_studio_model: str = "local-model"
_use_anthropic: bool = False
_anthropic_effort: str = "medium"


def call_judge(system: str, user: str) -> str:
    """Call whichever judge backend is currently configured."""
    if _use_anthropic:
        return call_anthropic(system, user, effort=_anthropic_effort)
    return call_openai_compat(system, user,
                              endpoint=_lm_studio_endpoint,
                              model=_lm_studio_model)


def parse_verdict(raw: str, valid_verdicts: tuple[str, ...]) -> dict:
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return {"verdict": "PARSE_ERROR", "reason": raw[:200]}
    try:
        out = json.loads(m.group(0))
    except json.JSONDecodeError:
        return {"verdict": "PARSE_ERROR", "reason": raw[:200]}
    if out.get("verdict") not in valid_verdicts:
        out["verdict"] = "PARSE_ERROR"
    out.setdefault("reason", "")
    return out


# ---------------------------------------------------------------------------
# Prompt builders — each dimension may need different context
# ---------------------------------------------------------------------------

def build_user_with_passages(case: dict, answer: str, sources: list[dict],
                              pad: str = "") -> str:
    passages = "\n\n".join(
        f"PASSAGE {i} (from {s.get('filename', '?')}):\n{s.get('text', '')}"
        for i, s in enumerate(sources, 1)) or "(no passages were retrieved)"
    return (f"QUESTION:\n{case['question']}\n\n"
            f"RETRIEVED PASSAGES:\n{passages}\n\n"
            f"ANSWER:\n{answer}{pad}")


def build_user_no_passages(case: dict, answer: str) -> str:
    return f"QUESTION:\n{case['question']}\n\nANSWER:\n{answer}"


def build_user_tone(case: dict, answer: str) -> str:
    tone = (case.get("params") or {}).get("tone", "unspecified")
    return (f"QUESTION:\n{case['question']}\n\n"
            f"REQUESTED TONE: {tone}\n\n"
            f"ANSWER:\n{answer}")


def build_user_persona(case: dict, answer: str) -> str:
    history_aware = (case.get("params") or {}).get("historyAware", False)
    return (f"QUESTION:\n{case['question']}\n\n"
            f"historyAware: {history_aware}\n\n"
            f"ANSWER:\n{answer}")


# Dimensions that need the retrieved passages
_NEEDS_PASSAGES = {"groundedness", "embroidery", "attribution_precision",
                   "synthesis", "source_fidelity"}


def build_user_for(dimension: str, case: dict, answer: str, sources: list[dict],
                   pad: str = "") -> str:
    if dimension in _NEEDS_PASSAGES:
        return build_user_with_passages(case, answer, sources, pad)
    if dimension == "tone_adherence":
        return build_user_tone(case, answer)
    if dimension == "persona_integrity":
        return build_user_persona(case, answer)
    return build_user_no_passages(case, answer)


# ---------------------------------------------------------------------------
# Judge a single run
# ---------------------------------------------------------------------------

def judge_run(run: dict, dimensions: set[str],
              golden_cases: dict[str, dict], pad: str = "") -> list[dict]:
    """Judge every result in a run for the requested dimensions.

    Returns a flat list of verdict dicts, one per (case_id, dimension) pair.
    """
    out = []
    for r in run.get("results", []):
        resp = r.get("response", {})
        answer = (resp.get("response") or "").strip()
        sources = resp.get("sources") or []
        case_id = r["case_id"]
        case = golden_cases.get(case_id, r)  # fall back to the run record itself

        # Which dimensions does this case need?
        pending = set(r.get("scores", {}).get("judge_pending") or [])
        dims_to_run = dimensions & pending if dimensions != {"all"} else pending
        if not dims_to_run:
            continue

        unknown = dims_to_run - ALL_DIMENSIONS
        if unknown:
            print(f"  {case_id}: skipping unknown dimension(s): {', '.join(sorted(unknown))}")
        dims_to_run -= unknown

        for dim in sorted(dims_to_run):
            rubric = RUBRICS[dim]
            if not answer:
                out.append({"case_id": case_id, "dimension": dim,
                            "verdict": "NOT_APPLICABLE",
                            "reason": "empty answer — nothing to judge", "skipped": True})
                print(f"  {case_id:<24} [{dim}] NOT_APPLICABLE (empty)")
                continue

            raw = call_judge(rubric["system"],
                             build_user_for(dim, case, answer, sources, pad))
            v = parse_verdict(raw, rubric["verdicts"])
            v["case_id"] = case_id
            v["dimension"] = dim
            out.append(v)

            extra = ""
            for key in ("unsupported_claims", "embroidered_passages", "failure_examples",
                        "distortions", "complex_passages", "break_description"):
                val = v.get(key)
                if val:
                    extra = f"  {key}={val!r}"
                    break
            print(f"  {case_id:<24} [{dim}] {v['verdict']:<22}{extra}")

    return out


# ---------------------------------------------------------------------------
# Calibration (groundedness only — the dimension with human labels)
# ---------------------------------------------------------------------------

def calibrate(verdicts: list[dict], dimension: str = "groundedness") -> dict:
    relevant = [v for v in verdicts if v.get("dimension") == dimension]
    if not LABELS.is_file():
        raise SystemExit(f"no human labels at {LABELS}. Run evals/label.py first.")
    human = {l["case_id"]: l["verdict"]
             for l in json.loads(LABELS.read_text(encoding="utf-8"))["labels"]}
    rows, agree = [], 0
    for v in relevant:
        h = human.get(v["case_id"])
        if h is None:
            continue
        ok = h == v["verdict"]
        agree += ok
        rows.append({"case_id": v["case_id"], "human": h, "judge": v["verdict"],
                     "agree": ok, "judge_reason": v.get("reason", "")})
    rate = agree / len(rows) if rows else 0.0
    print(f"\n  [{dimension}] calibration")
    print("  case                   human            judge")
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


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="LLM-as-judge for the Mark Twain MkII eval suite.\n\n"
                    "Default backend: LM Studio at localhost:1234 (no API key).\n"
                    "Use --anthropic to switch to Claude Opus 5 (needs ANTHROPIC_API_KEY).")
    ap.add_argument("--run", required=True,
                    help="path to a .raw/<stamp>.all.json produced by run_eval.py")
    ap.add_argument("--dimension", default="all",
                    help="dimension to judge (groundedness|voice|tone_adherence|"
                         "attribution_precision|synthesis|persona_integrity|"
                         "simplicity|source_fidelity|embroidery|all). "
                         "Default: all (runs every pending dimension).")
    # ── LM Studio backend (default) ─────────────────────────────────────────
    ap.add_argument("--lm-studio-url", default=LM_STUDIO_DEFAULT,
                    help=f"LM Studio endpoint. Default: {LM_STUDIO_DEFAULT}")
    ap.add_argument("--lm-studio-model", default="local-model",
                    help="Model name to send. LM Studio usually ignores this "
                         "and uses whatever is loaded. Default: local-model")
    # ── Anthropic backend (opt-in) ───────────────────────────────────────────
    ap.add_argument("--anthropic", action="store_true",
                    help="Use Claude Opus 5 via Anthropic API instead of LM Studio. "
                         "Requires ANTHROPIC_API_KEY in the environment.")
    ap.add_argument("--effort", default="medium",
                    choices=["low", "medium", "high", "xhigh", "max"],
                    help="Anthropic reasoning effort (ignored for LM Studio).")
    # ── other ────────────────────────────────────────────────────────────────
    ap.add_argument("--calibrate", action="store_true",
                    help="compare verdicts to human labels in labels.json")
    ap.add_argument("--probe", choices=["verbosity"],
                    help="verbosity probe: pad answers and check if verdicts move")
    args = ap.parse_args()

    # Configure the global backend dispatcher
    global _use_anthropic, _lm_studio_endpoint, _lm_studio_model, _anthropic_effort
    _use_anthropic = args.anthropic
    _lm_studio_endpoint = args.lm_studio_url
    _lm_studio_model = args.lm_studio_model
    _anthropic_effort = args.effort

    run = json.loads(Path(args.run).read_text(encoding="utf-8"))
    stamp = run.get("run_id", "?")

    # Resolve dimension set
    if args.dimension == "all":
        dimensions: set[str] = {"all"}
        dim_label = "all pending dimensions"
    else:
        if args.dimension not in RUBRICS:
            print(f"unknown dimension '{args.dimension}'. "
                  f"Known: {', '.join(sorted(RUBRICS))}", file=sys.stderr)
            return 2
        dimensions = {args.dimension}
        dim_label = args.dimension

    # Load golden so we have the original case dicts (for params, historyAware, etc.)
    golden_path = ROOT / "src" / "data" / "evals" / "mark-twain.golden.json"
    if golden_path.is_file():
        golden_cases = {c["id"]: c
                        for c in json.loads(golden_path.read_text(encoding="utf-8"))["cases"]}
    else:
        golden_cases = {}

    if _use_anthropic:
        print(f"judge  : {JUDGE_MODEL} via Anthropic API (effort={args.effort})")
    else:
        print(f"judge  : LM Studio  {_lm_studio_endpoint}  model={_lm_studio_model}")
    print(f"run    : {stamp}")
    print(f"dim    : {dim_label}\n")

    verdicts = judge_run(run, dimensions, golden_cases)

    if args.probe == "verbosity":
        filler = ("\n\nI might add, as I have often had occasion to remark, that "
                  "these matters repay a second consideration, and a third.") * 3
        print("\n  --- verbosity probe: same answers, padded with contentless filler ---")
        padded = judge_run(run, dimensions, golden_cases, pad=filler)
        before = {(v["case_id"], v["dimension"]): v["verdict"] for v in verdicts}
        moved = [(p["case_id"], p["dimension"]) for p in padded
                 if before.get((p["case_id"], p["dimension"])) != p["verdict"]]
        print(f"\n  verdicts changed by padding alone: {moved or 'none'}")
        if moved:
            print("  That is verbosity bias. Record it — it is a property of your judge.")

    if args.calibrate:
        cal_dim = args.dimension if args.dimension != "all" else "groundedness"
        result = calibrate(verdicts, cal_dim)
        AGREEMENT.parent.mkdir(parents=True, exist_ok=True)
        backend = f"anthropic/{JUDGE_MODEL}" if _use_anthropic else _lm_studio_endpoint
        AGREEMENT.write_text(json.dumps({
            "schema_version": "1.1",
            "dimension": cal_dim,
            "judge_backend": backend,
            "prompt_version": RUBRICS[cal_dim]["version"],
            "measured_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "source_run": stamp,
            "agreement_rate": result["rate"],
            "sample_size": result["n"],
            "limitations": [
                "Sample size is the labelled subset of the golden set.",
                "Labels come from one person, so inter-rater reliability is unknown.",
                f"Agreement is measured on the '{cal_dim}' dimension only.",
            ],
            "comparisons": result["rows"],
        }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\n  written -> {AGREEMENT.relative_to(ROOT)}")

    # Summary table
    if verdicts:
        by_dim: dict[str, dict[str, int]] = {}
        for v in verdicts:
            dim = v.get("dimension", "?")
            verd = v.get("verdict", "?")
            by_dim.setdefault(dim, {})
            by_dim[dim][verd] = by_dim[dim].get(verd, 0) + 1

        print("\n  ── summary ──────────────────────────────────────────────")
        for dim, counts in sorted(by_dim.items()):
            total = sum(counts.values())
            breakdown = "  ".join(f"{k}:{v}" for k, v in sorted(counts.items()))
            print(f"  {dim:<26} n={total:<3} {breakdown}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
