// Annotated screenshots for cpc/docs. The ROMs are not in the repo: pass the folder holding your own
// OS_464.ROM and BASIC_1.0.ROM (16K each).
// Run: CPC_ROMS=/path/to/roms node cpc.js && python3 compress.py ../../cpc/docs/img
const S=require('./shot.js');const path=require('path');const root=path.resolve(__dirname,'../..');const out=root+'/cpc/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const dir=process.env.CPC_ROMS;if(!dir){console.error('set CPC_ROMS');process.exit(1)}
const roms=[path.join(dir,'OS_464.ROM'),path.join(dir,'BASIC_1.0.ROM')];
const url='file://'+root+'/cpc/app/index.html';
const boot=async(p,prog)=>{await p.setInputFiles('#cpRomFile',roms);await p.waitForTimeout(5000);if(!prog)return;await p.click('#cpScreen');
  // save a line to tape first, so the deck holds a recording (no game tapes in these pictures)
  await p.keyboard.type('10 print "saved to tape"\nsave "demo"\n',{delay:140});await p.waitForTimeout(1000);
  await p.click('#cpTapeRec');await p.click('#cpScreen');await p.keyboard.press('Space');
  for(let i=0;i<60;i++){await p.waitForTimeout(2000);if(/motor off/.test(await p.textContent('#cpTapeInfo'))&&i>1)break}
  await p.click('#cpTapeRec');await p.click('#cpScreen');await p.keyboard.type('cls\nnew\n',{delay:140});
  await p.keyboard.type('10 for i=1 to 8\n20 print "z80 bench on the cpc 464"\n30 next\nrun\n',{delay:140});await p.waitForTimeout(3000);
  await p.keyboard.type('sound 1,142,2000,15\n',{delay:140});await p.waitForTimeout(800)};
