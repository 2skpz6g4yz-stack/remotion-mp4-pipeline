/**
 * 全片配乐：按 src/lib/script.ts 的真实分幕时间轴, 逐幕换和声。
 * 没有采样库, 所有音色都是现场合成的（加法 pad / 钟 / 噪升）。
 *
 *   node scripts/make-audio.mjs
 *
 * 产出 public/audio/bgm.wav（32kHz 立体声）。
 * 想要成片带声音, 再把 src/config.ts 里的 AUDIO 改成 "audio/bgm.wav"。
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

/* ------------------------------------------- 先把 TS 里的时间轴取出来 */
const TMPDIR = path.join(ROOT, ".tmp");
fs.mkdirSync(TMPDIR, { recursive: true });
const ENTRY = path.join(TMPDIR, "timeline-entry.ts");
const BUNDLE = path.join(TMPDIR, "timeline.mjs");
fs.writeFileSync(ENTRY, 'export { VIDEO } from "../src/theme";\nexport * from "../src/lib/script";\n');
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: BUNDLE,
  logLevel: "error",
});

const T = await import(pathToFileURL(BUNDLE).href + `?t=${Date.now()}`);
const fps = T.VIDEO.fps;
const SR = 32000;
const TOTAL = T.TOTAL_FRAMES / fps;
const acts = T.ACT_SPANS_OF("long").map((a) => ({ act: a.act, from: a.from / fps, to: a.to / fps }));

/* ------------------------------------------------------------ 和声 */
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** 每一幕一组音：低音 + 两个内声部 + 一个高音铺底。 */
const CHORD = {
  open: [45, 52, 57, 64],
  body: [41, 48, 53, 60],
  close: [43, 50, 55, 62],
};

const L = new Float32Array(Math.ceil(TOTAL * SR) + SR * 4);
const R = new Float32Array(L.length);

const add = (start, buf, gain, pan = 0) => {
  const s = Math.max(0, Math.floor(start * SR));
  const lg = gain * (1 - Math.max(0, pan));
  const rg = gain * (1 + Math.min(0, pan));
  for (let i = 0; i < buf.length; i++) {
    const j = s + i;
    if (j >= L.length) break;
    L[j] += buf[i] * lg;
    R[j] += buf[i] * rg;
  }
};

let seed = 20260927;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};

/** 加法 pad：三个微失谐正弦 + 慢起慢落 */
const pad = (midi, dur, bright = 1) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  const f = mtof(midi);
  const parts = [1, 1.006, 0.9945];
  const harm = [1, 2, 3, 4];
  const hg = [1, 0.3 * bright, 0.13 * bright, 0.05 * bright];
  const atk = Math.min(3.2, dur * 0.35);
  const rel = Math.min(4.5, dur * 0.45);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let env = 1;
    if (t < atk) env = t / atk;
    else if (t > dur - rel) env = Math.max(0, (dur - t) / rel);
    env *= env * (3 - 2 * env);
    let v = 0;
    for (let p = 0; p < parts.length; p++) {
      const vib = 1 + 0.0016 * Math.sin(2 * Math.PI * 0.19 * t + p);
      for (let h = 0; h < harm.length; h++) {
        v += hg[h] * Math.sin(2 * Math.PI * f * parts[p] * harm[h] * vib * t + h * 1.7);
      }
    }
    out[i] = (v / (parts.length * 1.7)) * env;
  }
  return out;
};

/** 钟：非谐分音 + 指数衰减 */
const bell = (midi, dur = 5.5, gain = 1) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  const f = mtof(midi);
  const ratios = [1, 2.01, 2.98, 4.1, 5.43, 6.8];
  const amps = [1, 0.5, 0.32, 0.18, 0.1, 0.06];
  const dec = [1, 1.5, 2.1, 2.8, 3.6, 4.4];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < ratios.length; k++) {
      v += amps[k] * Math.exp(-dec[k] * t) * Math.sin(2 * Math.PI * f * ratios[k] * t);
    }
    out[i] = v * Math.min(1, t / 0.004) * gain;
  }
  return out;
};

/** 噪升：一条慢慢涨落的嘶声, 用在换幕那一下 */
const swell = (dur, gain = 1) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.sin((Math.PI * t) / dur) ** 2;
    lp = lp * 0.94 + rnd() * 0.06;
    out[i] = lp * env * 1.6 * gain;
  }
  return out;
};

/* ------------------------------------------------------------ 排布 */
acts.forEach((a, i) => {
  const notes = CHORD[a.act] ?? CHORD.open;
  const dur = a.to - a.from + 2.4;
  notes.forEach((m, k) => add(a.from, pad(m, dur, k === 0 ? 1.25 : 0.9), k === 0 ? 0.13 : 0.075, (k - 1.5) * 0.18));
  add(a.from, pad(notes[0] - 12, dur + 1.6, 1.1), 0.085, 0);
  add(a.from, bell(notes[3] + 12, 6.5, 0.5), 0.075, (i % 2 ? 1 : -1) * 0.25);
  if (i > 0) add(a.from - 1.2, swell(3.2, 0.5), 0.05, 0);
});

// 每 9 秒点一颗钟, 免得中段太静
for (let t = 7; t < TOTAL - 3; t += 9) {
  const act = [...acts].reverse().find((a) => t >= a.from) ?? acts[0];
  const notes = CHORD[act.act] ?? CHORD.open;
  add(t, bell(notes[2] + 12, 5, 0.32), 0.05, Math.sin(t) * 0.4);
}

/* ------------------------------------------------------------ 归一化 + 写盘 */
let peak = 0;
for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = peak > 0 ? 0.72 / peak : 1;

// 只写到片子结束, 免得音轨比画面长
const frames = Math.ceil(TOTAL * SR);
const buf = Buffer.alloc(44 + frames * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + frames * 4, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) {
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * g * 32767))), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * g * 32767))), 46 + i * 4);
}

const out = path.join(ROOT, "public", "audio", "bgm.wav");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log(`${path.relative(ROOT, out)}  ${(buf.length / 1048576).toFixed(1)} MB  ${TOTAL.toFixed(1)}s`);
console.log('带上音轨: 把 src/config.ts 的 AUDIO 改成 "audio/bgm.wav"');