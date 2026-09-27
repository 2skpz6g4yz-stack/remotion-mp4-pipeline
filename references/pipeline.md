# 流水线与工程结构

## 一句话架构

`script.ts` 是唯一真相来源（分幕、镜头、字幕、标注、节奏表），组件只负责把它渲染出来。
改文案、改画面、调节奏都只动数据，不动场景代码。

```
src/lib/script.ts   数据：Scene → Shot → Line，外加 TIMING 节奏表与时间推导
        ↓
src/scenes/SceneView.tsx   一幕 = 若干镜头；按当前帧找出"第几镜 + 第几条字幕"
        ↓
src/components/Art.tsx         画面板 + 镜头运动 + 调色
src/components/Atmosphere.tsx  粒子 + 胶片颗粒 + 暗角
src/components/Annot.tsx       动态标注（年代戳 / 数字滚动）
src/components/Type.tsx        字幕、年代角标、大标题
        ↓
src/Main.tsx   TransitionSeries 把幕串起来，每段转场单独挑
src/Root.tsx   注册 composition（整片 + 单幕，便于单独渲染审片）
```

## 数据模型

- `Scene`：`id` / `act`（幕，决定配色粒子）/ `era`（左上角年代地点）/ `chapter?`（片头章节卡）/ `shots[]`
- `Shot`：`art`（`public/art/<art>.jpg`）/ `move`（12 种镜头运动之一）/ `annot?`（一条动态标注）/ `lines[]`
- `Line`：`zh` 中文字幕 + `en?` 拉丁小注

三条设计约束，破坏了片子就不成立：

1. **图文对应**：一幕由若干镜头组成，每个镜头挂 1–3 条字幕；字幕、画面、运动、标注共用同一份时间推导。
2. **不重复同一种效果**：相邻镜头不复用同一种运动，也不复用同一种标注。
3. **连贯叙事而不是 PPT**：反复出现的视觉母题（一道刻线、同一枚标志、同一套和声）要贯穿全片。

## 时间推导（不要手填时长）

```
lineDur(文字)  = max(lineMin, 字数 × perChar + 标点数 × punctW)
shotDur(镜头)  = Σ lineDur + lineGap × (n-1) + shotPad
sceneDur(幕)   = sceneIn + chapterLead + Σ shotDur + sceneOut
总帧数          = Σ sceneDur - transition × (幕数 - 1)
```

- 读速由 `TIMING.perChar` 决定：`6.4` ≈ 4.7 字/秒（从容），`3.15` ≈ 9.5 字/秒（快剪）。
- `TIMELINE_OF(mode)` 在模块加载时把每个镜头的绝对起止、每条字幕的起止一次算好；组件只查表。
- **一套画面出多个时长版本**：`DROP`（按画面板 id 丢掉次要字幕）与 `HIDE`（整幕跳过）不改画面，
  所以「图」和「文」仍然一一对应。改节奏只动 `TIMING`，不要动 `script.ts` 的结构。

## 标准流程

1. **立项**：`node scripts/new-video-project.mjs <目录> --install`（本 skill 的脚手架），
   或直接从 `assets/template` 拷一份。
2. **文案**：写 `src/lib/script.ts` 的 `SCENES`。先只写 `lines`，画面板 id 先占位。
3. **画面板**：把提示词写进 `tools/plates.json`，`python tools/gen-plates.py`；
   没有图像模型 key 时先 `python tools/make-placeholder-art.py` 出占位图把片子跑通。
4. **材质与配乐**：`python tools/make-tex.py`（颗粒 / 纸纹）、`node scripts/make-audio.mjs`（合成配乐）。
   配乐按 `ACT_SPANS_OF("long")` 逐幕换和声，音色全部现场合成（加法 pad / 钟 / 噪升），无采样库依赖。
   要成片带声，把 `src/config.ts` 的 `AUDIO` 改成 `"audio/bgm.wav"`。
5. **预览**：`npm run dev`（Remotion Studio，热更新）。
6. **渲染**：`npm run render -- Film out/video.mp4`。**一律走 `scripts/run-remotion.mjs`**，
   理由见 `references/windows-notes.md`。
7. **审片**：见 `references/review-qc.md`。

## 常见改动落点

| 想改什么 | 动哪里 |
| --- | --- |
| 文案 / 字幕 / 节奏 | `src/lib/script.ts`（`SCENES` 与 `TIMING`） |
| 某一镜的画面 | `tools/plates.json` 里那条 `prompt`，再 `gen-plates.py --only <id>` |
| 整幕配色与粒子 | `src/theme.ts` 的 `ACTS` |
| 画面与素材的统一色温 | `src/lib/grades.ts` 的 `GRADE` |
| 镜头运动曲线 | `src/lib/moves.ts` |
| 字幕里哪些词自动染色 | `src/theme.ts` 的 `TERMS`（数字自动识别） |
| 转场 | `src/Main.tsx` 的 `PRES`；`@remotion/transitions` 还提供 ripple / zoom-blur / film-burn / book-flip 等 |

## 换题材的推荐顺序

先换 `theme.ts` 的配色与 `grades.ts` 的调色（这两步就能让同一批图变成另一部片子），
再换 `plates.json` 的提示词，最后才动 `script.ts` 的文案与幕结构。