'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const STORE_KEY = 'fontdeveloper.project.v1';
  const CHARS = [];
  for (let c = 32; c <= 126; c++) CHARS.push(c);

  // ---------- project ----------
  function newProject() {
    return {
      format: 'fontdeveloper', version: 1,
      family: 'MyFont',
      unitsPerEm: 1000, ascender: 800, descender: -200, capHeight: 700, xHeight: 500,
      pixelSize: 50, defaultAdvance: 600,
      glyphs: {},
    };
  }
  function loadStored() {
    try {
      const s = localStorage.getItem(STORE_KEY);
      if (s) return normalise(JSON.parse(s));
    } catch (e) { /* ignore */ }
    return null;
  }
  function normalise(p) {
    const base = newProject();
    const out = { ...base, ...p };
    out.glyphs = {};
    for (const [k, g] of Object.entries(p.glyphs || {})) {
      out.glyphs[k] = { advance: +g.advance || base.defaultAdvance, pixels: g.pixels || [], shapes: g.shapes || [] };
    }
    return out;
  }

  let project = loadStored() || newProject();
  let cur = 65;
  const ui = { tool: 'pixel', strokeW: 80, cap: 'round', snap: true, snapSize: 25, guide: true };
  try { Object.assign(ui, JSON.parse(localStorage.getItem(STORE_KEY + '.ui') || '{}')); } catch (e) { /* ignore */ }
  if (ui.cur) cur = ui.cur;

  const hasContent = g => g && (g.pixels.length || g.shapes.length);
  function glyph(code, create = true) {
    let g = project.glyphs[code];
    if (!g && create) {
      g = project.glyphs[code] = { advance: code === 32 ? Math.round(project.defaultAdvance / 2) : project.defaultAdvance, pixels: [], shapes: [] };
    }
    return g;
  }
  const curGlyph = () => glyph(cur);

  // ---------- undo ----------
  const undoStack = [], redoStack = [];
  function pushUndo() {
    undoStack.push({ cur, glyphs: JSON.stringify(project.glyphs) });
    if (undoStack.length > 200) undoStack.shift();
    redoStack.length = 0;
  }
  function restore(from, to) {
    const s = from.pop();
    if (!s) return;
    to.push({ cur, glyphs: JSON.stringify(project.glyphs) });
    project.glyphs = JSON.parse(s.glyphs);
    selected = -1;
    if (s.cur !== cur) setChar(s.cur); else changed();
  }

  // ---------- persistence ----------
  let saveTimer = 0;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(project));
        localStorage.setItem(STORE_KEY + '.ui', JSON.stringify({ ...ui, cur }));
      } catch (e) { /* storage unavailable: fine, use Save project */ }
    }, 300);
  }

  function changed() {
    persist();
    drawEditor();
    schedulePreview();
    refreshCharLabels();
  }

  function status(msg, isError) {
    $('status').textContent = msg;
    $('status').parentElement.classList.toggle('error', !!isError);
  }

  // ---------- character selection ----------
  function charLabel(code) {
    const mark = hasContent(project.glyphs[code]) ? '●' : ' ';
    const ch = code === 32 ? 'space' : String.fromCharCode(code);
    return `${mark} ${ch}  U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  function buildCharSelect() {
    const sel = $('charSelect');
    sel.innerHTML = '';
    const groups = [
      ['Uppercase', c => c >= 65 && c <= 90],
      ['Lowercase', c => c >= 97 && c <= 122],
      ['Digits', c => c >= 48 && c <= 57],
      ['Punctuation & space', c => !(c >= 65 && c <= 90) && !(c >= 97 && c <= 122) && !(c >= 48 && c <= 57)],
    ];
    for (const [name, test] of groups) {
      const og = document.createElement('optgroup');
      og.label = name;
      for (const c of CHARS.filter(test)) {
        const o = document.createElement('option');
        o.value = c; o.textContent = charLabel(c);
        og.appendChild(o);
      }
      sel.appendChild(og);
    }
  }
  function refreshCharLabels() {
    for (const o of $('charSelect').options) o.textContent = charLabel(+o.value);
    refreshOverviewState();
  }
  function orderedChars() { return [...$('charSelect').options].map(o => +o.value); }
  function stepChar(d) {
    const list = orderedChars();
    const i = list.indexOf(cur);
    setChar(list[(i + d + list.length) % list.length]);
  }
  function setChar(code) {
    cur = code;
    selected = -1; cancelTemp();
    $('charSelect').value = String(code);
    $('advance').value = curGlyph().advance;
    fitView();
    changed();
  }

  // ---------- editor view ----------
  const cv = $('editor');
  const ctx = cv.getContext('2d');
  const view = { s: 0.5, ox: 0, oy: 0, w: 0, h: 0 };
  const toC = (x, y) => [view.ox + x * view.s, view.oy - y * view.s];
  const toF = (cx, cy) => [(cx - view.ox) / view.s, (view.oy - cy) / view.s];

  function resizeCanvas(c) {
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    const k = c.getContext('2d');
    k.setTransform(dpr, 0, 0, dpr, 0, 0);
    return r;
  }

  function fitView() {
    const r = cv.getBoundingClientRect();
    view.w = r.width; view.h = r.height;
    const em = project.unitsPerEm, m = em * 0.12;
    const top = Math.max(project.ascender, project.capHeight) + m;
    const bottom = project.descender - m;
    const right = Math.max(curGlyph().advance, em) + m;
    const left = -m;
    view.s = Math.max(0.01, Math.min(view.h / (top - bottom), view.w / (right - left)));
    view.ox = (view.w - (right - left) * view.s) / 2 - left * view.s;
    view.oy = (view.h - (top - bottom) * view.s) / 2 + top * view.s;
  }

  function snap(x, y) {
    if (!ui.snap || !(ui.snapSize > 0)) return [Math.round(x), Math.round(y)];
    const g = ui.snapSize;
    return [Math.round(x / g) * g, Math.round(y / g) * g];
  }

  const COL = {
    bg: '#0d0f0c', grid: '#182016', gridMajor: '#22301e', metric: '#3a5233', base: '#5d8a50',
    ink: 'rgba(111,220,90,0.85)', temp: 'rgba(111,220,90,0.45)', guide: 'rgba(160,190,150,0.13)',
    sel: '#e0f0a0', handle: '#f0d060', hover: 'rgba(111,220,90,0.25)', text: '#5d7a54',
  };

  let selected = -1;      // index of selected shape
  let temp = null;         // shape being drawn
  let arcPhase = 0;        // 0 idle, 1 dragging end, 2 bending
  let hoverCell = null;
  let drag = null;

  function drawEditor() {
    const r = resizeCanvas(cv);
    if (Math.abs(r.width - view.w) > 0.5 || Math.abs(r.height - view.h) > 0.5) fitView();
    const g = curGlyph();
    const p = project;
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, r.width, r.height);

    // pixel grid
    const ps = p.pixelSize;
    if (ps * view.s >= 4) {
      const [fx0, fy1] = toF(0, 0), [fx1, fy0] = toF(r.width, r.height);
      ctx.lineWidth = 1;
      for (let i = Math.floor(fx0 / ps); i <= Math.ceil(fx1 / ps); i++) {
        const x = Math.round(toC(i * ps, 0)[0]) + 0.5;
        ctx.strokeStyle = i % 4 === 0 ? COL.gridMajor : COL.grid;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, r.height); ctx.stroke();
      }
      for (let j = Math.floor(fy0 / ps); j <= Math.ceil(fy1 / ps); j++) {
        const y = Math.round(toC(0, j * ps)[1]) + 0.5;
        ctx.strokeStyle = j % 4 === 0 ? COL.gridMajor : COL.grid;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(r.width, y); ctx.stroke();
      }
    }

    // guide letter
    if (ui.guide && cur !== 32) {
      ctx.save();
      ctx.fillStyle = COL.guide;
      ctx.font = `${p.unitsPerEm * view.s}px Arial, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      const [gx, gy] = toC(0, 0);
      ctx.fillText(String.fromCharCode(cur), gx, gy);
      ctx.restore();
    }

    // metric lines
    ctx.font = '11px Consolas, monospace';
    ctx.textBaseline = 'bottom';
    const hline = (y, name, col, dash) => {
      const cy = Math.round(toC(0, y)[1]) + 0.5;
      ctx.strokeStyle = col; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(r.width, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.text; ctx.fillText(name, 4, cy - 2);
    };
    hline(p.ascender, 'ascender', COL.metric, [4, 4]);
    hline(p.capHeight, 'cap height', COL.metric, [2, 4]);
    hline(p.xHeight, 'x-height', COL.metric, [2, 4]);
    hline(0, 'baseline', COL.base);
    hline(p.descender, 'descender', COL.metric, [4, 4]);
    const vline = (x, dash) => {
      const cx = Math.round(toC(x, 0)[0]) + 0.5;
      ctx.strokeStyle = COL.base; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, r.height); ctx.stroke();
      ctx.setLineDash([]);
    };
    vline(0);
    vline(g.advance, [6, 4]);

    // hover cell
    if (hoverCell && (ui.tool === 'pixel' || ui.tool === 'erase')) {
      const [a, b] = toC(hoverCell[0] * ps, (hoverCell[1] + 1) * ps);
      ctx.fillStyle = COL.hover;
      ctx.fillRect(a, b, ps * view.s, ps * view.s);
    }

    // ink
    ctx.beginPath();
    Outline.tracePath(ctx, Outline.glyphOutlines(g, ps), toC);
    ctx.fillStyle = COL.ink;
    ctx.fill('nonzero');

    if (temp) {
      ctx.beginPath();
      Outline.tracePath(ctx, [Outline.shapeOutline(temp)], toC);
      ctx.fillStyle = COL.temp; ctx.fill('nonzero');
      drawSkeleton(temp, COL.handle);
    }

    if (selected >= 0 && g.shapes[selected]) {
      const s = g.shapes[selected];
      ctx.beginPath();
      Outline.tracePath(ctx, [Outline.shapeOutline(s)], toC);
      ctx.strokeStyle = COL.sel; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
      drawSkeleton(s, COL.handle);
      for (const h of handles(s)) drawHandle(h[0], h[1]);
    }
  }

  function drawSkeleton(s, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath();
    if (s.type === 'arc') {
      const a = Outline.arcGeom(s);
      if (a) {
        const [cx, cy] = toC(a.cx, a.cy);
        ctx.arc(cx, cy, a.r * view.s, -a.a1, -(a.a1 + a.sweep), a.sweep > 0);
      } else { ctx.moveTo(...toC(s.x1, s.y1)); ctx.lineTo(...toC(s.x2, s.y2)); }
    } else { ctx.moveTo(...toC(s.x1, s.y1)); ctx.lineTo(...toC(s.x2, s.y2)); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  function drawHandle(x, y) {
    const [cx, cy] = toC(x, y);
    ctx.fillStyle = COL.handle;
    ctx.fillRect(cx - 4, cy - 4, 8, 8);
  }
  function handles(s) {
    const h = [[s.x1, s.y1, 1], [s.x2, s.y2, 2]];
    if (s.type === 'arc') h.push([s.x3, s.y3, 3]);
    return h;
  }

  // ---------- pointer input ----------
  function cellAt(fx, fy) {
    const ps = project.pixelSize;
    return [Math.floor(fx / ps), Math.floor(fy / ps)];
  }
  function setPixel(i, j, value) {
    const g = curGlyph(), key = i + ',' + j;
    const k = g.pixels.indexOf(key);
    if (value && k < 0) g.pixels.push(key);
    else if (!value && k >= 0) g.pixels.splice(k, 1);
  }
  function paintLine(a, b, value) {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    for (let t = 0; t <= n; t++) {
      const f = n ? t / n : 0;
      setPixel(Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), value);
    }
  }

  function hitShape(cx, cy) {
    const g = curGlyph();
    for (let i = g.shapes.length - 1; i >= 0; i--) {
      const path = new Path2D();
      Outline.tracePath(path, [Outline.shapeOutline(g.shapes[i])], toC);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const hit = ctx.isPointInPath(path, cx, cy, 'nonzero');
      ctx.restore();
      if (hit) return i;
    }
    return -1;
  }

  function cancelTemp() { temp = null; arcPhase = 0; }

  function newShape(type, x, y) {
    const s = { type, x1: x, y1: y, x2: x, y2: y, w: ui.strokeW, cap: ui.cap };
    if (type === 'arc') { s.x3 = x; s.y3 = y; }
    return s;
  }

  cv.addEventListener('contextmenu', e => e.preventDefault());

  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    const r = cv.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const [fx, fy] = toF(cx, cy);
    const g = curGlyph();

    if (ui.tool === 'pixel' || ui.tool === 'erase') {
      pushUndo();
      const value = ui.tool === 'pixel' && e.button !== 2;
      const c = cellAt(fx, fy);
      setPixel(c[0], c[1], value);
      drag = { kind: 'paint', value, last: c };
      changed();
      return;
    }
    if (e.button !== 0) { cancelTemp(); drawEditor(); return; }
    const [sx, sy] = snap(fx, fy);

    if (ui.tool === 'line') {
      temp = newShape('line', sx, sy);
      drag = { kind: 'line' };
      drawEditor();
      return;
    }
    if (ui.tool === 'arc') {
      if (arcPhase === 2) {
        pushUndo();
        temp.x3 = sx; temp.y3 = sy;
        g.shapes.push(temp);
        cancelTemp();
        changed();
        return;
      }
      temp = newShape('arc', sx, sy);
      arcPhase = 1;
      drag = { kind: 'arcEnd' };
      drawEditor();
      return;
    }
    if (ui.tool === 'select') {
      // advance-width line
      if (Math.abs(cx - toC(g.advance, 0)[0]) < 6 && (selected < 0 || !handleAt(cx, cy))) {
        pushUndo();
        drag = { kind: 'advance' };
        return;
      }
      const h = handleAt(cx, cy);
      if (h) { pushUndo(); drag = { kind: 'handle', n: h }; return; }
      selected = hitShape(cx, cy);
      if (selected >= 0) {
        pushUndo();
        drag = { kind: 'move', start: [sx, sy], orig: { ...g.shapes[selected] }, moved: false };
      }
      drawEditor();
    }
  });

  function handleAt(cx, cy) {
    const s = curGlyph().shapes[selected];
    if (!s) return 0;
    for (const [x, y, n] of handles(s)) {
      const [hx, hy] = toC(x, y);
      if (Math.abs(hx - cx) <= 7 && Math.abs(hy - cy) <= 7) return n;
    }
    return 0;
  }

  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const [fx, fy] = toF(cx, cy);
    const [sx, sy] = snap(fx, fy);
    const g = curGlyph();

    if (ui.tool === 'pixel' || ui.tool === 'erase') {
      const c = cellAt(fx, fy);
      const changedCell = !hoverCell || c[0] !== hoverCell[0] || c[1] !== hoverCell[1];
      hoverCell = c;
      if (drag && drag.kind === 'paint') {
        if (changedCell) { paintLine(drag.last, c, drag.value); drag.last = c; changed(); }
      } else if (changedCell) drawEditor();
      return;
    }
    if (ui.tool === 'select') {
      cv.style.cursor = (drag && drag.kind === 'advance') || Math.abs(cx - toC(g.advance, 0)[0]) < 6 ? 'ew-resize'
        : handleAt(cx, cy) ? 'move' : 'default';
    } else cv.style.cursor = 'crosshair';

    if (!drag && !(ui.tool === 'arc' && arcPhase === 2)) return;
    if (ui.tool === 'arc' && arcPhase === 2) { temp.x3 = sx; temp.y3 = sy; drawEditor(); return; }
    if (drag.kind === 'line' || drag.kind === 'arcEnd') {
      temp.x2 = sx; temp.y2 = sy;
      if (temp.type === 'arc') { temp.x3 = (temp.x1 + sx) / 2; temp.y3 = (temp.y1 + sy) / 2; }
      drawEditor();
    } else if (drag.kind === 'handle') {
      const s = g.shapes[selected];
      s['x' + drag.n] = sx; s['y' + drag.n] = sy;
      changed();
    } else if (drag.kind === 'move') {
      const s = g.shapes[selected], o = drag.orig;
      const dx = sx - drag.start[0], dy = sy - drag.start[1];
      for (const n of [1, 2, 3]) if (('x' + n) in o) { s['x' + n] = o['x' + n] + dx; s['y' + n] = o['y' + n] + dy; }
      drag.moved = drag.moved || dx !== 0 || dy !== 0;
      changed();
    } else if (drag.kind === 'advance') {
      g.advance = Math.max(0, sx);
      $('advance').value = g.advance;
      changed();
    }
  });

  cv.addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.kind === 'line') {
      pushUndo();
      curGlyph().shapes.push(temp);
      cancelTemp();
      changed();
    } else if (d.kind === 'arcEnd') {
      if (temp.x1 === temp.x2 && temp.y1 === temp.y2) { cancelTemp(); drawEditor(); return; }
      arcPhase = 2;
      status('Arc: move the mouse to bend it, then click. Esc cancels.');
    } else if (d.kind === 'move' && !d.moved) {
      undoStack.pop(); // nothing changed
    }
  });

  cv.addEventListener('pointerleave', () => { hoverCell = null; if (!drag) drawEditor(); });

  // ---------- toolbar ----------
  function setTool(t) {
    ui.tool = t;
    cancelTemp();
    if (t !== 'select') selected = -1;
    for (const b of document.querySelectorAll('[data-tool]')) b.classList.toggle('active', b.dataset.tool === t);
    const help = {
      pixel: 'Pixel pen: left button draws, right button erases.',
      erase: 'Eraser: drag over pixels to remove them.',
      line: 'Line: press, drag and release.',
      arc: 'Arc: drag from start to end, release, then move to bend it and click.',
      select: 'Select: click a line or arc to move it, drag its handles to reshape, Delete removes it. Drag the dashed line to change the width.',
    };
    status(help[t]);
    persist();
    drawEditor();
  }
  for (const b of document.querySelectorAll('[data-tool]')) b.addEventListener('click', () => setTool(b.dataset.tool));

  function applyToSelected(fn) {
    const s = curGlyph().shapes[selected];
    if (s) { pushUndo(); fn(s); changed(); }
  }
  $('strokeW').addEventListener('change', e => {
    ui.strokeW = Math.max(2, +e.target.value || 80);
    applyToSelected(s => { s.w = ui.strokeW; });
    persist();
  });
  $('cap').addEventListener('change', e => {
    ui.cap = e.target.value;
    applyToSelected(s => { s.cap = ui.cap; });
    persist();
  });
  $('snap').addEventListener('change', e => { ui.snap = e.target.checked; persist(); });
  $('snapSize').addEventListener('change', e => { ui.snapSize = Math.max(1, +e.target.value || 25); persist(); });
  $('guide').addEventListener('change', e => { ui.guide = e.target.checked; persist(); drawEditor(); });
  $('undoBtn').addEventListener('click', () => restore(undoStack, redoStack));
  $('redoBtn').addEventListener('click', () => restore(redoStack, undoStack));
  $('clearBtn').addEventListener('click', () => {
    const g = curGlyph();
    if (!hasContent(g)) return;
    pushUndo(); g.pixels = []; g.shapes = []; selected = -1; changed();
  });
  let clipboard = null;
  $('copyBtn').addEventListener('click', () => {
    clipboard = JSON.stringify(curGlyph());
    status('Copied ' + charLabel(cur).slice(2) + '.');
  });
  $('pasteBtn').addEventListener('click', () => {
    if (!clipboard) { status('Nothing copied yet.'); return; }
    pushUndo();
    project.glyphs[cur] = JSON.parse(clipboard);
    selected = -1;
    $('advance').value = curGlyph().advance;
    changed();
  });

  $('charSelect').addEventListener('change', e => setChar(+e.target.value));
  $('prevChar').addEventListener('click', () => stepChar(-1));
  $('nextChar').addEventListener('click', () => stepChar(1));
  $('advance').addEventListener('change', e => {
    pushUndo();
    curGlyph().advance = Math.max(0, Math.round(+e.target.value || 0));
    changed();
  });
  $('family').addEventListener('change', e => {
    project.family = e.target.value.trim() || 'MyFont';
    e.target.value = project.family;
    changed();
  });

  const metricInputs = { m_upm: 'unitsPerEm', m_asc: 'ascender', m_desc: 'descender', m_cap: 'capHeight', m_x: 'xHeight', m_px: 'pixelSize', m_adv: 'defaultAdvance' };
  for (const [id, key] of Object.entries(metricInputs)) {
    $(id).addEventListener('change', e => {
      const v = Math.round(+e.target.value);
      if (!Number.isFinite(v) || (key === 'unitsPerEm' && v < 16) || (key === 'pixelSize' && v < 1)) { e.target.value = project[key]; return; }
      project[key] = v;
      fitView();
      changed();
    });
  }

  function syncInputs() {
    $('family').value = project.family;
    $('strokeW').value = ui.strokeW;
    $('cap').value = ui.cap;
    $('snap').checked = ui.snap;
    $('snapSize').value = ui.snapSize;
    $('guide').checked = ui.guide;
    for (const [id, key] of Object.entries(metricInputs)) $(id).value = project[key];
    $('charSelect').value = String(cur);
    $('advance').value = curGlyph().advance;
  }

  // ---------- keyboard ----------
  document.addEventListener('keydown', e => {
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && !inField) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); restore(undoStack, redoStack); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); restore(redoStack, undoStack); }
      else if (k === 's') { e.preventDefault(); saveProject(); }
      return;
    }
    if (inField) return;
    if (e.key === 'PageUp') { e.preventDefault(); stepChar(-1); return; }
    if (e.key === 'PageDown') { e.preventDefault(); stepChar(1); return; }
    if (e.key === 'Escape') { cancelTemp(); selected = -1; drawEditor(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected >= 0) {
      e.preventDefault();
      pushUndo(); curGlyph().shapes.splice(selected, 1); selected = -1; changed();
      return;
    }
    const tools = { p: 'pixel', e: 'erase', l: 'line', a: 'arc', v: 'select' };
    if (tools[e.key.toLowerCase()] && !e.altKey) setTool(tools[e.key.toLowerCase()]);
  });

  // ---------- font building ----------
  function fontGlyphs() {
    const p = project;
    const glyphs = [{
      code: null, advance: Math.round(p.unitsPerEm / 2),
      contours: [
        [[50, 0], [50, 700], [450, 700], [450, 0]].map(([x, y]) => ({ x: x * p.unitsPerEm / 1000, y: y * p.unitsPerEm / 1000, on: true })),
        [[100, 50], [400, 50], [400, 650], [100, 650]].map(([x, y]) => ({ x: x * p.unitsPerEm / 1000, y: y * p.unitsPerEm / 1000, on: true })),
      ],
    }];
    const codes = Object.keys(p.glyphs).map(Number).filter(c => hasContent(p.glyphs[c])).sort((a, b) => a - b);
    if (!codes.includes(32)) glyphs.push({ code: 32, advance: p.glyphs[32] ? p.glyphs[32].advance : Math.round(p.defaultAdvance / 2), contours: [] });
    for (const c of codes) glyphs.push({ code: c, advance: p.glyphs[c].advance, contours: Outline.glyphOutlines(p.glyphs[c], p.pixelSize) });
    glyphs.sort((a, b) => (a.code ?? -1) - (b.code ?? -1));
    return glyphs;
  }
  function buildFont() {
    const p = project;
    return TTF.build({
      family: p.family, version: '1.000', unitsPerEm: p.unitsPerEm,
      ascender: p.ascender, descender: p.descender, xHeight: p.xHeight, capHeight: p.capHeight,
    }, fontGlyphs());
  }

  // ---------- preview ----------
  const pv = $('glyphPreview');
  const pctx = pv.getContext('2d');
  let previewFace = null, previewSeq = 0, previewTimer = 0;
  const previewFamily = () => previewFace ? `"${previewFace.family}", "Segoe UI", sans-serif` : '"Segoe UI", sans-serif';

  function schedulePreview() {
    drawGlyphPreview();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreviewFont, 200);
  }

  async function updatePreviewFont() {
    const seq = ++previewSeq;
    let bytes;
    try { bytes = buildFont(); } catch (e) { status('Could not build font: ' + e.message, true); return; }
    try {
      const face = new FontFace('FDPreview' + seq, bytes.buffer);
      await face.load();
      if (seq !== previewSeq) return;
      document.fonts.add(face);
      if (previewFace) document.fonts.delete(previewFace);
      previewFace = face;
      renderSamples();
      if ($('status').parentElement.classList.contains('error')) status('Preview updated.');
    } catch (e) {
      if (seq === previewSeq) status('The browser rejected the generated font: ' + e.message, true);
    }
  }

  function drawGlyphPreview() {
    const r = resizeCanvas(pv);
    const p = project, g = curGlyph();
    pctx.fillStyle = '#151913';
    pctx.fillRect(0, 0, r.width, r.height);
    const pad = 16;
    const top = Math.max(p.ascender, p.capHeight), bottom = p.descender;
    const s = Math.min((r.height - pad * 2) / (top - bottom), (r.width - pad * 2) / Math.max(g.advance, 1));
    const ox = (r.width - g.advance * s) / 2, oy = pad + top * s;
    const map = (x, y) => [ox + x * s, oy - y * s];
    pctx.strokeStyle = '#2c3a28'; pctx.lineWidth = 1;
    pctx.beginPath();
    const by = Math.round(oy) + 0.5;
    pctx.moveTo(0, by); pctx.lineTo(r.width, by);
    for (const x of [0, g.advance]) { const cx = Math.round(ox + x * s) + 0.5; pctx.moveTo(cx, pad / 2); pctx.lineTo(cx, r.height - pad / 2); }
    pctx.stroke();
    pctx.beginPath();
    Outline.tracePath(pctx, Outline.glyphOutlines(g, p.pixelSize), map);
    pctx.fillStyle = '#cfe8c4';
    pctx.fill('nonzero');
  }

  const SIZES = [14, 20, 32, 56];
  function renderSamples() {
    const box = $('samples');
    const text = $('sample').value;
    box.innerHTML = '';
    for (const size of SIZES) {
      const d = document.createElement('div');
      const label = document.createElement('small');
      label.textContent = size + ' px';
      const t = document.createElement('div');
      t.textContent = text;
      t.style.fontFamily = previewFamily();
      t.style.fontSize = size + 'px';
      d.append(label, t);
      box.appendChild(d);
    }
    for (const b of $('overview').children) b.querySelector('span').style.fontFamily = previewFamily();
  }

  function buildOverview() {
    const box = $('overview');
    box.innerHTML = '';
    for (const c of orderedChars()) {
      const b = document.createElement('button');
      b.dataset.code = c;
      b.title = charLabel(c).slice(2);
      const span = document.createElement('span');
      span.textContent = c === 32 ? '␣' : String.fromCharCode(c);
      const small = document.createElement('small');
      small.textContent = c === 32 ? 'spc' : String.fromCharCode(c);
      b.append(span, small);
      b.addEventListener('click', () => setChar(c));
      box.appendChild(b);
    }
  }
  function refreshOverviewState() {
    for (const b of $('overview').children) {
      const c = +b.dataset.code;
      b.classList.toggle('empty', !hasContent(project.glyphs[c]));
      b.classList.toggle('current', c === cur);
    }
  }

  $('sample').addEventListener('input', () => {
    renderSamples();
    try { localStorage.setItem(STORE_KEY + '.sample', $('sample').value); } catch (e) { /* ignore */ }
  });

  // ---------- files ----------
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  const safeName = () => project.family.replace(/[\\/:*?"<>|]+/g, '_') || 'MyFont';

  function saveProject() {
    download(safeName() + '.fontdev.json', JSON.stringify(project, null, 1), 'application/json');
    status('Project saved as ' + safeName() + '.fontdev.json');
  }
  $('saveBtn').addEventListener('click', saveProject);
  $('exportBtn').addEventListener('click', () => {
    try {
      const bytes = buildFont();
      download(safeName() + '.ttf', bytes, 'font/ttf');
      const n = fontGlyphs().length - 1;
      status(`Exported ${safeName()}.ttf (${n} glyphs, ${bytes.length.toLocaleString()} bytes).`);
    } catch (e) { status('Export failed: ' + e.message, true); }
  });
  $('openBtn').addEventListener('click', () => $('openFile').click());
  $('openFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.format !== 'fontdeveloper') throw new Error('not a Font Developer project');
      pushUndo();
      project = normalise(data);
      syncInputs(); fitView(); setChar(cur);
      status('Opened ' + f.name);
    } catch (err) { status('Could not open ' + f.name + ': ' + err.message, true); }
  });
  $('newBtn').addEventListener('click', () => {
    if (Object.values(project.glyphs).some(hasContent) && !confirm('Start a new font? Unsaved work in this font will be lost (save the project first if you want to keep it).')) return;
    project = newProject();
    undoStack.length = redoStack.length = 0;
    syncInputs(); setChar(65);
    status('New font.');
  });

  // ---------- start ----------
  buildCharSelect();
  buildOverview();
  let sample = 'The quick brown fox jumps over the lazy dog.\nTHE QUICK BROWN FOX 0123456789';
  try { sample = localStorage.getItem(STORE_KEY + '.sample') || sample; } catch (e) { /* ignore */ }
  $('sample').value = sample;
  if (!CHARS.includes(cur)) cur = 65;
  syncInputs();
  setTool(ui.tool);
  fitView();
  changed();
  renderSamples();
  new ResizeObserver(() => { fitView(); drawEditor(); drawGlyphPreview(); }).observe(cv.parentElement);
  new ResizeObserver(() => drawGlyphPreview()).observe(pv);
  window.FontDev = { buildFont, get project() { return project; } }; // for debugging in the console
})();
