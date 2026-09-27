import type { ActId } from "../theme";

export type Grade = {
  /** 作用在画面板上的 CSS filter */
  filter: string;
  /** 叠加层：从下往上画 */
  layers: { bg: string; blend: string; opacity: number }[];
};

/**
 * 每一幕一套调色，把来源不同的画面板统一到同一部片子的色温里。
 * 换题材时这里是最省力的"统一画风"旋钮。
 */
export const GRADE: Record<ActId, Grade> = {
  open: {
    filter: "saturate(1.02) contrast(1.1) brightness(1.04)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(14,20,36,0.18), rgba(8,11,20,0.34))", blend: "multiply", opacity: 0.7 },
      { bg: "radial-gradient(120% 80% at 50% 42%, rgba(201,164,92,0.18), rgba(0,0,0,0) 62%)", blend: "screen", opacity: 0.85 },
    ],
  },
  body: {
    filter: "saturate(0.92) contrast(1.07) brightness(1.08) sepia(0.1)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(233,223,200,0.14), rgba(72,54,32,0.24))", blend: "soft-light", opacity: 0.9 },
      { bg: "linear-gradient(90deg, rgba(178,58,46,0.12), rgba(0,0,0,0) 45%)", blend: "screen", opacity: 0.7 },
      { bg: "radial-gradient(110% 76% at 50% 44%, rgba(255,238,196,0.14), rgba(20,14,8,0.16) 88%)", blend: "overlay", opacity: 0.8 },
    ],
  },
  close: {
    filter: "saturate(1.16) contrast(1.14) brightness(1.06) hue-rotate(-6deg)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(6,14,28,0.24), rgba(3,8,18,0.38))", blend: "multiply", opacity: 0.75 },
      { bg: "radial-gradient(100% 72% at 50% 38%, rgba(72,214,240,0.22), rgba(0,0,0,0) 64%)", blend: "screen", opacity: 0.9 },
      { bg: "linear-gradient(0deg, rgba(59,91,219,0.16), rgba(0,0,0,0) 55%)", blend: "screen", opacity: 0.8 },
    ],
  },
};