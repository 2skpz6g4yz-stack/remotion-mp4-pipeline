import { Easing, interpolate } from "remotion";

export const ease = Easing.bezier(0.22, 0.61, 0.24, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 → 1 的入场：带一点延迟与缓出 */
export const rise = (f: number, delay = 0, dur = 26) =>
  interpolate(f, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

/** 入场 + 出场 */
export const pulse = (f: number, inAt: number, outAt: number, inDur = 24, outDur = 26) =>
  Math.min(
    interpolate(f, [inAt, inAt + inDur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    }),
    interpolate(f, [outAt, outAt + outDur], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeIn,
    })
  );

/** 定位到 0..1 的全局进度 */
export const track = (f: number, from: number, to: number) =>
  interpolate(f, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
