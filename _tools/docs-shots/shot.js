// Annotated screenshot helper: numbered markers are drawn into the page, positioned from live element rects.
const {chromium}=require('playwright');
exports.open=async(url,vp)=>{const b=await chromium.launch();const p=await b.newPage({viewport:vp||{width:1440,height:1000},deviceScaleFactor:2});await p.goto(url);await p.waitForTimeout(1200);return {b,p}};
exports.mark=async(p,marks)=>p.evaluate(marks=>{
  document.querySelectorAll('.docmark').forEach(e=>e.remove());
  const find=s=>{ if(s.startsWith('panel:')){const t=s.slice(6).toLowerCase();return [...document.querySelectorAll('section.panel')].find(x=>x.querySelector('h2').textContent.trim().toLowerCase().startsWith(t));}
    if(s.startsWith('text:')){const [sel,t]=s.slice(5).split('|');return [...document.querySelectorAll(sel)].find(x=>x.textContent.trim().startsWith(t));}
    return document.querySelector(s)};
  const miss=[];
  for(const [sel,n,anchor='tl',dx=0,dy=0] of marks){const e=find(sel);if(!e){miss.push(sel);continue}
    const r=e.getBoundingClientRect();const X={tl:r.left,tr:r.right,l:r.left,r:r.right,t:(r.left+r.right)/2,b:(r.left+r.right)/2,c:(r.left+r.right)/2,bl:r.left,br:r.right}[anchor];
    const Y={tl:r.top,tr:r.top,l:(r.top+r.bottom)/2,r:(r.top+r.bottom)/2,t:r.top,b:r.bottom,c:(r.top+r.bottom)/2,bl:r.bottom,br:r.bottom}[anchor];
    const m=document.createElement('div');m.className='docmark';m.textContent=n;
    m.style.cssText=`position:absolute;z-index:99999;left:${X+scrollX+dx-13}px;top:${Y+scrollY+dy-13}px;width:26px;height:26px;border-radius:50%;background:#c2410c;color:#fff;font:700 14px/22px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);pointer-events:none`;
    document.body.appendChild(m);}
  return miss},marks);
exports.clip=async(p,sels,pad=14)=>p.evaluate(([sels,pad])=>{
  const find=s=>{ if(s.startsWith('panel:')){const t=s.slice(6).toLowerCase();return [...document.querySelectorAll('section.panel')].find(x=>x.querySelector('h2').textContent.trim().toLowerCase().startsWith(t));} return document.querySelector(s)};
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const s of sels){const r=find(s).getBoundingClientRect();x0=Math.min(x0,r.left+scrollX);y0=Math.min(y0,r.top+scrollY);x1=Math.max(x1,r.right+scrollX);y1=Math.max(y1,r.bottom+scrollY)}
  return {x:Math.max(0,x0-pad),y:Math.max(0,y0-pad),width:x1-x0+2*pad,height:y1-y0+2*pad}},[sels,pad]);
// Hides copyrighted ROM contents in a screenshot: covers the nth element matching the selector with a labelled block.
// The memory bitmap draws ROM bits as pixels, so its ROM bands must be covered before any shot that includes them.
// The cover is re-placed from the element's live position immediately before every snap, because panels above it
// change height as the script works (a cover placed once ends up in the wrong place and exposes the ROM).
const place=p=>p.evaluate(covers=>{document.querySelectorAll('.doccover').forEach(e=>e.remove());let ok=true;
  for(const [sel,nth,label] of covers){const e=document.querySelectorAll(sel)[nth];if(!e){ok=false;continue}const r=e.getBoundingClientRect();
    const d=document.createElement('div');d.className='doccover';d.textContent=label;
    d.style.cssText=`position:absolute;z-index:99998;left:${r.left+scrollX-1}px;top:${r.top+scrollY-1}px;width:${r.width+2}px;height:${r.height+2}px;background:repeating-linear-gradient(45deg,#d9d4e6,#d9d4e6 8px,#e6e2ef 8px,#e6e2ef 16px);color:#3b3550;font:600 13px/1.4 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;box-sizing:border-box`;
    document.body.appendChild(d)}
  return ok},p._covers||[]);
exports.cover=async(p,sel,nth,label)=>{(p._covers=p._covers||[]).push([sel,nth,label]);return place(p)};
exports.snap=async(p,file,clip)=>{if(p._covers&&!(await place(p)))throw new Error('ROM cover could not be placed: '+file);await p.screenshot({path:file,fullPage:true,clip});};
