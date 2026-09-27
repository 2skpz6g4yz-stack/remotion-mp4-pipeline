import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import type { ActId } from "../theme";
import { ACTS } from "../theme";
import { GRADE } from "../lib/grades";
import { moveOf } from "../lib/moves";
import type { Move } from "../lib/script";

type Props = {
  art: string;
  move: Move;
  act: ActId;
  /** 本镜头内 0..1 的进度 */
  p: number;
  /** 全片帧号，用于光扫的相位 */
  frame: number;
};

/**
 * 一张画面板 + 一组镜头运动 + 一套调色 + 前景雾气 + 掠光。
 * 每个镜头只换运动方向与掠光角度, 所以同一张图不会看出「重复播放」。
 */
export const Art: React.FC<Props> = ({ art, move, act, p, frame }) => {
  const a = ACTS[act];
  const m = moveOf(move, p);
  const grade = GRADE[act];

  const sweepAngle = 100 + ((frame / 30) % 7) * 3;
  const sweepX = interpolate(p, [0, 1], [-420, 420]);
  const hazeY = interpolate(p, [0, 1], [46, -46]);

  return (
    <AbsoluteFill style={{ backgroundColor: a.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: m.scale,
          translate: `${m.x}px ${m.y}px`,
          rotate: `${m.rotate}deg`,
          filter: m.blur > 0.05 ? `${grade.filter} blur(${m.blur.toFixed(2)}px)` : grade.filter,
        }}
      >
        <Img
          src={staticFile(`art/${art}.jpg`)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {grade.layers.map((l, i) => (
        <AbsoluteFill
          key={i}
          style={{ background: l.bg, mixBlendMode: l.blend as React.CSSProperties["mixBlendMode"], opacity: l.opacity }}
        />
      ))}

      {/* 前景雾气：反向缓慢平移, 伪造一层景深 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(0deg, ${a.paper}55 0%, rgba(0,0,0,0) 34%)`,
          translate: `0px ${hazeY}px`,
          opacity: act === "close" ? 0.35 : 0.55,
          mixBlendMode: "soft-light",
        }}
      />

      {/* 掠光：像一束扫过画面的侧光 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${sweepAngle}deg, rgba(0,0,0,0) 34%, ${a.accent}30 49%, rgba(255,255,255,0.06) 52%, rgba(0,0,0,0) 66%)`,
          translate: `${sweepX}px 0px`,
          mixBlendMode: "screen",
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};