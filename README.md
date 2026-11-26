<div align="center">

# TEDx Banner & Event Collateral Studio

**A browser-native print & social media design engine built by the TEDx CS Academy Coimbatore Tech Team.**  
Create print-ready roll-up standees, Instagram speaker reveals, 16:9 auditorium backdrops, and lanyard ID passes in seconds—with zero external dependencies.

[![Live Demo](https://img.shields.io/badge/Live_Studio-GitHub_Pages-EB0028?style=for-the-badge&logo=github)](https://suthirraja22.github.io/tedx-banner-studio/)
[![License: MIT](https://img.shields.io/badge/License-MIT-18181c?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Stack-Vanilla_JS_%7C_Canvas_%7C_SVG-25252e?style=for-the-badge)](#engineering-highlights)

<br />

![TEDx Banner & Collateral Studio Preview](docs/studio-preview.png)

</div>

---

## Overview

Producing consistent, high-resolution speaker collateral across physical flex printers and social channels is a recurring bottleneck for student-run conferences. **TEDx Banner Studio** automates the entire visual system behind **TEDx CS Academy Coimbatore** directly in the browser:

- **Instant Speaker Lineup Workflow** — Type speaker credentials or bulk-import a `.csv` roster, drop in raw headshots, and batch-export print-ready `.PNG` files.
- **Automatic Studio Portrait Blending** — Converts any color headshot into a high-contrast monochrome TED-style portrait, clipped inside the lower geometric arc with smoothstep shoulder/edge feathering and bright-background knock-out.
- **Dual Raster & Vector Pipeline** — Export ultra-high-resolution `.PNG` (`up to 3600 × 7200 px`), print-calibrated `.PDF` sheets, or **layered editable `.SVG` files** that open cleanly in **Figma, Adobe Illustrator, CorelDRAW, and Canva**.
- **Physical Print-Shop Safeguards** — Toggleable bleed borders and a **3-inch roll-up standee cassette clamp guide** so critical content never gets swallowed by aluminum standee bases.

---

## Supported Collateral Formats

| Format | Pixel Dimensions | Aspect / Size | Target Use Case |
| :--- | :--- | :--- | :--- |
| **Standee 3 × 6 ft** | `1800 × 3600 px` *(2x: `3600 × 7200`)* | `1 : 2` (`36 × 72 in`) | Standard campus & auditorium roll-up standees |
| **Standee 2.5 × 6 ft** | `1500 × 3600 px` *(2x: `3000 × 7200`)* | `5 : 12` (`30 × 72 in`) | Narrow flex roll-up standees |
| **IG Post 4:5** | `1080 × 1350 px` | `4 : 5` | Instagram speaker reveal feed posts & carousels |
| **IG Story 9:16** | `1080 × 1920 px` | `9 : 16` | Instagram Stories, Reels covers & vertical signage |
| **Stage Backdrop 16:9** | `1920 × 1080 px` *(2x: `3840 × 2160`)* | `16 : 9` | Auditorium LED walls & projector title slides |
| **ID Badge** | `1050 × 1500 px` | `3.5 × 5 in` (300 DPI) | Speaker, Organizer & Tech Team lanyard passes |

---

## Engineering Highlights

1. **Chord-Constrained Arc Typography Solver**  
   Rather than wrapping text inside static rectangles that collide with curved boundaries, the layout engine evaluates the circular chord bound per line baseline:
   $$x_{\max}(y) = c_x + \sqrt{r^2 - (y - c_y)^2} - m$$
   Paired with an iterative auto-fit solver, long speaker bios dynamically reflow and scale within the upper black arc across every aspect ratio without clipping.

2. **Real-Time Offscreen Canvas Portrait Grading**  
   Uploaded portraits pass through a cached offscreen `<canvas>` pixel pipeline applying monochrome contrast curves, luminance-threshold background keying, and an asymmetric radial smoothstep ($3t^2 - 2t^3$) vignette mask—preserving solid lower shoulders while melting outer photo edges seamlessly into `#080808`.

3. **Shared Deterministic Layout → Raster & Vector `.SVG` Serialization**  
   A single layout pass drives both the interactive 60 fps `<canvas>` stage and a standards-compliant XML `.SVG` serializer with `<clipPath>`, `<linearGradient>`, and grouped `<text>` layers—bridging automated tech workflows with manual graphic-design handoffs.

4. **Zero Build Step, 100% Client-Side Privacy**  
   Written in modular, dependency-free HTML5, CSS3, and ES2022 JavaScript. Speaker photos and CSV rosters are processed locally in browser memory and never uploaded to an external server.

---

## Quick Start

Clone the repository and serve the folder with any static HTTP server:

```bash
git clone https://github.com/suthirraja22/tedx-banner-studio.git
cd tedx-banner-studio
python3 -m http.server 8080
```

Then open **`http://localhost:8080`** in your browser.

### Bulk CSV Workflow
1. Prepare a CSV file with columns `name,bio,role,talkTitle` (see [`speakers_sample.csv`](speakers_sample.csv)).
2. Click **CSV** in the **Speaker Lineup** bar to import all speakers at once.
3. Drag and drop each speaker's photo directly onto the stage canvas.
4. Click **Batch** to download print-ready `.PNG` banners for the entire roster.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `1` – `6` | Switch between Standee, Social, Stage, and Badge formats |
| `G` | Toggle Print Bleed & 3-inch Standee Roller Clamp Guides |
| `R` | Re-center and reset portrait zoom |
| `↑` `↓` `←` `→` | Fine-nudge speaker portrait position |
| `⌘ / Ctrl + E` | Quick-export high-resolution `.PNG` |
| `?` | Open keyboard shortcuts reference |

---

## Project Structure

```text
tedx-banner-studio/
├── index.html                  # Studio workspace UI & semantic controls
├── styles.css                  # Dark-room studio theme & responsive layout
├── app.js                      # Arc-aware layout engine, pixel shader & SVG/PNG/PDF exporters
├── speakers_sample.csv         # Sample bulk-import speaker lineup
├── assets/                     # Fictional studio showcase speaker portraits
├── templates/                  # Standalone editable vector .SVG templates for Figma/Illustrator
├── scripts/
│   └── generate_templates.py   # Utility script to regenerate base .SVG artboards
└── .github/workflows/
    └── deploy-pages.yml        # Automated GitHub Pages deployment workflow
```

---

## Disclaimer & License

- **Sample Assets**: All preloaded speaker names, biographies, and studio portraits in `assets/` are **100% synthetic/fictional** created solely for template demonstration.
- **Trademark Notice**: `TED` and `TEDx` are registered trademarks of TED Conferences, LLC. Event teams should adhere to official [TEDx Brand & Design Guidelines](https://www.ted.com/participate/organize-a-local-tedx-event/tedx-organizer-guide/branding-promotions) when publishing event materials (`x = independently organized TED event`).
- Released under the **[MIT License](LICENSE)** by **[@suthirraja22](https://github.com/suthirraja22)**.
