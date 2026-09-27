---
name: remotion-mp4-pipeline
description: 用 Remotion 从文案生成 MP4 成片：搭工程骨架、按提示词出画面板、合成配乐、抽帧审片、渲染导出，并能用同一批素材出长短两个版本。当用户要做视频/短片/mp4、要把文案或脚本变成片子、要改已有 Remotion 工程的文案镜头节奏配色、或要出多个时长版本时使用。
metadata:
  short-description: 从文案生成 MP4 成片
---

# Remotion MP4 流水线

把文案渲染成 MP4：一句文案 → 画面板 → 配乐 → 审片 → 导出。文本是唯一的真相来源，
画面、字幕、镜头运动、动态标注共用同一份时间推导，所以"图"和"文"永远对得上。

## 起手式

```bash
node scripts/new-video-project.mjs <目标目录> --install
```

模板 `assets/template/` 是一个能直接渲染的三幕示例工程：镜头运动（12 种）、每幕调色、
粒子与胶片颗粒、字幕自动强调、动态标注（年代戳 / 数字滚动）、配乐合成、审片工具，
外加把临时文件收进工程内的渲染包装器。

## 核心工作流

1. **文案先行**：写 `src/lib/script.ts` 的 `SCENES`（幕 → 镜头 → 字幕）。先不定画面，只写词。
2. **出画面板**：提示词写进 `tools/plates.json` → `python tools/gen-plates.py`。
   没有图像模型 key 就先 `python tools/make-placeholder-art.py` 出占位图，把片子跑通再换真图。
3. **材质与配乐**：`python tools/make-tex.py`、`node scripts/make-audio.mjs`。
4. **预览**：`npm run dev`（Remotion Studio 热更新）。
5. **审片**：抽关键帧 → 缩略图 → 一次看 2–3 张，按 `references/review-qc.md` 的清单过。
6. **导出**：`npm run render -- Film out/video.mp4`。
7. **出第二个时长版本**：改 `script.ts` 的 `TIMING` 与 `DROP`/`HIDE` 取舍表，
   画面一个不删，只压节奏 —— 长短两版的图和文仍然一一对应。

## 四条硬约束

- **不要手填时长**。时长由读速推导（`lineDur/shotDur/sceneDur`）。改节奏只动 `TIMING` 表。
- **不要逐张读整帧大图**。一张 3MB 上下，几张就把请求体撑过 32MiB 上限、撞 `413`，
  之后该会话每轮都会失败。先 `python tools/make-review.py` 出总览图，一轮最多看 2–3 张。
- **渲染一律走 `scripts/run-remotion.mjs`**，不要直接 `npx remotion`：
  它把临时目录固定在工程内 `.tmp/` 并在结束后清空，否则无头 Chrome 会在系统 `%TEMP%`
  里攒下上百个配置目录（每个 10–100MB，且不会自己消失）。
- **API key 走环境变量**，不要写进文件（画面板脚本已经从环境变量读）。

## 审片看什么

画面和文案对不上、字幕被裁或与标注打架、标注动画没演完、转场闪、同一幕里调色不统一。
改完抽同样的帧复看，别凭印象宣布完成。

## 索引

- `references/pipeline.md` —— 架构、数据模型、时间推导、常见改动落点、配乐合成
- `references/art-prompts.md` —— 图像模型能画什么/画不了什么、提示词写法、水印与色阶后处理
- `references/review-qc.md` —— 看图纪律与审片循环
- `references/windows-notes.md` —— `py` vs `python`、复用系统 Chrome、代理坑
- `scripts/new-video-project.mjs` —— 从模板生成新工程
- `scripts/run-remotion.mjs` —— 渲染包装器（临时目录收进工程内）
- `assets/template/` —— 三幕示例工程，可直接拷走