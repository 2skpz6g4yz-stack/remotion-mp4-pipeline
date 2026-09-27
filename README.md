# remotion-mp4-pipeline

把文案变成 MP4 成片的 Codex skill。包含一套可直接用的 Remotion 视频工程模板、
AI 画面板批量出图脚本、现场合成的配乐脚本，以及抽帧审片工具。

> A Codex skill that turns a script into an MP4 film with Remotion:
> project scaffold, AI-generated art plates, synthesized score, frame-level review, export.

用一句话说清它的主张：**文本是唯一真相来源**。分幕、镜头、字幕、动态标注都写在
`src/lib/script.ts` 里，时长由读速自动推导，画面、字幕、镜头运动、配乐共用同一份时间轴 ——
所以字幕永远和画面对得上，改文案不需要动任何场景代码。

## 装法

把整个目录放进 Codex 的 skills 目录：

```bash
git clone <这个仓库> ~/.codex/skills/remotion-mp4-pipeline
# Windows: %USERPROFILE%\.codex\skills\remotion-mp4-pipeline
```

重启 Codex 后，"做个视频""把这段文案做成短片""改一下这个片子的节奏"这类请求就会命中它。

直接用模板（不需要 skill 机制）：

```bash
node scripts/new-video-project.mjs ~/videos/my-film --install
```

## 快速开始

```bash
cd my-film
python tools/make-placeholder-art.py   # 先用占位画面板跑通（不需要任何 key）
python tools/make-tex.py               # 颗粒与纸纹
node scripts/make-audio.mjs            # 合成配乐
npm run dev                            # 预览
npm run render -- Film out/video.mp4   # 导出
```

换成自己的画面：把提示词写进 `tools/plates.json`，设好 `ZHIPU_API_KEY`，再跑
`python tools/gen-plates.py`。

## 模板里有什么

- **镜头运动** 12 种（推拉摇移、弧线、呼吸、变焦），相邻镜头不复用同一种。
- **每幕一套调色**：把来源不同的画面板统一到同一色温。
- **粒子 + 胶片颗粒 + 暗角 + 掠光**：让 AI 底图看起来像被拍下来的。
- **字幕自动强调**：数字与专有名词自动染色，不用手写标记。
- **动态标注**：年代戳、数字滚动，每个镜头最多挂一个。
- **长短两个版本**：同一批画面，改一张节奏表就能出快剪版，图与文仍一一对应。
- **配乐现场合成**：加法 pad + 钟 + 噪升，逐幕换和声，无采样库依赖。
- **渲染包装器**：把无头 Chrome 的临时目录收进工程内 `.tmp/`，跑完自动清空
  （否则会在系统 `%TEMP%` 里攒下上百个目录、几个 GB）。

## 目录

```
SKILL.md                     skill 入口：何时用、工作流、硬约束
references/pipeline.md       架构、数据模型、时间推导、常见改动落点
references/art-prompts.md    图像模型能画什么、提示词写法、水印与色阶后处理
references/review-qc.md      看图纪律与审片循环
references/windows-notes.md  py vs python、复用系统 Chrome、代理坑
scripts/new-video-project.mjs  从模板生成新工程
scripts/run-remotion.mjs       渲染包装器
assets/template/               三幕示例工程
```

## 环境

- Node.js 18+ 与 npm；Python 3.10+（Pillow、numpy）。
- 已装 Chrome 的机器设 `REMOTION_BROWSER` 指向它，可省掉下载 Headless Shell。
- Windows 上 `python` 若是应用商店空壳桩，一律改用 `py`。

## 许可

MIT。`assets/template` 里的字体用的是系统字体回退链，不附带字体文件。