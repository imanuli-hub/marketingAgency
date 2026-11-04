// Cartoon scenes for "Why you can't tickle yourself" (scenes 2, 3, 5, 7, 9, 10).
import { Brain, Mascot, circle, INK } from "./mascot.jsx";
import { CYAN, W, H } from "./brand.jsx";

const YELLOW = "#FFD84D";
const full = (children, key) => <frame key={key} x={0} y={0} width={W} height={H} layout="none">{children}</frame>;
const show = (at, dur, from = 0) => [{ property: "opacity", keyframes: [{ at: 0, value: from, easing: "hold" }, { at: Math.max(0.01, at), value: 1 }, { at: Math.max(at + 0.02, dur - 0.02), value: 1 }] }];
const bob = (dur, amp = 10) => {
  const n = Math.max(2, Math.floor(dur / 0.9));
  const step = dur / n;
  return [{ property: "offsetY", keyframes: [{ at: 0, value: 0 }, { at: step / 2, value: -amp }, { at: step, value: 0 }], repeat: n, easing: "ease-in-out" }];
};
const big = (text, y, color = "#FFFFFF", size = 64) => (
  <text x={60} y={y} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={size} color={color} shadow={{ x: 0, y: 3, blur: 10, color: "#000000AA" }}>{text}</text>
);

