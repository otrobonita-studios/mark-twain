"""
clone_test.py — first clone test for the Mark Twain spoken-narrator voice.

Loads Qwen3-TTS *Base* (the cloning-capable model), clones from a reference
clip cut from the Suno stem, and writes a few spoken test lines so you can A/B
the timbre against the Suno track.

Run locally (needs a GPU + the Base weights). The CustomVoice checkpoint
CANNOT clone — this MUST be a Base model.

First run is partly a discovery step: it prints the available generate_* methods
and the clone method's signature on YOUR installed qwen_tts version, because the
exact name/params can drift between releases. Confirm those, then fill in the
call in `run_clone()`.
"""

import inspect
from pathlib import Path

import torch
import soundfile as sf

# ----------------------------- config ---------------------------------------
MODEL_ID  = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"   # Base = clone-capable. NOT CustomVoice.

REF_AUDIO = "refs/ref_124s_F0-174.wav"        # start with the low/clean clip
REF_TEXT  = "<<< exact words sung in the reference clip — fill this in >>>"

LANGUAGE  = "English"

TEST_LINES = [
    "It was a good while ago, but I remember it as if it were yesterday.",
    "The difference between the almost right word and the right word "
    "is the difference between the lightning bug and the lightning.",
]

OUT_DIR = Path("clone_out")

# Generation knobs — passed through to HF .generate(). Start conservative for
# stability, then loosen for expressiveness once timbre is confirmed.
GEN_KWARGS = dict(
    # temperature=0.7,
    # top_p=0.9,
    # repetition_penalty=1.05,
)
# ----------------------------------------------------------------------------


def load_model():
    from qwen_tts import Qwen3TTSModel
    common = dict(device_map="cuda:0", dtype=torch.bfloat16)
    try:
        return Qwen3TTSModel.from_pretrained(
            MODEL_ID, attn_implementation="flash_attention_2", **common
        )
    except Exception as e:  # flash-attn not installed / unsupported GPU
        print(f"[warn] flash_attention_2 unavailable ({e}); loading without it")
        return Qwen3TTSModel.from_pretrained(MODEL_ID, **common)


def find_clone_method(model):
    """Discover the clone entry point on this build and print its signature."""
    gen = [m for m in dir(model) if m.startswith("generate")]
    print("Available generate_* methods:", gen)
    clone = [m for m in gen if "clone" in m.lower() or "zero" in m.lower()]
    if not clone:
        print(
            "\n[!] No obvious clone method found. Inspect the list above and the "
            "qwen_tts README, then wire up run_clone() manually."
        )
        return None
    name = clone[0]
    print(f"Using clone method: model.{name}{inspect.signature(getattr(model, name))}")
    return name


def run_clone(model, method_name, text):
    """
    Best-guess call. If the kwargs don't match, the TypeError handler prints the
    real signature so you can correct REF/param names on the spot.
    Common param aliases across versions: ref_audio | reference_audio | prompt_audio,
    and ref_text | reference_text | prompt_text.
    """
    fn = getattr(model, method_name)
    try:
        return fn(
            text=text,
            ref_audio=REF_AUDIO,
            ref_text=REF_TEXT,
            language=LANGUAGE,
            **GEN_KWARGS,
        )
    except TypeError as e:
        print(f"\n[!] Call signature mismatch: {e}")
        print(f"    Real signature -> model.{method_name}{inspect.signature(fn)}")
        print("    Adjust the kwargs in run_clone() to match, then rerun.")
        raise


def main():
    OUT_DIR.mkdir(exist_ok=True)

    if not Path(REF_AUDIO).exists():
        raise SystemExit(f"Reference clip not found: {REF_AUDIO} (put the cut clips in refs/)")
    if REF_TEXT.startswith("<<<"):
        print("[warn] REF_TEXT is still the placeholder — fill in the clip's actual words.")

    model = load_model()
    method = find_clone_method(model)
    if method is None:
        return  # discovery-only run; nothing to generate yet

    for i, line in enumerate(TEST_LINES):
        wavs, sr = run_clone(model, method, line)
        out = OUT_DIR / f"clone_test_{i:02d}.wav"
        sf.write(out, wavs[0], sr)
        dur = len(wavs[0]) / sr
        print(f"wrote {out}  ({dur:.1f}s @ {sr} Hz)")

    print("\nDone. Listen to clone_out/ against the Suno track and compare timbre.")
    print("Then swap REF_AUDIO to the 069s / 030s clips and rerun to pick the best reference.")


if __name__ == "__main__":
    main()
