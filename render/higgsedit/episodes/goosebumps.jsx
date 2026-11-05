// Cartoon scenes for "Why we get goosebumps" (2, 3, 5, 7, 9, 10).
import { Brain, Mascot } from "./mascot.jsx";
import { P, full, keys, show, bob, wiggle, pulse, big, bumps, Snow, circle, ellipse, INK, CYAN, YELLOW, W, H } from "./kit.jsx";

const SKIN = "#F2B8A0";
const MUSCLE = "#D9534F";

/** Spiky outline around an ellipse: fur standing up. */
function furPath(cx, cy, rx, ry, spikes = 34, len = 34) {
  const pts = [];
  for (let i = 0; i <= spikes * 2; i++) {
    const a = (i / (spikes * 2)) * 2 * Math.PI;
    const k = i % 2 === 0 ? 1 : 1 + len / Math.min(rx, ry);
    pts.push(`${i ? "L" : "M"}${(cx + rx * k * Math.cos(a)).toFixed(1)},${(cy + ry * k * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ") + " Z";
}

function Cat({ fluffAt, dur }) {
  return [
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(fluffAt, dur)}>
      {P(furPath(560, 1000, 240, 140, 40, 46), { fill: "#9A9AA8", stroke: { width: 10, color: INK } })}
    </frame>,
    P(ellipse(560, 1000, 230, 130), { fill: "#8E8E9A", stroke: { width: 12, color: INK } }),
    P("M780,950 C900,880 930,760 880,700", { stroke: { width: 30, color: INK, cap: "round" } }),
    P("M780,950 C900,880 930,760 880,700", { stroke: { width: 16, color: "#8E8E9A", cap: "round" } }),
    P("M300,880 L320,770 L370,850 Z M410,850 L460,770 L470,880 Z", { fill: "#8E8E9A", stroke: { width: 10, color: INK } }),
    P(circle(390, 920, 100), { fill: "#8E8E9A", stroke: { width: 12, color: INK } }),
    P(ellipse(355, 910, 11, 17), { fill: INK }),
    P(ellipse(425, 910, 11, 17), { fill: INK }),
    P("M375,955 Q390,968 405,955", { stroke: { width: 7, color: INK, cap: "round" } }),
    P("M380,1120 L380,1190 M470,1125 L470,1195 M650,1125 L650,1195 M740,1115 L740,1185", { stroke: { width: 26, color: INK, cap: "round" } }),
  ];
}

const SCENES = {
  // "Goosebumps! But why?"
  2: ({ dur }) => full([
    ...Snow({ dur, n: 8 }),
    big("BRRR!", 250, "#DDF3FF", 80),
    <Mascot x={240} y={330} arms={["downL", "downR"]} expr={{ brows: "up", mouth: "o" }} animate={wiggle(dur, 2, 0.12)} />,
    ...bumps(470, 820, 150, 320, 16),
  ]),

  // "Every hair has a tiny muscle. A nerve tells it to squeeze."
  3: ({ dur, cue }) => {
    const tNerve = cue("nerve", dur * 0.45);
    const tSqueeze = cue("squeeze", dur * 0.75);
    return full([
      <rect x={60} y={940} width={960} height={380} radius={30} fill={SKIN} strokeColor={INK} strokeWidth={10} />,
      P(ellipse(560, 1080, 46, 90), { fill: "#C9826A", stroke: { width: 8, color: INK } }),
      // muscle: brightens and thickens on "squeeze"
      P("M590,1140 C660,1100 700,1040 730,960", { stroke: { width: 30, color: MUSCLE, cap: "round" } }),
      <frame x={0} y={0} width={W} height={H} layout="none" animate={show(tSqueeze, dur)}>
        {P("M590,1140 C650,1095 680,1050 700,990", { stroke: { width: 40, color: "#FF4D4D", cap: "round" } })}
        {P("M480,940 C520,880 600,880 640,940", { fill: SKIN, stroke: { width: 10, color: INK } })}
      </frame>,
      // the hair: pivots upright on "squeeze"
      <frame x={260} y={760} width={600} height={600} origin="center" layout="none"
        animate={[{ property: "rotation", keyframes: keys(dur, [{ at: 0, value: -38 }, { at: tSqueeze, value: -38 }, { at: tSqueeze + 0.35, value: 0, easing: "ease-out" }, { at: dur, value: 0 }]) }]}>
        <path d="M300,300 L300,-20" x={0} y={0} width={600} height={600} stroke={{ width: 12, color: INK, cap: "round" }} />
      </frame>,
      <frame x={0} y={0} width={W} height={H} layout="none" animate={show(tNerve, dur)}>
        {P("M1010,1260 C900,1240 820,1150 735,975", { stroke: { width: 10, color: YELLOW, cap: "round" }, dash: [22, 14] })}
        <text x={780} y={1340} width={260} fontFamily="Montserrat" fontWeight={800} fontSize={40} color={YELLOW}>NERVE</text>
      </frame>,
      <text x={720} y={880} width={300} fontFamily="Montserrat" fontWeight={800} fontSize={40} color={MUSCLE}>MUSCLE</text>,
      <text x={590} y={640} width={240} fontFamily="Montserrat" fontWeight={800} fontSize={40} color="#FFFFFF">HAIR</text>,
    ]);
  },

  // "For furry animals, that matters."
  5: ({ dur }) => full([...Cat({ fluffAt: dur * 0.35, dur })]),

  // "We lost the fur, but kept the reflex."
  7: ({ dur, cue }) => full([
    <Mascot x={240} y={360} arms={["shrugL", "shrugR"]} expr={{ brows: "raised", mouth: "smile" }} animate={bob(dur, 6)} />,
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(cue("kept", dur * 0.5), dur)}>
      {bumps(470, 850, 150, 300, 16)}
    </frame>,
  ]),

  // "In long cold spells, the mice grew fur faster!"
  9: ({ dur }) => {
    const stage = (k) => show(0.3 + k * ((dur - 0.6) / 3), dur);
    return full([
      ...Snow({ dur, n: 9 }),
      <frame x={0} y={0} width={W} height={H} layout="none" animate={stage(1)}>{P(furPath(560, 1000, 190, 120, 34, 22), { fill: "#B9B9C4", stroke: { width: 8, color: INK } })}</frame>,
      <frame x={0} y={0} width={W} height={H} layout="none" animate={stage(2)}>{P(furPath(560, 1000, 200, 128, 38, 40), { fill: "#C6C6D0", stroke: { width: 8, color: INK } })}</frame>,
      P(ellipse(560, 1000, 180, 110), { fill: "#A6A6B2", stroke: { width: 10, color: INK } }),
      P("M735,1010 C820,1040 860,1110 820,1180", { stroke: { width: 10, color: "#E79AAE", cap: "round" } }),
      P(circle(335, 905, 46), { fill: "#F6A5B5", stroke: { width: 8, color: INK } }),
      P(circle(400, 960, 78), { fill: "#A6A6B2", stroke: { width: 10, color: INK } }),
      P(ellipse(375, 950, 9, 14), { fill: INK }),
      P(circle(325, 985, 12), { fill: "#E79AAE" }),
    ]);
  },

  // "Goosebumps aren't useless. They're an ancient signal, still wired in."
  10: ({ dur, cue }) => full([
    <Brain x={390} y={230} glow={true} animate={pulse(dur, 0.95, 1.05, 1.4)} />,
    <Mascot x={240} y={480} scale={0.85} arms={["downL", "downR"]} expr={{ eyes: "up", brows: "up", mouth: "smile" }} />,
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(cue("ancient", dur * 0.4), dur)}>
      {P("M540,450 C540,560 560,640 600,760 C640,900 650,1040 660,1180", { stroke: { width: 12, color: YELLOW, cap: "round" }, dash: [20, 12] })}
      {P("M540,450 C540,560 560,640 600,760 C640,900 650,1040 660,1180", { stroke: { width: 26, color: YELLOW, cap: "round" }, blendMode: "screen", effects: [{ kind: "blur", params: { px: 12 } }] })}
    </frame>,
  ]),
};

export function scene(n, ctx) {
  const f = SCENES[n];
  if (!f) throw new Error(`no cartoon scene ${n}`);
  return f(ctx);
}
