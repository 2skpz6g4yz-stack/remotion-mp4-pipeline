import type { Move } from "./script";

export type MoveState = {
  scale: number;
  x: number;
  y: number;
  rotate: number;
  /** 焦外模糊（px），仅 rackFocus 用 */
  blur: number;
};

/**
 * 把 0..1 的镜头进度翻译成变换。
 * 所有镜头都从 1.05 以上的底scale 开始，保证推拉时不会露出画外。
 */
export const moveOf = (move: Move, p: number): MoveState => {
  const lin = (a: number, b: number) => a + (b - a) * p;
  const wave = Math.sin(p * Math.PI);
  switch (move) {
    case "pushIn":
      return { scale: lin(1.05, 1.19), x: 0, y: 0, rotate: 0, blur: 0 };
    case "pullOut":
      return { scale: lin(1.2, 1.05), x: 0, y: 0, rotate: 0, blur: 0 };
    case "panLeft":
      return { scale: 1.17, x: lin(62, -62), y: 0, rotate: 0, blur: 0 };
    case "panRight":
      return { scale: 1.17, x: lin(-62, 62), y: 0, rotate: 0, blur: 0 };
    case "tiltUp":
      return { scale: 1.17, x: 0, y: lin(48, -48), rotate: 0, blur: 0 };
    case "tiltDown":
      return { scale: 1.17, x: 0, y: lin(-48, 48), rotate: 0, blur: 0 };
    case "driftTR":
      return { scale: 1.15, x: lin(-42, 42), y: lin(26, -26), rotate: 0, blur: 0 };
    case "driftBL":
      return { scale: 1.15, x: lin(42, -42), y: lin(-26, 26), rotate: 0, blur: 0 };
    case "arcCW":
      return { scale: lin(1.09, 1.18), x: 0, y: 0, rotate: lin(-1.1, 1.1), blur: 0 };
    case "arcCCW":
      return { scale: lin(1.18, 1.09), x: 0, y: 0, rotate: lin(1.1, -1.1), blur: 0 };
    case "rackFocus":
      return { scale: lin(1.06, 1.15), x: 0, y: 0, rotate: 0, blur: lin(3.4, 0) };
    case "breathe":
      return { scale: 1.07 + wave * 0.035, x: 0, y: wave * 8, rotate: 0, blur: 0 };
  }
};