const SCENES = {
  // "Nothing, right?" — mascot pokes its own side, unimpressed
  2: ({ dur }) => full([
    <Mascot x={240} y={330} arms={["downL", "pokeR"]} expr={{ brows: "raised", mouth: "flat" }} animate={bob(dur, 6)} />,
    <path d="M700,780 L760,760 M705,820 L775,825 M700,860 L755,885" x={0} y={0} width={W} height={H} stroke={{ width: 10, color: YELLOW, cap: "round" }}
      animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: 0.15, value: 1 }, { at: 0.35, value: 0.2 }, { at: 0.55, value: 1 }, { at: Math.max(0.6, dur - 0.05), value: 1 }] }]} />,
  ]),

  // "Every time you move, your brain sends a copy of the command."
  3: ({ dur, cue }) => {
    const tCmd = cue("sends", 0.6);
    const tCopy = cue("copy", 1.6);
    return full([
      <Brain x={390} y={250} animate={[{ property: "scale", from: 0.9, to: 1.05, at: 0, duration: dur, easing: "ease-out" }]} />,
      <Mascot x={240} y={440} scale={0.85} arms={["downL", "upR"]} expr={{ eyes: "up", brows: "up", mouth: "smile" }} />,
      <frame x={0} y={0} width={W} height={H} layout="none" animate={show(tCmd, dur)}>
        <path d="M640,420 C760,470 790,580 740,700" x={0} y={0} width={W} height={H} stroke={{ width: 16, color: YELLOW, cap: "round" }} />
        <path d="M712,676 L740,712 L770,670" x={0} y={0} width={W} height={H} stroke={{ width: 16, color: YELLOW, cap: "round" }} />
        <text x={760} y={520} width={300} fontFamily="Montserrat" fontWeight={800} fontSize={44} color={YELLOW}>COMMAND</text>
      </frame>,
      <frame x={0} y={0} width={W} height={H} layout="none" animate={show(tCopy, dur)}>
        <path d="M700,600 C600,640 420,600 400,470" x={0} y={0} width={W} height={H} stroke={{ width: 14, color: CYAN, cap: "round" }} dash={[26, 18]} />
        <path d="M372,500 L400,462 L430,498" x={0} y={0} width={W} height={H} stroke={{ width: 14, color: CYAN, cap: "round" }} />
        <text x={150} y={560} width={300} fontFamily="Montserrat" fontWeight={800} fontSize={44} color={CYAN}>COPY</text>
      </frame>,
    ]);
  },

  // "Predicted touch? It gets turned DOWN." — volume dial drops
  5: ({ dur, cue }) => {
    const tDown = cue("turned", 1.2);
    return full([
      <path d="M260,640 C260,330 820,330 820,640" x={0} y={0} width={W} height={H} stroke={{ width: 28, color: "#FFFFFF", cap: "round" }} />,
      <path d="M260,640 C260,520 300,450 360,410" x={0} y={0} width={W} height={H} stroke={{ width: 28, color: CYAN, cap: "round" }} />,
      <path d="M720,410 C780,450 820,520 820,640" x={0} y={0} width={W} height={H} stroke={{ width: 28, color: "#FF6B6B", cap: "round" }} />,
      big("TOUCH", 680, "#FFFFFF", 52),
      <frame x={240} y={340} width={600} height={600} origin="center" layout="none"
        animate={[{ property: "rotation", keyframes: [{ at: 0, value: 55 }, { at: Math.max(0.05, tDown), value: 55 }, { at: Math.min(dur - 0.05, tDown + 0.45), value: -60, easing: "bounce" }, { at: dur - 0.02, value: -60 }] }]}>
        <rect x={292} y={70} width={16} height={232} radius={8} fill={INK} strokeColor="#FFFFFF" strokeWidth={4} />
        <path d={circle(300, 300, 26)} x={0} y={0} width={600} height={600} fill="#FFFFFF" stroke={{ width: 8, color: INK }} />
      </frame>,
      <Mascot x={240} y={600} scale={0.62} arms={["shrugL", "shrugR"]} expr={{ brows: "raised", mouth: "smile" }} />,
    ]);
  },

  // "That's why someone else can tickle you... and you can't."
  7: ({ dur, cue }) => {
    const tSwap = cue("and", dur * 0.6);
    const until = [{ property: "opacity", keyframes: [{ at: 0, value: 1, easing: "hold" }, { at: tSwap, value: 0, easing: "hold" }, { at: dur - 0.02, value: 0 }] }];
    const wiggle = [{ property: "rotation", keyframes: [{ at: 0, value: -4 }, { at: 0.12, value: 4 }, { at: 0.24, value: -4 }], repeat: 8 }];
    return full([
      <frame x={0} y={0} width={W} height={H} layout="none" animate={until}>
        <Mascot x={-80} y={480} scale={0.7} arms={["downL", "reachR"]} expr={{ eyes: "happy", mouth: "smile" }} />
        <Mascot x={500} y={480} scale={0.7} arms={["wiggleL", "downR"]} expr={{ eyes: "happy", mouth: "laugh" }} animate={wiggle} />
        {big("HA HA HA!", 360, YELLOW, 72)}
      </frame>,
      <frame x={0} y={0} width={W} height={H} layout="none" animate={show(tSwap, dur)}>
        <Mascot x={240} y={330} arms={["downL", "pokeR"]} expr={{ eyes: "blank", brows: "neutral", mouth: "flat" }} />
        {big("...", 280, "#FFFFFF", 90)}
      </frame>,
    ]);
  },

  // "and it started to feel more ticklish!" — delay counter + tickle meter
  9: ({ dur }) => {
    const steps = ["0", "100", "200", "300"];
    const seg = (dur - 0.2) / steps.length;
    const wiggle = [{ property: "rotation", keyframes: [{ at: 0, value: -5 }, { at: 0.1, value: 5 }, { at: 0.2, value: -5 }], repeat: Math.max(2, Math.floor(dur / 0.2) - 1) }];
    return full([
      big("ROBOT DELAY", 250, "#FFFFFFCC", 40),
      ...steps.map((v, i) => (
        <text key={`d${i}`} x={60} y={300} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={110} color={CYAN}
          animate={[{ property: "opacity", keyframes: [{ at: 0, value: i === 0 ? 1 : 0, easing: "hold" }, { at: Math.max(0.01, i * seg), value: 1, easing: "hold" }, { at: Math.max(0.02, (i + 1) * seg), value: i === steps.length - 1 ? 1 : 0, easing: "hold" }, { at: dur - 0.01, value: i === steps.length - 1 ? 1 : 0 }] }]}>
          {`${v} ms`}
        </text>
      )),
      big("TICKLE", 470, "#FFFFFFCC", 40),
      <rect x={240} y={530} width={600} height={56} radius={28} fill="#00000000" strokeColor="#FFFFFF" strokeWidth={6} />,
      <rect x={248} y={538} width={584} height={40} radius={20} fill={YELLOW}
        mask={{ x: 0, y: 0, width: 60, height: 40 }}
        animate={[{ property: "maskWidth", from: 60, to: 584, at: 0, duration: dur - 0.1, easing: "ease-out" }]} />,
      <Mascot x={240} y={520} scale={0.75} arms={["wiggleL", "shrugR"]} expr={{ eyes: "happy", mouth: "laugh" }} animate={wiggle} />,
    ]);
  },

  // "Your brain isn't just feeling the world. It's PREDICTING it."
  10: ({ dur, cue }) => {
    const tPred = cue("predicting", dur * 0.7);
    return full([
      <Brain x={390} y={310} glow={true} animate={[{ property: "scale", keyframes: [{ at: 0, value: 0.95 }, { at: Math.max(0.05, tPred), value: 1.05 }, { at: Math.min(dur - 0.05, tPred + 0.3), value: 1.25, easing: "ease-out" }, { at: dur - 0.02, value: 1.2 }] }]} />,
      <frame x={290} y={170} width={500} height={500} origin="center" layout="none"
        animate={[{ property: "scale", keyframes: [{ at: 0, value: 0.9 }, { at: 0.8, value: 1.08 }, { at: 1.6, value: 0.9 }], repeat: Math.max(2, Math.floor(dur / 1.6)) }]}>
        <path d={circle(250, 250, 195)} x={0} y={0} width={500} height={500} stroke={{ width: 8, color: CYAN }} dash={[14, 22]} />
      </frame>,
      <Mascot x={240} y={510} scale={0.85} arms={["downL", "downR"]} expr={{ eyes: "up", brows: "up", mouth: "smile" }} animate={bob(dur, 8)} />,
    ]);
  },
};

export function scene(n, ctx) {
  const f = SCENES[n];
  if (!f) throw new Error(`no cartoon scene ${n}`);
  return f(ctx);
}
