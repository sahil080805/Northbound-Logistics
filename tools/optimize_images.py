#!/usr/bin/env python3
"""
Image optimisation pipeline for Northbound Logistics.

Reads every PNG/JPG in assets/img-src/ and writes responsive, compressed
versions to assets/img/:
    <name>-<width>.webp   (modern, ~30-60% smaller)
    <name>-<width>.jpg    (fallback for very old browsers)

HTML then uses <picture> + srcset so each device downloads only what it needs.

Usage (from the project root):
    pip install Pillow
    python tools/optimize_images.py

To use your own photos: drop them into assets/img-src/ (any size >= 1200px
wide is ideal), run the script, then reference them with the same <picture>
pattern used in the pages. Adjust WIDTHS / QUALITY below if you like.
"""
import io
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "assets" / "img-src", ROOT / "assets" / "img"
WIDTHS = (480, 800, 1200, 1600)   # generated only if <= the source width
WEBP_QUALITY, JPG_QUALITY = 78, 80


def kb(path):
    return path.stat().st_size / 1024


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sources = sorted(p for p in SRC.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"})
    if not sources:
        print("No images found in", SRC)
        return
    total_src = total_out = 0.0
    print(f"{'image':<18}{'source':>10}{'webp (largest)':>16}{'jpg (largest)':>15}{'saved':>8}")
    for src in sources:
        img = Image.open(src).convert("RGB")
        widths = [w for w in WIDTHS if w <= img.width] or [img.width]
        for w in widths:
            h = round(img.height * w / img.width)
            resized = img.resize((w, h), Image.LANCZOS)
            # Try lossy and lossless WebP; keep whichever is smaller (flat artwork often wins lossless).
            lossy, lossless = io.BytesIO(), io.BytesIO()
            resized.save(lossy, "WEBP", quality=WEBP_QUALITY, method=6)
            resized.save(lossless, "WEBP", lossless=True, method=6)
            best = lossy if lossy.tell() <= lossless.tell() else lossless
            (OUT / f"{src.stem}-{w}.webp").write_bytes(best.getvalue())
            resized.save(OUT / f"{src.stem}-{w}.jpg", "JPEG", quality=JPG_QUALITY, optimize=True, progressive=True)
        big = max(widths)
        webp, jpg = OUT / f"{src.stem}-{big}.webp", OUT / f"{src.stem}-{big}.jpg"
        saved = 100 - kb(webp) / kb(src) * 100
        total_src += kb(src)
        total_out += kb(webp)
        print(f"{src.stem:<18}{kb(src):>8.0f}KB{kb(webp):>14.0f}KB{kb(jpg):>13.0f}KB{saved:>7.0f}%")
    print(f"\nTotal: {total_src:.0f} KB of sources -> {total_out:.0f} KB of WebP at full size "
          f"({100 - total_out / total_src * 100:.0f}% smaller). Smaller widths are smaller still.")


if __name__ == "__main__":
    main()
