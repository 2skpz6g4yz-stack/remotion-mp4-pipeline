import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ACTS } from "../theme";
import type { Mode, SceneSpan } from "../lib/script";
import { chapterLead, timingOf } from "../lib/script";
import { Art } from "../components/Art";
import { Atmosphere } from "../components/Atmosphere";
import { AnnotLayer } from "../components/Annot";
import { BigTitle, Kicker, Subtitle } from "../components/Type";

/**
 * 一幕 = 若干镜头 + 若干条字幕。
 * 画面、镜头运动、动态标注都跟着字幕走, 所以「图」和「文」永远对得上。
 */
export const SceneView: React.FC<{ span: SceneSpan; sceneDuration: number; mode: Mode }> = ({
  span,
  sceneDuration,
  mode,
}) => {
  const frame = useCurrentFrame();
  const tm = timingOf(mode);
  const act = span.scene.act;
  const a = ACTS[act];

  // 章节卡期间（第一镜还没开始）算作停在第 0 镜, 不能算成最后一镜
  const si = span.shots.findIndex((s) => frame >= s.from - span.from && frame < s.to - span.from);
  const shotIndex = si === -1 ? (frame < span.shots[0].from - span.from ? 0 : span.shots.length - 1) : si;
  const shotSpan = span.shots[shotIndex];
  const shotLocal = Math.max(0, frame - (shotSpan.from - span.from));
  const shotLen = shotSpan.to - shotSpan.from;
  const p = Math.max(0, Math.min(1, shotLocal / Math.max(1, shotLen)));

  const cap = span.captions.find((c) => frame >= c.from && frame < c.to);

  const lead = chapterLead(span.scene, mode);
  const titleOp =
    lead > 0
      ? interpolate(frame, [lead - 34, lead - 8], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: a.bg }}>
      <Art art={shotSpan.shot.art} move={shotSpan.shot.move} act={act} p={p} frame={frame} />
      <Atmosphere act={act} frame={frame} seed={shotSpan.shot.art} strength={0.9} />
      <AnnotLayer spec={shotSpan.shot.annot} act={act} f={shotLocal} length={shotLen} />
      <Kicker era={span.scene.era} act={act} f={frame} out={sceneDuration - tm.sceneOut - 8} />
      {span.scene.chapter && titleOp > 0 ? (
        <AbsoluteFill style={{ opacity: titleOp }}>
          <BigTitle
            zh={span.scene.title}
            en={span.scene.chapter.latin}
            sub={span.scene.chapter.name}
            act={act}
            f={frame}
          />
        </AbsoluteFill>
      ) : null}
      {cap ? (
        <Subtitle zh={cap.text} en={cap.en} f={frame - cap.from} length={cap.to - cap.from} act={act} />
      ) : null}
    </AbsoluteFill>
  );
};