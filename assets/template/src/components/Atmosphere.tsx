import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import type { ActId } from "../theme";
import { ACTS } from "../theme";
import { rngOf } from "../lib/rng";

const COUNT: Record<string, number> = { dust: 58, ember: 54, mote: 62, spark: 50, star: 74 };

type P = { x: number; y: number; r: number; sp: number; ph: number; op: number; depth: number };

const build = (act: ActId, seed: string): P[] => {
  const rnd = rngOf(`${act}:${seed}`);
  const n = COUNT[ACTS[act].particle] ?? 70;
  return Array.from({ length: n }, () => {
    const depth = rnd();
    return {
      x: rnd() * 1920,
      y: rnd() * 1080,
      r: 0.8 + depth * 2.6,
      sp: 0.25 + depth * 1.15,
      ph: rnd() * Math.PI * 2,
      op: 0.18 + rnd() * 0.55,
      depth,
    };
  });
};

const look = (act: ActId, a: (typeof ACTS)[ActId]) => {
  switch (a.particle) {
    case "ember":
      return { color: `radial-gradient(circle, ${a.accent} 0%, rgba(178,58,46,0) 70%)`, dir: -1, twinkle: 0.5 };
    case "dust":
      return { color: "radial-gradient(circle, rgba(237,225,198,0.85) 0%, rgba(237,225,198,0) 70%)", dir: -1, twinkle: 0.25 };
    case "mote":
      return { color: `radial-gradient(circle, ${a.accent} 0%, rgba(77,107,254,0) 70%)`, dir: 1, twinkle: 0.45 };
    case "spark":
      return { color: `radial-gradient(circle, ${a.accent} 0%, rgba(72,214,240,0) 70%)`, dir: 1, twinkle: 0.15 };
    default:
      return { color: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(231,200,140,0) 70%)", dir: 0, twinkle: 0.7 };
  }
};

/** 漂浮粒子 + 胶片颗粒 + 暗角。三个东西叠在一起, 画面就不会"死"。 */
export const Atmosphere: React.FC<{ act: ActId; frame: number; seed: string; strength?: number }> = ({
  act,
  frame,
  seed,
  strength = 1,
}) => {
  const a = ACTS[act];
  const ps = build(act, seed);
  const lk = look(act, a);
  const t = frame / 30;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {ps.map((p, i) => {
        const drift = lk.dir === 0 ? Math.sin(t * 0.25 * p.sp + p.ph) * 26 : lk.dir * ((t * 22 * p.sp) % 1180);
        const y = ((p.y - drift) % 1140 + 1140) % 1140 - 30;
        const x = p.x + Math.sin(t * 0.4 * p.sp + p.ph) * 30;
        const tw = 1 - lk.twinkle / 2 + (lk.twinkle / 2) * (0.5 + 0.5 * Math.sin(t * 2.1 * p.sp + p.ph));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.r * 2,
              height: p.r * 2,
              background: lk.color,
              opacity: p.op * tw * strength,
            }}
          />
        );
      })}

      {/* 胶片颗粒：每帧微移, 不重复 */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("tex/grain.png")})`,
          backgroundSize: "512px 512px",
          backgroundPosition: `${(frame * 7) % 512}px ${(frame * 11) % 512}px`,
          mixBlendMode: "overlay",
          opacity: act === "civil" ? 0.22 : 0.15,
        }}
      />

      {/* 暗角 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(114% 90% at 50% 46%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.22) 80%, rgba(0,0,0,0.44) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
