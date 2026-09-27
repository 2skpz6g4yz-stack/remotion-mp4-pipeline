#!/usr/bin/env python
"""没有图像模型 key 时, 先出一批占位画面板, 保证工程 clone 下来就能渲染。

    python tools/make-placeholder-art.py

产出 public/art/<id>.jpg（1920x1080, 每幕一套配色 + 一团墨韵 + 暗角）。
它只是"能看的占位", 正式出图走 tools/gen-plates.py。
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "public" / "art"
SPEC = ROOT / "tools" / "plates.json"

# 与 src/theme.ts 里 ACTS 的配色保持一致
PALETTE = {
    "open": ("#080A10", "#C9A45C"),
    "body": ("#14110C", "#B23A2E"),
    "close": ("#04060C", "#48D6F0"),
}


def hex_rgb(s: str) -> np.ndarray:
    s = s.lstrip("#")
    return np.array([int(s[i : i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def fbm(h: int, w: int, seed: int, octaves: int = 6, base: int = 4) -> np.ndarray:
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        c = max(2, base * 2**o)
        small = (rng.random((c, c)) * 255).astype(np.uint8)
        acc += amp * (np.asarray(Image.fromarray(small).resize((w, h), Image.BICUBIC), np.float32) / 255.0)
        total += amp
        amp *= 0.55
    acc /= total
    acc -= acc.min()
    return acc / max(acc.max(), 1e-6)


def plate(act: str, seed: int) -> Image.Image:
    w, h = 1920, 1080
    bg, accent = (hex_rgb(c) for c in PALETTE[act])
    cloud = fbm(h, w, seed, octaves=7, base=5)
    fine = fbm(h, w, seed + 99, octaves=3, base=64)

    # 一团居中的墨韵：中心亮、边缘沉
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * (0.44 + 0.12 * ((seed % 7) / 7 - 0.5)), h * (0.5 + 0.1 * ((seed % 5) / 5 - 0.5))
    r = np.sqrt(((xx - cx) / (w * 0.52)) ** 2 + ((yy - cy) / (h * 0.62)) ** 2)
    core = np.clip(1.0 - r, 0, 1) ** 1.6

    wash = 0.55 * cloud + 0.45 * fine
    tone = np.clip(core * (0.55 + 0.75 * wash), 0, 1)

    rgb = bg[None, None, :] * (1 - tone[:, :, None] * 0.55) + accent[None, None, :] * (tone[:, :, None] * 0.75)

    # 暗角 + 颗粒
    vig = np.clip(1.0 - (r**1.8) * 0.85, 0, 1)
    rgb *= vig[:, :, None]
    rng = np.random.default_rng(seed)
    rgb += rng.normal(0, 0.012, rgb.shape).astype(np.float32)

    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    return im.filter(ImageFilter.GaussianBlur(0.4))


def main() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    ART.mkdir(parents=True, exist_ok=True)
    for i, (pid, entry) in enumerate(spec["plates"].items()):
        dst = ART / f"{pid}.jpg"
        plate(entry["act"], 1000 + i * 17).save(dst, quality=90)
        print(f"{dst.relative_to(ROOT)}  {dst.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())