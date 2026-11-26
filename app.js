/**
 * TEDx CS Academy Coimbatore — Speaker Banner & Event Collateral Studio
 * Open-source client-side design & print-production engine (Canvas + Layered SVG + PDF).
 */

const FORMAT_KEYS = [
  'standee_3x6',
  'standee_25x6',
  'ig_post',
  'ig_story',
  'backdrop_16x9',
  'badge_id'
];

const FORMATS = {
  standee_3x6: {
    id: 'standee_3x6',
    label: 'Standee 3 × 6 ft',
    w: 1800,
    h: 3600,
    phys: '36 × 72 in Print',
    mode: 'standee',
    rollerRatio: 3 / 72
  },
  standee_25x6: {
    id: 'standee_25x6',
    label: 'Standee 2.5 × 6 ft',
    w: 1500,
    h: 3600,
    phys: '30 × 72 in Print',
    mode: 'standee_narrow',
    rollerRatio: 3 / 72
  },
  ig_post: {
    id: 'ig_post',
    label: 'IG Post 4:5',
    w: 1080,
    h: 1350,
    phys: 'Social Feed Portrait',
    mode: 'social_4x5',
    rollerRatio: 0
  },
  ig_story: {
    id: 'ig_story',
    label: 'IG Story 9:16',
    w: 1080,
    h: 1920,
    phys: 'Vertical Story / Reel',
    mode: 'story_9x16',
    rollerRatio: 0
  },
  backdrop_16x9: {
    id: 'backdrop_16x9',
    label: 'Stage Backdrop 16:9',
    w: 1920,
    h: 1080,
    phys: 'HD LED / Projector',
    mode: 'landscape',
    rollerRatio: 0
  },
  badge_id: {
    id: 'badge_id',
    label: 'ID Badge 3.5×5 in',
    w: 1050,
    h: 1500,
    phys: '3.5 × 5 in Pass (300 DPI)',
    mode: 'badge',
    rollerRatio: 0
  }
};

const DEMO_SPEAKERS = [
  {
    id: 'demo_arjun',
    name: 'Dr. Arjun\nMenon',
    bio: 'Principal AI Researcher and Climate Systems Architect. Leads open-source atmospheric modeling initiatives across South Asia and advises urban resilience consortiums on sustainable infrastructure.',
    role: 'SPEAKER',
    talkTitle: 'Forecasting Resilient Cities',
    photoDataUrl: 'assets/speaker-arjun.jpg',
    photoScale: 102,
    photoX: 0,
    photoY: 0,
    photoGrayscale: true,
    photoFeather: 52,
    photoBgKey: 0,
    photoContrast: 114,
    photoBrightness: 102
  },
  {
    id: 'demo_maya',
    name: 'Maya\nKrishnan',
    bio: 'Bio-Design Innovator and Circular Materials Founder. Pioneering mycelium-based architectural acoustic panels and biodegradable packaging engineered from regional agricultural waste.',
    role: 'SPEAKER',
    talkTitle: 'Growing the Cities of Tomorrow',
    photoDataUrl: 'assets/speaker-maya.jpg',
    photoScale: 102,
    photoX: 0,
    photoY: 0,
    photoGrayscale: true,
    photoFeather: 52,
    photoBgKey: 0,
    photoContrast: 114,
    photoBrightness: 102
  },
  {
    id: 'demo_vikram',
    name: 'Prof. Vikram\nSundaram',
    bio: 'Astrophysicist and Science Communicator building low-cost community radio telescope arrays for high-school classrooms across Tamil Nadu.',
    role: 'SPEAKER',
    talkTitle: 'Listening to Distant Worlds',
    photoDataUrl: '',
    photoScale: 100,
    photoX: 0,
    photoY: 0,
    photoGrayscale: true,
    photoFeather: 48,
    photoBgKey: 0,
    photoContrast: 116,
    photoBrightness: 102
  }
];

const STORAGE_KEY = 'tedx_csa_banner_studio_v2';

const state = {
  format: 'standee_3x6',
  arcPreset: 'classic',
  showGuides: false,
  viewZoom: 1.0,
  orgLine1: 'CS Academy',
  orgLine2: 'Coimbatore',
  showRoleOnAll: false,
  showTedFooter: false,
  nameSize: 100,
  bioSize: 100,
  waistGap: 0,
  arcSpin: 0,
  accentRed: '#EB0028',
  exportScale: 1,
  speakers: structuredClone(DEMO_SPEAKERS),
  activeSpeakerIndex: 0
};

const imageCache = new Map();
let processedPortraitCache = { key: '', canvas: null, dataUrl: null };
let isDragging = false;
let dragStart = { x: 0, y: 0, origX: 0, origY: 0 };

const canvas = document.getElementById('bannerCanvas');
const ctx = canvas.getContext('2d');

