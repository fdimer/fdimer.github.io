// Annotated screenshots for spectrum/docs. The ROM is not in the repo: pass your own 48K ROM (16K).
// Run: SPEC_ROM=/path/to/48.rom node spectrum.js && python3 compress.py ../../spectrum/docs/img
// The memory bitmap draws ROM bits as pixels, so its two ROM bands are covered in every shot that shows it, and the
// hex view is pointed at RAM. No game tapes appear: the deck holds a SAVE recorded here.
const S=require('./shot.js');const path=require('path');const root=path.resolve(__dirname,'../..');const out=root+'/spectrum/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const rom=process.env.SPEC_ROM;if(!rom){console.error('set SPEC_ROM');process.exit(1)}
const url='file://'+root+'/spectrum/app/index.html';
const chk=m=>{if(m.length)console.log('MISSING',m)};
const coverRom=async p=>{
  const bands=await p.evaluate(()=>[...document.querySelectorAll('#mmBands > *')].map(e=>(e.innerText||'').trim().split('\n')[0]));
  if(bands.length!==await p.evaluate(()=>document.querySelectorAll('#mmBands canvas').length))throw new Error('bands and canvases do not match');
  let nc=0;for(let i=0;i<bands.length;i++)if(!/^RAM /.test(bands[i])){nc++;if(!await S.cover(p,'#mmBands canvas',i,'ROM: contents not shown in this picture'))throw new Error('cover failed')}
  if(nc!==2)throw new Error('expected 2 ROM bands, covered '+nc);
};
(async()=>{const {b,p}=await S.open(url,{width:1440,height:1000});
await p.setInputFiles('#zxRomFile',rom);await p.waitForTimeout(4500);await p.click('#zxScreen');
const typ=async t=>{for(const ch of t){await p.keyboard.press(ch==='\n'?'Enter':ch,{delay:110});await p.waitForTimeout(120)}};
// record a SAVE, so the deck holds a tape of our own
await typ('s"demo"\n');await p.waitForTimeout(800);await p.click('#zxTapeRec');await p.click('#zxScreen');await p.keyboard.press('Space');
for(let i=0;i<40;i++){await p.waitForTimeout(1000);if(/0 OK/.test(await p.evaluate(()=>zxBench.zx.screenText().join('|')))&&i>2)break}
await p.click('#zxTapeRec');await p.click('#zxScreen');
await typ('p"Z80 Bench on the ZX Spectrum"\n');await p.waitForTimeout(600);await typ('b1\n');await p.waitForTimeout(1500);
// a program in the lower RAM (6000h), so the bus timing shows the ULA holding the clock: LD (4000h),A then JR back
await p.click('#modeHex');await p.fill('#hexIn','6000:\n32 00 40\n18 FB\n');await p.fill('#loadAddr','6000');await p.check('#resetAfter');await p.click('#btnLoad');await p.waitForTimeout(300);
await p.click('#btnRun');await p.waitForTimeout(800);await p.click('#btnRun');await p.waitForTimeout(300);
for(let i=0;i<4000;i++){const t=await p.evaluate(()=>document.querySelector('#pTiming').innerText);if(/TH/.test(t)&&/LD \(4000h\),A/.test(t))break;await p.keyboard.press('s');}
console.log(await p.textContent('#status'));
await p.uncheck('#memFollow');await p.fill('#memFrom','5800');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
await coverRom(p);
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pScreen',2],['#pPinout',3],['#pMemChips',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the bus timing with held T-states
chk(await S.mark(p,[['#pTiming',1,'tl',428,212]]));
await S.snap(p,out+'timing.png',await S.clip(p,['#pTiming'],10));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the screen panel
chk(await S.mark(p,[['#zxScreen',1,'tl',18,18],['#zxScrInfo',2,'l',-16,0],['#zxLoadRom',3,'t',0,-2],['#zxRestart',4,'t',0,-2],['#zxSnapLoad',5,'t',0,-2],['#zxSnapSave',6,'t',0,-2],['#zxSound',7,'t',0,-12],['label[for=zxContend]',8,'tl',-4,-8],
  ['#zxTapeIns',9,'t',0,-2],['#zxTapePlay',10,'t',0,-2],['#zxTapeRew',11,'t',0,-2],['#zxTapeRec',12,'t',0,-2],['#zxTapeSave',13,'t',0,-2],['#zxTapeWav',14,'t',0,-2],['#zxTapeBlk',15,'b',0,14],['label[for=zxTapeInstant]',16,'tl',-4,-8],['label[for=zxTapeFast]',17,'tl',-4,-8],['#zxTapeInfo',18,'l',-16,0],['#zxKb',19,'tl',-2,6]]));
await S.snap(p,out+'screen.png',await S.clip(p,['#pScreen h2','#zxScreen','#zxKb'],20));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the processor and the ULA
chk(await S.mark(p,[['#zxFigZ80',1,'tl',8,8],['#zxFigUla',2,'tl',8,8],['#pPinout .legend',3,'t',-230,14],['#pPinout .busread',4,'r',-24,0]]));
await S.snap(p,out+'chips.png',await S.clip(p,['#pPinout h2','.cpchips','#pPinout .busread'],16));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the hardware panel
chk(await S.mark(p,[['text:#zxState .hd|Memory',1,'r',-12,0],['text:#zxState .hd|ULA IC1',2,'r',-12,0],['text:#zxState .hd|Contention',3,'r',-12,0],['text:#zxState .hd|Port FE',4,'r',-12,0]]));
await S.snap(p,out+'hardware.png',await S.clip(p,['#pMach']));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the memory bitmap (ROM bands covered)
chk(await S.mark(p,[['#mmBands',1,'tr',-30,60],['#mmLegend',2,'tr',-12,10],['#mmRead',3,'r',-12,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// chips and faults: IC9 (lower RAM, D3) with its output disconnected, and the menu of its DIN open
await p.click('#mcTiles button:has-text("IC9")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]');await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.click('#mcChip g.pin[data-pin="DIN"]');await p.waitForTimeout(200);
await p.evaluate(()=>{const e=document.querySelector('.mcpop');const t=[...document.querySelectorAll('#mcTiles .mctile')].find(x=>/IC10/.test(x.textContent)).getBoundingClientRect(),f=e.parentElement.getBoundingClientRect();const t2=[...document.querySelectorAll('#mcTiles .mctile')].find(x=>/IC2/.test(x.textContent)).getBoundingClientRect();e.style.left=(t.left-f.left)+'px';e.style.top=(t2.top-f.top)+'px';});await p.waitForTimeout(100);
chk(await S.mark(p,[['text:#mcTiles button|IC2',1,'l',-4,0],['text:#mcTiles button|IC5',2,'l',-4,0],['text:#mcTiles button|IC6',3,'l',-4,0],['text:#mcTiles button|IC15',4,'l',-4,0],['#mcChip',5,'tr',-30,10],['.mcpop',6,'tr',6,0],['#mcFaults',7,'t',110,12],['#mcClear',8,'l',-16,0]]));
await S.snap(p,out+'memchips.png',await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');await p.evaluate(()=>document.querySelectorAll('.docmark,.doccover').forEach(e=>e.remove()));
// the picture with that fault: back to BASIC (power on), then a moment's running
await p.click('#zxRestart');await p.waitForTimeout(3500);
await p.click('#mcTiles button:has-text("IC9")');await p.waitForTimeout(200);await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]');await p.keyboard.press('Escape');
await p.waitForTimeout(1500);await p.locator('#zxScreen').screenshot({path:out+'fault.png'});
// the CPU clock line's menu on the Z80
await p.click('#mcClearAll');await p.click('#mcTiles button:has-text("IC2")');await p.waitForTimeout(200);await p.click('#mcChip g.pin[data-pin="CLK"]');await p.waitForTimeout(200);
await S.snap(p,out+'linemenu.png',await S.clip(p,['#mcFig','.mcpop'],14));
await b.close()})();
