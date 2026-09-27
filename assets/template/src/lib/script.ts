import type { ActId } from "../theme";

/* ------------------------------------------------------------------ *
 *  全片唯一「真相来源」。
 *  改文案 / 改画面 / 调节奏都只动这个文件，场景代码不用变。
 * ------------------------------------------------------------------ */

export type Line = {
  /** 中文字幕（旁白） */
  zh: string;
  /** 拉丁小注 */
  en?: string;
};

/** 镜头运动。相邻镜头不复用同一种，全片也不出现连续重复。 */
export type Move =
  | "pushIn"
  | "pullOut"
  | "panLeft"
  | "panRight"
  | "tiltUp"
  | "tiltDown"
  | "driftTR"
  | "driftBL"
  | "arcCW"
  | "arcCCW"
  | "rackFocus"
  | "breathe";

/** 叠在画面上的动态标注。每个镜头最多挂一个，保证「不重复同一种效果」。 */
export type Annot =
  | { k: "year"; value: string; note?: string }
  | { k: "counter"; label: string; to: number; unit?: string; decimals?: number };

export type Shot = {
  /** public/art/<art>.jpg */
  art: string;
  move: Move;
  annot?: Annot;
  lines: Line[];
};

export type Scene = {
  id: string;
  act: ActId;
  /** 左上角年代 / 地点 */
  era: string;
  title: string;
  /** 本幕开头压一张大标题卡 */
  chapter?: { char: string; name: string; latin: string };
  shots: Shot[];
};

/* ------------------------------------------------------------ 时间推导 */

export type Mode = "long" | "short";

/**
 * 精简版的取舍表。key = 画面板 id, value = 该镜头里不再单独念出来的字幕序号。
 * 画面一个不删 —— 去掉的只是那些信息已经印在画面标注上的次要句。
 */
export const DROP: Record<string, number[]> = {
  "body-01": [1],
};

/** 某个剪辑里整幕跳过（按 scene id）。 */
const HIDE: Record<Mode, string[]> = {
  long: [],
  short: [],
};

/** 某个镜头在某套节奏下真正要念出来的字幕。 */
export const visibleLines = (shot: Shot, mode: Mode = "long"): Line[] => {
  if (mode === "long") return shot.lines;
  const drop = DROP[shot.art] ?? [];
  return drop.length ? shot.lines.filter((_, i) => !drop.includes(i)) : shot.lines;
};

export type Timings = {
  /** 每字帧数 */
  perChar: number;
  /** 每个标点的额外帧数 */
  punctW: number;
  lineMin: number;
  lineGap: number;
  shotPad: number;
  sceneIn: number;
  chapterLead: number;
  sceneOut: number;
  transition: number;
};

/**
 * long  ≈ 4.7 字/秒，从容
 * short ≈ 9.5 字/秒，快剪
 * 同一批画面、同一份文案，两套节奏只差这张表。
 */
export const TIMING: Record<Mode, Timings> = {
  long: { perChar: 6.4, punctW: 9, lineMin: 76, lineGap: 9, shotPad: 16, sceneIn: 12, chapterLead: 98, sceneOut: 22, transition: 18 },
  short: { perChar: 3.15, punctW: 4.5, lineMin: 44, lineGap: 3, shotPad: 4, sceneIn: 3, chapterLead: 36, sceneOut: 5, transition: 10 },
};

export const timingOf = (mode: Mode): Timings => TIMING[mode];

export const chapterLead = (scene: Scene, mode: Mode = "long"): number =>
  scene.chapter ? TIMING[mode].chapterLead : 0;

const punct = (s: string) => (s.match(/[，。、；：！？—…·「」《》""'']/g) || []).length;

export const lineDur = (text: string, mode: Mode = "long"): number => {
  const t = TIMING[mode];
  return Math.max(t.lineMin, Math.round(text.length * t.perChar + punct(text) * t.punctW));
};

export const shotDur = (shot: Shot, mode: Mode = "long"): number => {
  const t = TIMING[mode];
  const lines = visibleLines(shot, mode);
  return (
    lines.reduce((a, l) => a + lineDur(l.zh, mode), 0) +
    t.lineGap * Math.max(0, lines.length - 1) +
    t.shotPad
  );
};

export const sceneDur = (scene: Scene, mode: Mode = "long"): number => {
  const t = TIMING[mode];
  return (
    t.sceneIn +
    chapterLead(scene, mode) +
    scene.shots.reduce((a, s) => a + shotDur(s, mode), 0) +
    t.sceneOut
  );
};

/* ------------------------------------------------------------ 全片文案 */

