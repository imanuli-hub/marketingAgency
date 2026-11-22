/**
 * Chart colours. Categorical slots are the validated dark-mode reference
 * palette (checked against the #0d1a14 surface: all six checks pass).
 * Assign in fixed order - never cycle, max 8 series.
 */
export const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c", "#9085e9", "#e66767"] as const;

/** Diverging poles for profit/loss polarity (warm = loss, cool = gain). */
export const GAIN = "#3987e5";
export const LOSS = "#d95926";

export const AXIS = { stroke: "#3a4d43", tick: { fill: "#9aa89f", fontSize: 11 }, tickLine: false } as const;
export const GRID = { stroke: "#23392e", strokeDasharray: "0", vertical: false } as const;
export const TOOLTIP_STYLE = {
  contentStyle: { background: "#0d1a14", border: "1px solid #23392e", borderRadius: 10, fontSize: 12, color: "#ece7da" },
  labelStyle: { color: "#9aa89f" },
  itemStyle: { color: "#ece7da" },
  cursor: { fill: "rgba(255,255,255,0.04)", stroke: "#3a4d43" },
} as const;
