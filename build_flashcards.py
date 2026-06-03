#!/usr/bin/env python3
"""
Build a self-contained IMAGE INSPECTOR for a book's illustrations.

For each page, flip through ALL recreated variants in sequence
(mdrnzd-p135.jpg, mdrnzd-p135(1).jpg, ...), then the ORIGINAL image, then
on to the next page. Square card, object-fit:contain (no crop).

Controls: right side = forward, left 30% = back, Space = forward, arrows, S = shuffle.
Carousel chevrons (< >) fade in on hover and fade away.

Emits  flashcards.html  in the book folder. Re-run any time.
"""

import sys, re, json
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

BOOK_DIR = Path(r"E:\development\mark-twain\public\images\book-illustrations\Following-The-Equator")
IMAGES = BOOK_DIR / "images"
APPROVED = BOOK_DIR / "approved"
MODERNIZED = BOOK_DIR / "modernized"
OUT = BOOK_DIR / "flashcards.html"
TITLE = "Following the Equator — Image Inspector"

# strip duplicate/variant markers to get the GROUP key (page id), but keep page letters (p254a)
DUP_RE = re.compile(r"(\s*-\s*kopia|\s*\(\d+\)|\s*-\s*copy|\s*copy)+$", re.IGNORECASE)
NUM_RE = re.compile(r"\((\d+)\)\s*$")


def base_and_num(photo: Path):
    s = photo.stem.replace("mdrnzd-", "")
    m = NUM_RE.search(s)
    num = int(m.group(1)) if m else 0
    base = DUP_RE.sub("", s).strip()
    return base, num


def find_original(stem: str):
    for rel in (IMAGES / f"{stem}.jpg", IMAGES / "photostyle" / f"{stem}.jpg"):
        if rel.exists():
            return rel.relative_to(BOOK_DIR).as_posix()
    return None


def collect_groups():
    # base -> { num -> (rank, mtime, relpath, status) }  (rank: approved=1 > draft=0)
    groups, group_status = {}, {}
    for folder, status, rank in ((APPROVED, "approved", 1), (MODERNIZED, "draft", 0)):
        if not folder.exists():
            continue
        for photo in folder.glob("mdrnzd-*.jpg"):
            base, num = base_and_num(photo)
            variants = groups.setdefault(base, {})
            entry = (rank, photo.stat().st_mtime, photo.relative_to(BOOK_DIR).as_posix(), status)
            if num not in variants or entry > variants[num]:
                variants[num] = entry
            if rank == 1:
                group_status[base] = "approved"

    result = []
    for base, variants in groups.items():
        original = find_original(base)
        if not original:
            continue
        ordered = [variants[n] for n in sorted(variants)]
        result.append({
            "stem": base,
            "status": group_status.get(base, "draft"),
            "recreated": [v[2] for v in ordered],
            "original": original,
        })
    result.sort(key=lambda g: g["stem"])
    return result


def build_slides(groups):
    slides = []
    for gi, g in enumerate(groups):
        n = len(g["recreated"])
        # original first, then recreated variants
        slides.append({"src": g["original"], "kind": "original", "stem": g["stem"],
                       "status": g["status"], "sub": "", "gi": gi})
        for k, src in enumerate(g["recreated"]):
            slides.append({"src": src, "kind": "recreated", "stem": g["stem"],
                           "status": g["status"], "sub": (f"{k+1}/{n}" if n > 1 else ""), "gi": gi})
    return slides


