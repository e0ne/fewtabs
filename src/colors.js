// Shared color-rule logic used by the background worker, the options page and tests.
//
// Settings shape:
//   {
//     rules: [{ max: 20, color: "#2e7d32" }, ...],  // "up to `max` tabs -> `color`"
//     overflowColor: "#000000"                      // used above the largest `max`
//   }

export const DEFAULT_SETTINGS = Object.freeze({
  rules: Object.freeze([
    Object.freeze({ max: 20, color: "#2e7d32" }), // green:  1–20
    Object.freeze({ max: 50, color: "#f9a825" }), // yellow: 21–50
    Object.freeze({ max: 100, color: "#c62828" }), // red:    51–100
  ]),
  overflowColor: "#000000", // black:  101+
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isValidColor(color) {
  return typeof color === "string" && HEX_COLOR.test(color);
}

/**
 * Returns a cleaned copy of settings: drops invalid rules, removes duplicate
 * thresholds (first wins) and sorts rules by `max` ascending. Falls back to
 * defaults for anything missing or malformed.
 */
export function normalizeSettings(settings) {
  const input = settings && typeof settings === "object" ? settings : {};
  const seen = new Set();
  const rules = (Array.isArray(input.rules) ? input.rules : DEFAULT_SETTINGS.rules)
    .filter((r) => r && Number.isInteger(r.max) && r.max >= 0 && isValidColor(r.color))
    .filter((r) => (seen.has(r.max) ? false : (seen.add(r.max), true)))
    .map((r) => ({ max: r.max, color: r.color.toLowerCase() }))
    .sort((a, b) => a.max - b.max);

  return {
    rules,
    overflowColor: isValidColor(input.overflowColor)
      ? input.overflowColor.toLowerCase()
      : DEFAULT_SETTINGS.overflowColor,
  };
}

/** Picks the badge color for a given tab count. */
export function colorForCount(count, settings) {
  const { rules, overflowColor } = normalizeSettings(settings);
  const rule = rules.find((r) => count <= r.max);
  return rule ? rule.color : overflowColor;
}

/** Black or white, whichever reads better on the given background. */
export function contrastTextColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel((n >> 16) & 0xff) +
    0.7152 * channel((n >> 8) & 0xff) +
    0.0722 * channel(n & 0xff);
  // Contrast against white vs. against black; pick the larger.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? "#ffffff" : "#000000";
}

/** Badge text only has room for ~4 characters. */
export function formatCount(count) {
  return count > 999 ? "999+" : String(count);
}
