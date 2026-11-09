import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  colorForCount,
  contrastTextColor,
  formatCount,
  normalizeSettings,
} from "../src/colors.js";

const GREEN = "#2e7d32";
const YELLOW = "#f9a825";
const RED = "#c62828";
const BLACK = "#000000";

test("default thresholds map counts to green / yellow / red / black", () => {
  const cases = [
    [0, GREEN],
    [1, GREEN],
    [20, GREEN],
    [21, YELLOW],
    [50, YELLOW],
    [51, RED],
    [100, RED],
    [101, BLACK],
    [5000, BLACK],
  ];
  for (const [count, expected] of cases) {
    assert.equal(colorForCount(count, DEFAULT_SETTINGS), expected, `count=${count}`);
  }
});

test("custom rules are sorted and applied", () => {
  const settings = {
    rules: [
      { max: 30, color: "#0000FF" },
      { max: 5, color: "#00ff00" },
    ],
    overflowColor: "#ff0000",
  };
  assert.equal(colorForCount(5, settings), "#00ff00");
  assert.equal(colorForCount(6, settings), "#0000ff");
  assert.equal(colorForCount(31, settings), "#ff0000");
});

test("with no rules every count uses the overflow color", () => {
  assert.equal(colorForCount(1, { rules: [], overflowColor: "#123456" }), "#123456");
});

test("normalizeSettings drops invalid rules and duplicate thresholds", () => {
  const result = normalizeSettings({
    rules: [
      { max: 10, color: "#111111" },
      { max: 10, color: "#222222" },
      { max: -1, color: "#333333" },
      { max: 2.5, color: "#444444" },
      { max: 40, color: "red" },
      null,
    ],
    overflowColor: "not-a-color",
  });
  assert.deepEqual(result, {
    rules: [{ max: 10, color: "#111111" }],
    overflowColor: DEFAULT_SETTINGS.overflowColor,
  });
});

test("normalizeSettings falls back to defaults for garbage input", () => {
  assert.deepEqual(normalizeSettings(undefined), normalizeSettings(DEFAULT_SETTINGS));
  assert.deepEqual(normalizeSettings("nope"), normalizeSettings(DEFAULT_SETTINGS));
});

test("contrastTextColor picks a readable text color", () => {
  assert.equal(contrastTextColor(BLACK), "#ffffff");
  assert.equal(contrastTextColor(RED), "#ffffff");
  assert.equal(contrastTextColor(GREEN), "#ffffff");
  assert.equal(contrastTextColor(YELLOW), "#000000");
  assert.equal(contrastTextColor("#ffffff"), "#000000");
});

test("formatCount caps the badge at 4 characters", () => {
  assert.equal(formatCount(7), "7");
  assert.equal(formatCount(999), "999");
  assert.equal(formatCount(1000), "999+");
});