export const SCENES: Scene[] = [
  {
    id: "S01",
    act: "open",
    era: "序 · 一切从一句文案开始",
    title: "开场",
    chapter: { char: "序", name: "开场", latin: "Overture" },
    shots: [
      {
        art: "open-01",
        move: "pushIn",
        annot: { k: "year", value: "2026", note: "模板示例" },
        lines: [
          { zh: "把文案写进 script.ts，画面会跟着它走。", en: "Write the script, the picture follows." },
          { zh: "每个镜头挂一到三条字幕，时间轴由读速自动推导。", en: "Timing is derived from reading speed." },
        ],
      },
    ],
  },
  {
    id: "S02",
    act: "body",
    era: "壹 · 正文",
    title: "正文",
    shots: [
      {
        art: "body-01",
        move: "driftTR",
        annot: { k: "counter", label: "示例计数", to: 57, unit: " 张" },
        lines: [
          { zh: "一张画面板，加一组镜头运动，加一套调色，就是一个镜头。", en: "A plate, a move, a grade." },
          { zh: "相邻镜头不复用同一种运动，全片就看不出重复播放。", en: "No two neighbouring shots move alike." },
        ],
      },
      {
        art: "body-02",
        move: "arcCW",
        lines: [
          { zh: "字幕里的数字会自动染色，专有名词在 theme.ts 的 TERMS 里登记。", en: "Numbers and terms highlight themselves." },
          { zh: "颗粒、粒子、暗角统一由 Atmosphere 叠上去，画面不会「死」。", en: "Grain, motes and vignette come from one layer." },
        ],
      },
    ],
  },
  {
    id: "S03",
    act: "close",
    era: "收 · 落版",
    title: "落版",
    shots: [
      {
        art: "close-01",
        move: "breathe",
        lines: [
          { zh: "渲染：npm run render -- <合成名> out/video.mp4", en: "Render with the wrapper." },
          { zh: "画面板换成自己的图，就是一部新的片子。", en: "Swap the plates and it is a new film." },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------ 派生时间轴 */

export type ShotSpan = { shot: Shot; from: number; to: number; index: number };
export type SceneSpan = {
  scene: Scene;
  index: number;
  from: number;
  to: number;
  duration: number;
  shots: ShotSpan[];
  /** 每条字幕在该幕内的起止（相对幕首） */
  captions: { text: string; en?: string; from: number; to: number; shot: number }[];
};

/** 某个剪辑里真正出现的幕。 */
export const SCENES_OF = (mode: Mode): Scene[] =>
  SCENES.filter((s) => !HIDE[mode].includes(s.id));

const buildScene = (scene: Scene, index: number, from: number, mode: Mode): SceneSpan => {
  const tm = TIMING[mode];
  const shots: ShotSpan[] = [];
  const captions: SceneSpan["captions"] = [];
  let t = tm.sceneIn + chapterLead(scene, mode);
  scene.shots.forEach((shot, si) => {
    const lines = visibleLines(shot, mode);
    const sFrom = t;
    lines.forEach((line, li) => {
      const d = lineDur(line.zh, mode);
      captions.push({ text: line.zh, en: line.en, from: t, to: t + d, shot: si });
      t += d;
      if (li < lines.length - 1) t += tm.lineGap;
    });
    t += tm.shotPad;
    shots.push({ shot, from: from + sFrom, to: from + t, index: si });
  });
  const duration = t + tm.sceneOut;
  return { scene, index, from, to: from + duration, duration, shots, captions };
};

const buildTimeline = (mode: Mode): SceneSpan[] => {
  const out: SceneSpan[] = [];
  let acc = 0;
  SCENES_OF(mode).forEach((s, i) => {
    out.push(buildScene(s, i, acc, mode));
    acc += sceneDur(s, mode) - TIMING[mode].transition;
  });
  return out;
};

/** 两套节奏各自的时间轴, 在模块加载时一次算好。 */
const TIMELINES: Record<Mode, SceneSpan[]> = {
  long: buildTimeline("long"),
  short: buildTimeline("short"),
};

export const TIMELINE_OF = (mode: Mode): SceneSpan[] => TIMELINES[mode];

export const TIMELINE: SceneSpan[] = TIMELINES.long;

export const TOTAL_FRAMES_OF = (mode: Mode): number =>
  SCENES_OF(mode).reduce((a, s) => a + sceneDur(s, mode), 0) -
  TIMING[mode].transition * (Math.max(1, SCENES_OF(mode).length) - 1);

export const TOTAL_FRAMES = TOTAL_FRAMES_OF("long");

export const sceneSpan = (id: string, mode: Mode = "long"): SceneSpan =>
  TIMELINES[mode].find((s) => s.scene.id === id) as SceneSpan;

/** 全片里每一幕（同 act 相邻幕合并）的起止，配乐按它换和声。 */
const actSpansOf = (mode: Mode) => {
  const out: { act: ActId; from: number; to: number }[] = [];
  TIMELINES[mode].forEach((s) => {
    const last = out[out.length - 1];
    if (last && last.act === s.scene.act) last.to = s.to;
    else out.push({ act: s.scene.act, from: s.from, to: s.to });
  });
  return out;
};

export const ACT_SPANS_OF = actSpansOf;