def build_html(groups) -> str:
    slides = build_slides(groups)
    data = json.dumps(slides, ensure_ascii=False)
    G = len(groups)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{TITLE}</title>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ height:100%; }}
  html {{ overflow-y:scroll; }}            /* always reserve scrollbar gutter -> no flip jitter */
  body {{ background:#15110d; color:rgba(255,244,223,0.95); overflow:visible;
         font-family:'Courier Prime',monospace; display:flex; flex-direction:column;
         align-items:center; justify-content:center; min-height:100vh; padding:1rem; gap:1rem; }}
  h1 {{ font-family:'Playfair Display',serif; color:#d9a34a; font-size:1.4rem; letter-spacing:0.5px; text-align:center; }}
  .scene {{ width:min(80vh,94vw); height:min(80vh,94vw); perspective:2000px; position:relative; }}
  .card {{ position:relative; width:100%; height:100%;
          transform-style:preserve-3d; transition:transform 0.6s cubic-bezier(.2,.7,.2,1); }}
  .card.flipped {{ transform:rotateY(180deg); }}
  .face {{ position:absolute; inset:0; backface-visibility:hidden; overflow:hidden;
          background:#0d0a07; box-shadow:0 16px 40px rgba(0,0,0,0.6); }}
  .face img {{ width:100%; height:100%; object-fit:contain; display:block; }}
  .back {{ transform:rotateY(180deg); }}
  .tag {{ position:absolute; bottom:0; left:0; right:0; padding:0.5rem 0.9rem;
         display:flex; justify-content:space-between; align-items:center;
         font-size:0.8rem; letter-spacing:1px; pointer-events:none;
         background:linear-gradient(to top, rgba(13,10,7,0.9), rgba(13,10,7,0)); }}
  .tag .side {{ color:#d9a34a; font-family:'Playfair Display',serif; }}
  .tag .side.draw {{ color:rgba(255,244,223,0.9); }}
  .zones {{ position:absolute; inset:0; display:flex; z-index:5; }}
  .zone-back {{ width:30%; cursor:grab; }}
  .zone-fwd {{ width:70%; cursor:pointer; }}
  /* carousel chevrons */
  .chev {{ position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px;
          opacity:0; transition:opacity 0.35s ease; pointer-events:none; z-index:6; color:#d9a34a;
          filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7)); }}
  .chev.left {{ left:12px; }}
  .chev.right {{ right:12px; }}
  .chev.show {{ opacity:0.9; }}
  .chev svg {{ width:100%; height:100%; fill:none; stroke:currentColor; stroke-width:2.5;
              stroke-linecap:round; stroke-linejoin:round; }}
  .controls {{ display:flex; align-items:center; gap:1rem; }}
  button {{ background:#1d1611; color:rgba(255,244,223,0.9); border:1px solid rgba(217,163,74,0.5);
           font-family:'Courier Prime',monospace; padding:0.5rem 1rem; cursor:pointer; letter-spacing:1px;
           transition:all 0.2s ease; }}
  button:hover {{ border-color:#d9a34a; color:#d9a34a; }}
  .counter {{ color:rgba(255,244,223,0.7); min-width:80px; text-align:center; }}
  .hint {{ color:rgba(255,244,223,0.4); font-size:0.75rem; font-style:italic; text-align:center; }}
  .badge {{ font-size:0.6rem; letter-spacing:1px; padding:0.12rem 0.45rem; border:1px solid; }}
  .badge.approved {{ color:#d9a34a; border-color:#d9a34a; }}
  .badge.draft {{ color:rgba(255,244,223,0.45); border-color:rgba(255,244,223,0.25); }}
</style>
</head>
<body>
  <h1>{TITLE}</h1>
  <div class="scene" id="scene">
    <div class="card" id="card">
      <div class="face front"><img id="imgA" alt="">
        <div class="tag"><span class="side" id="labA"></span><span id="pgA"></span></div>
      </div>
      <div class="face back"><img id="imgB" alt="">
        <div class="tag"><span class="side" id="labB"></span><span id="pgB"></span></div>
      </div>
    </div>
    <div class="zones">
      <div class="zone-back" id="zback" title="Back"></div>
      <div class="zone-fwd" id="zfwd" title="Forward"></div>
    </div>
    <div class="chev left" id="chevL"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></div>
    <div class="chev right" id="chevR"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></div>
  </div>
  <div class="controls">
    <span class="counter" id="counter"></span>
    <button id="shuffle">Shuffle</button>
  </div>
  <p class="hint">Click right &rarr; forward (original &rsaquo; variants &rsaquo; next page) &middot; left 30% &larr; back &middot; Space forward &middot; S shuffle</p>

  <script>
    const SLIDES = {data};
    const GROUPS = {G};
    const faces = [
      {{img:document.getElementById('imgA'), lab:document.getElementById('labA'), pg:document.getElementById('pgA')}},
      {{img:document.getElementById('imgB'), lab:document.getElementById('labB'), pg:document.getElementById('pgB')}}
    ];
    const card=document.getElementById('card'), counter=document.getElementById('counter'),
          chevL=document.getElementById('chevL'), chevR=document.getElementById('chevR');
    let pos = 0, flipped = false, chevTimer;

    const badge = s => `<span class="badge ${{s}}">${{s==='approved'?'APPROVED':'draft'}}</span>`;
    function render(){{
      const s = SLIDES[pos];
      const f = faces[flipped ? 1 : 0];          // the face rotating into view
      f.img.src = s.src;
      f.lab.textContent = s.kind==='original' ? 'Original Image' : ('Recreated' + (s.sub ? ' '+s.sub : ''));
      f.lab.className = 'side' + (s.kind==='original' ? ' draw' : '');
      f.pg.innerHTML = `${{s.stem}} ${{badge(s.status)}}`;
      counter.textContent = `${{s.gi+1}} / ${{GROUPS}}`;
      card.classList.toggle('flipped', flipped);
    }}
    function step(d){{ flipped = !flipped; pos = (pos + d + SLIDES.length) % SLIDES.length; render(); }}
    function advance(){{ step(1); pulse(chevR); }}
    function backward(){{ step(-1); pulse(chevL); }}
    function shuffle(){{
      const starts = []; let last=-1;
      SLIDES.forEach((s,i)=>{{ if(s.gi!==last){{starts.push(i); last=s.gi;}} }});
      pos = starts[Math.random()*starts.length|0]; render();
    }}
    function pulse(el){{ el.classList.add('show'); fadeSoon(); }}
    function fadeSoon(){{ clearTimeout(chevTimer); chevTimer=setTimeout(()=>{{chevL.classList.remove('show');chevR.classList.remove('show');}},1100); }}

    document.getElementById('zfwd').addEventListener('click', advance);
    document.getElementById('zback').addEventListener('click', backward);
    document.getElementById('zfwd').addEventListener('mouseenter', ()=>{{chevR.classList.add('show'); clearTimeout(chevTimer);}});
    document.getElementById('zfwd').addEventListener('mouseleave', fadeSoon);
    document.getElementById('zback').addEventListener('mouseenter', ()=>{{chevL.classList.add('show'); clearTimeout(chevTimer);}});
    document.getElementById('zback').addEventListener('mouseleave', fadeSoon);
    document.getElementById('shuffle').addEventListener('click', shuffle);
    document.addEventListener('keydown', e=>{{
      if(e.code==='Space'){{e.preventDefault(); advance();}}
      else if(e.code==='ArrowRight') advance();
      else if(e.code==='ArrowLeft') backward();
      else if(e.key.toLowerCase()==='s') shuffle();
    }});
    render();
  </script>
</body>
</html>"""


def main():
    groups = collect_groups()
    OUT.write_text(build_html(groups), encoding="utf-8")
    total_variants = sum(len(g["recreated"]) for g in groups)
    multi = sum(1 for g in groups if len(g["recreated"]) > 1)
    print(f"Wrote {OUT}")
    print(f"  {len(groups)} pages, {total_variants} recreated variants ({multi} pages have multiple)")


if __name__ == "__main__":
    main()
