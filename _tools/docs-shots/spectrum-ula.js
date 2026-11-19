// Annotated screenshots for spectrum-ula/docs. The ROM is not in the repo: pass your own 16K Spectrum 48K image.
// Run: SPEC_ROM=/path/to/48.rom node spectrum-ula.js && python3 compress.py ../../spectrum-ula/docs/img
// The test bench has no memory bitmap or hex view, so no ROM contents appear in the pictures: only the Spectrum's own screen.
const S=require('./shot.js');const root=require('path').resolve(__dirname,'../..');const out=root+'/spectrum-ula/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const rom=process.env.SPEC_ROM;if(!rom){console.error('set SPEC_ROM');process.exit(1)}
const url='file://'+root+'/spectrum-ula/app/index.html';
const chk=m=>{if(m.length)console.log('MISSING',m)};
(async()=>{const {b,p}=await S.open(url,{width:1280,height:1000});
await p.setInputFiles('#romFile',rom);
// the bench runs at a few per cent of full speed: hold each key for a few Spectrum frames, and wait longer before the same
// key again (the ROM ignores a key pressed again within 5 interrupts of its release)
await p.waitForTimeout(3000);await p.focus('#tv');
let lastK='';const key=async(k,sym)=>{if(k===lastK)await p.waitForTimeout(6000);lastK=k;if(sym)await p.keyboard.down('Control');await p.keyboard.down(k);await p.waitForTimeout(2500);await p.keyboard.up(k);if(sym)await p.keyboard.up('Control');await p.waitForTimeout(2500)};
// 10 PRINT "ULA" / RUN: prints once and stops with 0 OK, 10:1, leaving a still screen for the picture check
for(const [k,s] of [['1'],['0'],['p'],['p',1],['u'],['l'],['a'],['p',1],['Enter'],['r'],['Enter']])await key(k,s);
await p.waitForTimeout(8000);await p.click('#btnRun');await p.waitForTimeout(500);await p.evaluate(()=>document.activeElement.blur());
// the machine: buttons, start, message, picture and keyboard
chk(await S.mark(p,[['label[for=romFile]',1,'tl',0,0],['label[for=snaFile]',2,'tl',0,0],['#btnRun',3,'tl',0,0],['#btnReset',4,'tl',0,0],['#start',5,'tl',0,0],['#msg',6,'l',-14,0],['#tv',7,'tl',20,20],['#kbd',8,'tl',-4,8]]));
await S.snap(p,out+'machine.png',await S.clip(p,['section[aria-label="The machine"]'],16));
// the instruments, with a report written
await p.click('#btnReport');await p.waitForTimeout(400);
chk(await S.mark(p,[['text:dl.meters dt|Speed',1,'l',-16,0],['text:dl.meters dt|Frames',2,'l',-16,0],['text:dl.meters dt|Lines between',3,'l',-16,0],['text:dl.meters dt|Interrupts',4,'l',-16,0],['text:dl.meters dt|T-states held',5,'l',-16,0],['text:dl.meters dt|Gate events',6,'l',-16,0],['#pcPill',7,'l',-14,0],['#btnReport',8,'tl',0,0],['#btnCopy',9,'tl',0,0],['#report',10,'tr',-20,14]]));
await S.snap(p,out+'instruments.png',await S.clip(p,['section[aria-label="Instruments"]'],16));
// the whole page, small, for the overview
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
chk(await S.mark(p,[['section[aria-label="The machine"]',1,'tl',-4,-4],['section[aria-label="Instruments"]',2,'tl',-4,-4],['footer',3,'tl',-4,-4]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1280,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
console.log(await p.inputValue('#report'));
await b.close()})();
