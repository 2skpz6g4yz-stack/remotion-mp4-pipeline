import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { dissolve } from "@remotion/transitions/dissolve";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AUDIO } from "./config";
import type { Mode } from "./lib/script";
import { SCENES_OF, TIMELINE_OF, sceneDur, timingOf } from "./lib/script";
import { SceneView } from "./scenes/SceneView";

/**
 * 转场按「它要表达什么」来挑, 连着两段不用同一种。
 * 需要更多效果就从 @remotion/transitions 里引, 名字见 references/pipeline.md。
 */
const PRES: (() => React.ReactElement)[] = [
  () => fade(),
  () => dissolve({ intensity: 0.8 }),
  () => wipe({ direction: "from-left" }),
  () => slide({ direction: "from-right" }),
];

/** 同一批画面、同一份文案, 两套节奏。转场顺序两边完全一致。 */
const Program: React.FC<{ mode: Mode }> = ({ mode }) => {
  const tl = TIMELINE_OF(mode);
  const scenes = SCENES_OF(mode);
  const timing = linearTiming({ durationInFrames: timingOf(mode).transition });

  return (
    <AbsoluteFill style={{ backgroundColor: "#04060C" }}>
      {AUDIO ? <Audio src={staticFile(AUDIO)} volume={0.62} /> : null}
      <TransitionSeries>
        {scenes.flatMap((s, i) => {
          const dur = sceneDur(s, mode);
          const nodes: React.ReactNode[] = [
            <TransitionSeries.Sequence key={`s-${s.id}`} name={s.id} durationInFrames={dur}>
              <SceneView span={tl[i]} sceneDuration={dur} mode={mode} />
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1) {
            const P = PRES[i % PRES.length];
            nodes.push(<TransitionSeries.Transition key={`t-${s.id}`} presentation={P()} timing={timing} />);
          }
          return nodes;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** 完整版。 */
export const Film: React.FC = () => <Program mode="long" />;

/** 精简版：画面与顺序不变, 只换成快剪节奏。 */
export const FilmShort: React.FC = () => <Program mode="short" />;