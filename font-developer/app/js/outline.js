// Turns glyph drawing data (pixels, lines, arcs) into quadratic outlines in font units (y up).
// The same outlines feed the editor, the preview and the exported .ttf.
'use strict';

const Outline = (() => {
  const TAU = Math.PI * 2;
  const MAX_SEG = Math.PI / 4; // max sweep per quadratic segment

  // Appends a circular arc (excluding its start point) to pts.
  function arcTo(pts, cx, cy, r, a0, sweep) {
    const n = Math.max(1, Math.ceil(Math.abs(sweep) / MAX_SEG - 1e-9));
    const d = sweep / n;
    const rc = r / Math.cos(d / 2);
    for (let i = 0; i < n; i++) {
      const am = a0 + d * (i + 0.5), a1 = a0 + d * (i + 1);
      pts.push({ x: cx + rc * Math.cos(am), y: cy + rc * Math.sin(am), on: false });
      pts.push({ x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1), on: true });
    }
  }
  const on = (x, y) => ({ x, y, on: true });

  function circle(cx, cy, r) {
    const pts = [on(cx + r, cy)];
    arcTo(pts, cx, cy, r, 0, -TAU);
    pts.pop();
    return pts;
  }

  function lineOutline(s) {
    const h = s.w / 2;
    let dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return s.cap === 'round' ? circle(s.x1, s.y1, h) : square(s.x1, s.y1, h);
    dx /= len; dy /= len;
    const nx = -dy * h, ny = dx * h;
    const t = Math.atan2(dy, dx);
    const pts = [on(s.x1 + nx, s.y1 + ny), on(s.x2 + nx, s.y2 + ny)];
    if (s.cap === 'round') arcTo(pts, s.x2, s.y2, h, t + Math.PI / 2, -Math.PI);
    else pts.push(on(s.x2 - nx, s.y2 - ny));
    pts.push(on(s.x1 - nx, s.y1 - ny));
    if (s.cap === 'round') { arcTo(pts, s.x1, s.y1, h, t - Math.PI / 2, -Math.PI); pts.pop(); }
    return pts;
  }

  function square(cx, cy, h) {
    return [on(cx - h, cy - h), on(cx - h, cy + h), on(cx + h, cy + h), on(cx + h, cy - h)];
  }

  // Circle through three points, or null when (nearly) collinear.
  function circleFrom3(x1, y1, x2, y2, x3, y3) {
    const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    if (Math.abs(d) < 1e-6) return null;
    const s1 = x1 * x1 + y1 * y1, s2 = x2 * x2 + y2 * y2, s3 = x3 * x3 + y3 * y3;
    const cx = (s1 * (y2 - y3) + s2 * (y3 - y1) + s3 * (y1 - y2)) / d;
    const cy = (s1 * (x3 - x2) + s2 * (x1 - x3) + s3 * (x2 - x1)) / d;
    return { cx, cy, r: Math.hypot(x1 - cx, y1 - cy) };
  }

  const norm = a => ((a % TAU) + TAU) % TAU;

  // Arc geometry: start (x1,y1), end (x2,y2), passing through (x3,y3).
  function arcGeom(s) {
    const c = circleFrom3(s.x1, s.y1, s.x2, s.y2, s.x3, s.y3);
    if (!c || c.r > 1e5) return null;
    const a1 = Math.atan2(s.y1 - c.cy, s.x1 - c.cx);
    const a2 = Math.atan2(s.y2 - c.cy, s.x2 - c.cx);
    const a3 = Math.atan2(s.y3 - c.cy, s.x3 - c.cx);
    const ccw = norm(a2 - a1), mid = norm(a3 - a1);
    const sweep = mid < ccw ? ccw : ccw - TAU;
    return { ...c, a1, a2, sweep };
  }

  function arcOutline(s) {
    const g = arcGeom(s);
    if (!g) return lineOutline({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, w: s.w, cap: s.cap });
    const h = s.w / 2;
    const R = g.r + h, ri = Math.max(g.r - h, 0);
    const sg = Math.sign(g.sweep) || 1;
    const pts = [on(g.cx + R * Math.cos(g.a1), g.cy + R * Math.sin(g.a1))];
    arcTo(pts, g.cx, g.cy, R, g.a1, g.sweep);
    const endIn = on(g.cx + ri * Math.cos(g.a2), g.cy + ri * Math.sin(g.a2));
    if (s.cap === 'round') arcTo(pts, s.x2, s.y2, h, g.a2, sg * Math.PI);
    else pts.push(endIn);
    if (ri > 0) arcTo(pts, g.cx, g.cy, ri, g.a2, -g.sweep);
    else pts.push(on(g.cx, g.cy));
    if (s.cap === 'round') { arcTo(pts, s.x1, s.y1, h, g.a1 + Math.PI, sg * Math.PI); pts.pop(); }
    return pts;
  }

  function pixelOutlines(cells, size) {
    const rows = new Map();
    for (const key of cells) {
      const [i, j] = key.split(',').map(Number);
      if (!rows.has(j)) rows.set(j, []);
      rows.get(j).push(i);
    }
    const out = [];
    for (const [j, xs] of rows) {
      xs.sort((a, b) => a - b);
      let start = xs[0], prev = xs[0];
      const flush = () => {
        const x0 = start * size, x1 = (prev + 1) * size, y0 = j * size, y1 = (j + 1) * size;
        out.push([on(x0, y0), on(x0, y1), on(x1, y1), on(x1, y0)]);
      };
      for (let k = 1; k < xs.length; k++) {
        if (xs[k] === prev + 1) prev = xs[k];
        else { flush(); start = prev = xs[k]; }
      }
      flush();
    }
    return out;
  }

  function signedArea(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      a += p.x * q.y - q.x * p.y;
    }
    return a / 2;
  }

  // TrueType fills clockwise contours; make every contour clockwise so overlaps union.
  function clockwise(pts) {
    if (signedArea(pts) > 0) {
      pts.reverse();
      // keep an on-curve point first
      const k = pts.findIndex(p => p.on);
      if (k > 0) pts.push(...pts.splice(0, k));
    }
    return pts;
  }

  function shapeOutline(s) {
    return clockwise(s.type === 'arc' ? arcOutline(s) : lineOutline(s));
  }

  function glyphOutlines(glyph, pixelSize) {
    const contours = pixelOutlines(glyph.pixels || [], pixelSize).map(clockwise);
    for (const s of glyph.shapes || []) contours.push(shapeOutline(s));
    return contours;
  }

  // Adds contours to a canvas path. map(x, y) -> [cx, cy].
  function tracePath(ctx, contours, map) {
    for (const c of contours) {
      if (!c.length) continue;
      const p0 = map(c[0].x, c[0].y);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i <= c.length; i++) {
        const p = c[i % c.length];
        if (p.on) { const q = map(p.x, p.y); ctx.lineTo(q[0], q[1]); }
        else {
          const e = c[(i + 1) % c.length];
          const q = map(p.x, p.y), r = map(e.x, e.y);
          ctx.quadraticCurveTo(q[0], q[1], r[0], r[1]);
          i++;
        }
      }
      ctx.closePath();
    }
  }

  return { glyphOutlines, shapeOutline, tracePath, arcGeom };
})();
