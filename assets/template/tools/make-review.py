#!/usr/bin/env python
"""生成小预览, 避免把整帧大图一张张读进对话（会撞 32MiB 上限）。

    python tools/make-review.py            # public/art/*.jpg → public/art/review/*.jpg + out/contact-sheet.jpg
    python tools/make-review.py out/x.jpg  # 指定帧图 → out/review/x.jpg
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent


def tile(path: Path, width: int, label: str | None = None) -> Image.Image:
    im = Image.open(path).convert("RGB")
    h = int(round(im.height * width / im.width))
    im = im.resize((width, h), Image.LANCZOS)
    if label:
        ImageDraw.Draw(im).text((8, 8), label, fill=(255, 90, 90))
    return im


def main() -> int:
    args = sys.argv[1:]
    if args:
        dst_dir = ROOT / "out" / "review"
        dst_dir.mkdir(parents=True, exist_ok=True)
        for a in args:
            p = Path(a)
            if not p.is_absolute():
                p = ROOT / a
            out = dst_dir / p.name
            tile(p, 900).save(out, quality=82)
            print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
        return 0

    art = sorted((ROOT / "public" / "art").glob("*.jpg"))
    if not art:
        print("public/art 里还没有图")
        return 1
    rev = ROOT / "public" / "art" / "review"
    rev.mkdir(parents=True, exist_ok=True)
    for p in art:
        tile(p, 720).save(rev / p.name, quality=80)

    cols = 4
    cw, chh = 460, 259
    rows = (len(art) + cols - 1) // cols
    sheet = Image.new("RGB", (cw * cols, chh * rows), (8, 8, 10))
    for i, p in enumerate(art):
        sheet.paste(tile(p, cw, p.stem), ((i % cols) * cw, (i // cols) * chh))
    out = ROOT / "out" / "contact-sheet.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=80)
    print(f"{len(art)} 张 → {out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
