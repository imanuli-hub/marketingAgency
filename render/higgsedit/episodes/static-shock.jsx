// Cartoon scenes for "Why static shocks are worse in winter" (2, 3, 5, 7, 9, 10).
import { Mascot } from "./mascot.jsx";
import { P, full, keys, show, hideAt, bob, wiggle, pulse, big, Gauge, Steps, Snow, sparkPath, charge, circle, ellipse, INK, CYAN, YELLOW, W, H } from "./kit.jsx";

const BRASS = "#C9A227";
const CARPET = "#3B4A6B";

const flash = (dur, period = 0.3) => [{ property: "opacity", keyframes: [{ at: 0, value: 1 }, { at: period / 2, value: 0.15 }, { at: period, value: 1 }], repeat: Math.max(2, Math.floor((dur - 0.05) / period)) }];

const SCENES = {
  // "Ouch! Why is it worse in winter?"
  2: ({ dur }) => full([
    ...Snow({ dur, n: 8 }),
    P(circle(930, 840, 52), { fill: BRASS, stroke: { width: 10, color: INK } }),
    <rect x={960} y={790} width={120} height={100} fill="#6B4E31" />,
    <frame x={0} y={0} width={W} height={H} layout="none" animate={flash(dur)}>
      {P(sparkPath(860, 820, 0.9), { fill: YELLOW, stroke: { width: 6, color: INK } })}
    </frame>,
    <Mascot x={150} y={360} arms={["downL", "reachR"]} expr={{ eyes: "blank", brows: "up", mouth: "o" }} animate={wiggle(dur, 2, 0.14)} />,
    big("OUCH!", 260, YELLOW, 90),
  ]),

  // "As you walk, charge moves between your shoes and the carpet."
  3: ({ dur }) => {
    const hop = (i) => [
      { property: "offsetY", keyframes: keys(dur, [{ at: 0, value: 0 }, { at: 0.3 + i * 0.35, value: 0 }, { at: 0.75 + i * 0.35, value: -130, easing: "ease-out" }, { at: dur, value: -130 }]) },
      { property: "opacity", keyframes: keys(dur, [{ at: 0, value: 0, easing: "hold" }, { at: 0.3 + i * 0.35, value: 1 }, { at: dur, value: 1 }]) },
    ];
    return full([
      <rect x={0} y={1130} width={W} height={240} fill={CARPET} />,
      P("M40,1150 L40,1190 M110,1150 L110,1190 M180,1150 L180,1190 M250,1150 L250,1190 M320,1150 L320,1190 M390,1150 L390,1190 M460,1150 L460,1190 M530,1150 L530,1190 M600,1150 L600,1190 M670,1150 L670,1190 M740,1150 L740,1190 M810,1150 L810,1190 M880,1150 L880,1190 M950,1150 L950,1190 M1020,1150 L1020,1190", { stroke: { width: 6, color: "#5A6C94", cap: "round" } }),
      <frame x={0} y={0} width={W} height={H} layout="none"
        animate={[{ property: "offsetX", from: -260, to: 220, at: 0, duration: dur - 0.02, easing: "ease-in-out" }, ...bob(dur, 30)]}>
        {P("M380,1130 L380,1000 C380,960 470,960 470,1000 L470,1050 C560,1060 660,1080 670,1130 Z", { fill: "#2B2B33", stroke: { width: 10, color: INK } })}
        {P("M370,1130 L680,1130", { stroke: { width: 18, color: INK, cap: "round" } })}
      </frame>,
      ...[0, 1, 2, 3, 4].map((i) => (
        <frame key={`c${i}`} x={0} y={0} width={W} height={H} layout="none" animate={hop(i)}>
          {charge(330 + i * 110, 1110, i % 2 === 0)}
        </frame>
      )),
    ]);
  },

  // "But winter air is dry, and heating dries it more."
  5: ({ dur, cue }) => {
    const tDry = cue("dries", dur * 0.6);
    return full([
      ...Gauge({ cx: 540, cy: 760, r: 260, label: "HUMIDITY", fromDeg: 0, toDeg: -62, at: Math.max(0.2, tDry - 0.3), dur, lowColor: "#FF9F43", highColor: CYAN }),
      ...Steps({ values: ["50%", "30%", "15%"], y: 880, t0: 0.3, t1: Math.min(dur - 0.2, tDry + 0.5), dur, color: "#FFFFFF", size: 64 }),
      <rect x={140} y={1020} width={340} height={260} radius={20} fill="#C9CED8" strokeColor={INK} strokeWidth={10} />,
      P("M200,1040 L200,1260 M260,1040 L260,1260 M320,1040 L320,1260 M380,1040 L380,1260 M440,1040 L440,1260", { stroke: { width: 10, color: "#8E95A3" } }),
      <frame x={0} y={0} width={W} height={H} layout="none" animate={pulse(dur, 0.98, 1.02, 0.8)}>
        {P("M220,990 C200,950 240,930 220,890 M310,990 C290,950 330,930 310,890 M400,990 C380,950 420,930 400,890", { stroke: { width: 9, color: "#FF9F43", cap: "round" } })}
      </frame>,
    ]);
  },

  // "Tens of THOUSANDS? Isn't that deadly?"
  7: ({ dur }) => full([
    ...Steps({ values: ["1,500 V", "10,000 V", "35,000 V"], y: 270, t0: 0, t1: dur * 0.7, dur, color: YELLOW, size: 110 }),
    <Mascot x={240} y={520} scale={0.85} arms={["shrugL", "shrugR"]} expr={{ eyes: "open", brows: "up", mouth: "o" }} animate={wiggle(dur, 2, 0.16)} />,
  ]),

  // "That's why a humidifier helps: wetter air drains the charge."
  9: ({ dur }) => {
    const puff = (i) => [
      { property: "offsetY", from: 0, to: -320, at: 0.1 + i * 0.35, duration: Math.max(0.3, dur - 0.15 - i * 0.35), easing: "ease-out" },
      { property: "opacity", keyframes: keys(dur, [{ at: 0, value: 0, easing: "hold" }, { at: 0.1 + i * 0.35, value: 1 }, { at: dur, value: 0.55 }]) },
    ];
    return full([
      <rect x={400} y={900} width={280} height={360} radius={60} fill="#DDEBF5" strokeColor={INK} strokeWidth={10} />,
      <rect x={470} y={980} width={140} height={60} radius={30} fill={CYAN} />,
      ...[0, 1, 2, 3].map((i) => (
        <frame key={`p${i}`} x={0} y={0} width={W} height={H} layout="none" animate={puff(i)}>
          {P(circle(540 + (i % 2 ? 50 : -50), 860, 70 + i * 10), { fill: "#FFFFFF", stroke: { width: 6, color: "#B8D8EE" } })}
        </frame>
      )),
      ...[0, 1, 2, 3].map((i) => (
        <frame key={`q${i}`} x={0} y={0} width={W} height={H} layout="none" animate={hideAt(0.6 + i * 0.4, dur)}>
          {charge(200 + i * 230, 560 + (i % 2) * 120, i % 2 === 0)}
        </frame>
      )),
    ]);
  },

  // "That spark is a tiny lightning bolt... and YOU made it."
  10: ({ dur, cue }) => full([
    <Mascot x={240} y={500} scale={0.85} arms={["downL", "upR"]} expr={{ eyes: "happy", mouth: "smile" }} animate={bob(dur, 6)} />,
    <frame x={0} y={0} width={W} height={H} layout="none" animate={pulse(dur, 0.92, 1.08, 0.6)}>
      {P(circle(720, 560, 170), { fill: "#FFD84D55" })}
      {P(sparkPath(720, 560, 2.2), { fill: YELLOW, stroke: { width: 4, color: "#B07800" } })}
    </frame>,
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(cue("you", dur * 0.6), dur)}>
      {big("POCKET LIGHTNING", 300, YELLOW, 64)}
    </frame>,
  ]),
};

export function scene(n, ctx) {
  const f = SCENES[n];
  if (!f) throw new Error(`no cartoon scene ${n}`);
  return f(ctx);
}
