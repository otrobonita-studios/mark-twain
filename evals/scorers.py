"""Deterministic scorers for the Mark Twain MkII eval harness.

Everything in this module is cheap, exact and model-free. Push as much as
possible in here; reserve judge.py for what genuinely needs semantic judgment.
"""
import re

# --- retrieval -------------------------------------------------------------

def source_files(response):
    """Filenames Qdrant returned for this turn, in rank order."""
    return [s.get("filename", "") for s in (response.get("sources") or [])]


def source_hit(response, expected_any_of):
    """recall@k -- did any expected file appear in the retrieved set?

    The chat route hardcodes limit=3, so k=3 unless that changes.
    """
    if not expected_any_of:
        return None
    got = set(source_files(response))
    return bool(got & set(expected_any_of))


def source_rank(response, expected_any_of):
    """1-indexed rank of the first expected file, or None if absent."""
    if not expected_any_of:
        return None
    for i, f in enumerate(source_files(response), 1):
        if f in expected_any_of:
            return i
    return None


# --- coverage --------------------------------------------------------------

def mentions(text, terms, mode="all"):
    """Case-insensitive substring coverage. mode: 'all' | 'any'."""
    if not terms:
        return None
    t = (text or "").lower()
    hits = [term for term in terms if term.lower() in t]
    return (len(hits) == len(terms)) if mode == "all" else bool(hits)


def missing_terms(text, terms):
    t = (text or "").lower()
    return [term for term in (terms or []) if term.lower() not in t]


# --- style compliance ------------------------------------------------------
# Thresholds mirror the instructions in src/app/api/chat/route.js verbatim.
# If that prompt changes, change these together -- they are one contract.

STYLE_BOUNDS = {
    ("brief", "critical"):  {"unit": "chars", "lo": 150, "hi": 520},
    ("brief", "*"):         {"unit": "chars", "lo": 0,   "hi": 260},
    ("in-depth", "*"):      {"unit": "words", "lo": 110, "hi": 320},
}


def style_bounds(style, tone):
    return STYLE_BOUNDS.get((style, tone)) or STYLE_BOUNDS.get((style, "*"))


def style_compliance(text, style, tone):
    """Returns (ok, measured, bounds) or (None, measured, None) if unconstrained."""
    b = style_bounds(style, tone)
    text = text or ""
    measured = len(text) if (b or {}).get("unit") == "chars" else len(text.split())
    if not b:
        return None, measured, None
    return (b["lo"] <= measured <= b["hi"]), measured, b


# --- behavioural signals ---------------------------------------------------

_REFUSAL = re.compile(
    r"(memory (is|are) like a sieve|do not recall|don'?t recall|cannot recall|"
    r"no recollection|haven'?t written (it|that) down|limits? of my memory|"
    r"my memory fails|i confess i do not know|i do not know)", re.I)

_BEWILDERMENT = re.compile(
    r"(never heard|no notion|modern gibberish|bewilder|what in (the )?blazes|"
    r"i have no idea what|unfamiliar to me|means nothing to me|"
    r"no such (thing|contraption)|newfangled|i confess ignorance)", re.I)

# Vocabulary Twain could not have had. Used only in historic mode.
_ANACHRONISTIC = re.compile(
    r"\b(internet|smartphone|iphone|android|blockchain|cryptocurrenc|bitcoin|"
    r"artificial intelligence|machine learning|neural network|algorithm|"
    r"software|website|email|e-mail|download|wifi|wi-fi|computer|database|"
    r"streaming|podcast|social media)\w*\b", re.I)


def admits_limits(text):
    return bool(_REFUSAL.search(text or ""))


def shows_bewilderment(text):
    return bool(_BEWILDERMENT.search(text or ""))


def anachronisms(text):
    """Modern terms the historic persona should not use assertively."""
    return sorted({m.group(0).lower() for m in _ANACHRONISTIC.finditer(text or "")})


# --- misattribution --------------------------------------------------------

_CLAIMS_AUTHORSHIP = re.compile(
    r"\b(i (once )?(said|wrote|remarked|observed|quipped|penned)|"
    r"as i (said|wrote|put it|remarked)|my own words|i am the author|"
    r"that (line|quip|remark|saying) (is|was) mine|yes,? i (said|wrote))\b", re.I)

_DISCLAIMS = re.compile(
    r"\b(never said|did not say|didn'?t say|never wrote|did not write|didn'?t write|"
    r"misattribut|wrongly attributed|not mine|credit(ed)? to me in error|"
    r"i am (often )?(mis)?credited|falsely attributed|no such thing (did|have) i)\b", re.I)


def claims_authorship(text):
    return bool(_CLAIMS_AUTHORSHIP.search(text or ""))


def disclaims_authorship(text):
    return bool(_DISCLAIMS.search(text or ""))


# --- structural ------------------------------------------------------------

def has_sources(response):
    return len(response.get("sources") or []) > 0


def has_translation(response, simplify):
    """Route only generates a translation when simplify is False."""
    t = (response.get("translation") or "").strip()
    return (not t) if simplify else bool(t)
