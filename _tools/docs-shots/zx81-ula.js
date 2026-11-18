// Annotated screenshots for zx81-ula/docs. The ROM is not in the repo: pass your own 8K ZX81 image.
// Run: ZX81_ROM=/path/to/zx81.rom node zx81-ula.js && python3 compress.py ../../zx81-ula/docs/img
// The test bench has no memory bitmap or hex view, so no ROM contents appear in the pictures: only the ZX81's own screen.
const S=require('./shot.js');const root=require('path').resolve(__dirname,'../..');const out=root+'/zx81-ula/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const rom=process.env.ZX81_ROM;if(!rom){console.error('set ZX81_ROM');process.exit(1)}
const url='file://'+root+'/zx81-ula/app/index.html';
const chk=m=>{if(m.length)console.log('MISSING',m)};
(async()=>{const {b,p}=await S.open(url,{width:1280,height:1000});
await p.setInputFiles('#romFile',rom);
// the bench runs at about half speed in a headless browser: wait for the cursor, and hold each key long enough for the ROM's scan
await p.waitForFunction(()=>parseFloat(document.querySelector('#mTime').textContent)>4,null,{timeout:60000});await p.click('#tv');
const type=async s=>{for(const k of s){await p.keyboard.press(k,{delay:450});await p.waitForTimeout(450)}};
// 10 PRINT "ULA TEST BENCH" / RUN: the program prints once and stops with report 0/10, leaving a still screen for the picture check
await type(['1','0','p','Shift+KeyP','U','L','A',' ','T','E','S','T',' ','B','E','N','C','H','Shift+KeyP','Enter']);await type(['r','Enter']);
await p.waitForTimeout(6000);
// the machine: buttons, picture and keyboard
chk(await S.mark(p,[['label[for=romFile]',1,'tl',0,0],['label[for=pFile]',2,'tl',0,0],['#btnRun',3,'tl',0,0],['#btnReset',4,'tl',0,0],['#msg',5,'l',-14,0],['#tv',6,'tl',20,20],['#kbd',7,'tl',-4,8]]));
await S.snap(p,out+'machine.png',await S.clip(p,['section[aria-label="The machine"]'],16));
// the instruments, with a report written
await p.click('#btnReport');await p.waitForTimeout(400);
chk(await S.mark(p,[['#engine',1,'r',16,0],['text:dl.meters dt|Speed',2,'l',-16,0],['text:dl.meters dt|Last frame',3,'l',-16,0],['text:dl.meters dt|Frames whose',4,'l',-16,0],['text:dl.meters dt|NMIs',5,'l',-16,0],['text:dl.meters dt|Program counter',6,'l',-16,0],['#pcPill',7,'l',-14,0],['#btnReport',8,'tl',0,0],['#btnCopy',9,'tl',0,0],['#report',10,'tr',-20,14]]));
await S.snap(p,out+'instruments.png',await S.clip(p,['section[aria-label="Instruments"]'],16));
// the logic analyser: pause, step one instruction, show 40 T-states
await p.click('#btnRun');await p.waitForTimeout(300);await p.click('#btnStepI');await p.waitForTimeout(300);
chk(await S.mark(p,[['#btnStepI',1,'tl',0,0],['#btnStepF',2,'tl',0,0],['#zoom',3,'tl',0,0],['#back',4,'t',0,-12],['#btnVcd',5,'tl',0,0],['#wave',6,'tl',-12,12],['#wave',7,'tl',-12,343],['#wave',8,'tl',520,410]]));
await S.snap(p,out+'analyser.png',await S.clip(p,['section[aria-label="Logic analyser"]'],16));
// the whole page, small, for the overview
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
chk(await S.mark(p,[['section[aria-label="The machine"]',1,'tl',-4,-4],['section[aria-label="Instruments"]',2,'tl',-4,-4],['section[aria-label="Logic analyser"]',3,'tl',-4,-4],['footer',4,'tl',-4,-4]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1280,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
await b.close()})();
