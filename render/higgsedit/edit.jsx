// Generic episode edit: photoreal clips + code-drawn cartoon scenes, labels,
// karaoke captions, end card. Episode-specific cartoon scenes live in
// episodes/<slug>.jsx (copied to ./episode.jsx by run.sh).
import T from "./timeline.js";
import { Backdrop, Caption, EndCard, Label, Scrim, W, H } from "./brand.jsx";
import * as episode from "./episode.jsx";

const clean = (s) => s.replace(/[.,!…]+$/, "");

export default async ({ project }) => {
  const p = await project({ dir: ".", size: "1080x1920", fps: 30, background: "#0B1220" });
  const mix = await p.add("../mix.wav");
  const clips = {};
  for (const s of T.scenes) if (s.clip) clips[s.n] = await p.add(s.clip);

  const sceneFrames = T.scenes.map((s, i) => {
    // cue(text) = seconds from scene start when that word is spoken
    const cue = (word, fallback = 0) => {
      const w = s.words.find((x) => clean(x.text).toLowerCase() === word.toLowerCase());
      return w ? Math.max(0, Math.min(s.dur - 0.1, w.at - s.start)) : fallback;
    };
    const body =
      s.style === "photoreal" ? (
        <frame x={0} y={0} width={W} height={H} origin="center" layout="none"
          animate={[{ property: "scale", from: 1.0, to: 1.06, at: 0, duration: s.dur, easing: "linear" }]}>
          <media file={clips[s.n]} x={0} y={0} width={W} height={H} fit="cover" />
        </frame>
      ) : (
        episode.scene(s.n, { dur: s.dur, cue })
      );
    return (
      <frame key={i} at={s.start} duration={s.dur} x={0} y={0} width={W} height={H} layout="none">
        {s.style === "photoreal" ? null : <Backdrop />}
        {body}
        {s.style === "photoreal" ? <Scrim /> : null}
        {Label({ text: s.label })}
      </frame>
    );
  });

  const caps = T.captions.map((c, i) => (
    <frame key={`c${i}`} at={c.at} duration={c.dur} x={0} y={0} width={W} height={H} layout="none">
      <Caption words={c.words.map((w) => ({ ...w, text: clean(w.text) || w.text }))} at={0} duration={c.dur} />
    </frame>
  ));

  p.compose(
    <frame width={W} height={H} layout="none">
      {sceneFrames}
      {caps}
      <frame at={T.voiceEnd} duration={T.endCard} x={0} y={0} width={W} height={H} layout="none">
        {EndCard()}
      </frame>
    </frame>,
    { at: 0, dur: T.total },
  );
  p.cut(mix, { at: 0 });
};
