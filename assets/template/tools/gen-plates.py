#!/usr/bin/env python
"""按 tools/plates.json 批量出画面板：调图像模型 → 补水印 → 自动色阶 → 上采样 1920x1080。

用法:
    ZHIPU_API_KEY=xxx python tools/gen-plates.py            # 只补还没生成的
    python tools/gen-plates.py --only body-01               # 重做指定几张（会重新出图）
    python tools/gen-plates.py --force --skip-fetch         # 不联网, 拿 .raw/ 重做后期

没有 API key 也想先看片子长什么样: python tools/make-placeholder-art.py

踩过的坑（见 references/art-prompts.md）:
  * 直接按 16:9 出图 (1792x1008), 不要 4:3 再裁 —— 裁切会把构图切死, 主体变特写。
  * 免费额度会在右下角盖一枚水印, 位置由 WM_BOX 决定；换成别家模型要重新量。
  * 底图偏暗, 收尾做一次温和的自动色阶 + 轻锐化, 否则叠上调色只剩一团泥。
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "public" / "art"
RAW = ROOT / ".raw"
SPEC = ROOT / "tools" / "plates.json"

API = "https://open.bigmodel.cn/api/paas/v4/images/generations"
MODEL = "cogview-3-flash"
GEN_SIZE = "1792x1008"
TARGET = (1920, 1080)

# 水印位置（在 1792x1008 下量出来的）, 留一点余量
WM_BOX = (1596, 908)

OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def fetch(prompt: str, key: str, tries: int = 3) -> bytes | None:
    body = json.dumps({"model": MODEL, "prompt": prompt, "size": GEN_SIZE}).encode()
    for attempt in range(1, tries + 1):
        req = urllib.request.Request(
            API,
            data=body,
            headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        )
        try:
            payload = json.loads(OPENER.open(req, timeout=90).read().decode())
            item = payload["data"][0]
            if item.get("url"):
                return OPENER.open(item["url"], timeout=90).read()
            import base64

            return base64.b64decode(item["b64_json"])
        except Exception as exc:  # noqa: BLE001
            detail = ""
            try:
                detail = exc.read().decode()[:160]  # type: ignore[attr-defined]
            except Exception:  # noqa: BLE001
                pass
            print(f"    attempt {attempt}: {type(exc).__name__} {str(exc)[:90]} {detail}", flush=True)
            time.sleep(6 * attempt)
    return None


def dewatermark(im: Image.Image) -> Image.Image:
    """把右下角水印用调和扩散补掉, 再掺一点邻域的颗粒, 避免留一块糊斑。"""
    a = np.asarray(im, np.float32) / 255.0
    h, w, _ = a.shape
    x0, y0 = WM_BOX
    x0 = min(x0, w - 8)
    y0 = min(y0, h - 8)

    field = a[y0:h, x0:w].copy()
    top = a[y0 - 1, x0:w].copy()
    left = a[y0:h, x0 - 1].copy()

    for _ in range(240):
        field[0] = top
        field[:, 0] = left
        field[1:-1, 1:-1] = 0.25 * (
            field[:-2, 1:-1] + field[2:, 1:-1] + field[1:-1, :-2] + field[1:-1, 2:]
        )
        field[-1] = field[-2]
        field[:, -1] = field[:, -2]

    ref = a[max(0, y0 - 96) : y0, x0:w]
    noise = float(np.std(ref - ref.mean()))
    rng = np.random.default_rng(11)
    field = np.clip(field + rng.normal(0, noise * 0.55, field.shape).astype(np.float32), 0, 1)

    out = a.copy()
    out[y0:h, x0:w] = field
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def autolevel(im: Image.Image, lo: float = 0.045, hi: float = 0.965) -> Image.Image:
    """自动色阶：把 1.5% / 99.2% 分位拉到目标区间, 再补一点 S 曲线。

    增益设了上限, 免得把噪点一起放大。
    """
    a = np.asarray(im, np.float32) / 255.0
    lum = a[:, :, 0] * 0.299 + a[:, :, 1] * 0.587 + a[:, :, 2] * 0.114
    p_lo, p_hi = float(np.percentile(lum, 1.5)), float(np.percentile(lum, 99.2))
    if p_hi - p_lo > 0.06:
        gain = min((hi - lo) / (p_hi - p_lo), 2.1)
        a = (a - p_lo) * gain + lo
    a = np.clip(a, 0, 1)
    a = a * a * (3 - 2 * a) * 0.22 + a * 0.78
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def process(src: Path, dst: Path) -> None:
    """补水印 → 自动色阶 → 上采样 1920x1080 → 轻锐化。"""
    im = Image.open(src).convert("RGB")
    if im.size != (1792, 1008):
        im = im.resize((1792, 1008), Image.LANCZOS)
    im = dewatermark(im)
    im = autolevel(im)
    im = im.resize(TARGET, Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2.4, percent=64, threshold=3))
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, quality=92, subsampling=0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", default=None)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--skip-fetch", action="store_true")
    ap.add_argument("--sleep", type=float, default=1.5)
    args = ap.parse_args()

    key = os.environ.get("ZHIPU_API_KEY", "")
    if not key and not args.skip_fetch:
        print("缺少 ZHIPU_API_KEY 环境变量。先跑 tools/make-placeholder-art.py 也能出片。")
        return 2

    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    styles = spec["style"]
    tail = spec.get("tail", "")
    plates = spec["plates"]
    ids = args.only or list(plates.keys())
    RAW.mkdir(exist_ok=True)
    ART.mkdir(exist_ok=True)

    ok = failed = 0
    for pid in ids:
        entry = plates[pid]
        dst = ART / f"{pid}.jpg"
        raw = RAW / f"{pid}.jpg"
        if dst.exists() and not args.force and not args.only:
            print(f"= {pid} 已存在, 跳过")
            continue
        style = entry.get("style") or styles[entry["act"]]
        prompt = f"{entry['prompt']}, {style}, {tail}"
        if raw.exists():
            try:
                if Image.open(raw).size != (1792, 1008):
                    raw.unlink()
            except Exception:  # noqa: BLE001
                raw.unlink()
        if not raw.exists() or args.force or args.only:
            if args.skip_fetch:
                if not raw.exists():
                    print(f"! {pid} 没有原图, 跳过")
                    failed += 1
                    continue
            else:
                print(f"+ {pid} 出图 ...", flush=True)
                blob = fetch(prompt, key)
                if not blob:
                    print(f"! {pid} 出图失败")
                    failed += 1
                    continue
                raw.write_bytes(blob)
                time.sleep(args.sleep)
        process(raw, dst)
        print(f"  -> {dst.relative_to(ROOT)}  {dst.stat().st_size // 1024} KB")
        ok += 1

    print(f"\n完成 {ok} 张, 失败 {failed} 张")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())