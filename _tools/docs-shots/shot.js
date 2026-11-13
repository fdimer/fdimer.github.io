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
exports.snap=async(p,file,clip)=>{await p.screenshot({path:file,fullPage:true,clip});};
