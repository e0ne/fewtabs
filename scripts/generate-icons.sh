#!/bin/sh
# Renders icons/icon.svg (or a hand-tuned icons/icon<size>.svg) into the PNG sizes Chrome needs.
# Requires rsvg-convert (macOS: `brew install librsvg`). Run from anywhere.
set -eu
cd "$(dirname "$0")/../icons"
command -v rsvg-convert >/dev/null || { echo "rsvg-convert not found: brew install librsvg" >&2; exit 1; }
for size in 16 32 48 128; do
  # A hand-tuned icon<size>.svg, if present, wins over the scaled master.
  src=icon.svg; [ -f "icon$size.svg" ] && src="icon$size.svg"
  rsvg-convert -w "$size" -h "$size" "$src" -o "icon$size.png"
  echo "wrote icons/icon$size.png"
done
