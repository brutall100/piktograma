/* ==========================================================================
   Vizitinės kortelės kūrėjas (Piktograma)
   Kortelė piešiama <canvas> milimetrais: 90 × 50 mm, spaudai + 3 mm užlaidos.
   PDF sukuriamas be bibliotekų: kiekvienas puslapis – 600 dpi JPEG su TrimBox.
   Logotipas niekur nesiunčiamas – lieka naršyklėje.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.querySelector('[data-card-maker]');
  if (!root) return;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const T = JSON.parse(root.dataset.i18n || '{}');

  const W = 90;
  const H = 50;
  const BLEED = 3;
  const STORE = 'piktograma-card-v1';

  const FONTS = {
    modern: { head: 'Manrope', body: 'Manrope', headW: 800, bodyW: 500 },
    round: { head: 'Quicksand', body: 'Quicksand', headW: 700, bodyW: 600 },
    serif: { head: 'Georgia, "Times New Roman", serif', body: 'Georgia, "Times New Roman", serif', headW: 700, bodyW: 400 },
  };
  const FIELDS = ['name', 'role', 'company', 'slogan', 'phone', 'email', 'web', 'address'];

  const form = $('[data-cm-form]');
  const front = $('[data-cm-front]');
  const back = $('[data-cm-back]');
  const backWrap = $('[data-cm-back-wrap]');
  const msg = $('[data-cm-msg]');
  const customColor = $('[data-cm-custom]');
  const logoInput = $('[data-cm-logo]');
  const logoName = $('[data-cm-logo-name]');
  const logoRemove = $('[data-cm-logo-remove]');
  const logoLabel = logoName ? logoName.textContent : '';

  let logo = null; // { img, src, name }

  /* ------------------------------------------------------------------ */
  /* Būsena                                                              */
  /* ------------------------------------------------------------------ */

  function state() {
    const fd = new FormData(form);
    const st = { template: fd.get('template') || 'diagonal', font: fd.get('font') || 'modern', back: fd.get('back') === '1' };
    const c = fd.get('color');
    st.color = c === 'custom' ? customColor.value : c || '#e53126';
    st.colorKey = c;
    st.data = {};
    st.filled = {};
    for (const k of FIELDS) {
      const v = String(fd.get(k) || '').trim();
      st.filled[k] = v;
      st.data[k] = v || T.ph[k] || '';
    }
    return st;
  }

  function save(st) {
    try {
      const keep = { ...st.filled, template: st.template, font: st.font, back: st.back, color: st.colorKey, custom: customColor.value };
      if (logo && logo.src.length < 400000) keep.logo = { src: logo.src, name: logo.name };
      localStorage.setItem(STORE, JSON.stringify(keep));
    } catch {
      /* privatus režimas ar pilna saugykla – ne bėda */
    }
  }

  function restore() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(STORE) || 'null');
    } catch {
      d = null;
    }
    if (!d) return;
    for (const k of FIELDS) if (d[k] && form.elements[k]) form.elements[k].value = d[k];
    const pick = (name, v) => {
      const el = $$(`input[name="${name}"]`, form).find((x) => x.value === v);
      if (el) el.checked = true;
    };
    if (d.template) pick('template', d.template);
    if (d.font) pick('font', d.font);
    if (d.custom) customColor.value = d.custom;
    if (d.color) pick('color', d.color);
    if (typeof d.back === 'boolean') form.elements.back.checked = d.back;
    if (d.logo && d.logo.src) loadLogo(d.logo.src, d.logo.name, true);
  }

  /* ------------------------------------------------------------------ */
  /* Piešimo pagalbininkai (vienetai – milimetrai)                       */
  /* ------------------------------------------------------------------ */

  // Smulkiam tekstui šriftas nustatomas 10× didesnis ir sumažinamas – taip išvengiama
  // naršyklių apribojimų labai mažiems šrifto dydžiams.
  function text(c, str, x, y, { size = 3, weight = 500, family = 'Manrope', color = '#141414', align = 'left', max = 0, spacing = 0, upper = false } = {}) {
    if (!str) return 0;
    let s = upper ? str.toLocaleUpperCase(T.lang === 'lt' ? 'lt' : 'en') : str;
    let sz = size;
    c.save();
    c.scale(0.1, 0.1);
    const setFont = () => {
      c.font = `${weight} ${sz * 10}px ${family}`;
      if ('letterSpacing' in c) c.letterSpacing = `${spacing * sz * 10}px`;
    };
    setFont();
    if (max) {
      while (c.measureText(s).width / 10 > max && sz > size * 0.55) {
        sz *= 0.95;
        setFont();
      }
      // vis dar netelpa – sutrumpinam
      while (c.measureText(s).width / 10 > max && s.length > 3) {
        s = s.slice(0, -2) + '…';
      }
    }
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillText(s, x * 10, y * 10);
    const w = c.measureText(s).width / 10;
    c.restore();
    return w;
  }

  function diamond(c, x, y, size, fill, stroke = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.PI / 4);
    if (stroke) {
      c.lineWidth = stroke;
      c.strokeStyle = fill;
      c.strokeRect(-size / 2, -size / 2, size, size);
    } else {
      c.fillStyle = fill;
      c.fillRect(-size / 2, -size / 2, size, size);
    }
    c.restore();
  }

  function poly(c, pts, fill) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }

  const bg = (c, color) => {
    c.fillStyle = color;
    c.fillRect(-BLEED, -BLEED, W + BLEED * 2, H + BLEED * 2);
  };

  // Logotipas į stačiakampį (x, y, w, h); align: 'left' | 'right' | 'center'
  function drawLogo(c, x, y, w, h, align = 'left') {
    if (!logo) return false;
    const iw = logo.img.naturalWidth || logo.img.width || 1;
    const ih = logo.img.naturalHeight || logo.img.height || 1;
    const k = Math.min(w / iw, h / ih);
    const dw = iw * k;
    const dh = ih * k;
    const dx = align === 'right' ? x + w - dw : align === 'center' ? x + (w - dw) / 2 : x;
    c.drawImage(logo.img, dx, y + (h - dh) / 2, dw, dh);
    return true;
  }

  // Kontaktų eilutės su rombo ženkleliu
  function contacts(c, d, x, y, { size = 2.25, gap = 3.55, color = '#2a2a2a', bullet = '#e53126', family, weight, max = 40, align = 'left' } = {}) {
    const rows = ['phone', 'email', 'web', 'address'].map((k) => d[k]).filter(Boolean);
    rows.forEach((v, i) => {
      const yy = y + i * gap;
      if (align === 'right') {
        text(c, v, x - 2.6, yy, { size, family, weight, color, align: 'right', max });
        diamond(c, x - 0.8, yy - size * 0.33, 1.05, bullet);
      } else {
        diamond(c, x + 0.6, yy - size * 0.33, 1.05, bullet);
        text(c, v, x + 2.4, yy, { size, family, weight, color, max });
      }
    });
    return rows.length;
  }

  // Šviesi ar tamsi spalva (tekstui ant jos)
  function isLight(hex) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    if (!m) return false;
    const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62;
  }

  /* ------------------------------------------------------------------ */
  /* Šablonai: front(c, st) ir back(c, st)                               */
  /* ------------------------------------------------------------------ */

  const INK = '#141414';
  const MUTED = '#5d5d60';
  const DARK = '#121214';

  const TEMPLATES = {
    /* Įstrižainė – Piktogramos kortelės motyvas */
    diagonal: {
      front(c, st, F) {
        const d = st.data;
        const a = st.color;
        bg(c, '#ffffff');
        poly(c, [[62, -BLEED], [W + BLEED, -BLEED], [W + BLEED, H + BLEED], [44, H + BLEED]], DARK);
        diamond(c, 55.5, 31, 7.5, a);
        diamond(c, 49.5, 41.5, 4.6, '#9a9a9d');
        diamond(c, 61.5, 21, 3.4, '#ffffff', 0.5);
        diamond(c, 68.5, 26.5, 1.8, a);
        let top = 13.5;
        if (drawLogo(c, 6, 5, 22, 7.5)) top = 19.5;
        text(c, d.name, 6, top, { size: 4.4, weight: F.headW, family: F.head, color: INK, max: 46 });
        text(c, d.role, 6, top + 4.6, { size: 2.2, weight: 700, family: F.body, color: a, upper: true, spacing: 0.08, max: 44 });
        contacts(c, d, 6, 32.5, { family: F.body, weight: F.bodyW, color: '#2b2b2b', bullet: a, max: 36 });
        text(c, d.company, W - 5, 12.5, { size: 3.1, weight: F.headW, family: F.head, color: '#ffffff', align: 'right', max: 24 });
        text(c, d.slogan, W - 5, 16.5, { size: 1.9, weight: F.bodyW, family: F.body, color: '#a9a9ad', align: 'right', max: 24 });
      },
      back: (c, st, F) => backSide(c, st, F, DARK),
    },

    /* Klasika – akcento juosta kairėje */
    classic: {
      front(c, st, F) {
        const d = st.data;
        const a = st.color;
        bg(c, '#ffffff');
        c.fillStyle = a;
        c.fillRect(-BLEED, -BLEED, BLEED + 3, H + BLEED * 2);
        drawLogo(c, 60, 5, 25, 11, 'right') ||
          text(c, d.company, W - 5, 10.5, { size: 2.6, weight: F.headW, family: F.head, color: INK, align: 'right', max: 34 });
        text(c, d.name, 9, 21, { size: 4.6, weight: F.headW, family: F.head, color: INK, max: 76 });
        text(c, d.role, 9, 25.6, { size: 2.2, weight: 700, family: F.body, color: a, upper: true, spacing: 0.08, max: 70 });
        c.fillStyle = '#e3e3e5';
        c.fillRect(9, 29, 72, 0.25);
        contacts(c, d, 9, 34.5, { family: F.body, weight: F.bodyW, color: '#2b2b2b', bullet: a, max: 72, gap: 3.45 });
      },
      back: (c, st, F) => backSide(c, st, F, st.color),
    },

    /* Minimalus – daug baltos erdvės */
    minimal: {
      front(c, st, F) {
        const d = st.data;
        const a = st.color;
        bg(c, '#ffffff');
        diamond(c, 8, 12.2, 2.2, a);
        text(c, d.name, 11.5, 13.6, { size: 3.8, weight: F.headW, family: F.head, color: INK, max: 66 });
        text(c, d.role, 11.5, 17.6, { size: 2.1, weight: F.bodyW, family: F.body, color: MUTED, max: 66 });
        const rows = ['phone', 'email', 'web', 'address'].map((k) => d[k]).filter(Boolean);
        rows.forEach((v, i) => text(c, v, W - 7, 33 + i * 3.3, { size: 2.1, weight: F.bodyW, family: F.body, color: '#2b2b2b', align: 'right', max: 50 }));
        c.fillStyle = a;
        c.fillRect(W - 5.4, 29.8, 0.35, Math.max(1, rows.length) * 3.3 + 0.4);
        drawLogo(c, 7, 34, 22, 9) || text(c, d.company, 7, 42, { size: 2.3, weight: F.headW, family: F.head, color: INK, max: 30 });
      },
      back: (c, st, F) => backSide(c, st, F, '#ffffff', true),
    },

    /* Tamsus */
    dark: {
      front(c, st, F) {
        const d = st.data;
        const a = st.color;
        bg(c, DARK);
        poly(c, [[W + BLEED, 28], [W + BLEED, H + BLEED], [64, H + BLEED]], a === DARK || a === '#111214' ? '#3a3a3e' : a);
        diamond(c, 83, 42.5, 3.4, '#ffffff', 0.35);
        diamond(c, 77.5, 46, 1.6, '#ffffff');
        drawLogo(c, 60, 5, 25, 10, 'right') ||
          text(c, d.company, W - 5, 10.5, { size: 2.6, weight: F.headW, family: F.head, color: '#ffffff', align: 'right', max: 34 });
        text(c, d.name, 6, 20, { size: 4.5, weight: F.headW, family: F.head, color: '#ffffff', max: 70 });
        text(c, d.role, 6, 24.6, { size: 2.2, weight: 700, family: F.body, color: isLight(a) || a === DARK ? '#cfcfd2' : a, upper: true, spacing: 0.08, max: 60 });
        contacts(c, d, 6, 32.8, { family: F.body, weight: F.bodyW, color: '#e8e8ea', bullet: a === '#111214' ? '#ffffff' : a, max: 54 });
      },
      back: (c, st, F) => backSide(c, st, F, st.color === '#111214' ? '#e53126' : st.color),
    },

    /* Juosta apačioje */
    band: {
      front(c, st, F) {
        const d = st.data;
        const a = st.color;
        const on = isLight(a) ? INK : '#ffffff';
        bg(c, '#ffffff');
        c.fillStyle = a;
        c.fillRect(-BLEED, 32, W + BLEED * 2, H - 32 + BLEED);
        diamond(c, 12, 32, 3.2, '#ffffff');
        diamond(c, 12, 32, 1.6, a);
        text(c, d.name, 6, 13, { size: 4.4, weight: F.headW, family: F.head, color: INK, max: 52 });
        text(c, d.role, 6, 17.6, { size: 2.2, weight: 700, family: F.body, color: a === '#ffffff' ? MUTED : a, upper: true, spacing: 0.08, max: 50 });
        drawLogo(c, 60, 5, 25, 12, 'right') ||
          (text(c, d.company, W - 5, 10.5, { size: 2.6, weight: F.headW, family: F.head, color: INK, align: 'right', max: 30 }),
          text(c, d.slogan, W - 5, 14, { size: 1.8, weight: F.bodyW, family: F.body, color: MUTED, align: 'right', max: 30 }));
        const L = [d.phone, d.email].filter(Boolean);
        const R = [d.web, d.address].filter(Boolean);
        L.forEach((v, i) => text(c, v, 6, 39.5 + i * 3.6, { size: 2.2, weight: F.bodyW, family: F.body, color: on, max: 38 }));
        R.forEach((v, i) => text(c, v, W - 6, 39.5 + i * 3.6, { size: 2.2, weight: F.bodyW, family: F.body, color: on, align: 'right', max: 36 }));
      },
      back: (c, st, F) => backSide(c, st, F, DARK),
    },

    /* Centre */
    center: {
      front(c, st, F) {
        const d = st.data;
        const a = st.color;
        bg(c, '#ffffff');
        const cx = W / 2;
        drawLogo(c, cx - 15, 5, 30, 9.5, 'center') ||
          text(c, d.company, cx, 11.5, { size: 2.6, weight: F.headW, family: F.head, color: a === '#ffffff' ? INK : a, align: 'center', max: 60, upper: true, spacing: 0.12 });
        text(c, d.name, cx, 24, { size: 4.6, weight: F.headW, family: F.head, color: INK, align: 'center', max: 78 });
        text(c, d.role, cx, 28.4, { size: 2.1, weight: F.bodyW, family: F.body, color: MUTED, align: 'center', max: 70 });
        diamond(c, cx, 32.6, 1.6, a);
        c.fillStyle = '#d9d9dc';
        c.fillRect(cx - 14, 32.5, 11.5, 0.22);
        c.fillRect(cx + 2.5, 32.5, 11.5, 0.22);
        const r1 = [d.phone, d.email].filter(Boolean).join('   ·   ');
        const r2 = [d.web, d.address].filter(Boolean).join('   ·   ');
        text(c, r1, cx, 39.2, { size: 2.1, weight: F.bodyW, family: F.body, color: '#2b2b2b', align: 'center', max: 80 });
        text(c, r2, cx, 42.8, { size: 2.1, weight: F.bodyW, family: F.body, color: '#2b2b2b', align: 'center', max: 80 });
      },
      back: (c, st, F) => backSide(c, st, F, st.color),
    },
  };

  /* Nugarėlė: logotipas (ar įmonės pavadinimas) centre, svetainė apačioje */
  function backSide(c, st, F, color, light = false) {
    const d = st.data;
    const a = st.color;
    const dark = !light && !isLight(color);
    const fg = dark ? '#ffffff' : INK;
    bg(c, color);
    // rombų motyvas kampe
    const deco = color === a ? (dark ? 'rgba(255,255,255,0.9)' : INK) : a;
    diamond(c, W - 9, 9, 5.2, deco);
    diamond(c, W - 15.5, 6.5, 2.4, deco, 0.35);
    diamond(c, W - 4.5, 15.5, 1.8, deco);
    diamond(c, 7, H - 7, 3, deco, 0.35);
    if (logo) {
      if (dark) {
        // baltas pagrindas, kad tamsus logotipas matytųsi
        c.fillStyle = '#ffffff';
        roundRect(c, W / 2 - 21, H / 2 - 10.5, 42, 17, 1.2);
        c.fill();
      }
      drawLogo(c, W / 2 - 18, H / 2 - 8.5, 36, 13, 'center');
      text(c, d.slogan, W / 2, H / 2 + 12, { size: 2, weight: F.bodyW, family: F.body, color: dark ? '#ffffffcc' : MUTED, align: 'center', max: 70 });
    } else {
      text(c, d.company, W / 2, H / 2 + 1, { size: 5, weight: F.headW, family: F.head, color: fg, align: 'center', max: 70 });
      text(c, d.slogan, W / 2, H / 2 + 6, { size: 2.1, weight: F.bodyW, family: F.body, color: dark ? 'rgba(255,255,255,0.78)' : MUTED, align: 'center', max: 70 });
    }
    text(c, d.web, W / 2, H - 5.5, { size: 2, weight: 700, family: F.body, color: dark ? 'rgba(255,255,255,0.85)' : INK, align: 'center', max: 60, spacing: 0.06 });
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ------------------------------------------------------------------ */
  /* Atvaizdavimas                                                       */
  /* ------------------------------------------------------------------ */

  // dpmm – taškų milimetre; bleed – ar piešti su užlaidomis
  function render(canvas, side, st, dpmm, bleed = false, template = st.template) {
    const b = bleed ? BLEED : 0;
    const cw = Math.round((W + b * 2) * dpmm);
    const ch = Math.round((H + b * 2) * dpmm);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    const c = canvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cw, ch);
    c.setTransform(dpmm, 0, 0, dpmm, b * dpmm, b * dpmm);
    c.imageSmoothingQuality = 'high';
    if (!bleed) {
      c.save();
      c.beginPath();
      c.rect(0, 0, W, H);
      c.clip();
    }
    TEMPLATES[template][side](c, st, FONTS[st.font] || FONTS.modern);
    if (!bleed) c.restore();
    return canvas;
  }

  let current = null;
  function update() {
    current = state();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const dp = (front.clientWidth || 480) / W;
    render(front, 'front', current, dp * dpr);
    backWrap.hidden = !current.back;
    if (current.back) render(back, 'back', current, ((back.clientWidth || front.clientWidth || 480) / W) * dpr);
    $$('[data-cm-thumb]').forEach((cv) => render(cv, 'front', current, cv.width / W, false, cv.dataset.cmThumb));
    $$('.cm__swatch--custom').forEach((el) => el.style.setProperty('--c', customColor.value));
    syncOrder();
    save(current);
  }

  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  };

  /* ------------------------------------------------------------------ */
  /* Logotipas                                                           */
  /* ------------------------------------------------------------------ */

  function loadLogo(src, name, silent) {
    const img = new Image();
    img.onload = () => {
      logo = { img, src, name };
      logoName.textContent = name || logoLabel;
      logoRemove.hidden = false;
      schedule();
    };
    img.onerror = () => {
      if (!silent) showMsg(T.logoBad);
    };
    img.src = src;
  }

  logoInput.addEventListener('change', () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024 || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
      showMsg(T.logoBad);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => loadLogo(String(reader.result), file.name);
    reader.onerror = () => showMsg(T.logoBad);
    reader.readAsDataURL(file);
  });

  logoRemove.addEventListener('click', () => {
    logo = null;
    logoInput.value = '';
    logoName.textContent = logoLabel;
    logoRemove.hidden = true;
    schedule();
  });

  /* ------------------------------------------------------------------ */
  /* Atsisiuntimai                                                       */
  /* ------------------------------------------------------------------ */

  function showMsg(text) {
    msg.textContent = text;
    msg.hidden = !text;
  }

  const slug = (s) =>
    (s || 'vizitine')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'vizitine';

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

  function needName() {
    const st = state();
    if (!st.filled.name) {
      showMsg(T.needName);
      form.elements.name.focus();
      return null;
    }
    showMsg('');
    return st;
  }

  async function busy(btn, fn) {
    const span = btn.querySelector('span');
    const old = span ? span.textContent : '';
    btn.disabled = true;
    if (span) span.textContent = T.working;
    try {
      await fn();
    } finally {
      btn.disabled = false;
      if (span) span.textContent = old;
    }
  }

  $('[data-cm-png]').addEventListener('click', (e) => {
    const st = needName();
    if (!st) return;
    busy(e.currentTarget, async () => {
      const dpmm = 300 / 25.4;
      const sides = st.back ? ['front', 'back'] : ['front'];
      for (const side of sides) {
        const cv = render(document.createElement('canvas'), side, st, dpmm);
        download(await toBlob(cv, 'image/png'), `${slug(st.filled.name)}-${side === 'front' ? 1 : 2}.png`);
      }
    });
  });

  $('[data-cm-pdf]').addEventListener('click', (e) => {
    const st = needName();
    if (!st) return;
    busy(e.currentTarget, async () => {
      const dpmm = 600 / 25.4;
      const pages = [];
      for (const side of st.back ? ['front', 'back'] : ['front']) {
        const cv = render(document.createElement('canvas'), side, st, dpmm, true);
        const blob = await toBlob(cv, 'image/jpeg', 0.93);
        pages.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), w: cv.width, h: cv.height });
      }
      download(buildPdf(pages, st), `${slug(st.filled.name)}-vizitine.pdf`);
    });
  });

  /* Minimalus PDF: kiekvienas puslapis = vienas JPEG per visą lapą (su užlaidomis). */
  function buildPdf(pages, st) {
    const enc = new TextEncoder();
    const pt = (mm) => (mm * 72) / 25.4;
    const PW = pt(W + BLEED * 2).toFixed(3);
    const PH = pt(H + BLEED * 2).toFixed(3);
    const b = pt(BLEED).toFixed(3);
    const trim = `[${b} ${b} ${pt(W + BLEED).toFixed(3)} ${pt(H + BLEED).toFixed(3)}]`;
    const chunks = [];
    const offsets = [];
    let size = 0;
    const push = (part) => {
      const bytes = typeof part === 'string' ? enc.encode(part) : part;
      chunks.push(bytes);
      size += bytes.length;
    };
    const obj = (n, body) => {
      offsets[n] = size;
      push(`${n} 0 obj\n`);
      body();
      push('\nendobj\n');
    };
    const n = pages.length;
    // 1 – katalogas, 2 – puslapiai, 3 – info; toliau kiekvienam puslapiui: page, content, image
    const pageId = (i) => 4 + i * 3;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] >>`));
    const title = `${T.lang === 'lt' ? 'Vizitine kortele' : 'Business card'} - ${slug(st.filled.name)}`;
    obj(3, () => push(`<< /Title (${title}) /Creator (Piktograma) /Producer (Piktograma card maker) >>`));
    pages.forEach((p, i) => {
      const id = pageId(i);
      obj(id, () =>
        push(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /BleedBox [0 0 ${PW} ${PH}] /TrimBox ${trim} ` +
            `/Resources << /XObject << /Im${i} ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`
        )
      );
      const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
      obj(id + 1, () => {
        push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      });
      obj(id + 2, () => {
        push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
        push(p.jpeg);
        push('\nendstream');
      });
    });
    const xref = size;
    const count = pageId(n - 1) + 3;
    let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) table += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    push(table);
    push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  /* ------------------------------------------------------------------ */
  /* Užsakymas (naudoja bendrą užklausų formą)                           */
  /* ------------------------------------------------------------------ */

  const dialog = $('[data-cm-dialog]');
  const orderForm = $('[data-cm-order-form]');
  const messageInput = $('[data-cm-message]');

  function orderMessage() {
    const st = current || state();
    const o = T.order;
    const fd = new FormData(orderForm);
    const lines = [
      o.head,
      `${o.qty}: ${fd.get('qty')}`,
      `${o.paper}: ${T.papers[fd.get('paper')] || fd.get('paper')}`,
      `${o.sides}: ${st.back ? o.two : o.one}`,
      `${o.design}: ${T.templates[st.template]}, ${st.color}, ${T.fonts[st.font]}`,
      '---',
      ...FIELDS.filter((k) => st.filled[k]).map((k) => `${T.labels[k]}: ${st.filled[k]}`),
      `${o.logo}: ${logo ? `${o.logoYes} (${logo.name || 'logo'})` : o.logoNo}`,
    ];
    const note = String(fd.get('note') || '').trim();
    if (note) lines.push('---', `${o.note}: ${note}`);
    return lines.join('\n').slice(0, 1990);
  }

  function syncOrder() {
    if (messageInput) messageInput.value = orderMessage();
  }

  $('[data-cm-order]').addEventListener('click', () => {
    const st = needName();
    if (!st) return;
    // perkeliam kortelės duomenis į užsakymo formą (jei ten dar tuščia)
    $$('[data-cm-sync]', orderForm).forEach((el) => {
      if (!el.value) el.value = st.filled[el.dataset.cmSync] || '';
    });
    syncOrder();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });
  $('[data-cm-close]').addEventListener('click', () => (dialog.close ? dialog.close() : dialog.removeAttribute('open')));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && dialog.close) dialog.close();
  });
  // žinutė atnaujinama prieš bendrą formos siuntimo tvarkyklę (site.js)
  document.addEventListener('submit', (e) => e.target === orderForm && syncOrder(), true);
  orderForm.addEventListener('input', syncOrder);

  /* ------------------------------------------------------------------ */
  /* Paleidimas                                                          */
  /* ------------------------------------------------------------------ */

  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  customColor.addEventListener('input', () => {
    const r = $('input[name="color"][value="custom"]', form);
    r.checked = true;
    schedule();
  });
  $('[data-cm-reset]').addEventListener('click', () => {
    form.reset();
    logo = null;
    logoName.textContent = logoLabel;
    logoRemove.hidden = true;
    try {
      localStorage.removeItem(STORE);
    } catch {
      /* nieko */
    }
    showMsg('');
    schedule();
  });
  window.addEventListener('resize', schedule);

  restore();
  update();
  // šriftai (su lietuviškomis raidėmis) gali įsikelti vėliau – perpiešiam
  if (document.fonts && document.fonts.load) {
    Promise.all(
      ['800 20px Manrope', '500 20px Manrope', '700 20px Manrope', '700 20px Quicksand', '600 20px Quicksand'].map((f) =>
        document.fonts.load(f, 'AaĄąČčĘęĖėĮįŠšŲųŪūŽž').catch(() => null)
      )
    ).then(update);
  }
})();
