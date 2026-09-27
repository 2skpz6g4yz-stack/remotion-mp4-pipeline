import React from "react";
import { Composition, Folder } from "remotion";
import { Film, FilmShort } from "./Main";
import { SCENES, TIMELINE, TOTAL_FRAMES, TOTAL_FRAMES_OF, sceneDur } from "./lib/script";
import { VIDEO } from "./theme";
import { SceneView } from "./scenes/SceneView";

const meta = { width: VIDEO.width, height: VIDEO.height, fps: VIDEO.fps };

/** Remotion 只接受 a-z A-Z 0-9 CJK 和 -。 */
const sid = (s: { id: string; title: string }) => `${s.id}-${s.title.replace(/[^\w\u4e00-\u9fff-]/g, "")}`;

const Scene: React.FC<{ i: number }> = ({ i }) => (
  <SceneView span={TIMELINE[i]} sceneDuration={sceneDur(SCENES[i])} mode="long" />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} {...meta} durationInFrames={TOTAL_FRAMES} />
    <Composition id="FilmShort" component={FilmShort} {...meta} durationInFrames={TOTAL_FRAMES_OF("short")} />
    <Folder name="Scenes">
      {SCENES.map((s, i) => (
        <Composition
          key={s.id}
          id={sid(s)}
          component={Scene}
          defaultProps={{ i }}
          {...meta}
          durationInFrames={sceneDur(s)}
        />
      ))}
    </Folder>
  </>
);