// Annotated screenshots for msx/docs. The ROM is not in the repo: pass your own 32K BIOS image.
// Run: MSX_ROM=/path/to/hb-55p_basicbios1.rom node msx.js && python3 compress.py ../../msx/docs/img
const S=require('./shot.js');const root=require('path').resolve(__dirname,'../..');const out=root+'/msx/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const rom=process.env.MSX_ROM;if(!rom){console.error('set MSX_ROM');process.exit(1)}
const url='file://'+root+'/msx/app/index.html';
const boot=async(p,prog)=>{await p.uncheck('#mxFw');await p.setInputFiles('#mxRomFile',rom);await p.waitForTimeout(6000);if(!prog)return;await p.click('#mxScreen');
  const type=async s=>{for(const k of s){await p.keyboard.press(k,{delay:90});await p.waitForTimeout(120)}};const txt=t=>[...t].map(c=>c===' '?'Space':c);
  // 10 FOR I=1 TO 8 / 20 PRINT "Z80 BENCH ON MSX" / 30 NEXT / RUN
  await type([...txt('10 FOR I'),'Equal',...txt('1 TO 8'),'Enter',...txt('20 PRINT '),'Shift+Quote',...txt('Z80 BENCH ON MSX'),'Shift+Quote','Enter',...txt('30 NEXT'),'Enter',...txt('RUN'),'Enter']);await p.waitForTimeout(2000)};
(async()=>{const {b,p}=await S.open(url,{width:1440,height:1000});
const chk=m=>{if(m.length)console.log('MISSING',m)};
await boot(p,true);
await p.click('#btnRun');await p.waitForTimeout(300);await p.click('#btnStep');await p.click('#btnStep');
// show RAM, not ROM, in the hex view, and cover the ROM bands of the bitmap (the ROM is copyrighted)
await p.uncheck('#memFollow');await p.fill('#memFrom','C000');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
const bands=await p.evaluate(()=>[...document.querySelectorAll('#mmBands > *')].map(e=>(e.innerText||'').trim().split('\n')[0]));console.log(bands);
if(bands.length!==await p.evaluate(()=>document.querySelectorAll('#mmBands canvas').length))throw new Error('bands and canvases do not match');
for(let i=0;i<bands.length;i++)if(/ROM|firmware|cartridge/i.test(bands[i]))if(!await S.cover(p,'#mmBands canvas',i,'ROM: contents not shown in this picture'))throw new Error('cover failed');
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pScreen',2],['#pMemChips',3],['panel:pinout',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
// screen and keyboard
chk(await S.mark(p,[['#mxScreen',1,'tl',18,18],['#mxLoadRom',2,'t',0,-2],['#mxRestart',3,'t',0,-2],['#mxMachine',4,'t',0,-2],['#mxFw',5,'t',0,-12],['#mxSound',6,'t',0,-12],['#mxCartIn',7,'r',10,0],['#mxTapeIn',8,'r',10,0],['#mxDumpTxt',9,'r',14,0],['#mxKb',10,'tl',-2,6]]));
await S.snap(p,out+'screen.png',await S.clip(p,['#mxScreen','#mxKb'],20));
// memory chips, with a fault and the pin menu open
await p.click('#mcTiles button:has-text("IC58")');await p.waitForTimeout(200);
console.log('pins:',await p.evaluate(()=>[...document.querySelectorAll('#mcChip g.pin')].map(g=>g.dataset.pin).join(' ')));
await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);await p.click('.mcpop button:has-text("Stuck low"), .pinpop button:has-text("Stuck low")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="A1"]');await p.waitForTimeout(200);
chk(await S.mark(p,[['text:#mcTiles button|IC42',1,'l',-4,0],['text:#mcTiles button|IC58',2,'l',-4,0],['text:#mcTiles button|IC3',3,'l',-4,0],['#mcChip',4,'tr',-30,10],['.mcpop, .pinpop',5,'tr',6,0],['#mcFaults',6,'l',-14,8],['#mcClear',7,'l',-16,0]]));
await S.snap(p,out+'memchips.png',await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
// MSX hardware panel
chk(await S.mark(p,[['text:#mxState .hd|Slots',1,'r',-12,0],['text:#mxState .hd|Video processor',2,'r',-12,0],['text:#mxState .hd|PPI port C',3,'r',-12,0],['text:#mxState .hd|Sound',4,'r',-12,0],['text:#mxState .hd|Machine',5,'r',-12,0]]));
await S.snap(p,out+'hardware.png',await S.clip(p,['#pMach']));
// memory bitmap
await p.evaluate(()=>{const b=document.querySelector('#mmBands'),c=b.children[4];b.scrollTop+=c.getBoundingClientRect().top-b.getBoundingClientRect().top-4});await p.waitForTimeout(300);
chk(await S.mark(p,[['#mmBands',1,'tr',-30,60],['#mmLegend',2,'tl',-4,10],['#mmRead',3,'l',-4,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
await b.close();
// toolbar at a narrower width
{const {b,p}=await S.open(url,{width:940,height:800});await boot(p,false);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:940,height:y+6});await b.close()}
})();