const chk=m=>{if(m.length)console.log('MISSING',m)};
(async()=>{const {b,p}=await S.open(url,{width:1440,height:1000});
await boot(p,true);
// stop in RAM, at the firmware's interrupt entry (B939h), so the disassembly shows RAM
await p.selectOption('#dbgType','at');await p.fill('#dbgAddr','B939');await p.click('#dbgAdd');await p.waitForTimeout(1500);
console.log(await p.textContent('#status'));
// show RAM, not ROM, in the hex view, and cover the ROM bands of the bitmap (the ROMs are copyrighted)
await p.uncheck('#memFollow');await p.fill('#memFrom','4000');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
const bands=await p.evaluate(()=>[...document.querySelectorAll('#mmBands > *')].map(e=>(e.innerText||'').trim().split('\n')[0]));console.log(bands);
if(bands.length!==await p.evaluate(()=>document.querySelectorAll('#mmBands canvas').length))throw new Error('bands and canvases do not match');
let nc=0;for(let i=0;i<bands.length;i++)if(/^(Firmware|BASIC) ROM/i.test(bands[i])||!/^RAM /.test(bands[i])){nc++;if(!await S.cover(p,'#mmBands canvas',i,'ROM: contents not shown in this picture'))throw new Error('cover failed')}
if(nc!==4)throw new Error('expected 4 ROM bands, covered '+nc);
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pScreen',2],['#pPinout',3],['#pMemChips',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
// screen and keyboard
chk(await S.mark(p,[['#cpScreen',1,'tl',18,18],['#cpScrInfo',2,'l',-16,0],['#cpLoadRom',3,'t',0,-2],['#cpRestart',4,'t',0,-2],['#cpDumpBin',5,'t',0,-2],['#cpGa',6,'t',0,-12],['#cpSound',7,'t',0,-12],['#cpTapeIns',8,'t',0,-2],['#cpTapePlay',9,'t',0,-2],['#cpTapeRew',10,'t',0,-2],['#cpTapeRec',11,'t',0,-2],['#cpTapeSave',12,'t',0,-2],['#cpTapeBlk',13,'tl',150,-6],['label[for=cpTapeInstant]',14,'tl',-4,-8],['label[for=cpTapeFast]',15,'tl',-4,-8],['#cpTapeInfo',16,'l',-16,0],['#cpKb',17,'tl',-2,6]]));
await S.snap(p,out+'screen.png',await S.clip(p,['#pScreen h2','#cpScreen','#cpKb'],20));
// the processor, gate array and 6845, with the fault menu of the 6845's VSYNC pin open
await p.click('#cpChipVdu g.pin[data-pin="VSYNC"]');await p.waitForTimeout(250);
chk(await S.mark(p,[['#cpFigZ80',1,'tl',8,8],['#cpFigGa',2,'tl',8,8],['#cpFigVdu',3,'tl',8,8],['.mcpop',4,'tr',6,0],['#pPinout .legend',5,'t',-230,14],['#pPinout .busread',6,'r',-24,0]]));
await S.snap(p,out+'chips.png',await S.clip(p,['#pPinout h2','.cpchips','#pPinout .busread'],16));
await p.keyboard.press('Escape');await p.click('#pPinout h2');
// CPC hardware panel
chk(await S.mark(p,[['text:#cpState .hd|Memory now',1,'r',-12,0],['text:#cpState .hd|Gate array',2,'r',-12,0],['text:#cpState .hd|READY',3,'r',-12,0],['text:#cpState .hd|6845',4,'r',-12,0],['text:#cpState .hd|Monitor',5,'r',-12,0],['text:#cpState .hd|Sound chip',6,'r',-12,0],['text:#cpState .hd|8255',7,'r',-12,0]]));
await S.snap(p,out+'hardware.png',await S.clip(p,['#pMach']));
// memory bitmap, scrolled to the screen memory (RAM at C000h)
await p.evaluate(()=>{const b=document.querySelector('#mmBands'),c=b.children[10];b.scrollTop+=c.getBoundingClientRect().top-b.getBoundingClientRect().top-4});await p.waitForTimeout(300);
chk(await S.mark(p,[['#mmBands',1,'tr',-30,60],['#mmLegend',2,'tr',-12,10],['#mmRead',3,'r',-12,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
// memory chips: IC120 (data bit 0) with its output disconnected, and the A1 pin menu open
await p.click('#mcTiles button:has-text("IC120")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]');await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.click('#mcChip g.pin[data-pin="A1"]');await p.waitForTimeout(200);await p.evaluate(()=>{const e=document.querySelector('.mcpop');const t=[...document.querySelectorAll('#mcTiles .mctile')].find(x=>/IC105/.test(x.textContent)).getBoundingClientRect(),f=e.parentElement.getBoundingClientRect();e.style.left=(t.right-f.left+40)+'px';e.style.top=(t.top-f.top-14)+'px';});await p.waitForTimeout(100);
chk(await S.mark(p,[['text:#mcTiles button|IC103',1,'l',-4,0],['text:#mcTiles button|IC120',2,'l',-4,0],['text:#mcTiles button|IC109',3,'l',-4,0],['text:#mcTiles button|IC107',4,'l',-4,0],['#mcChip',5,'tr',-30,10],['.mcpop',6,'tr',6,0],['#mcFaults',7,'t',110,12],['#mcClear',8,'l',-16,0]]));
await S.snap(p,out+'memchips.png',await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
// the picture with that fault: remove the breakpoint, run for a moment, stop
await p.evaluate(()=>document.querySelectorAll('.docmark,.doccover').forEach(e=>e.remove()));
await p.click('#dbgList button.x');await p.click('#btnRun');await p.waitForTimeout(1500);await p.click('#btnRun');await p.waitForTimeout(400);
console.log(await p.textContent('#status'));
await p.locator('#cpScreen').screenshot({path:out+'fault.png'});
// the 8255's pinout with the fault menu of PB0, which is on the VSYNC line
await p.click('#mcClearAll');await p.click('#mcTiles button:has-text("IC107")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="PB0"]');await p.waitForTimeout(200);
await S.snap(p,out+'iochip.png',await S.clip(p,['#mcFig','.mcpop'],14));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
// a selector fault: IC104's input from the 6845's RA2 cut and high, so each character's top half repeats its bottom half
await p.click('#mcTiles button:has-text("IC104")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="2C2"]');await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]');await p.waitForTimeout(150);
await p.click('.mcpop button[data-a="1"]');await p.waitForTimeout(150);await p.keyboard.press('Escape');
await p.click('#btnRun');await p.waitForTimeout(1500);await p.click('#btnRun');await p.waitForTimeout(400);
await p.locator('#cpScreen').screenshot({path:out+'selfault.png'});
await b.close();
// toolbar at a narrower width
{const {b,p}=await S.open(url,{width:940,height:800});await boot(p,false);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:940,height:y+6});await b.close()}
})();
