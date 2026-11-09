import {
  DEFAULT_SETTINGS,
  colorForCount,
  contrastTextColor,
  formatCount,
  normalizeSettings,
} from "../colors.js";

const SETTINGS_KEY = "settings";
const MAX_RULES = 10;

const rulesList = document.getElementById("rules");
const template = document.getElementById("rule-template");
const addButton = document.getElementById("add-rule");
const overflowColor = document.getElementById("overflow-color");
const overflowLabel = document.getElementById("overflow-label");
const preview = document.getElementById("preview");
const currentCount = document.getElementById("current-count");
const status = document.getElementById("status");

function addRuleRow(rule) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector(".rule-max").value = rule.max;
  row.querySelector(".rule-color").value = rule.color;
  row.querySelector(".remove").addEventListener("click", () => {
    row.remove();
    onChange();
  });
  rulesList.append(row);
}

function render(settings) {
  rulesList.replaceChildren();
  settings.rules.forEach(addRuleRow);
  overflowColor.value = settings.overflowColor;
  onChange();
}

/** Reads the form. Returns { settings, error }. */
function readForm() {
  const rows = [...rulesList.querySelectorAll(".rule")];
  const seen = new Set();
  let error = null;

  const rules = rows.map((row) => {
    const input = row.querySelector(".rule-max");
    const max = Number(input.value);
    let invalid = input.value === "" || !Number.isInteger(max) || max < 0;
    if (invalid) error ??= "Each level needs a whole number of tabs (0 or more).";
    else if (seen.has(max)) {
      invalid = true;
      error ??= `Two levels use the same number (${max}).`;
    }
    seen.add(max);
    input.classList.toggle("invalid", invalid);
    return { max, color: row.querySelector(".rule-color").value };
  });

  return { settings: { rules, overflowColor: overflowColor.value }, error };
}

function onChange() {
  const { settings, error } = readForm();
  const normalized = normalizeSettings(settings);
  const highest = normalized.rules.at(-1)?.max;

  overflowLabel.textContent = highest ?? 0;
  addButton.disabled = rulesList.children.length >= MAX_RULES;
  renderPreview(normalized);
  setStatus(error ?? "", error ? "error" : "");
  return { settings: normalized, error };
}

function renderPreview(settings) {
  const samples = new Set([1]);
  for (const { max } of settings.rules) {
    if (max > 0) samples.add(max);
    samples.add(max + 1);
  }
  preview.replaceChildren(
    ...[...samples]
      .sort((a, b) => a - b)
      .map((count) => {
        const color = colorForCount(count, settings);
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = formatCount(count);
        badge.style.background = color;
        badge.style.color = contrastTextColor(color);
        return badge;
      }),
  );
}

let statusTimer;
function setStatus(text, kind) {
  clearTimeout(statusTimer);
  status.textContent = text;
  status.className = kind;
  if (kind === "ok") statusTimer = setTimeout(() => setStatus("", ""), 2000);
}

async function save() {
  const { settings, error } = onChange();
  if (error) return;
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  render(settings); // re-render in sorted order
  setStatus("Saved", "ok");
}

async function reset() {
  const settings = normalizeSettings(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  render(settings);
  setStatus("Defaults restored", "ok");
}

async function showCurrentCount() {
  const tabs = await chrome.tabs.query({});
  currentCount.textContent = tabs.length;
}

addButton.addEventListener("click", () => {
  const { settings } = readForm();
  const highest = Math.max(0, ...settings.rules.map((r) => r.max).filter(Number.isFinite));
  addRuleRow({ max: highest + 50, color: "#1a73e8" });
  onChange();
});
rulesList.addEventListener("input", onChange);
overflowColor.addEventListener("input", onChange);
document.getElementById("save").addEventListener("click", save);
document.getElementById("reset").addEventListener("click", reset);

chrome.tabs.onCreated.addListener(showCurrentCount);
chrome.tabs.onRemoved.addListener(() => setTimeout(showCurrentCount, 50));

const stored = await chrome.storage.sync.get(SETTINGS_KEY);
render(normalizeSettings(stored[SETTINGS_KEY] ?? DEFAULT_SETTINGS));
showCurrentCount();
