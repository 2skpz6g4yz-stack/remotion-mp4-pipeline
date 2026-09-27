import React from "react";
import { interpolate } from "remotion";
import type { ActId } from "../theme";
import { ACTS, FONTS } from "../theme";
import { easeOut } from "../lib/anim";
import type { Annot as AnnotSpec } from "../lib/script";

/**
 * 动态标注：压在画面上的一层信息。
 * 每个镜头最多挂一个, 省得画面打架；动画一定在本镜头结束前演完。
 */
export const AnnotLayer: React.FC<{ spec?: AnnotSpec; act: ActId; f: number; length: number }> = ({
  spec,
  act,
  f,
  length,
}) => {
  if (!spec) return null;
  const a = ACTS[act];
  const enter = interpolate(f, [6, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const out = interpolate(f, [Math.max(30, length - 22), Math.max(52, length - 2)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = Math.min(enter, out);

  if (spec.k === "counter") {
    // 计数窗按镜头长度收敛, 短镜头也来得及数完。
    const countEnd = Math.max(20, length * 0.62);
    const k = interpolate(f, [10, countEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    });
    const shown = spec.decimals
      ? (k * spec.to).toFixed(spec.decimals)
      : Math.round(k * spec.to).toLocaleString("en-US");
    return (
      <div
        style={{
          position: "absolute",
          right: 104,
          bottom: 104,
          textAlign: "right",
          opacity: op,
          fontFamily: FONTS.mono,
          color: a.ink,
          textShadow: "0 2px 22px rgba(0,0,0,0.85)",
        }}
      >
        <div style={{ fontSize: 17, letterSpacing: "0.34em", opacity: 0.62, textTransform: "uppercase" }}>
          {spec.label}
        </div>
        <div style={{ fontSize: 84, fontWeight: 500, letterSpacing: "0.02em", color: a.accent }}>
          {shown}
          {spec.unit ? <span style={{ fontSize: 30, color: a.ink, opacity: 0.8 }}>{spec.unit}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        bottom: 96,
        opacity: op,
        display: "flex",
        alignItems: "baseline",
        gap: 18,
        fontFamily: FONTS.serif,
        color: a.ink,
        textShadow: "0 2px 22px rgba(0,0,0,0.85)",
      }}
    >
      <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: "0.04em", color: a.accent }}>{spec.value}</span>
      {spec.note ? <span style={{ fontSize: 24, letterSpacing: "0.22em", opacity: 0.7 }}>{spec.note}</span> : null}
    </div>
  );
};