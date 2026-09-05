# CSS Gradient Generator Pro

[![CI](https://github.com/kasapdev/css-gradient-generator-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/kasapdev/css-gradient-generator-pro/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) ![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-F7DF1E?logo=javascript&logoColor=black)

Build linear, radial and conic CSS gradients visually, with draggable color stops and live copy-ready output.

> A premium, zero-dependency gradient workbench. Add and drag color stops, dial in an angle or center position, and watch the preview and the generated `background` declaration update instantly — no build step, no account, nothing ever leaves your browser.

## Overview

CSS Gradient Generator Pro runs entirely in the browser with no build step, no frameworks, and no network calls — open `index.html` from disk and it works. Switch between linear, radial and conic gradient modes, edit any number of color stops with a picker, a hex field and a position slider, and reorder them by dragging. The large preview swatch and the read-only CSS output stay in sync on every change, ready to copy straight into a stylesheet.

## Features

- **Three gradient modes** — Linear, Radial and Conic, switched with a segmented control.
- **Unlimited color stops** — each stop has its own color picker, synced hex text field, and a 0–100% position slider.
- **Add stop** inserts a new stop at the midpoint of the largest gap, with a color interpolated between its neighbors.
- **Remove stop**, disabled once only 2 stops remain (a valid CSS gradient needs at least 2).
- **Real drag-and-drop reordering** of the stop list via a drag handle (HTML5 drag events, not a static list).
- **Linear controls** — a 0–360° angle slider kept in sync with a numeric input.
- **Radial controls** — circle/ellipse shape toggle plus a 3×3 center-position preset grid and independent X/Y sliders.
- **Conic controls** — a starting-angle (`from Ndeg`) control plus the same center-position grid and X/Y sliders.
- **Large live preview swatch** that renders the actual `background` value on every change.
- **Live CSS output** — a read-only `background: <gradient>;` declaration, stops sorted by position, percentages cleaned of floating-point noise.
- **Copy CSS** button (and a keyboard shortcut) for the generated declaration.
- **10 curated presets** — Purple Haze, Sunset, Ocean, Mint, Fire, Cool Blues, Peachy, Emerald Pool, Berry and Candy Swirl — spanning all three gradient modes, loaded with one click.
- **Randomize** — generates a plausible gradient with a random mode, harmonious HSL-derived colors, and random angle/position.
- **Reset** back to the default brand gradient.
- **Auto-persist** — the full gradient state is saved to `localStorage` and restored on return.
- **Dark & light themes**, fully responsive down to 360px, accessible, and keyboard-driven.

## Installation

No dependencies, no build step.

```bash
git clone https://github.com/kasapdev/css-gradient-generator-pro.git
cd css-gradient-generator-pro
```

Then simply open `index.html` in any modern browser (double-click it, or `file://` it). That's it.

## Usage

1. Pick a mode — **Linear**, **Radial** or **Conic** — from the segmented control.
2. Adjust the geometry: the angle for Linear, shape + center for Radial, starting angle + center for Conic.
3. Edit color stops — pick a color, type a hex value, or drag the position slider. Click **Add stop** for more, or the trash icon to remove one (minimum 2).
4. Drag a stop's handle up or down to reorder the list.
5. Click a **preset** swatch to load a ready-made gradient, or **Randomize** for a surprise.
6. Copy the generated CSS with the **Copy CSS** button (or <kbd>Ctrl/⌘</kbd>+<kbd>C</kbd>) and paste it straight into your stylesheet.
7. **Reset** returns to the default gradient at any time; your last gradient is otherwise remembered automatically.

## Keyboard Shortcuts

| Action                | Shortcut                       |
| ---------------------- | ------------------------------ |
| Copy generated CSS     | <kbd>Ctrl/⌘</kbd> + <kbd>C</kbd> |
| Randomize gradient     | <kbd>R</kbd>                    |
| Show shortcuts help    | <kbd>?</kbd>                    |
| Close dialog           | <kbd>Esc</kbd>                  |

## Screenshots

> _Screenshots coming soon._

![screenshot](docs/screenshot-1.png)
![screenshot](docs/screenshot-2.png)

## Roadmap

- [ ] Export gradients as an SVG or PNG image
- [ ] Multi-gradient layering (stack several gradients into one `background`)
- [ ] Shareable URL that encodes the current gradient
- [ ] CSS custom-property / Tailwind config output modes
- [ ] Angle dial visual for the linear mode

## License

MIT Licensed. Part of [CSS Gradient Generator Pro](https://github.com/kasapdev/css-gradient-generator-pro).

---

## Part of the kasapdev Tools Suite

One of 45+ zero-dependency vanilla JS tools, all free and open source — [see the full list](https://github.com/kasapdev/kasapdev).
