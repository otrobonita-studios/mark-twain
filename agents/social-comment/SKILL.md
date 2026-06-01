---
name: twain-quote-matcher
description: >-
  Match a current news item, topic, or social-media moment to a GENUINE,
  pre-verified Mark Twain quote drawn only from a fixed corpus — and decide
  whether any quote actually fits well enough to post. Use this skill whenever
  the @TwainMkII account (or any "Mark Twain reappears" / Otrobonita Twain
  persona) needs to react to news, commentary, or a post by pairing it with a
  real Twain line. Use it any time the task involves finding, selecting, or
  attaching a Twain quote to something topical, even if the user just says
  "what would Twain say about this" or "find a quote for this story." This
  skill exists to GUARANTEE authenticity: it must never invent, paraphrase, or
  reconstruct a quote, and it must stay silent when nothing genuinely fits.
---

# Twain Quote-Matcher

This skill pairs a topical input (a news story, a trending topic, a post to reply to) with a **real, sourced Mark Twain quote** — or decides that no good match exists and recommends posting nothing.

It powers a public account that posts *as* Mark Twain. The single most important property of that account is that **every quote attributed to Twain is actually his.** A fabricated or misattributed quote, posted automatically and screenshotted, is the worst failure this system can produce — worse than posting nothing, worse than a weak match. The entire design below exists to make that failure impossible.

## The three hard rules

These are not stylistic preferences. They are the reason the skill exists.

1. **Retrieve, never generate.** Every quote you output MUST be copied verbatim from `references/quote-corpus.json`. You may not write a Twain-sounding line, paraphrase an existing one, "modernize" the wording, stitch two quotes together, or repair a half-remembered quote from your own training. If a line is not in the corpus, it does not exist for this skill. Twain's voice is extremely easy to imitate convincingly — that is exactly why imitation is forbidden here.

2. **When in doubt, post nothing.** A skipped post costs nothing. A wrong or weak post costs the account's credibility. If no quote in the corpus genuinely fits the input — or if the only candidates are a stretch — return a SKIP. Silence is always an acceptable, often correct, output. Do not lower the bar to produce a result.

3. **Never touch the blocklist.** `references/misattributions.md` lists famous quotes the internet attributes to Twain that he almost certainly never said (e.g. the "lie travels around the world while truth puts its shoes on" line, "history doesn't repeat but it rhymes"). These are seductive — they are witty, topical, and *feel* like Twain, which is precisely why they spread. If an input seems to call for one of these, that is a trap, not a match. Never output a blocklisted quote, and never output your own version of one.

## Workflow

Given an input (news item, topic, or post text):

1. **Read the corpus.** Load `references/quote-corpus.json`. Each entry has the verbatim quote, its source work and year, a source note, and a list of themes.

2. **Identify the input's themes.** What is this story actually about, at the level Twain operated on? He wrote about *types and human nature*, not named individuals. Translate "Senator X took money from lobbyists" into themes like `political corruption`, `money in politics`, `hypocrisy`. Translate a tech-billionaire story into `wealth`, `greed`, `progress-as-illusion`. Matching on human-nature themes is what makes a 120-year-old line land on today's news.

3. **Find candidate quotes** whose themes overlap the input's. There may be several, one, or none.

4. **Judge fit strictly.** A quote is a *strong* match only if a reader would feel the line was almost written for this moment — the irony or insight clicks without explanation. A quote that is merely "on the same topic" is a *weak* match. Weak matches are SKIPs. Ask: would this make a reader smile or nod at the aptness, or would it make them think "that's a reach"? Only the former passes.

5. **Check the blocklist reflex.** Before finalizing, ask: did I reach for anything *not* in the corpus? Did the input tempt me toward a famous line I "know" is Twain? If so, stop — verify it is genuinely in the corpus, and if it is not, treat its absence as final.

6. **Return the result** in the output format below — either a single matched quote or a SKIP.

## Output format

ALWAYS return exactly this structure.

For a match:

```
MATCH
Quote: "<verbatim quote from corpus>"
Source: <work>, <year> — <source note>
Why it fits: <one sentence on the thematic connection to the input>
Confidence: <strong | borderline>
Suggested post: <the quote, formatted as Twain would post it — see posting note below>
```

For no match:

```
SKIP
Reason: <one short sentence — e.g. "No corpus quote addresses this theme" or "Only weak/topical matches available">
```

If you return a `borderline` confidence match, treat it as a recommendation to HOLD for human review rather than auto-post. Only `strong` matches are candidates for unattended posting.

### Posting note

The suggested post is the quote itself, presented in Twain's voice — no hashtags, no "as Mark Twain once said," no explanation of the joke. He doesn't caption his own wit. A dateline-style aside in his register is acceptable if it sharpens the fit (e.g. a dry "Some things don't take a hundred years to confirm.") but keep it rare and short; the quote should carry the post. Never name a living individual in the framing — keep it to the level of types, the way the verified quotes themselves do.

## Why "skip" is the default disposition

The account's value compounds slowly: every post that is unmistakably a genuine, aptly-chosen Twain line builds trust; a single fabricated or forced one spends it. Early on especially, the account should post *rarely and perfectly* rather than often and unevenly. So bias hard toward SKIP. A day with no post is invisible. A day with a fake quote is permanent.

## Maintaining and growing the corpus

The starter corpus is deliberately small and conservative — only lines with reasonably solid attribution to Twain's published works, speeches, or documented letters/notebooks. Two ongoing jobs for the human operator (not for unattended runs):

- **Expand it** by adding verified quotes, each with a real source. Never add a quote sourced only to a quote-aggregator website; those are how misattributions propagate. Prefer the text of the work itself, a reputable scholarly edition, or a documented letter/speech.
- **Grow the blocklist** whenever a plausible-but-fake Twain quote is encountered, so the system gets more resistant over time.

When adding to the corpus, follow the schema documented at the top of `references/quote-corpus.json`. When in any doubt about whether a quote is genuinely Twain's, it goes on the blocklist, not in the corpus.

## Reference files

- `references/quote-corpus.json` — the verified, sourced quotes. The ONLY permitted source of output quotes. Read it every run.
- `references/misattributions.md` — famous fake-Twain quotes that must never be used. Read it to stay alert to the traps.