function currentSpeaker() {
  return state.speakers[state.activeSpeakerIndex] || state.speakers[0];
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------------- Persistence ---------------- */
function saveState() {
  try {
    const serializable = {
      ...state,
      speakers: state.speakers.map(s => ({
        ...s,
        photoDataUrl: s.photoDataUrl && (s.photoDataUrl.startsWith('assets/') || s.photoDataUrl.length < 1_500_000)
          ? s.photoDataUrl
          : ''
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (_) {}
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.speakers) && parsed.speakers.length > 0) {
      Object.assign(state, parsed);
      state.activeSpeakerIndex = Math.min(state.activeSpeakerIndex || 0, state.speakers.length - 1);
      state.viewZoom = Number(state.viewZoom) || 1.0;
      state.arcPreset = state.arcPreset || 'classic';
    }
  } catch (_) {}
}

/* ---------------- Image Loading & Studio Portrait Processing ---------------- */
function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getProcessedPortrait(spk) {
  const img = imageCache.get(spk.photoDataUrl);
  if (!img) return null;

  const cacheKey = [
    spk.photoDataUrl,
    spk.photoGrayscale,
    spk.photoFeather,
    spk.photoBgKey,
    spk.photoContrast,
    spk.photoBrightness
  ].join('|');

  if (processedPortraitCache.key === cacheKey && processedPortraitCache.canvas) {
    return processedPortraitCache;
  }

  const maxDim = 1400;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');

  const filters = [];
  if (spk.photoGrayscale) filters.push('grayscale(100%)');
  filters.push(`contrast(${spk.photoContrast}%)`);
  filters.push(`brightness(${spk.photoBrightness}%)`);
  octx.filter = filters.join(' ');
  octx.drawImage(img, 0, 0, w, h);
  octx.filter = 'none';

  const featherAmt = spk.photoFeather / 100;
  const bgKeyAmt = spk.photoBgKey / 100;

  if (featherAmt > 0 || bgKeyAmt > 0) {
    const imgData = octx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const invHalfW = 1 / (w * 0.5);
    const innerRadius = 1 - featherAmt * 0.58;
    const featherSpan = Math.max(0.04, 1.02 - innerRadius);
    const keyThreshold = 255 - bgKeyAmt * 175;

    for (let y = 0; y < h; y++) {
      const nyRaw = (y - h * 0.58) / (h * 0.56);
      const ny = nyRaw > 0 ? nyRaw * 0.42 : nyRaw * 1.02;
      const ny2 = ny * ny;

      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        let alpha = d[idx + 3] / 255;
        if (alpha === 0) continue;

        if (bgKeyAmt > 0) {
          const lum = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;
          if (lum > keyThreshold) {
            const k = Math.min(1, (lum - keyThreshold) / Math.max(12, 255 - keyThreshold));
            alpha *= (1 - k * k);
          }
        }

        if (featherAmt > 0) {
          const nx = (x - w * 0.5) * invHalfW;
          const dist = Math.sqrt(nx * nx + ny2);
          if (dist > innerRadius) {
            const t = Math.min(1, (dist - innerRadius) / featherSpan);
            const fade = 1 - t * t * (3 - 2 * t);
            alpha *= fade;
          }
        }

        d[idx + 3] = Math.round(alpha * 255);
      }
    }
    octx.putImageData(imgData, 0, 0);
  }

  processedPortraitCache = { key: cacheKey, canvas: off, dataUrl: null };
  return processedPortraitCache;
}

/* ---------------- Dual-Arc Geometry Engine ---------------- */
function computeGeometry(W, H, mode) {
  const presetShift = state.arcPreset === 'spotlight' ? -0.14 : state.arcPreset === 'xsplit' ? 0.12 : 0;
  const gapShift = (state.waistGap / 100) * Math.min(W, H) * 0.22;
  const spinShift = ((state.arcSpin / 100) + presetShift) * Math.min(W, H) * 0.25;

  if (mode === 'landscape') {
    return {
      isLandscape: true,
      upper: {
        cx: W * 0.22 - gapShift * 0.5,
        cy: H * 0.38 - spinShift * 0.4,
        r: H * 0.86
      },
      lower: {
        cx: W * (state.arcPreset === 'spotlight' ? 0.75 : 0.80) + gapShift * 0.5,
        cy: H * 0.60 + spinShift * 0.4,
        r: H * 0.78
      }
    };
  }

  const lowerCenterXFactor = state.arcPreset === 'spotlight' ? 0.52 : state.arcPreset === 'xsplit' ? 0.74 : 0.665;
  const upperCenterXFactor = state.arcPreset === 'spotlight' ? 0.34 : state.arcPreset === 'xsplit' ? 0.20 : 0.255;

  if (mode === 'standee_narrow') {
    return {
      isLandscape: false,
      upper: {
        cx: W * upperCenterXFactor - spinShift * 0.5,
        cy: H * 0.115 - gapShift * 0.5,
        r: W * 0.84
      },
      lower: {
        cx: W * lowerCenterXFactor + spinShift * 0.5,
        cy: H * 0.868 + gapShift * 0.5,
        r: W * 0.885
      }
    };
  }

  if (mode === 'social_4x5') {
    return {
      isLandscape: false,
      upper: {
        cx: W * upperCenterXFactor - spinShift * 0.5,
        cy: H * 0.135 - gapShift * 0.5,
        r: W * 0.745
      },
      lower: {
        cx: W * (lowerCenterXFactor + 0.03) + spinShift * 0.5,
        cy: H * 0.895 + gapShift * 0.5,
        r: W * 0.67
      }
    };
  }

  if (mode === 'story_9x16') {
    return {
      isLandscape: false,
      upper: {
        cx: W * upperCenterXFactor - spinShift * 0.5,
        cy: H * 0.115 - gapShift * 0.5,
        r: W * 0.74
      },
      lower: {
        cx: W * lowerCenterXFactor + spinShift * 0.5,
        cy: H * 0.868 + gapShift * 0.5,
        r: W * 0.77
      }
    };
  }

  if (mode === 'badge') {
    return {
      isLandscape: false,
      isBadge: true,
      upper: {
        cx: W * upperCenterXFactor - spinShift * 0.5,
        cy: H * 0.095 - gapShift * 0.5,
        r: W * 0.70
      },
      lower: {
        cx: W * lowerCenterXFactor + spinShift * 0.5,
        cy: H * 0.80 + gapShift * 0.5,
        r: W * 0.665
      }
    };
  }

  // Reference 3 x 6 ft Standee (1800 x 3600)
  return {
    isLandscape: false,
    upper: {
      cx: W * upperCenterXFactor - spinShift * 0.5,
      cy: H * 0.118 - gapShift * 0.5,
      r: W * 0.728
    },
    lower: {
      cx: W * lowerCenterXFactor + spinShift * 0.5,
      cy: H * 0.868 + gapShift * 0.5,
      r: W * 0.765
    }
  };
}

function maxChordRightX(circle, y, fallbackMaxX, margin) {
  const dy = Math.abs(y - circle.cy);
  if (dy >= circle.r * 0.96) return fallbackMaxX * 0.55;
  const dx = Math.sqrt(circle.r * circle.r - dy * dy);
  return Math.min(fallbackMaxX, circle.cx + dx - margin);
}

function wrapArcParagraph(context, text, xLeft, yStart, lineHeight, fontStr, upperCircle, maxRightLimit, circleMargin) {
  context.save();
  context.font = fontStr;
  const paragraphs = (text || '').split(/\n+/);
  const lines = [];
  let curY = yStart;

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const rightBound = maxChordRightX(upperCircle, curY + lineHeight * 0.35, maxRightLimit, circleMargin);
      const maxWidth = Math.max(140, rightBound - xLeft);

      if (context.measureText(testLine).width > maxWidth && currentLine) {
        lines.push({ text: currentLine, x: xLeft, y: curY });
        curY += lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push({ text: currentLine, x: xLeft, y: curY });
      curY += lineHeight;
    }
  }

  context.restore();
  return lines;
}

/* ---------------- Core Render Function ---------------- */
function renderScene(targetCtx, W, H, fmt, spk, includeGuides = false) {
  const geom = computeGeometry(W, H, fmt.mode);
  const u = geom.upper;
  const l = geom.lower;

  targetCtx.save();
  targetCtx.clearRect(0, 0, W, H);

  // 1. Solid TED Red Background
  targetCtx.fillStyle = state.accentRed;
  targetCtx.fillRect(0, 0, W, H);

  // 2. Upper Black Circle
  targetCtx.fillStyle = '#080808';
  targetCtx.beginPath();
  targetCtx.arc(u.cx, u.cy, u.r, 0, Math.PI * 2);
  targetCtx.fill();

  // 3. Lower Black Circle
  targetCtx.fillStyle = '#080808';
  targetCtx.beginPath();
  targetCtx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2);
  targetCtx.fill();

  // 4. Portrait Clipped Inside Lower Circle
  const portrait = getProcessedPortrait(spk);
  const portraitDrawMetrics = computePortraitMetrics(W, H, fmt, geom, spk, portrait ? portrait.canvas : null);

  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2);
  targetCtx.clip();

  if (portrait && portrait.canvas && portraitDrawMetrics) {
    targetCtx.drawImage(
      portrait.canvas,
      portraitDrawMetrics.dx,
      portraitDrawMetrics.dy,
      portraitDrawMetrics.dw,
      portraitDrawMetrics.dh
    );

    const bGrad = targetCtx.createLinearGradient(0, H * 0.90, 0, H);
    bGrad.addColorStop(0, 'rgba(8,8,8,0)');
    bGrad.addColorStop(1, 'rgba(8,8,8,0.72)');
    targetCtx.fillStyle = bGrad;
    targetCtx.fillRect(0, H * 0.90, W, H * 0.10);
  } else {
    drawPortraitPlaceholder(targetCtx, l, W, H);
  }
  targetCtx.restore();

  // 5. Typography Layout Metrics
  const unit = geom.isLandscape ? H : W;
  const padLeft = geom.isLandscape ? W * 0.055 : W * 0.058;
  let cursorY = geom.isLandscape ? H * 0.095 : fmt.mode === 'badge' ? H * 0.085 : H * 0.028;

  if (fmt.mode === 'badge') {
    targetCtx.fillStyle = '#1b1b20';
    roundRect(targetCtx, W * 0.41, H * 0.026, W * 0.18, H * 0.022, H * 0.011);
    targetCtx.fill();
  }

  // 5a. TEDx Logo Lockup
  const tedSize = Math.round(unit * (geom.isLandscape ? 0.082 : fmt.mode === 'social_4x5' ? 0.078 : 0.082));
  targetCtx.fillStyle = state.accentRed;
  targetCtx.font = `900 ${tedSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  targetCtx.textBaseline = 'top';

  const tedLetters = ['T', 'E', 'D'];
  let lx = padLeft;
  for (const ch of tedLetters) {
    targetCtx.fillText(ch, lx, cursorY);
    lx += targetCtx.measureText(ch).width - tedSize * 0.055;
  }
  const xSize = Math.round(tedSize * 0.64);
  targetCtx.font = `900 ${xSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  targetCtx.fillText('x', lx + tedSize * 0.02, cursorY + tedSize * 0.02);

  cursorY += tedSize * 1.02;

  // 5b. Event Subtitle Lines
  const subSize = Math.round(unit * (geom.isLandscape ? 0.048 : fmt.mode === 'social_4x5' ? 0.048 : 0.053));
  targetCtx.fillStyle = '#f5f5f7';
  targetCtx.font = `300 ${subSize}px Inter, "Helvetica Neue", Arial, sans-serif`;

  if (state.orgLine1.trim()) {
    targetCtx.fillText(state.orgLine1.trim(), padLeft, cursorY);
    cursorY += subSize * 1.05;
  }
  if (state.orgLine2.trim()) {
    targetCtx.fillText(state.orgLine2.trim(), padLeft, cursorY);
    cursorY += subSize * 1.18;
  }

  // Optional Role Pill
  if (state.showRoleOnAll && fmt.mode !== 'badge' && spk.role.trim()) {
    const pillFontSize = Math.round(unit * 0.025);
    targetCtx.font = `700 ${pillFontSize}px Inter, sans-serif`;
    const label = spk.role.trim().toUpperCase();
    const pw = targetCtx.measureText(label).width + pillFontSize * 1.3;
    const ph = pillFontSize * 1.6;
    targetCtx.fillStyle = state.accentRed;
    roundRect(targetCtx, padLeft, cursorY, pw, ph, ph * 0.25);
    targetCtx.fill();
    targetCtx.fillStyle = '#ffffff';
    targetCtx.fillText(label, padLeft + pillFontSize * 0.65, cursorY + pillFontSize * 0.3);
    cursorY += ph + subSize * 0.3;
  }

  // 5c. Speaker Name
  const baseNameSize = unit * (geom.isLandscape ? 0.084 : fmt.mode === 'social_4x5' ? 0.080 : 0.094);
  const nameFontSize = Math.round(baseNameSize * (state.nameSize / 100));
  const nameLineHeight = Math.round(nameFontSize * 1.04);
  const nameFont = `800 ${nameFontSize}px Inter, "Helvetica Neue", Arial, sans-serif`;

  const rawNameLines = (spk.name || 'Speaker Name').split('\n');
  const renderedNameLines = [];
  targetCtx.font = nameFont;
  targetCtx.fillStyle = '#ffffff';

  for (const rLine of rawNameLines) {
    const wrapped = wrapArcParagraph(
      targetCtx,
      rLine,
      padLeft,
      cursorY,
      nameLineHeight,
      nameFont,
      u,
      geom.isLandscape ? W * 0.56 : W * 0.93,
      unit * 0.035
    );
    for (const wl of wrapped) {
      targetCtx.fillText(wl.text, wl.x, wl.y);
      renderedNameLines.push(wl);
      cursorY = wl.y + nameLineHeight;
    }
  }

  cursorY += Math.round(nameFontSize * 0.22);

  // Optional Talk Title
  let renderedTalkLine = null;
  if (spk.talkTitle && spk.talkTitle.trim()) {
    const talkSize = Math.round(unit * 0.030 * (state.bioSize / 100));
    targetCtx.font = `600 ${talkSize}px Inter, sans-serif`;
    targetCtx.fillStyle = state.accentRed;
    targetCtx.fillText(spk.talkTitle.trim(), padLeft, cursorY);
    renderedTalkLine = { text: spk.talkTitle.trim(), x: padLeft, y: cursorY, size: talkSize };
    cursorY += Math.round(talkSize * 1.45);
  }

  // 5d. Speaker Bio (Arc-aware + Smart Auto-Fit inside upper circle)
  const baseBioSize = unit * (geom.isLandscape ? 0.028 : fmt.mode === 'social_4x5' ? 0.028 : 0.0305);
  let bioFontSize = Math.round(baseBioSize * (state.bioSize / 100));
  const minBioFontSize = Math.max(10, Math.round(bioFontSize * 0.60));
  const maxBioBottomY = u.cy + u.r - unit * 0.032;
  let bioLines = [];

  while (bioFontSize >= minBioFontSize) {
    const bioLineHeight = Math.round(bioFontSize * 1.34);
    const bioFont = `400 ${bioFontSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
    bioLines = wrapArcParagraph(
      targetCtx,
      spk.bio,
      padLeft,
      cursorY,
      bioLineHeight,
      bioFont,
      u,
      geom.isLandscape ? W * 0.55 : W * 0.91,
      unit * 0.038
    );
    if (!bioLines.length || bioLines[bioLines.length - 1].y + bioFontSize <= maxBioBottomY) {
      break;
    }
    bioFontSize -= Math.max(1, Math.round(unit * 0.0014));
  }

  targetCtx.font = `400 ${bioFontSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  targetCtx.fillStyle = 'rgba(244, 244, 246, 0.90)';
  for (const bl of bioLines) {
    if (bl.y + bioFontSize <= maxBioBottomY + bioFontSize * 0.25) {
      targetCtx.fillText(bl.text, bl.x, bl.y);
    }
  }

  // 6. ID Badge Role Footer Bar
  if (fmt.mode === 'badge') {
    const barH = H * 0.095;
    targetCtx.fillStyle = state.accentRed;
    targetCtx.fillRect(0, H - barH, W, barH);
    const rSize = Math.round(W * 0.058);
    targetCtx.font = `900 ${rSize}px Inter, sans-serif`;
    targetCtx.fillStyle = '#ffffff';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText((spk.role || 'SPEAKER').toUpperCase(), W / 2, H - barH / 2);
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';
  }

  // 7. Official TEDx License Footer
  if (state.showTedFooter && fmt.mode !== 'badge') {
    const footSize = Math.round(unit * 0.021);
    const footY = fmt.rollerRatio > 0 ? H * (1 - fmt.rollerRatio) - footSize * 1.8 : H - footSize * 2.1;
    targetCtx.font = `400 ${footSize}px Inter, sans-serif`;
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    targetCtx.textAlign = 'right';
    targetCtx.fillText('x = independently organized TED event', W - padLeft * 0.75, footY);
    targetCtx.textAlign = 'left';
  }

  // 8. Print Guides
  if (includeGuides) {
    drawPrintGuides(targetCtx, W, H, fmt);
  }

  targetCtx.restore();

  return {
    geom,
    portraitDrawMetrics,
    tedSize,
    subSize,
    padLeft,
    nameFontSize,
    renderedNameLines,
    renderedTalkLine,
    bioFontSize,
    bioLines
  };
}

function computePortraitMetrics(W, H, fmt, geom, spk, imgCanvas) {
  if (!imgCanvas) return null;
  const l = geom.lower;
  const imgAspect = imgCanvas.width / imgCanvas.height;

  let baseHeight, anchorCenterX, anchorBottomY;
  if (geom.isLandscape) {
    baseHeight = H * 0.84;
    anchorCenterX = W * 0.77;
    anchorBottomY = H * 1.01;
  } else if (fmt.mode === 'badge') {
    baseHeight = H * 0.48;
    anchorCenterX = state.arcPreset === 'spotlight' ? W * 0.50 : W * 0.58;
    anchorBottomY = H * 0.915;
  } else if (fmt.mode === 'social_4x5') {
    baseHeight = H * 0.50;
    anchorCenterX = state.arcPreset === 'spotlight' ? W * 0.52 : W * 0.62;
    anchorBottomY = H * 1.01;
  } else {
    baseHeight = H * 0.48;
    anchorCenterX = state.arcPreset === 'spotlight' ? W * 0.50 : W * 0.55;
    anchorBottomY = H * 1.0;
  }

  const scaleFactor = spk.photoScale / 100;
  const dh = baseHeight * scaleFactor;
  const dw = dh * imgAspect;

  const shiftX = (spk.photoX / 100) * W * 0.5;
  const shiftY = (spk.photoY / 100) * H * 0.35;

  const dx = anchorCenterX - dw / 2 + shiftX;
  const dy = anchorBottomY - dh + shiftY;

  return { dx, dy, dw, dh, cx: l.cx, cy: l.cy, r: l.r };
}

function drawPortraitPlaceholder(targetCtx, lowerCircle, W, H) {
  const cx = Math.min(W * 0.58, lowerCircle.cx);
  const cy = Math.min(H * 0.78, lowerCircle.cy);
  const r = Math.min(W, H) * 0.135;

  targetCtx.save();
  targetCtx.fillStyle = '#19191f';
  targetCtx.beginPath();
  targetCtx.arc(cx, cy - r * 0.55, r * 0.62, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.beginPath();
  targetCtx.ellipse(cx, cy + r * 0.95, r * 1.35, r * 0.95, 0, Math.PI, 0, false);
  targetCtx.fill();

  targetCtx.fillStyle = 'rgba(255,255,255,0.42)';
  targetCtx.font = `600 ${Math.round(Math.min(W, H) * 0.026)}px Inter, sans-serif`;
  targetCtx.textAlign = 'center';
  targetCtx.fillText('DROP SPEAKER PHOTO HERE', cx, cy + r * 1.25);
  targetCtx.restore();
}

function drawPrintGuides(targetCtx, W, H, fmt) {
  targetCtx.save();
  const bleed = Math.round(Math.min(W, H) * 0.025);
  targetCtx.strokeStyle = 'rgba(0, 229, 255, 0.78)';
  targetCtx.lineWidth = Math.max(2, Math.round(W * 0.002));
  targetCtx.setLineDash([14, 10]);
  targetCtx.strokeRect(bleed, bleed, W - bleed * 2, H - bleed * 2);

  if (fmt.rollerRatio > 0) {
    const rollerY = Math.round(H * (1 - fmt.rollerRatio));
    targetCtx.fillStyle = 'rgba(235, 0, 40, 0.28)';
    targetCtx.fillRect(0, rollerY, W, H - rollerY);

    targetCtx.strokeStyle = '#ffeb3b';
    targetCtx.beginPath();
    targetCtx.moveTo(0, rollerY);
    targetCtx.lineTo(W, rollerY);
    targetCtx.stroke();

    targetCtx.setLineDash([]);
    targetCtx.fillStyle = '#ffeb3b';
    targetCtx.textBaseline = 'bottom';
    targetCtx.font = `700 ${Math.round(W * 0.021)}px Inter, sans-serif`;
    targetCtx.fillText('▲ STANDEE ROLLER CASSETTE CLAMP ZONE (BOTTOM 3 INCHES — KEEP TEXT ABOVE)', bleed * 1.3, rollerY - Math.round(W * 0.01));
  }
  targetCtx.restore();
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

/* ---------------- Viewport Sizing & Live Preview ---------------- */
async function renderPreview() {
  const fmt = FORMATS[state.format];
  const spk = currentSpeaker();

  if (spk.photoDataUrl) {
    await loadImage(spk.photoDataUrl);
  }

  const stage = document.getElementById('canvasViewport');
  const availW = Math.max(260, stage.clientWidth - 64);
  const availH = Math.max(260, stage.clientHeight - 98);
  const fitScale = Math.min(availW / fmt.w, availH / fmt.h) * state.viewZoom;

  const cssW = Math.round(fmt.w * fitScale);
  const cssH = Math.round(fmt.h * fitScale);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderW = Math.min(fmt.w, Math.max(360, Math.round(cssW * dpr * 1.2)));
  const renderH = Math.round(renderW * (fmt.h / fmt.w));

  if (canvas.width !== renderW || canvas.height !== renderH) {
    canvas.width = renderW;
    canvas.height = renderH;
  }
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  renderScene(ctx, renderW, renderH, fmt, spk, state.showGuides);

  const scaleMult = Number(state.exportScale) || 1;
  document.getElementById('dimensionBadge').textContent =
    `${fmt.label} • ${fmt.w * scaleMult} × ${fmt.h * scaleMult} px • ${fmt.phys}`;
  document.getElementById('zoomResetBtn').textContent =
    state.viewZoom === 1 ? 'Fit' : `${Math.round(state.viewZoom * 100)}%`;
}

/* ---------------- High-Res PNG, Editable SVG & Print PDF Exports ---------------- */
function slugify(str) {
  return (str || 'speaker')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase()
    .slice(0, 42) || 'speaker';
}

async function exportHighResPng(spk = currentSpeaker()) {
  const fmt = FORMATS[state.format];
  if (spk.photoDataUrl) await loadImage(spk.photoDataUrl);

  const mult = Number(state.exportScale) || 1;
  const outW = fmt.w * mult;
  const outH = fmt.h * mult;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');

  renderScene(outCtx, outW, outH, fmt, spk, false);

  return new Promise((resolve) => {
    outCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tedx-csa-${fmt.id}-${slugify(spk.name)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      resolve();
    }, 'image/png');
  });
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function buildEditableSvgString(fmt, spk) {
  if (spk.photoDataUrl) await loadImage(spk.photoDataUrl);
  const W = fmt.w;
  const H = fmt.h;

  const mCanvas = document.createElement('canvas');
  mCanvas.width = W;
  mCanvas.height = H;
  const mCtx = mCanvas.getContext('2d');
  const layout = renderScene(mCtx, W, H, fmt, spk, false);

  const u = layout.geom.upper;
  const l = layout.geom.lower;
  const portrait = getProcessedPortrait(spk);
  let portraitHref = '';
  if (portrait && portrait.canvas) {
    if (!portrait.dataUrl) {
      portrait.dataUrl = portrait.canvas.toDataURL('image/png');
    }
    portraitHref = portrait.dataUrl;
  }

  const pm = layout.portraitDrawMetrics;
  const unit = layout.geom.isLandscape ? H : W;
  const topY = layout.geom.isLandscape ? H * 0.095 : fmt.mode === 'badge' ? H * 0.085 : H * 0.028;
  const tedBaseline = Math.round(topY + layout.tedSize * 0.84);
  let subY = topY + layout.tedSize * 1.02;

  const orgLinesSvg = [];
  if (state.orgLine1.trim()) {
    orgLinesSvg.push(`<text x="${layout.padLeft.toFixed(1)}" y="${(subY + layout.subSize * 0.84).toFixed(1)}" fill="#F5F5F7" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="300" font-size="${layout.subSize}">${escapeXml(state.orgLine1.trim())}</text>`);
    subY += layout.subSize * 1.05;
  }
  if (state.orgLine2.trim()) {
    orgLinesSvg.push(`<text x="${layout.padLeft.toFixed(1)}" y="${(subY + layout.subSize * 0.84).toFixed(1)}" fill="#F5F5F7" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="300" font-size="${layout.subSize}">${escapeXml(state.orgLine2.trim())}</text>`);
  }

  const nameLinesSvg = layout.renderedNameLines.map(nl =>
    `<text x="${nl.x.toFixed(1)}" y="${(nl.y + layout.nameFontSize * 0.84).toFixed(1)}" fill="#FFFFFF" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="800" font-size="${layout.nameFontSize}" letter-spacing="-0.02em">${escapeXml(nl.text)}</text>`
  ).join('\n    ');

  const talkSvg = layout.renderedTalkLine
    ? `<text x="${layout.renderedTalkLine.x.toFixed(1)}" y="${(layout.renderedTalkLine.y + layout.renderedTalkLine.size * 0.84).toFixed(1)}" fill="${state.accentRed}" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="${layout.renderedTalkLine.size}">${escapeXml(layout.renderedTalkLine.text)}</text>`
    : '';

  const maxBot = u.cy + u.r - unit * 0.025;
  const bioLinesSvg = layout.bioLines
    .filter(bl => bl.y + layout.bioFontSize <= maxBot)
    .map(bl =>
      `<text x="${bl.x.toFixed(1)}" y="${(bl.y + layout.bioFontSize * 0.84).toFixed(1)}" fill="#EBEBEF" fill-opacity="0.9" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="400" font-size="${layout.bioFontSize}">${escapeXml(bl.text)}</text>`
    ).join('\n    ');

  const portraitSvg = (portraitHref && pm)
    ? `<g clip-path="url(#lowerCircleClip)">
      <image href="${portraitHref}" x="${pm.dx.toFixed(1)}" y="${pm.dy.toFixed(1)}" width="${pm.dw.toFixed(1)}" height="${pm.dh.toFixed(1)}" preserveAspectRatio="none" />
      <rect x="0" y="${(H * 0.90).toFixed(1)}" width="${W}" height="${(H * 0.10).toFixed(1)}" fill="url(#bottomFade)" />
    </g>`
    : '';

  const badgeSvg = fmt.mode === 'badge'
    ? `<g id="Badge_Role_Bar">
      <rect x="0" y="${(H * 0.905).toFixed(1)}" width="${W}" height="${(H * 0.095).toFixed(1)}" fill="${state.accentRed}" />
      <text x="${(W / 2).toFixed(1)}" y="${(H * 0.965).toFixed(1)}" text-anchor="middle" fill="#FFFFFF" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="900" font-size="${Math.round(W * 0.058)}">${escapeXml((spk.role || 'SPEAKER').toUpperCase())}</text>
    </g>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <title>TEDx CS Academy Coimbatore — ${escapeXml(spk.name.replace(/\n/g, ' '))}</title>
  <defs>
    <clipPath id="lowerCircleClip">
      <circle cx="${l.cx.toFixed(1)}" cy="${l.cy.toFixed(1)}" r="${l.r.toFixed(1)}" />
    </clipPath>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#080808" stop-opacity="0" />
      <stop offset="100%" stop-color="#080808" stop-opacity="0.72" />
    </linearGradient>
  </defs>

  <rect id="Background_Red" width="${W}" height="${H}" fill="${state.accentRed}" />
  <circle id="Upper_Arc_Black" cx="${u.cx.toFixed(1)}" cy="${u.cy.toFixed(1)}" r="${u.r.toFixed(1)}" fill="#080808" />
  <circle id="Lower_Arc_Black" cx="${l.cx.toFixed(1)}" cy="${l.cy.toFixed(1)}" r="${l.r.toFixed(1)}" fill="#080808" />

  ${portraitSvg}

  <g id="TEDx_Event_Lockup">
    <text x="${layout.padLeft.toFixed(1)}" y="${tedBaseline}" fill="${state.accentRed}" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-weight="900" font-size="${layout.tedSize}" letter-spacing="-0.05em">TED<tspan dy="${Math.round(-layout.tedSize * 0.34)}" font-size="${Math.round(layout.tedSize * 0.62)}">x</tspan></text>
    ${orgLinesSvg.join('\n    ')}
  </g>

  <g id="Speaker_Name">
    ${nameLinesSvg}
    ${talkSvg}
  </g>

  <g id="Speaker_Bio">
    ${bioLinesSvg}
  </g>

  ${badgeSvg}
</svg>`;
}

async function exportEditableSvg() {
  const fmt = FORMATS[state.format];
  const spk = currentSpeaker();
  const svgStr = await buildEditableSvgString(fmt, spk);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tedx-csa-${fmt.id}-${slugify(spk.name)}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  showToast('Exported layered .SVG (Illustrator, Figma & Canva ready)');
}

async function exportPrintPdfView() {
  const fmt = FORMATS[state.format];
  const spk = currentSpeaker();
  if (spk.photoDataUrl) await loadImage(spk.photoDataUrl);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = fmt.w;
  outCanvas.height = fmt.h;
  renderScene(outCanvas.getContext('2d'), fmt.w, fmt.h, fmt, spk, false);
  const dataUrl = outCanvas.toDataURL('image/png');

  const win = window.open('', '_blank');
  if (!win) {
    showToast('Allow pop-ups to open the Print / Save-as-PDF sheet.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>TEDx CS Academy Coimbatore — ${escapeXml(spk.name.replace(/\n/g, ' '))}</title>
  <style>
    @page { margin: 0; size: ${fmt.w / 100}in ${fmt.h / 100}in; }
    html, body { margin: 0; padding: 0; background: #000; display: flex; justify-content: center; align-items: center; }
    img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <img src="${dataUrl}" onload="setTimeout(() => window.print(), 250)" />
</body>
</html>`);
  win.document.close();
}

/* ---------------- Roster & CSV Bulk Import ---------------- */
function getInitials(nameStr) {
  const clean = (nameStr || 'S').replace(/^(mr|ms|mrs|dr|prof)\.\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (clean.slice(0, 2) || 'SP').toUpperCase();
}

function renderRosterChips() {
  const list = document.getElementById('speakerList');
  document.getElementById('rosterCount').textContent = String(state.speakers.length);
  list.innerHTML = '';

  state.speakers.forEach((s, idx) => {
    const chip = document.createElement('div');
    chip.className = `speaker-chip ${idx === state.activeSpeakerIndex ? 'active' : ''}`;
    const shortName = (s.name || `Speaker ${idx + 1}`).replace(/\n+/g, ' ').trim();

    if (s.photoDataUrl) {
      const av = document.createElement('img');
      av.className = 'chip-avatar';
      av.src = s.photoDataUrl;
      av.alt = '';
      chip.appendChild(av);
    } else {
      const av = document.createElement('span');
      av.className = 'chip-avatar';
      av.textContent = getInitials(shortName);
      chip.appendChild(av);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'chip-name';
    labelSpan.textContent = shortName || `Speaker ${idx + 1}`;
    chip.appendChild(labelSpan);

    if (state.speakers.length > 1) {
      const del = document.createElement('span');
      del.className = 'delete-chip';
      del.textContent = '×';
      del.title = 'Remove speaker from lineup';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        state.speakers.splice(idx, 1);
        state.activeSpeakerIndex = Math.max(0, Math.min(state.activeSpeakerIndex, state.speakers.length - 1));
        syncInputsFromState();
        renderRosterChips();
        saveState();
        renderPreview();
      });
      chip.appendChild(del);
    }

    chip.addEventListener('click', () => {
      state.activeSpeakerIndex = idx;
      syncInputsFromState();
      renderRosterChips();
      renderPreview();
    });

    list.appendChild(chip);
  });
}

function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cur.trim());
      cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && next === '\n') i++;
      row.push(cur.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function formatNameMultiLine(rawName) {
  if (!rawName || rawName.includes('\n')) return rawName;
  const parts = rawName.trim().split(/\s+/);
  if (parts.length <= 2) return parts.join('\n');
  if (/^(mr|ms|mrs|dr|prof|shri|smt)\.?$/i.test(parts[0]) && parts.length >= 3) {
    return [`${parts[0]} ${parts[1]}`, ...parts.slice(2)].join('\n');
  }
  return parts.join('\n');
}

function importSpeakersFromCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 1) return;

  const header = rows[0].map(h => h.toLowerCase());
  const hasHeader = header.some(h => h.includes('name') || h.includes('bio') || h.includes('speaker'));
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const nameIdx = hasHeader ? Math.max(0, header.findIndex(h => h.includes('name') || h.includes('speaker'))) : 0;
  const bioIdx = hasHeader ? header.findIndex(h => h.includes('bio') || h.includes('desc') || h.includes('about')) : 1;
  const roleIdx = hasHeader ? header.findIndex(h => h.includes('role') || h.includes('type')) : 2;
  const talkIdx = hasHeader ? header.findIndex(h => h.includes('talk') || h.includes('topic') || h.includes('title')) : 3;

  const imported = dataRows.map((r, i) => ({
    ...structuredClone(DEMO_SPEAKERS[2]),
    id: `csv_${Date.now()}_${i}`,
    name: formatNameMultiLine(r[nameIdx] || `Speaker ${i + 1}`),
    bio: (bioIdx >= 0 ? r[bioIdx] : r[1]) || '',
    role: (roleIdx >= 0 ? r[roleIdx] : '') || 'SPEAKER',
    talkTitle: (talkIdx >= 0 ? r[talkIdx] : '') || '',
    photoDataUrl: ''
  }));

  if (imported.length > 0) {
    state.speakers.push(...imported);
    state.activeSpeakerIndex = state.speakers.length - imported.length;
    syncInputsFromState();
    renderRosterChips();
    saveState();
    renderPreview();
    showToast(`Imported ${imported.length} speakers from CSV!`);
  }
}

/* ---------------- UI Binding & Interactive Controls ---------------- */
function syncInputsFromState() {
  const spk = currentSpeaker();

  document.getElementById('speakerName').value = spk.name;
  document.getElementById('speakerBio').value = spk.bio;
  document.getElementById('bioCharCount').textContent = `${(spk.bio || '').length} chars`;
  document.getElementById('badgeRole').value = spk.role || 'SPEAKER';
  document.getElementById('talkTitle').value = spk.talkTitle || '';

  document.getElementById('orgLine1').value = state.orgLine1;
  document.getElementById('orgLine2').value = state.orgLine2;
  document.getElementById('showRoleOnAll').checked = state.showRoleOnAll;
  document.getElementById('showTedFooter').checked = state.showTedFooter;

  document.getElementById('photoGrayscale').checked = spk.photoGrayscale;
  document.getElementById('photoFeather').value = spk.photoFeather;
  document.getElementById('photoFeatherVal').textContent = `${spk.photoFeather}%`;
  document.getElementById('photoBgKey').value = spk.photoBgKey;
  document.getElementById('photoBgKeyVal').textContent = `${spk.photoBgKey}%`;
  document.getElementById('photoContrast').value = spk.photoContrast;
  document.getElementById('photoContrastVal').textContent = `${spk.photoContrast}%`;
  document.getElementById('photoBrightness').value = spk.photoBrightness;
  document.getElementById('photoBrightnessVal').textContent = `${spk.photoBrightness}%`;

  document.getElementById('photoScale').value = spk.photoScale;
  document.getElementById('photoScaleVal').textContent = `${spk.photoScale}%`;
  document.getElementById('photoX').value = spk.photoX;
  document.getElementById('photoXVal').textContent = `${spk.photoX}%`;
  document.getElementById('photoY').value = spk.photoY;
  document.getElementById('photoYVal').textContent = `${spk.photoY}%`;

  document.getElementById('nameSize').value = state.nameSize;
  document.getElementById('nameSizeVal').textContent = `${state.nameSize}%`;
  document.getElementById('bioSize').value = state.bioSize;
  document.getElementById('bioSizeVal').textContent = `${state.bioSize}%`;
  document.getElementById('waistGap').value = state.waistGap;
  document.getElementById('waistGapVal').textContent = state.waistGap;
  document.getElementById('arcSpin').value = state.arcSpin;
  document.getElementById('arcSpinVal').textContent = state.arcSpin;
  document.getElementById('exportScaleSelect').value = String(state.exportScale);

  document.querySelectorAll('.format-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === state.format);
  });
  document.querySelectorAll('.style-card').forEach(card => {
    card.classList.toggle('active', card.dataset.preset === state.arcPreset);
  });
  document.getElementById('toggleGuidesBtn').classList.toggle('active', state.showGuides);
}

function handlePhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const spk = currentSpeaker();
    spk.photoDataUrl = e.target.result;
    spk.photoScale = 100;
    spk.photoX = 0;
    spk.photoY = 0;
    processedPortraitCache = { key: '', canvas: null, dataUrl: null };
    syncInputsFromState();
    renderRosterChips();
    saveState();
    renderPreview();
    showToast('Portrait blended into lower arc!');
  };
  reader.readAsDataURL(file);
}

function centerCurrentPortrait() {
  const spk = currentSpeaker();
  spk.photoScale = 100;
  spk.photoX = 0;
  spk.photoY = 0;
  syncInputsFromState();
  saveState();
  renderPreview();
  showToast('Portrait centered');
}

function bindEvents() {
  document.getElementById('formatTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.format-pill');
    if (!btn) return;
    state.format = btn.dataset.format;
    syncInputsFromState();
    saveState();
    renderPreview();
  });

  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  document.getElementById('arcPresetCards').addEventListener('click', (e) => {
    const card = e.target.closest('.style-card');
    if (!card) return;
    state.arcPreset = card.dataset.preset;
    syncInputsFromState();
    saveState();
    renderPreview();
  });

  const bindSpeakerField = (id, prop, extraFn) => {
    document.getElementById(id).addEventListener('input', (e) => {
      currentSpeaker()[prop] = e.target.value;
      if (extraFn) extraFn(e.target.value);
      renderRosterChips();
      saveState();
      renderPreview();
    });
  };

  bindSpeakerField('speakerName', 'name');
  bindSpeakerField('speakerBio', 'bio', (v) => {
    document.getElementById('bioCharCount').textContent = `${v.length} chars`;
  });
  bindSpeakerField('badgeRole', 'role');
  bindSpeakerField('talkTitle', 'talkTitle');

  document.getElementById('clearSpeakerBtn').addEventListener('click', () => {
    const spk = currentSpeaker();
    spk.name = 'Speaker\nFull Name';
    spk.bio = 'Title, organization, and brief speaker introduction.';
    spk.talkTitle = '';
    syncInputsFromState();
    renderRosterChips();
    saveState();
    renderPreview();
  });

  document.getElementById('resetDemoBtn').addEventListener('click', async () => {
    localStorage.removeItem(STORAGE_KEY);
    state.speakers = structuredClone(DEMO_SPEAKERS);
    state.activeSpeakerIndex = 0;
    state.arcPreset = 'classic';
    state.waistGap = 0;
    state.arcSpin = 0;
    state.accentRed = '#EB0028';
    syncInputsFromState();
    renderRosterChips();
    await renderPreview();
    showToast('Restored demo speaker lineup');
  });

  document.getElementById('orgLine1').addEventListener('input', (e) => {
    state.orgLine1 = e.target.value;
    saveState();
    renderPreview();
  });
  document.getElementById('orgLine2').addEventListener('input', (e) => {
    state.orgLine2 = e.target.value;
    saveState();
    renderPreview();
  });
  document.getElementById('showRoleOnAll').addEventListener('change', (e) => {
    state.showRoleOnAll = e.target.checked;
    saveState();
    renderPreview();
  });
  document.getElementById('showTedFooter').addEventListener('change', (e) => {
    state.showTedFooter = e.target.checked;
    saveState();
    renderPreview();
  });

  // Portrait Upload
  const dropzone = document.getElementById('photoDropzone');
  const photoInput = document.getElementById('photoInput');
  dropzone.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));

  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  });

  // Full-stage drag & drop
  const stage = document.getElementById('canvasViewport');
  stage.addEventListener('dragenter', (e) => {
    e.preventDefault();
    stage.classList.add('dragging-file');
  });
  stage.addEventListener('dragover', (e) => {
    e.preventDefault();
    stage.classList.add('dragging-file');
  });
  stage.addEventListener('dragleave', (e) => {
    if (e.target === stage) stage.classList.remove('dragging-file');
  });
  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    stage.classList.remove('dragging-file');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  });

  document.getElementById('resetPhotoTransformBtn').addEventListener('click', centerCurrentPortrait);

  document.getElementById('removePhotoBtn').addEventListener('click', () => {
    currentSpeaker().photoDataUrl = '';
    renderRosterChips();
    saveState();
    renderPreview();
  });

  document.getElementById('photoGrayscale').addEventListener('change', (e) => {
    currentSpeaker().photoGrayscale = e.target.checked;
    saveState();
    renderPreview();
  });

  const bindSpeakerSlider = (id, prop, suffix = '%') => {
    document.getElementById(id).addEventListener('input', (e) => {
      const val = Number(e.target.value);
      currentSpeaker()[prop] = val;
      document.getElementById(`${id}Val`).textContent = `${val}${suffix}`;
      saveState();
      renderPreview();
    });
  };

  bindSpeakerSlider('photoFeather', 'photoFeather');
  bindSpeakerSlider('photoBgKey', 'photoBgKey');
  bindSpeakerSlider('photoContrast', 'photoContrast');
  bindSpeakerSlider('photoBrightness', 'photoBrightness');
  bindSpeakerSlider('photoScale', 'photoScale');
  bindSpeakerSlider('photoX', 'photoX');
  bindSpeakerSlider('photoY', 'photoY');

  const bindGlobalSlider = (id, prop, suffix = '') => {
    document.getElementById(id).addEventListener('input', (e) => {
      const val = Number(e.target.value);
      state[prop] = val;
      document.getElementById(`${id}Val`).textContent = `${val}${suffix}`;
      saveState();
      renderPreview();
    });
  };

  bindGlobalSlider('nameSize', 'nameSize', '%');
  bindGlobalSlider('bioSize', 'bioSize', '%');
  bindGlobalSlider('waistGap', 'waistGap', '');
  bindGlobalSlider('arcSpin', 'arcSpin', '');

  document.getElementById('colorSwatches').addEventListener('click', (e) => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    state.accentRed = sw.dataset.color;
    document.getElementById('customRedPicker').value = state.accentRed;
    document.querySelectorAll('.swatch').forEach(b => b.classList.toggle('active', b === sw));
    saveState();
    renderPreview();
  });

  document.getElementById('customRedPicker').addEventListener('input', (e) => {
    state.accentRed = e.target.value;
    document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
    saveState();
    renderPreview();
  });

  document.getElementById('exportScaleSelect').addEventListener('change', (e) => {
    state.exportScale = Number(e.target.value) || 1;
    saveState();
    renderPreview();
  });

  // Stage Zoom HUD
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    state.viewZoom = Math.max(0.55, Number((state.viewZoom - 0.15).toFixed(2)));
    renderPreview();
  });
  document.getElementById('zoomResetBtn').addEventListener('click', () => {
    state.viewZoom = 1.0;
    renderPreview();
  });
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    state.viewZoom = Math.min(2.0, Number((state.viewZoom + 0.15).toFixed(2)));
    renderPreview();
  });

  // Canvas Interactive Drag & Wheel Zoom for Portrait
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    const spk = currentSpeaker();
    dragStart = { x: e.clientX, y: e.clientY, origX: spk.photoX, origY: spk.photoY };
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const dxPct = ((e.clientX - dragStart.x) / Math.max(1, rect.width)) * 180;
    const dyPct = ((e.clientY - dragStart.y) / Math.max(1, rect.height)) * 240;
    const spk = currentSpeaker();
    spk.photoX = Math.round(Math.max(-80, Math.min(80, dragStart.origX + dxPct)));
    spk.photoY = Math.round(Math.max(-80, Math.min(80, dragStart.origY + dyPct)));
    syncInputsFromState();
    renderPreview();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      saveState();
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const spk = currentSpeaker();
    const delta = e.deltaY < 0 ? 4 : -4;
    spk.photoScale = Math.max(35, Math.min(240, spk.photoScale + delta));
    syncInputsFromState();
    saveState();
    renderPreview();
  }, { passive: false });

  // Roster Actions
  document.getElementById('addSpeakerBtn').addEventListener('click', () => {
    const idx = state.speakers.length + 1;
    state.speakers.push({
      ...structuredClone(DEMO_SPEAKERS[2]),
      id: `spk_${Date.now()}`,
      name: `Speaker ${idx}\nFull Name`,
      bio: 'Designation, organization, and brief speaker bio for TEDx CS Academy Coimbatore.',
      talkTitle: '',
      photoDataUrl: ''
    });
    state.activeSpeakerIndex = state.speakers.length - 1;
    syncInputsFromState();
    renderRosterChips();
    saveState();
    renderPreview();
  });

  document.getElementById('duplicateSpeakerBtn').addEventListener('click', () => {
    const copy = structuredClone(currentSpeaker());
    copy.id = `spk_${Date.now()}`;
    copy.name = `${copy.name} (Copy)`;
    state.speakers.splice(state.activeSpeakerIndex + 1, 0, copy);
    state.activeSpeakerIndex += 1;
    syncInputsFromState();
    renderRosterChips();
    saveState();
    renderPreview();
    showToast('Duplicated speaker card');
  });

  document.getElementById('importCsvBtn').addEventListener('click', () => {
    document.getElementById('csvFileInput').click();
  });

  document.getElementById('csvFileInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => importSpeakersFromCsv(ev.target.result);
    r.readAsText(f);
    e.target.value = '';
  });

  document.getElementById('exportAllBtn').addEventListener('click', async () => {
    showToast(`Exporting ${state.speakers.length} speaker banner(s)...`);
    for (const s of state.speakers) {
      await exportHighResPng(s);
      await new Promise(res => setTimeout(res, 260));
    }
    showToast(`Finished exporting ${state.speakers.length} PNG banner(s)!`);
  });

  // Topbar Buttons
  document.getElementById('toggleGuidesBtn').addEventListener('click', () => {
    state.showGuides = !state.showGuides;
    syncInputsFromState();
    renderPreview();
  });

  document.getElementById('exportPngBtn').addEventListener('click', async () => {
    await exportHighResPng(currentSpeaker());
    showToast('Downloaded print-ready .PNG!');
  });

  document.getElementById('exportSvgBtn').addEventListener('click', exportEditableSvg);
  document.getElementById('exportPdfBtn').addEventListener('click', exportPrintPdfView);

  // Shortcuts Modal & Keybindings
  const modal = document.getElementById('shortcutsModal');
  document.getElementById('shortcutsBtn').addEventListener('click', () => modal.classList.toggle('open'));
  document.getElementById('closeShortcutsBtn').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  window.addEventListener('keydown', async (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      await exportHighResPng(currentSpeaker());
      showToast('Downloaded print-ready .PNG!');
      return;
    }

    const tag = (e.target && e.target.tagName) || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      modal.classList.toggle('open');
    } else if (e.key === 'Escape') {
      modal.classList.remove('open');
    } else if (e.key.toLowerCase() === 'g') {
      state.showGuides = !state.showGuides;
      syncInputsFromState();
      renderPreview();
    } else if (e.key.toLowerCase() === 'r') {
      centerCurrentPortrait();
    } else if (e.key >= '1' && e.key <= '6') {
      const fk = FORMAT_KEYS[Number(e.key) - 1];
      if (fk) {
        state.format = fk;
        syncInputsFromState();
        saveState();
        renderPreview();
      }
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const spk = currentSpeaker();
      if (e.key === 'ArrowLeft') spk.photoX = Math.max(-80, spk.photoX - 2);
      if (e.key === 'ArrowRight') spk.photoX = Math.min(80, spk.photoX + 2);
      if (e.key === 'ArrowUp') spk.photoY = Math.max(-80, spk.photoY - 2);
      if (e.key === 'ArrowDown') spk.photoY = Math.min(80, spk.photoY + 2);
      syncInputsFromState();
      saveState();
      renderPreview();
    }
  });

  window.addEventListener('resize', () => renderPreview());
}

/* ---------------- Init ---------------- */
(async function init() {
  loadSavedState();
  syncInputsFromState();
  renderRosterChips();
  bindEvents();
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await Promise.all(
    state.speakers.filter(s => s.photoDataUrl).map(s => loadImage(s.photoDataUrl))
  );
  await renderPreview();
})();
