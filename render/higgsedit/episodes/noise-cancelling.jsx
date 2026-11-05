// Cartoon scenes for "How noise-cancelling headphones erase sound" (2, 3, 5, 7, 9, 10).
import { Mascot } from "./mascot.jsx";
import { P, full, keys, show, bob, pulse, big, headPos, wavePath, circle, ellipse, INK, CYAN, YELLOW, W, H } from "./kit.jsx";

const GREY = "#2A2F3A";

/** Over-ear headphones drawn around a mascot head. */
function Headphones({ x, y, s }) {
  const { cx, cy, r } = headPos(x, y, s);
  const band = `M${cx - r - 18},${cy - 10} C${cx - r - 18},${cy - r - 120} ${cx + r + 18},${cy - r - 120} ${cx + r + 18},${cy - 10}`;
  const cup = (sx) => <rect x={cx + sx * (r + 6) - 32} y={cy - 70} width={64} height={140} radius={26} fill={GREY} strokeColor={INK} strokeWidth={8} />;
  return [
    P(band, { stroke: { width: 30, color: INK, cap: "round" } }),
    P(band, { stroke: { width: 16, color: GREY, cap: "round" } }),
    cup(-1),
    cup(1),
    <rect x={cx - r - 22} y={cy - 26} width={10} height={52} radius={5} fill={CYAN} />,
    <rect x={cx + r + 12} y={cy - 26} width={10} height={52} radius={5} fill={CYAN} />,
  ];
}

function Wave({ y, invert = false, color, amp = 90, wl = 300, x0 = 80, x1 = 1000, width = 14 }) {
  return P(wavePath(x0, x1, y, amp, wl, invert), { stroke: { width, color, cap: "round" } });
}

const SCENES = {
  // "How? They fight sound... with MORE sound."
  2: ({ dur, cue }) => full([
    <Mascot x={240} y={440} scale={0.85} arms={["downL", "downR"]} expr={{ brows: "raised", mouth: "o" }} animate={bob(dur, 6)} />,
    ...Headphones({ x: 240, y: 440, s: 0.85 }),
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(cue("more", dur * 0.6), dur)}>
      {P("M170,560 L90,520 M160,640 L70,650 M190,720 L110,780 M910,560 L990,520 M920,640 L1010,650 M890,720 L970,780", { stroke: { width: 12, color: YELLOW, cap: "round" } })}
      {big("SOUND vs SOUND", 300, YELLOW, 64)}
    </frame>,
  ]),

  // "Sound is a pressure wave: squeeze, stretch, squeeze, stretch."
  3: ({ dur }) => full([
    <frame x={0} y={0} width={W} height={H} layout="none"
      animate={[{ property: "offsetX", from: 0, to: -600, at: 0, duration: dur - 0.02, easing: "linear" }]}>
      {P(wavePath(-200, 1900, 820, 130, 300), { stroke: { width: 16, color: YELLOW, cap: "round" } })}
    </frame>,
    <text x={60} y={560} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={54} color="#FFFFFF">SQUEEZE · STRETCH</text>,
    <rect x={60} y={1040} width={960} height={6} radius={3} fill="#FFFFFF40" />,
  ]),

  // "A chip builds the exact opposite wave."
  5: ({ dur, cue }) => full([
    Wave({ y: 520, color: YELLOW }),
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(cue("opposite", dur * 0.6), dur)}>
      {Wave({ y: 760, invert: true, color: CYAN })}
    </frame>,
    <rect x={390} y={1010} width={300} height={220} radius={22} fill={GREY} strokeColor={INK} strokeWidth={10} />,
    P("M420,1010 L420,970 M470,1010 L470,970 M520,1010 L520,970 M560,1010 L560,970 M610,1010 L610,970 M660,1010 L660,970 M420,1230 L420,1270 M470,1230 L470,1270 M520,1230 L520,1270 M560,1230 L560,1270 M610,1230 L610,1270 M660,1230 L660,1270", { stroke: { width: 10, color: "#B8C2D6", cap: "round" } }),
    <text x={390} y={1088} width={300} align="center" fontFamily="JetBrains Mono" fontWeight={400} fontSize={52} color={CYAN}>CHIP</text>,
  ]),

  // "Wave plus anti-wave equals... almost silence!"
  7: ({ dur, cue }) => {
    const tFlat = cue("almost", dur * 0.6);
    return full([
      Wave({ y: 430, color: YELLOW, amp: 70 }),
      big("+", 520, "#FFFFFF", 80),
      Wave({ y: 700, invert: true, color: CYAN, amp: 70 }),
      big("=", 790, "#FFFFFF", 80),
      <frame x={0} y={0} width={W} height={H} layout="none" animate={show(tFlat, dur)}>
        {P(wavePath(80, 1000, 1000, 6, 300), { stroke: { width: 14, color: "#FFFFFF", cap: "round" } })}
      </frame>,
    ]);
  },

  // "And engineers built an electronic sound absorber back in nineteen fifty-three!"
  9: ({ dur, cue }) => full([
    // microphone on a stand
    P(ellipse(330, 760, 70, 90), { fill: "#B8C2D6", stroke: { width: 10, color: INK } }),
    P("M280,730 L380,730 M275,770 L385,770 M285,810 L375,810", { stroke: { width: 6, color: INK } }),
    P("M330,850 L330,1150 M240,1150 L420,1150", { stroke: { width: 16, color: INK, cap: "round" } }),
    // cable to the amplifier and loudspeaker
    P("M330,1150 C420,1220 540,1220 600,1120", { stroke: { width: 8, color: YELLOW, cap: "round" } }),
    <rect x={580} y={720} width={260} height={400} radius={18} fill="#6B4E31" strokeColor={INK} strokeWidth={10} />,
    P(circle(710, 860, 90), { fill: GREY, stroke: { width: 8, color: INK } }),
    P(circle(710, 860, 30), { fill: "#B8C2D6", stroke: { width: 6, color: INK } }),
    P(circle(710, 1040, 40), { fill: GREY, stroke: { width: 6, color: INK } }),
    <frame x={0} y={0} width={W} height={H} layout="none" animate={show(cue("nineteen", dur * 0.6), dur)}>
      {big("1953", 330, YELLOW, 150)}
    </frame>,
  ]),

  // "Your quiet is made of noise... turned upside down."
  10: ({ dur, cue }) => {
    const tFlip = cue("upside", dur * 0.6);
    return full([
      <frame x={0} y={130} width={W} height={400} origin="center" layout="none"
        animate={[{ property: "rotation", keyframes: keys(dur, [{ at: 0, value: 0 }, { at: tFlip, value: 0 }, { at: tFlip + 0.5, value: 180, easing: "ease-in-out" }, { at: dur, value: 180 }]) }]}>
        <path d={wavePath(140, 940, 200, 70, 270)} x={0} y={0} width={W} height={400} stroke={{ width: 14, color: CYAN, cap: "round" }} />
      </frame>,
      <Mascot x={240} y={520} scale={0.85} arms={["downL", "downR"]} expr={{ eyes: "happy", mouth: "smile" }} animate={pulse(dur, 0.84, 0.86, 1.6)} />,
      ...Headphones({ x: 240, y: 520, s: 0.85 }),
    ]);
  },
};

export function scene(n, ctx) {
  const f = SCENES[n];
  if (!f) throw new Error(`no cartoon scene ${n}`);
  return f(ctx);
}
