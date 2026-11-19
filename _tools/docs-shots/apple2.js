// Annotated screenshots for apple2/docs. The ROMs are not in the repo: pass the folder that holds your own Apple II Plus
// ROM files. Run: A2_ROMS=/path/to/roms node apple2.js && python3 compress.py ../../apple2/docs/img
// The pictures show the Apple's screen (its own start-up banner) but no ROM contents: every ROM band of the memory
// bitmap is covered, and the hex view points at RAM.
const S=require('./shot.js');const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'../..');const out=root+'/apple2/docs/img/';fs.mkdirSync(out,{recursive:true});
const dir=process.env.A2_ROMS;if(!dir){console.error('set A2_ROMS');process.exit(1)}
const roms=fs.readdirSync(dir).filter(f=>/\.(bin|rom)$/i.test(f)).map(f=>path.join(dir,f));
const url='file://'+root+'/apple2/app/index.html';
const tmp=require('os').tmpdir();
// a disk image of zeros and a short binary, made here: no Apple software in the pictures
const dsk=path.join(tmp,'blank.dsk');fs.writeFileSync(dsk,Buffer.alloc(143360));
const bin=path.join(tmp,'stars.bin');fs.writeFileSync(bin,Buffer.from([0xA2,0x27,0xA9,0x2A,0x9D,0x00,0x04,0xCA,0x10,0xFA,0x60]));
const prog=['10 GR:FOR I=0 TO 15:COLOR=I:FOR X=I*2 TO I*2+1:VLIN 0,39 AT X+4:NEXT:NEXT','20 HOME:VTAB 22:PRINT "LORES COLOURS 0-15, MIXED WITH TEXT"','RUN'];
(async()=>{const {b,p}=await S.open(url,{width:1440,height:1000});
const chk=m=>{if(m.length)console.log('MISSING',m)};
await p.setInputFiles('#a2RomFile',roms);await p.waitForTimeout(2500);
await p.check('#a2Lc');await p.waitForTimeout(400);await p.check('#a2Dsk');await p.waitForTimeout(1200);
await p.fill('#a2Paste',prog.join('\n'));await p.click('#a2Type');await p.waitForTimeout(7000);
await p.click('#a2Drives .a2drive[data-d="0"] .ins');await p.setInputFiles('#a2DiskFile',dsk);await p.waitForTimeout(400);
await p.fill('#a2BinAddr','0300');await p.setInputFiles('#a2TapeBinFile',bin);await p.waitForTimeout(400);
await p.fill('#a2Paste','');
console.log(await p.evaluate(()=>[document.querySelector('#status').textContent,document.querySelector('#a2ScrInfo').textContent,document.querySelector('#a2Msg').textContent]));
await p.click('#btnRun');await p.waitForTimeout(300);
// show RAM, not ROM, in the hex view, and cover every ROM band of the bitmap (the ROMs are copyrighted)
await p.uncheck('#memFollow');await p.fill('#memFrom','0400');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
const bands=await p.evaluate(()=>[...document.querySelectorAll('#mmBands > *')].map(e=>(e.innerText||'').trim().split('\n')[0]));console.log(bands);
if(bands.length!==await p.evaluate(()=>document.querySelectorAll('#mmBands canvas').length))throw new Error('bands and canvases do not match');
for(let i=0;i<bands.length;i++)if(/ROM|PROM/i.test(bands[i]))if(!await S.cover(p,'#mmBands canvas',i,'ROM: contents not shown in this picture'))throw new Error('cover failed');
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pScreen',2],['#pMemChips',3],['panel:pinout',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the screen and the controls under it
chk(await S.mark(p,[['#a2Screen',1,'tl',18,18],['#a2LoadRom',2,'t',0,-2],['#a2Restart',3,'t',0,-2],['#a2Reset',4,'t',0,-2],['#a2Ram',5,'t',0,-2],['#a2Mon',6,'t',0,-2],['label[for=a2Sound]',7,'l',-4,0],['label[for=a2Pdl0]',8,'l',-4,0],['label:has(#a2Pb0)',9,'l',-4,0],['#a2Paste',10,'tl',-2,6],['#a2Type',11,'t',0,-2],['#a2BinIn',12,'t',0,-2],['#a2Listing',13,'t',0,-2]]));
await S.snap(p,out+'screen.png',await S.clip(p,['#a2Screen','#a2Listing'],20));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// cards, drives, cassette, sockets and keyboard
chk(await S.mark(p,[['#a2Hz',1,'t',0,-2],['label:has(#a2Lc)',2,'l',-4,0],['label:has(#a2Dsk)',3,'l',-4,0],['#a2Drives .a2drive[data-d="0"] .led',4,'t',0,-2],['#a2Drives .a2drive[data-d="0"] .ins',5,'t',0,-2],['#a2Drives .a2drive[data-d="0"] .sv',6,'t',0,-2],['#a2Drives .a2drive[data-d="0"] .info',7,'r',14,0],['#a2TapeIn',8,'t',0,-2],['#a2TapeBin',9,'t',0,-2],['#a2Play',10,'t',0,-2],['#a2Rec',11,'t',0,-2],['#a2TapeInfo',12,'r',14,0],['#a2Sockets',13,'tl',-2,6],['#a2Kb',14,'tl',-2,6]]));
await S.snap(p,out+'cards.png',await S.clip(p,['#a2Hz','#a2Kb'],20));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// memory chips, with a fault and the pin menu open
await p.click('#mcTiles button:has-text("C3")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]');await p.waitForTimeout(150);await p.click('.mcpop button:has-text("High")');await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.click('#mcChip g.pin[data-pin="A1"]');await p.waitForTimeout(200);await p.evaluate(()=>{const e=document.querySelector('.mcpop, .pinpop');e.style.left=(-e.offsetWidth-14)+'px';e.style.top='0px';});await p.waitForTimeout(100);
chk(await S.mark(p,[['text:#mcTiles button|C10',1,'l',-4,0],['text:#mcTiles button|D10',2,'l',-4,0],['text:#mcTiles button|E10',3,'l',-4,0],['text:#mcTiles button|D0',4,'l',-4,0],['text:#mcTiles button|A5',5,'l',-4,0],['#mcChip',6,'tr',-30,10],['.mcpop, .pinpop',7,'tr',6,0],['#mcFaults',8,'r',-50,0],['#mcClear',9,'l',-16,0]]));
await S.snap(p,out+'memchips.png',await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');await p.click('#mcClear');await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// the Apple II hardware panel
await p.click('#btnRun');await p.waitForTimeout(1500);await p.click('#btnRun');await p.waitForTimeout(300);
chk(await S.mark(p,[['text:#a2State .hd|Soft switches',1,'r',-12,0],['text:#a2State .hd|Keyboard',2,'r',-12,0],['text:#a2State .hd|Speaker',3,'r',-12,0],['text:#a2State .hd|Video scanner',4,'r',-12,0],['text:#a2State .hd|Language card',5,'r',-12,0],['text:#a2State .hd|Disk II',6,'r',-12,0],['text:#a2State .hd|Machine',7,'r',-12,0]]));
await S.snap(p,out+'hardware.png',await S.clip(p,['#pMach']));
await p.evaluate(()=>document.querySelectorAll('.docmark').forEach(e=>e.remove()));
// memory bitmap
for(let i=0;i<bands.length;i++)if(/ROM|PROM/i.test(bands[i]))await S.cover(p,'#mmBands canvas',i,'ROM: contents not shown in this picture');
chk(await S.mark(p,[['#mmBands',1,'tr',-30,60],['#mmLegend',2,'tl',-4,10],['#mmRead',3,'l',-4,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
await b.close();
// toolbar at a narrower width
{const {b,p}=await S.open(url,{width:940,height:800});await p.setInputFiles('#a2RomFile',roms);await p.waitForTimeout(2000);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:940,height:y+6});await b.close()}
})();
