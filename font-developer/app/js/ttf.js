// Minimal TrueType (.ttf) writer. No dependencies.
// Input: font info + glyph list with quadratic contours in font units (y up).
// Contours are arrays of {x, y, on} points; consecutive points never both off-curve.
'use strict';

const TTF = (() => {
  class Writer {
    constructor() { this.bytes = []; }
    u8(v) { this.bytes.push(v & 0xff); }
    u16(v) { this.u8(v >> 8); this.u8(v); }
    i16(v) { this.u16(v < 0 ? v + 0x10000 : v); }
    u32(v) { this.u16((v >>> 16) & 0xffff); this.u16(v & 0xffff); }
    i32(v) { this.u32(v >>> 0); }
    tag(s) { for (let i = 0; i < 4; i++) this.u8(s.charCodeAt(i)); }
    raw(arr) { for (const b of arr) this.u8(b); }
    pad4() { while (this.bytes.length % 4) this.u8(0); }
    get length() { return this.bytes.length; }
  }

  const clamp16 = v => Math.max(-32768, Math.min(32767, Math.round(v)));

  function checksum(bytes) {
    let sum = 0;
    for (let i = 0; i < bytes.length; i += 4) {
      const v = ((bytes[i] || 0) << 24) | ((bytes[i + 1] || 0) << 16) | ((bytes[i + 2] || 0) << 8) | (bytes[i + 3] || 0);
      sum = (sum + (v >>> 0)) >>> 0;
    }
    return sum;
  }

  function longDateTime(w, date) {
    // Seconds since 1904-01-01, as 64-bit.
    const secs = Math.floor(date.getTime() / 1000) + 2082844800;
    w.u32(Math.floor(secs / 0x100000000));
    w.u32(secs >>> 0);
  }

  function utf16be(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      out.push(c >> 8, c & 0xff);
    }
    return out;
  }

  function encodeGlyph(contours) {
    const w = new Writer();
    const pts = [];
    const ends = [];
    for (const c of contours) {
      for (const p of c) pts.push({ x: clamp16(p.x), y: clamp16(p.y), on: p.on });
      ends.push(pts.length - 1);
    }
    if (!pts.length) return { bytes: [], bbox: null, points: 0, contours: 0 };
    let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
    for (const p of pts) {
      xMin = Math.min(xMin, p.x); yMin = Math.min(yMin, p.y);
      xMax = Math.max(xMax, p.x); yMax = Math.max(yMax, p.y);
    }
    w.i16(contours.length);
    w.i16(xMin); w.i16(yMin); w.i16(xMax); w.i16(yMax);
    for (const e of ends) w.u16(e);
    w.u16(0); // no instructions
    for (const p of pts) w.u8(p.on ? 1 : 0); // x/y as int16 deltas
    let prev = 0;
    for (const p of pts) { w.i16(p.x - prev); prev = p.x; }
    prev = 0;
    for (const p of pts) { w.i16(p.y - prev); prev = p.y; }
    w.pad4();
    return { bytes: w.bytes, bbox: { xMin, yMin, xMax, yMax }, points: pts.length, contours: contours.length };
  }

  function buildCmap(map) { // map: [{code, gid}] sorted by code
    const segs = [];
    for (const { code, gid } of map) {
      const last = segs[segs.length - 1];
      if (last && code === last.end + 1 && gid === last.gid + (code - last.start)) last.end = code;
      else segs.push({ start: code, end: code, gid });
    }
    segs.push({ start: 0xffff, end: 0xffff, delta: 1 }); // required end segment, maps to .notdef
    const n = segs.length;
    const entrySelector = Math.floor(Math.log2(n));
    const searchRange = 2 * Math.pow(2, entrySelector);
    const w = new Writer();
    w.u16(0); w.u16(1);           // cmap version, 1 subtable
    w.u16(3); w.u16(1); w.u32(12); // Windows, Unicode BMP
    const len = 16 + n * 8;
    w.u16(4); w.u16(len); w.u16(0);
    w.u16(n * 2); w.u16(searchRange); w.u16(entrySelector); w.u16(n * 2 - searchRange);
    for (const s of segs) w.u16(s.end);
    w.u16(0);
    for (const s of segs) w.u16(s.start);
    for (const s of segs) w.u16(s.delta !== undefined ? s.delta : ((s.gid - s.start) & 0xffff));
    for (let i = 0; i < n; i++) w.u16(0);
    return w.bytes;
  }

  function buildName(info) {
    const ps = (info.family + '-Regular').replace(/[^A-Za-z0-9-]/g, '').slice(0, 63) || 'Untitled-Regular';
    const records = [
      [1, info.family],
      [2, 'Regular'],
      [3, info.family + ' Regular ' + info.version],
      [4, info.family + ' Regular'],
      [5, 'Version ' + info.version],
      [6, ps],
    ];
    const w = new Writer();
    const strings = [];
    let offset = 0;
    w.u16(0); w.u16(records.length); w.u16(6 + records.length * 12);
    for (const [id, str] of records) {
      const b = utf16be(str);
      w.u16(3); w.u16(1); w.u16(0x0409); w.u16(id); w.u16(b.length); w.u16(offset);
      strings.push(b); offset += b.length;
    }
    for (const b of strings) w.raw(b);
    return w.bytes;
  }

  // info: {family, version, unitsPerEm, ascender, descender, xHeight, capHeight}
  // glyphs: [{name, code (or null), advance, contours}] — glyph 0 must be .notdef
  function build(info, glyphs) {
    const enc = glyphs.map(g => encodeGlyph(g.contours));
    const numGlyphs = glyphs.length;

    // glyf + loca (long offsets)
    const glyf = [];
    const loca = new Writer();
    for (const e of enc) { loca.u32(glyf.length); for (const b of e.bytes) glyf.push(b); }
    loca.u32(glyf.length);

    let xMin = 0, yMin = 0, xMax = 0, yMax = 0, any = false;
    let maxPoints = 0, maxContours = 0, advMax = 0, minLsb = 0, minRsb = 0, maxExtent = 0;
    enc.forEach((e, i) => {
      const adv = glyphs[i].advance;
      advMax = Math.max(advMax, adv);
      maxPoints = Math.max(maxPoints, e.points);
      maxContours = Math.max(maxContours, e.contours);
      if (!e.bbox) return;
      const b = e.bbox;
      if (!any) { xMin = b.xMin; yMin = b.yMin; xMax = b.xMax; yMax = b.yMax; minLsb = b.xMin; minRsb = adv - b.xMax; maxExtent = b.xMax; any = true; }
      xMin = Math.min(xMin, b.xMin); yMin = Math.min(yMin, b.yMin);
      xMax = Math.max(xMax, b.xMax); yMax = Math.max(yMax, b.yMax);
      minLsb = Math.min(minLsb, b.xMin); minRsb = Math.min(minRsb, adv - b.xMax);
      maxExtent = Math.max(maxExtent, b.xMax);
    });

    const winAscent = Math.max(info.ascender, yMax);
    const winDescent = Math.max(-info.descender, -yMin);

    const head = new Writer();
    head.u32(0x00010000); head.u32(0x00010000); head.u32(0); head.u32(0x5F0F3CF5);
    head.u16(0x000B); head.u16(info.unitsPerEm);
    const now = new Date(); longDateTime(head, now); longDateTime(head, now);
    head.i16(xMin); head.i16(yMin); head.i16(xMax); head.i16(yMax);
    head.u16(0); head.u16(8); head.i16(2); head.i16(1); head.i16(0);

    const hhea = new Writer();
    hhea.u32(0x00010000); hhea.i16(winAscent); hhea.i16(-winDescent); hhea.i16(0);
    hhea.u16(advMax); hhea.i16(minLsb); hhea.i16(minRsb); hhea.i16(maxExtent);
    hhea.i16(1); hhea.i16(0); hhea.i16(0);
    for (let i = 0; i < 4; i++) hhea.i16(0);
    hhea.i16(0); hhea.u16(numGlyphs);

    const hmtx = new Writer();
    enc.forEach((e, i) => { hmtx.u16(Math.max(0, Math.round(glyphs[i].advance))); hmtx.i16(e.bbox ? e.bbox.xMin : 0); });

    const maxp = new Writer();
    maxp.u32(0x00010000); maxp.u16(numGlyphs); maxp.u16(maxPoints); maxp.u16(maxContours);
    maxp.u16(0); maxp.u16(0); maxp.u16(2);
    for (let i = 0; i < 9; i++) maxp.u16(0);

    const post = new Writer();
    post.u32(0x00030000); post.u32(0); post.i16(-100); post.i16(50);
    for (let i = 0; i < 5; i++) post.u32(0);

    const codes = glyphs.map((g, gid) => ({ code: g.code, gid })).filter(m => m.code != null && m.code < 0xffff)
      .sort((a, b) => a.code - b.code);
    const advs = glyphs.map(g => g.advance).filter(a => a > 0);
    const os2 = new Writer();
    os2.u16(4);
    os2.i16(advs.length ? Math.round(advs.reduce((a, b) => a + b, 0) / advs.length) : 0);
    os2.u16(400); os2.u16(5); os2.u16(0);
    const em = info.unitsPerEm;
    [em * 0.65, em * 0.6, 0, em * 0.075, em * 0.65, em * 0.6, 0, em * 0.35, em * 0.05, em * 0.25]
      .forEach(v => os2.i16(Math.round(v)));
    os2.i16(0);
    for (let i = 0; i < 10; i++) os2.u8(0);
    os2.u32(1); os2.u32(0); os2.u32(0); os2.u32(0);
    os2.tag('NONE');
    os2.u16(0x0040);
    os2.u16(codes.length ? codes[0].code : 0x20);
    os2.u16(codes.length ? codes[codes.length - 1].code : 0x20);
    os2.i16(info.ascender); os2.i16(info.descender); os2.i16(0);
    os2.u16(winAscent); os2.u16(winDescent);
    os2.u32(1); os2.u32(0);
    os2.i16(info.xHeight); os2.i16(info.capHeight);
    os2.u16(0); os2.u16(32); os2.u16(0);

    const tables = {
      'OS/2': os2.bytes,
      cmap: buildCmap(codes),
      glyf,
      head: head.bytes,
      hhea: hhea.bytes,
      hmtx: hmtx.bytes,
      loca: loca.bytes,
      maxp: maxp.bytes,
      name: buildName(info),
      post: post.bytes,
    };
    const tags = Object.keys(tables).sort();
    const n = tags.length;
    const entrySelector = Math.floor(Math.log2(n));
    const searchRange = 16 * Math.pow(2, entrySelector);

    const out = new Writer();
    out.u32(0x00010000); out.u16(n); out.u16(searchRange); out.u16(entrySelector); out.u16(n * 16 - searchRange);
    let offset = 12 + n * 16;
    const offsets = {};
    for (const t of tags) {
      offsets[t] = offset;
      out.tag(t); out.u32(checksum(tables[t])); out.u32(offset); out.u32(tables[t].length);
      offset += (tables[t].length + 3) & ~3;
    }
    for (const t of tags) { out.raw(tables[t]); out.pad4(); }

    const bytes = new Uint8Array(out.bytes);
    const adj = (0xB1B0AFBA - checksum(bytes)) >>> 0;
    const p = offsets.head + 8;
    bytes[p] = adj >>> 24; bytes[p + 1] = (adj >>> 16) & 0xff; bytes[p + 2] = (adj >>> 8) & 0xff; bytes[p + 3] = adj & 0xff;
    return bytes;
  }

  return { build };
})();
