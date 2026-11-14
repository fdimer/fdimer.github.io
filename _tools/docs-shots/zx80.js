// Annotated screenshots for zx80/docs, taken on the ZX81. The ROM is not in the repo: pass your own 8K ZX81 image.
// Run: ZX81_ROM=/path/to/zx81.rom node zx80.js && python3 compress.py ../../zx80/docs/img
const S=require('./shot.js');const root=require('path').resolve(__dirname,'../..');const out=root+'/zx80/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const rom=process.env.ZX81_ROM;if(!rom){console.error('set ZX81_ROM');process.exit(1)}
const url='file://'+root+'/zx80/app/index.html';
const boot=async p=>{await p.selectOption('#zxMachine','zx81');await p.waitForTimeout(300);await p.setInputFiles('#zxRomFile',rom);await p.waitForTimeout(4000);await p.click('#zxScreen');
  const type=async s=>{for(const k of s){await p.keyboard.press(k,{delay:150});await p.waitForTimeout(250)}};
  // 10 PRINT "Z80 BENCH" / 20 GOTO 10 / RUN
  await type(['1','0','p','Shift+KeyP','Z','8','0',' ','B','E','N','C','H','Shift+KeyP','Enter']);await type(['2','0','g','1','0','Enter']);await type(['r','Enter']);await p.waitForTimeout(2500)};
(async()=>{const {b,p}=await S.open(url,{width:1440,height:1000});
const chk=m=>{if(m.length)console.log('MISSING',m)};
await boot(p);
await p.click('#btnRun');await p.waitForTimeout(300);await p.click('#btnStep');await p.click('#btnStep');
// show RAM, not ROM, in the hex view, and cover the ROM band of the bitmap (the ROM is copyrighted)
await p.uncheck('#memFollow');await p.fill('#memFrom','4000');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
if(!await S.cover(p,'#mmBands canvas',0,'ROM: contents not shown in this picture'))console.log('COVER FAILED');
console.log(await p.evaluate(()=>document.querySelector('#mmBands').innerText.slice(0,200)));
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pScreen',2],['#pPinout',3],['#pMemChips',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
// screen and keyboard
chk(await S.mark(p,[['#zxScreen',1,'tl',18,18],['#zxLoadRom',2,'t',0,-2],['#zxRestart',3,'t',0,-2],['#zxMachine',4,'t',0,-2],['#zxRam',5,'t',0,-2],['#zxHires',6,'r',95,0],['#zxTapeIn',7,'b',0,2],['#zxDumpBin',8,'b',0,2],['#zxKb',9,'tl',-2,6]]));
await S.snap(p,out+'screen.png',await S.clip(p,['#zxScreen','#zxKb'],20));
// memory chips, with a fault and the pin menu open
await p.click('#mcTiles button:has-text("IC4b"), #mcTiles button:has-text("IC4")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="I/O1"]').catch(async()=>console.log('pins:',await p.evaluate(()=>[...document.querySelectorAll('#mcChip g.pin')].map(g=>g.dataset.pin).join(' '))));
await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]').catch(()=>console.log('no tick box'));await p.waitForTimeout(200);await p.click('.mcpop button:has-text("Low")').catch(()=>console.log('no low'));await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="A3"]');await p.waitForTimeout(200);
chk(await S.mark(p,[['#mcTiles button',1,'l',-4,0],['#mcTiles button:nth-of-type(2), #mcTiles .mcrow:nth-of-type(2) button',2,'l',-4,0],['#mcChip',3,'tr',-30,10],['.mcpop',4,'tr',6,0],['#mcFaults',5,'l',-14,8],['#mcClear',6,'l',-16,0]]));
await S.snap(p,out+'memchips.png',await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
await p.evaluate(()=>document.querySelector('#mcClearAll').click());await p.waitForTimeout(200);
// processor and ULA: paused in the refresh half of a character fetch, with the fault menu of A3' open
let found=false;for(let i=0;i<6000&&!found;i++){await p.keyboard.press('c');found=await p.evaluate(()=>/Opcode fetch · T3/.test(document.querySelector('#brCycle').textContent)&&document.querySelector('#zxChipUla [data-pin="D0"] .sv').textContent!=='Z')}
if(!found)console.log('NO CHARACTER FETCH FOUND');
// a harmless fault so the caption lists one: USA/UK disconnected floats high, which is the UK setting anyway
await p.click('#zxChipUla g.pin[data-pin="USA/UK"]');await p.waitForTimeout(200);await p.click('.mcpop button:has-text("Disconnected")');await p.keyboard.press('Escape');
await p.click('#zxChipUla g.pin[data-pin="A3\'"]');await p.waitForTimeout(200);
chk(await S.mark(p,[['#chip',1,'tl',60,4],['#zxChipUla',2,'tl',60,4],['.mcpop',3,'tr',6,0],['#zxCapUla .mcfaults',4,'c',-118,0]]));
await S.snap(p,out+'ula.png',await S.clip(p,['#zxFigZ80','#zxFigUla','.mcpop'],18));
await p.keyboard.press('Escape');await p.evaluate(()=>document.querySelector('#mcClearAll').click());
// video logic
chk(await S.mark(p,[['text:#zxState .hd|Character logic',1,'r',-12,0],['text:#zxState .hd|ULA',2,'r',-12,0],['text:#zxState .hd|BASIC mode',3,'r',-12,0],['text:#zxState .hd|Sync',4,'r',-12,0],['text:#zxState .hd|Keyboard',5,'r',-12,0]]));
await S.snap(p,out+'videologic.png',await S.clip(p,['#pMach']));
// memory bitmap
chk(await S.mark(p,[['#mmBands',1,'tr',-30,30],['#mmLegend',2,'tl',-4,10],['#mmRead',3,'l',-4,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
await b.close();
// toolbar at a narrower width
{const {b,p}=await S.open(url,{width:940,height:800});await p.selectOption('#zxMachine','zx81');await p.setInputFiles('#zxRomFile',rom);await p.waitForTimeout(3000);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:940,height:y+6});await b.close()}
})();
