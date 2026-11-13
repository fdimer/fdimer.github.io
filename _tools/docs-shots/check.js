// Checks a docs page: images load, in-page and relative links resolve, no sideways scroll at phone width,
// and each keyed list has as many items as the highest marker on the screenshot above it is expected to have (printed for review).
// Usage: node check.js <folder>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const root=path.resolve(__dirname,'../..');const f=process.argv[2];const file=root+'/'+f+'/docs/index.html';
const b=await chromium.launch();let bad=0;
for(const w of [390,1100]){const p=await b.newPage({viewport:{width:w,height:800}});await p.goto('file://'+file);await p.waitForTimeout(500);
 const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),
  links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),ids:[...document.querySelectorAll('[id]')].map(e=>e.id),
  lists:[...document.querySelectorAll('ol.keyed')].map(o=>o.children.length)}));
 if(r.sw>r.iw){console.log('OVERFLOW at',w,r.sw);bad++} if(r.broken.length){console.log('BROKEN IMG',r.broken);bad++}
 if(w===390){for(const h of r.links){if(h.startsWith('http'))continue;if(h.startsWith('#')){if(!r.ids.includes(h.slice(1))){console.log('BAD ANCHOR',h);bad++}continue}
   let t=path.resolve(path.dirname(file),h.split('#')[0]);if(fs.existsSync(t)&&fs.statSync(t).isDirectory())t+='/index.html';if(!fs.existsSync(t)){console.log('BAD LINK',h);bad++}}
  console.log('keyed list sizes',r.lists.join(' '))}
 await p.close()}
await b.close();console.log(bad?'PROBLEMS: '+bad:'ok');process.exit(bad?1:0)})();
