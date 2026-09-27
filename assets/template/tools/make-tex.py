#!/usr/bin/env python
"""生成两张材质：胶片颗粒 grain.png 与宣纸纤维 paper.jpg。

两张贴图在 Remotion 里用 blend mode 叠加, 让 AI 底图有"被拍下来"的质感,
同时压住上采样带来的发虚。
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
TEX = ROOT / "public" / "tex"


def fbm(h: int, w: int, seed: int, octaves: int = 6, base: int = 4) -> np.ndarray:
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        ch = max(2, base * 2**o)
        cw = max(2, base * 2**o)
        small = (rng.random((ch, cw)) * 255).astype(np.uint8)
        acc += amp * (np.asarray(Image.fromarray(small).resize((w, h), Image.BICUBIC), np.float32) / 255.0)
        total += amp
        amp *= 0.55
    acc /= total
    acc -= acc.min()
    return acc / max(acc.max(), 1e-6)


def grain() -> None:
    size = 512
    rng = np.random.default_rng(7)
    n = rng.random((size, size)).astype(np.float32)
    soft = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    n = 0.6 * n + 0.4 * soft
    v = np.clip(128 + (n - 0.5) * 220, 0, 255).astype(np.uint8)
    Image.fromarray(v, "L").convert("RGB").save(TEX / "grain.png", optimize=True)


def paper() -> None:
    size = 1024
    f = fbm(size, size, 21, octaves=7, base=3)
    fibers = fbm(size, size, 33, octaves=3, base=64)
    shade = 0.82 * f + 0.18 * fibers
    base = 226 - shade * 34
    rgb = np.stack([base * 1.0, base * 0.975, base * 0.915], -1)
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im.save(TEX / "paper.jpg", quality=88, optimize=True)


if __name__ == "__main__":
    TEX.mkdir(parents=True, exist_ok=True)
    grain()
    paper()
    for p in sorted(TEX.iterdir()):
        print(p.name, p.stat().st_size // 1024, "KB")
