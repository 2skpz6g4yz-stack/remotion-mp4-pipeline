export const VIDEO = { width: 1920, height: 1080, fps: 30 } as const;

/** 字幕与标题字体。装了 webfont 就把家族名加到最前面。 */
export const FONTS = {
  serif: "'NotoSerifSC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif",
  latin: "'EBGaramond', Garamond, 'Times New Roman', serif",
  mono: "Consolas, 'Courier New', monospace",
} as const;

export type ActId = "open" | "body" | "close";

export type Act = {
  id: ActId;
  /** 章节汉字 */
  char: string;
  name: string;
  /** 副标题（拉丁小注） */
  latin: string;
  /** 画面基调色 */
  bg: string;
  ink: string;
  accent: string;
  accent2: string;
  /** 纸/底的亮色 */
  paper: string;
  /** 本幕漂浮粒子 */
  particle: "dust" | "ember" | "mote" | "spark" | "star";
};

export const ACTS: Record<ActId, Act> = {
  open: {
    id: "open", char: "序", name: "开场", latin: "Overture",
    bg: "#080A10", ink: "#E8E2D4", accent: "#C9A45C", accent2: "#5B7FB4",
    paper: "#12151C", particle: "star",
  },
  body: {
    id: "body", char: "壹", name: "正文", latin: "The Body",
    bg: "#14110C", ink: "#F0E7D3", accent: "#B23A2E", accent2: "#8A7648",
    paper: "#E9DFC8", particle: "ember",
  },
  close: {
    id: "close", char: "收", name: "落版", latin: "Coda",
    bg: "#04060C", ink: "#EAF2FA", accent: "#48D6F0", accent2: "#3B5BDB",
    paper: "#0B1220", particle: "spark",
  },
};

export const ACT_ORDER: ActId[] = ["open", "body", "close"];

/** 字幕里会自动染成强调色的专有名词；数字、百分比、年份不用登记也会被认出来。 */
export const TERMS: string[] = ["Remotion", "DeepSeek"];