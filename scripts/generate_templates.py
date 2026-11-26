"""Generates standalone editable .svg vector templates into templates/ for Figma, Illustrator, CorelDRAW, or Canva."""
from pathlib import Path

OUT_DIR = Path('/Users/suthir/.gemini/antigravity/scratch/tedx-cs-academy-banners/templates')
OUT_DIR.mkdir(parents=True, exist_ok=True)

SPECS = [
    ('tedx-standee-3x6ft.svg', 1800, 3600, (459, 425, 1300), (1197, 3125, 1364), False),
    ('tedx-standee-2.5x6ft.svg', 1500, 3600, (390, 414, 1252), (990, 3125, 1328), False),
    ('tedx-instagram-post-4x5.svg', 1080, 1350, (259, 115, 729), (745, 1181, 740), False),
    ('tedx-stage-backdrop-16x9.svg', 1920, 1080, (422, 410, 929), (1536, 648, 842), True),
]

for filename, W, H, (cx1, cy1, r1), (cx2, cy2, r2), is_land in SPECS:
    unit = H if is_land else W
    pad = round(W * (0.055 if is_land else 0.058))
    ted_sz = round(unit * (0.092 if is_land else 0.106))
    sub_sz = round(unit * (0.052 if is_land else 0.064))
    name_sz = round(unit * (0.088 if is_land else 0.108))
    bio_sz = round(unit * (0.028 if is_land else 0.033))

    y0 = round(H * (0.095 if is_land else 0.028))
    ted_y = y0 + round(ted_sz * 0.85)
    sub1_y = y0 + round(ted_sz * 1.04 + sub_sz * 0.84)
    sub2_y = sub1_y + round(sub_sz * 1.08)
    name1_y = sub2_y + round(sub_sz * 0.4 + name_sz * 0.92)
    name2_y = name1_y + round(name_sz * 1.06)
    name3_y = name2_y + round(name_sz * 1.06)
    bio1_y = name3_y + round(name_sz * 0.35 + bio_sz * 0.9)

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <title>TEDx CS Academy Coimbatore Template ({filename})</title>
  <defs>
    <clipPath id="Speaker_Portrait_Circle_Clip">
      <circle cx="{cx2}" cy="{cy2}" r="{r2}" />
    </clipPath>
    <radialGradient id="Portrait_Placeholder_Glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#26262c" />
      <stop offset="100%" stop-color="#080808" />
    </radialGradient>
  </defs>

  <!-- 1. Official TED Red Background -->
  <rect id="TED_Red_Background" width="{W}" height="{H}" fill="#EB0028" />

  <!-- 2. Dual Offset Black Circles -->
  <circle id="Upper_Content_Arc" cx="{cx1}" cy="{cy1}" r="{r1}" fill="#080808" />
  <circle id="Lower_Portrait_Arc" cx="{cx2}" cy="{cy2}" r="{r2}" fill="#080808" />

  <!-- 3. Speaker Portrait Group (Replace placeholder inside clip-path with speaker B&W photo) -->
  <g id="Speaker_Portrait_Slot" clip-path="url(#Speaker_Portrait_Circle_Clip)">
    <circle cx="{round(W * (0.76 if is_land else 0.56))}" cy="{round(H * (0.64 if is_land else 0.78))}" r="{round(unit * 0.32)}" fill="url(#Portrait_Placeholder_Glow)" />
    <text x="{round(W * (0.76 if is_land else 0.56))}" y="{round(H * (0.65 if is_land else 0.79))}" text-anchor="middle" fill="#71717A" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="{round(unit * 0.032)}">PLACE B&amp;W SPEAKER PHOTO HERE</text>
  </g>

  <!-- 4. TEDx CS Academy Coimbatore Lockup -->
  <g id="TEDx_Logo_Lockup">
    <text x="{pad}" y="{ted_y}" fill="#EB0028" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="900" font-size="{ted_sz}" letter-spacing="-0.05em">TED<tspan dy="{-round(ted_sz * 0.34)}" font-size="{round(ted_sz * 0.62)}">x</tspan></text>
    <text x="{pad}" y="{sub1_y}" fill="#F5F5F7" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="300" font-size="{sub_sz}">CS Academy</text>
    <text x="{pad}" y="{sub2_y}" fill="#F5F5F7" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="300" font-size="{sub_sz}">Coimbatore</text>
  </g>

  <!-- 5. Speaker Name -->
  <g id="Speaker_Name_Editable">
    <text x="{pad}" y="{name1_y}" fill="#FFFFFF" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="800" font-size="{name_sz}" letter-spacing="-0.02em">Speaker</text>
    <text x="{pad}" y="{name2_y}" fill="#FFFFFF" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="800" font-size="{name_sz}" letter-spacing="-0.02em">Middle</text>
    <text x="{pad}" y="{name3_y}" fill="#FFFFFF" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="800" font-size="{name_sz}" letter-spacing="-0.02em">Last Name</text>
  </g>

  <!-- 6. Speaker Bio -->
  <g id="Speaker_Bio_Editable">
    <text x="{pad}" y="{bio1_y}" fill="#EBEBEF" fill-opacity="0.9" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="400" font-size="{bio_sz}">
      <tspan x="{pad}" dy="0">Role, title, and key credentials go here.</tspan>
      <tspan x="{pad}" dy="{round(bio_sz * 1.38)}">Add 3–5 concise lines describing their work,</tspan>
      <tspan x="{pad}" dy="{round(bio_sz * 1.38)}">impact, and connection to your TEDx theme.</tspan>
    </text>
  </g>
</svg>
'''
    (OUT_DIR / filename).write_text(svg, encoding='utf-8')
    print('Wrote', OUT_DIR / filename)
