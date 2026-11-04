// Channel identity drawn in code (see channels/invisible-explained/style-bible.md).
export const NAVY = "#0B1220";
export const CYAN = "#3FD0D4";
export const W = 1080;
export const H = 1920;
// Gradient angle that runs transparent (top) -> dark (bottom); verified on a preview frame.
const SCRIM_ANGLE = 180;

/** Small mono scene label, top centre, under a short cyan rule. */
export function Label({ text }) {
  return [
    <rect x={510} y={150} width={60} height={4} fill={CYAN} />,
    <text x={60} y={172} width={960} align="center" fontFamily="JetBrains Mono" fontWeight={400} fontSize={30}
      letterSpacing={4} color="#FFFFFFE6" shadow={{ x: 0, y: 2, blur: 10, color: "#000000CC" }}>{text}</text>,
  ];
}

/**
 * One caption chunk (2-4 words). Words start dim and light up as spoken;
 * key words turn cyan. w.t = seconds from the chunk's start.
 */
export function Caption({ words, at, duration }) {
  const end = Math.max(0.1, duration - 0.02);
  return (
    <row x={60} y={1420} width={960} gap={22} rowGap={4} wrap={true} justify="center" at={at} duration={duration}>
      {words.map((w, i) => {
        const lit = w.key ? CYAN : "#FFFFFF";
        const t = Math.min(Math.max(0.02, w.t), end - 0.02);
        return (
          <text key={i} fontFamily="Montserrat" fontWeight={800} fontSize={80}
            shadow={{ x: 0, y: 4, blur: 16, color: "#000000E6" }}
            animate={[{ property: "color", keyframes: [{ at: 0, value: "#FFFFFF80", easing: "hold" }, { at: t, value: lit, easing: "hold" }, { at: end, value: lit }] }]}>
            {w.text}
          </text>
        );
      })}
    </row>
  );
}

export function Backdrop() {
  return <rect x={0} y={0} width={W} height={H} fill={{ kind: "radial", stops: [{ offset: 0, color: "#1B2C48" }, { offset: 0.75, color: NAVY }] }} />;
}

/** Bottom scrim so captions stay readable over bright footage. */
export function Scrim() {
  return <rect x={0} y={1080} width={W} height={840} fill={{ kind: "linear", angle: SCRIM_ANGLE, stops: [{ offset: 0, color: "#000000", opacity: 0 }, { offset: 1, color: "#000000", opacity: 0.75 }] }} />;
}

export function EndCard() {
  return [
    <rect x={0} y={0} width={W} height={H} fill="#000000" />,
    <text x={60} y={860} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={96} letterSpacing={6} color={CYAN}>THE INVISIBLE</text>,
    <text x={60} y={975} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={96} letterSpacing={6} color="#FFFFFF">EXPLAINED</text>,
  ];
}
