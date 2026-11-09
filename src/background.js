import {
  DEFAULT_SETTINGS,
  colorForCount,
  contrastTextColor,
  formatCount,
  normalizeSettings,
} from "./colors.js";

const SETTINGS_KEY = "settings";
const DEBOUNCE_MS = 100;

async function loadSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY] ?? DEFAULT_SETTINGS);
}

/**
 * Recounts tabs in all windows and repaints the badge.
 * `removedTabIds` are excluded because tabs.query() can still return a tab
 * while its onRemoved event is being dispatched.
 */
async function updateBadge(removedTabIds) {
  const [allTabs, settings] = await Promise.all([chrome.tabs.query({}), loadSettings()]);
  const tabs = allTabs.filter((t) => !removedTabIds.has(t.id));
  const count = tabs.length;
  const windowCount = new Set(tabs.map((t) => t.windowId)).size;
  const color = colorForCount(count, settings);
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  await Promise.all([
    chrome.action.setBadgeText({ text: formatCount(count) }),
    chrome.action.setBadgeBackgroundColor({ color }),
    chrome.action.setBadgeTextColor({ color: contrastTextColor(color) }),
    chrome.action.setTitle({
      title: `FewTabs: ${plural(count, "tab")} in ${plural(windowCount, "window")}`,
    }),
  ]);
}

// Closing a window fires onRemoved once per tab, so coalesce bursts of events.
let timer = null;
let pendingRemoved = new Set();

function refresh(removedTabId) {
  if (removedTabId !== undefined) pendingRemoved.add(removedTabId);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const removed = pendingRemoved;
    pendingRemoved = new Set();
    updateBadge(removed).catch((err) => console.error("FewTabs: badge update failed", err));
  }, DEBOUNCE_MS);
}

chrome.runtime.onInstalled.addListener(() => refresh());
chrome.runtime.onStartup.addListener(() => refresh());

chrome.tabs.onCreated.addListener(() => refresh());
chrome.tabs.onRemoved.addListener((tabId) => refresh(tabId));
chrome.tabs.onAttached.addListener(() => refresh());
chrome.tabs.onDetached.addListener(() => refresh());
chrome.tabs.onReplaced.addListener(() => refresh());
chrome.windows.onCreated.addListener(() => refresh());
chrome.windows.onRemoved.addListener(() => refresh());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && SETTINGS_KEY in changes) refresh();
});

// Clicking the toolbar icon opens the color settings.
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Also repaint whenever the service worker spins up.
refresh();
