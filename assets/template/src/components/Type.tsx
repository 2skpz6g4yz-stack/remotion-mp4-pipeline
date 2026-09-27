import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import type { ActId } from "../theme";
import { ACTS, FONTS, TERMS } from "../theme";
import { easeOut, pulse } from "../lib/anim";

/* ---------------------------------------------------------------- 自动强调 */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NUM = "([0-9][0-9,.]*(?:\\s?(?:万亿|亿|万|千|百|%|美元|万元|张|只|个|年|月|日|秒|倍|度))?)";

/** 数字与专有名词自动染成强调色 —— 不用手写标记, 也不会漏。 */
const KEY = new RegExp(TERMS.length ? `${NUM}|(${TERMS.map(escapeRe).join("|")})` : NUM, "g");

export const rich = (text: string, accent: string, ink: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  KEY.lastIndex = 0;
  let i = 0;
  while ((m = KEY.exec(text))) {
    if (m.index > last) out.push(<span key={i++} style={{ color: ink }}>{text.slice(last, m.index)}</span>);
    out.push(
      <span key={i++} style={{ color: accent, fontWeight: 700 }}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={i++} style={{ color: ink }}>{text.slice(last)}</span>);
  return out;
};

/* ---------------------------------------------------------------- 字幕 */

export const Subtitle: React.FC<{
  zh: string;
  en?: string;
  /** 本条字幕的本地帧 */
  f: number;
  length: number;
  act: ActId;
}> = ({ zh, en, f, length, act }) => {
  const a = ACTS[act];
  // 快剪版里一条字幕可能只有 1.5 秒, 淡入淡出要跟着缩短, 否则永远到不了全亮。
  const tight = length < 50;
  const fin = tight ? Math.round(length * 0.3) : 20;
  const fout = tight ? Math.round(length * 0.26) : 18;
  const op = pulse(f, 0, tight ? Math.max(fin, length - fout) : Math.max(10, length - 20), fin, fout);
  const y = interpolate(f, [0, Math.min(24, Math.max(8, length * 0.4))], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const clock = act === "close";

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 118 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 380,
          background: `linear-gradient(0deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.30) 46%, rgba(0,0,0,0) 100%)`,
          opacity: op * 0.9,
        }}
      />
      <div style={{ position: "relative", width: 1480, textAlign: "center", opacity: op, translate: `0px ${y}px` }}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontWeight: act === "close" ? 500 : 600,
            fontSize: 47,
            lineHeight: 1.42,
            letterSpacing: "0.02em",
            color: a.ink,
            textShadow: "0 2px 22px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          {rich(zh, a.accent, a.ink)}
        </div>
        {en ? (
          <div
            style={{
              marginTop: 13,
              fontFamily: clock ? FONTS.mono : FONTS.latin,
              fontStyle: clock ? "normal" : "italic",
              fontSize: clock ? 18 : 23,
              letterSpacing: clock ? "0.14em" : "0.03em",
              color: a.ink,
              opacity: 0.6,
              textTransform: clock ? "uppercase" : "none",
            }}
          >
            {en}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 年代 / 地点 */

export const Kicker: React.FC<{ era: string; act: ActId; f: number; out: number }> = ({ era, act, f, out }) => {
  const a = ACTS[act];
  const op = pulse(f, 6, out, 26, 24);
  const tech = act === "close";
  const x = interpolate(f, [6, 34], [-14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        top: 74,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: op * 0.92,
        translate: `${x}px 0px`,
      }}
    >
      <div style={{ width: 3, height: tech ? 26 : 30, background: a.accent, boxShadow: `0 0 18px ${a.accent}aa` }} />
      <div
        style={{
          fontFamily: tech ? FONTS.mono : FONTS.serif,
          fontSize: tech ? 20 : 25,
          fontWeight: tech ? 400 : 600,
          letterSpacing: tech ? "0.22em" : "0.2em",
          textTransform: tech ? "uppercase" : "none",
          color: a.ink,
          opacity: 0.86,
          textShadow: "0 2px 18px rgba(0,0,0,0.8)",
        }}
      >
        {era}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- 大标题 */

export const BigTitle: React.FC<{
  zh: string;
  en?: string;
  sub?: string;
  act: ActId;
  f: number;
  align?: "center" | "left";
}> = ({ zh, en, sub, act, f, align = "center" }) => {
  const a = ACTS[act];
  const op = interpolate(f, [0, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const y = interpolate(f, [0, 44], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const sp = interpolate(f, [0, 60], [0.5, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : 130,
        right: align === "center" ? 0 : undefined,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align === "center" ? "center" : "flex-start",
        opacity: op,
        translate: `0px ${y}px`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.serif,
          fontWeight: 800,
          fontSize: 132,
          letterSpacing: `${sp}em`,
          color: a.ink,
          textShadow: `0 6px 44px rgba(0,0,0,0.9), 0 0 90px ${a.accent}44`,
        }}
      >
        {zh}
      </div>
      {en ? (
        <div
          style={{
            marginTop: 26,
            fontFamily: FONTS.latin,
            fontSize: 30,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: a.accent,
            opacity: 0.92,
          }}
        >
          {en}
        </div>
      ) : null}
      {sub ? (
        <div
          style={{
            marginTop: 30,
            fontFamily: FONTS.serif,
            fontSize: 26,
            letterSpacing: "0.16em",
            color: a.ink,
            opacity: 0.62,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};