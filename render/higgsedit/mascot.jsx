// Code-drawn mascot in the style of the channel's Oct 29 "brain freeze" character:
// white round head, thick black outline, dot eyes, arched brows, noodle arms.
const K = 0.5523;
export const circle = (cx, cy, r) => ellipse(cx, cy, r, r);
export const ellipse = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} C${cx - rx},${cy - ry * K} ${cx - rx * K},${cy - ry} ${cx},${cy - ry} ` +
  `C${cx + rx * K},${cy - ry} ${cx + rx},${cy - ry * K} ${cx + rx},${cy} ` +
  `C${cx + rx},${cy + ry * K} ${cx + rx * K},${cy + ry} ${cx},${cy + ry} ` +
  `C${cx - rx * K},${cy + ry} ${cx - rx},${cy + ry * K} ${cx - rx},${cy} Z`;

export const INK = "#111111";
const W = 600;
const H = 940;
const P = (d, props = {}) => <path d={d} x={0} y={0} width={W} height={H} {...props} />;

// [path, hand centre]
const ARMS = {
  downL: ["M215,480 C170,560 160,640 175,720", [175, 728]],
  downR: ["M385,480 C430,560 440,640 425,720", [425, 728]],
  pokeR: ["M385,480 C500,540 470,640 400,620", [394, 616]],
  upR: ["M385,480 C440,420 470,330 480,250", [482, 242]],
  shrugL: ["M215,480 C150,520 110,500 95,430", [92, 420]],
  shrugR: ["M385,480 C450,520 490,500 505,430", [508, 420]],
  reachR: ["M385,480 C470,500 520,520 585,500", [590, 498]],
  wiggleL: ["M215,480 C140,470 110,420 120,350", [122, 340]],
};

function arm(key) {
  const [d, [hx, hy]] = ARMS[key];
  return [
    P(d, { stroke: { width: 50, color: INK, cap: "round" } }),
    P(d, { stroke: { width: 34, color: "#FFFFFF", cap: "round" } }),
    P(circle(hx, hy, 30), { fill: "#FFFFFF", stroke: { width: 9, color: INK } }),
  ];
}

function face({ eyes, brows, mouth }) {
  const out = [];
  const line = (d, w = 10) => P(d, { stroke: { width: w, color: INK, cap: "round" } });
  if (eyes === "happy") out.push(line("M208,262 Q236,228 264,262"), line("M336,262 Q364,228 392,262"));
  else if (eyes === "blank") out.push(P(circle(236, 255, 11), { fill: INK }), P(circle(364, 255, 11), { fill: INK }));
  else if (eyes === "up") out.push(P(ellipse(240, 238, 15, 24), { fill: INK }), P(ellipse(368, 238, 15, 24), { fill: INK }));
  else out.push(P(ellipse(236, 255, 15, 24), { fill: INK }), P(ellipse(364, 255, 15, 24), { fill: INK }));

  if (brows === "raised") out.push(line("M204,198 Q236,172 268,196"), line("M334,212 L394,212"));
  else if (brows === "up") out.push(line("M206,190 Q236,166 266,186"), line("M334,186 Q364,166 394,190"));
  else out.push(line("M210,206 Q236,192 262,204"), line("M338,204 Q364,192 390,206"));

  if (mouth === "laugh") out.push(P("M236,318 Q300,430 364,318 Z", { fill: "#F2788A", stroke: { width: 10, color: INK } }));
  else if (mouth === "smile") out.push(line("M252,322 Q300,370 348,322"));
  else if (mouth === "o") out.push(P(ellipse(300, 345, 18, 24), { fill: "#3A1F25", stroke: { width: 9, color: INK } }));
  else out.push(line("M270,345 L330,345"));
  return out;
}

/**
 * Mascot in a 600x940 box. (x, y) is the box's top-left in the parent frame.
 * arms = [left, right] keys from ARMS; expr = { eyes, brows, mouth }.
 * Extra keyframed animation (e.g. a bob or wiggle) rides on the box.
 */
export function Mascot({ x = 240, y = 560, scale = 1, arms = ["downL", "downR"], expr = {}, animate = [] }) {
  const hold = [{ property: "scale", from: scale, to: scale, at: 0, duration: 0.05 }];
  return (
    <frame x={x} y={y} width={W} height={H} origin="center" layout="none" animate={animate.length ? animate : hold}>
      {P(ellipse(300, 925, 220, 22), { fill: "#00000080" })}
      {P("M215,430 C190,560 185,760 195,925 L405,925 C415,760 410,560 385,430 Z", { fill: "#FFFFFF", stroke: { width: 14, color: INK } })}
      {P("M222,440 C204,560 200,760 210,918 L244,918 C236,760 238,560 252,446 Z", { fill: "#E3E7EE" })}
      {arm(arms[0])}
      {arm(arms[1])}
      {P(circle(300, 260, 200), { fill: "#FFFFFF", stroke: { width: 14, color: INK } })}
      {P("M112,300 C120,380 180,440 260,455 C170,420 128,370 112,300 Z", { fill: "#E3E7EE" })}
      {face({ eyes: "open", brows: "neutral", mouth: "smile", ...expr })}
    </frame>
  );
}

/** Cartoon brain (pink, lobed) in a 300x220 box at (x, y). */
export function Brain({ x, y, glow = false, animate = [] }) {
  const B = (d, props) => <path d={d} x={0} y={0} width={300} height={220} {...props} />;
  const hold = [{ property: "scale", from: 1, to: 1, at: 0, duration: 0.05 }];
  return (
    <frame x={x} y={y} width={300} height={220} origin="center" layout="none" animate={animate.length ? animate : hold}>
      {glow ? (
        <rect x={-150} y={-160} width={600} height={540}
          fill={{ kind: "radial", stops: [{ offset: 0, color: "#7FE7FF", opacity: 0.5 }, { offset: 0.65, color: "#7FE7FF", opacity: 0 }] }} />
      ) : null}
      {B("M40,120 C10,100 20,50 60,45 C70,10 130,5 150,30 C175,5 240,10 245,50 C285,55 295,110 265,130 C280,170 240,200 205,185 C185,215 125,215 110,190 C70,205 30,175 40,120 Z", { fill: "#F6A5B5", stroke: { width: 10, color: INK } })}
      {B("M150,32 C140,80 160,120 150,185", { stroke: { width: 7, color: "#C9637A", cap: "round" } })}
      {B("M70,80 C95,70 110,95 95,115 M200,70 C230,75 230,105 210,115 M90,150 C110,135 130,160 120,170 M190,150 C215,140 235,160 220,175", { stroke: { width: 7, color: "#C9637A", cap: "round" } })}
    </frame>
  );
}
