# FewTabs

A Chrome extension that puts a badge on its toolbar icon, next to the address bar, showing how many
tabs are open across **all** windows. The badge color changes with the count:

| Open tabs | Default color |
| --------- | ------------- |
| 0–20      | green         |
| 21–50     | yellow        |
| 51–100    | red           |
| 101+      | black         |

Click the FewTabs icon (or right-click it → **Options**) to change the thresholds and colors. You can
add up to 10 levels, remove levels, and pick the color used above the highest level. Settings are
stored in `chrome.storage.sync`, so they follow your Chrome profile.

Hovering the icon shows a tooltip like `FewTabs: 42 tabs in 3 windows`.

## Install (development)

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this folder.
4. Pin FewTabs from the puzzle-piece menu so the badge is always visible next to the address bar.

After editing the code, click the reload icon on the FewTabs card in `chrome://extensions`.

Requires Chrome 110 or newer.

## Project layout

```
manifest.json            Manifest V3 definition
src/background.js        Service worker: counts tabs, updates the badge
src/colors.js            Shared threshold → color logic (used by worker, options page, tests)
src/options/             Settings page (HTML/CSS/JS)
icons/icon.svg           Icon source (tally marks); icon*.png are generated from it
icons/icon16.svg         Pixel-tuned 16px variant (used instead of scaling icon.svg down)
scripts/generate-icons.sh  Renders icons/icon.svg to PNGs (needs rsvg-convert: brew install librsvg)
test/                    Unit tests (node:test, no dependencies)
```

## Scripts

```sh
npm test          # run unit tests (Node 18+)
npm run icons     # regenerate icons/*.png from icons/icon.svg
npm run package   # build dist/fewtabs.zip for the Chrome Web Store
```
