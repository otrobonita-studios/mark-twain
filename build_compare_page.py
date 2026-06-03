#!/usr/bin/env python3
"""
Build a standalone before/after comparison page for a book's illustrations.
Original line drawing  <->  1899 photograph (flip on hover / click to lock).

Scans:
  images/            originals  (pXXX.jpg)
  approved/          chosen photos (mdrnzd-pXXX.jpg)  [preferred]
  modernized/        draft photos  (mdrnzd-pXXX.jpg)  [fallback]

Emits  compare.html  in the book folder (relative paths -> open directly).
Re-run any time; it just rescans.
"""

import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

BOOK_DIR = Path(r"E:\development\mark-twain\public\images\book-illustrations\Following-The-Equator")
IMAGES = BOOK_DIR / "images"
APPROVED = BOOK_DIR / "approved"
MODERNIZED = BOOK_DIR / "modernized"
OUT = BOOK_DIR / "compare.html"
TITLE = "Following the Equator — Illustrations as 1899 Photographs"


def find_original(stem: str) -> str | None:
    """Original drawing for a page stem (e.g. 'p066'). Prefer images/, then images/photostyle/."""
    for rel in (IMAGES / f"{stem}.jpg", IMAGES / "photostyle" / f"{stem}.jpg"):
        if rel.exists():
            return rel.relative_to(BOOK_DIR).as_posix()
    return None


def collect_pairs():
    pairs = []
    seen = set()
    # approved first (preferred), then modernized (draft)
    for folder, status in ((APPROVED, "approved"), (MODERNIZED, "draft")):
        if not folder.exists():
            continue
        for photo in sorted(folder.glob("mdrnzd-*.jpg")):
            stem = photo.stem.replace("mdrnzd-", "")
            if stem in seen:
                continue
            original = find_original(stem)
            if not original:
                continue
            seen.add(stem)
            pairs.append({
                "stem": stem,
                "original": original,
                "photo": photo.relative_to(BOOK_DIR).as_posix(),
                "status": status,
            })
    pairs.sort(key=lambda p: p["stem"])
    return pairs


def build_html(pairs) -> str:
    cards = []
    for p in pairs:
        badge = "APPROVED" if p["status"] == "approved" else "draft"
        cards.append(f"""
      <figure class="card {p['status']}" tabindex="0">
        <div class="frame">
          <img class="photo" src="{p['photo']}" alt="{p['stem']} photograph" loading="lazy">
          <img class="drawing" src="{p['original']}" alt="{p['stem']} original" loading="lazy">
        </div>
        <figcaption><span class="pg">{p['stem']}</span><span class="badge {p['status']}">{badge}</span></figcaption>
      </figure>""")

    approved_n = sum(1 for p in pairs if p["status"] == "approved")
    draft_n = len(pairs) - approved_n

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{TITLE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#15110d; color:rgba(255,244,223,0.95);
         font-family:'Courier Prime',monospace; padding:2.5rem 2rem 4rem; }}
  header {{ text-align:center; margin-bottom:2.5rem; border-bottom:1px solid rgba(217,163,74,0.2); padding-bottom:1.5rem; }}
  h1 {{ font-family:'Playfair Display',serif; color:#d9a34a; font-size:2rem; letter-spacing:0.5px; }}
  .sub {{ color:rgba(255,244,223,0.6); margin-top:0.6rem; font-size:0.9rem; }}
  .hint {{ color:rgba(255,244,223,0.45); margin-top:0.4rem; font-size:0.8rem; font-style:italic; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:1.75rem; max-width:1500px; margin:0 auto; }}
  .card {{ background:#1d1611; border-left:3px solid #d9a34a; padding:0.75rem;
          box-shadow:0 8px 20px rgba(0,0,0,0.4); outline:none; }}
  .card.draft {{ border-left-color:rgba(217,163,74,0.35); }}
  .frame {{ position:relative; width:100%; aspect-ratio:16/9; overflow:hidden; background:#0d0a07; }}
  .frame img {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }}
  .frame .drawing {{ opacity:0; transition:opacity 0.25s ease; }}
  /* hover or focus -> reveal the original drawing */
  .card:hover .drawing, .card:focus .drawing, .card.flip .drawing {{ opacity:1; }}
  figcaption {{ display:flex; justify-content:space-between; align-items:center; margin-top:0.6rem; font-size:0.85rem; }}
  .pg {{ color:rgba(255,244,223,0.7); letter-spacing:1px; }}
  .badge {{ font-size:0.65rem; letter-spacing:1px; padding:0.15rem 0.5rem; border:1px solid; }}
  .badge.approved {{ color:#d9a34a; border-color:#d9a34a; }}
  .badge.draft {{ color:rgba(255,244,223,0.45); border-color:rgba(255,244,223,0.25); }}
</style>
</head>
<body>
  <header>
    <h1>{TITLE}</h1>
    <p class="sub">{len(pairs)} pairs &middot; {approved_n} approved &middot; {draft_n} draft</p>
    <p class="hint">Photograph shown by default. Hover (or tap) a card to reveal the original drawing. Click to lock the flip.</p>
  </header>
  <div class="grid">{''.join(cards)}
  </div>
  <script>
    document.querySelectorAll('.card').forEach(c =>
      c.addEventListener('click', () => c.classList.toggle('flip')));
  </script>
</body>
</html>"""


def main():
    pairs = collect_pairs()
    OUT.write_text(build_html(pairs), encoding="utf-8")
    approved_n = sum(1 for p in pairs if p["status"] == "approved")
    print(f"Wrote {OUT}")
    print(f"  {len(pairs)} pairs ({approved_n} approved, {len(pairs)-approved_n} draft)")


if __name__ == "__main__":
    main()
