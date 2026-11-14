// Annotated screenshots for osborne-executive/docs. The ROM is not in the repo: pass your own image.
// Run: OSB_ROM=/path/to/execv12.bin OSB_DISK=/path/to/system-disk.imd node osborne-executive.js && python3 compress.py ../../osborne-executive/docs/img
// OSB_DISK (your own CP/M Plus system disk) is only used for the picture of the screen and drives: the other pictures are taken
// before anything is loaded from disk, because the memory bitmap would otherwise show the system's code as pixels.
const S=require('./shot.js');const root=require('path').resolve(__dirname,'../..');const out=root+'/osborne-executive/docs/img/';require('fs').mkdirSync(out,{recursive:true});
const rom=process.env.OSB_ROM,disk=process.env.OSB_DISK;if(!rom||!disk){console.error('set OSB_ROM and OSB_DISK');process.exit(1)}
(async()=>{const {b,p}=await S.open('file://'+root+'/osborne-executive/app/index.html',{width:1440,height:1000});
const chk=m=>{if(m.length)console.log('MISSING',m)};
await p.setInputFiles('#osbRomFile',rom);await p.waitForTimeout(8000);
await p.click('#btnRun');await p.waitForTimeout(300);            // pause
await p.click('#btnStep');await p.click('#btnStep');
// show RAM, not ROM, in the hex view, and cover the ROM band of the bitmap (the ROM is copyrighted)
await p.uncheck('#memFollow');await p.fill('#memFrom','EF00');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
if(!await S.cover(p,'#mmBands canvas',0,'Boot ROM: contents not shown in this picture'))console.log('COVER FAILED');
// overview
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pChips',2],['#pMemChips',3],['#pScreen',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
// chips, with a pin menu open on the system PIA
await p.click('#chipPia0 g.pin.input[data-pin="CB1"]');await p.waitForTimeout(200);
chk(await S.mark(p,[['#chip',1,'tl',20,6],['#chipPia0',2,'tl',20,6],['#chipPia1',3,'tl',20,6],['#chipSio',4,'tl',20,6],['.pinpop',5,'tr',6,0],['#pChips input[data-conn="pia1"]',6,'l',-14,0],['#brAddr',7,'l',-110,0]]));
{const c=await S.clip(p,['#pChips']);c.height=await p.evaluate(()=>document.querySelector('#pChips .busread').getBoundingClientRect().bottom+scrollY+14)-c.y;await S.snap(p,out+'chips.png',c);}
await p.keyboard.press('Escape');await p.click('#pChips h2');
// memory chips: pick U10, set a fault on data out, open the menu on an address pin
await p.click('#mcTiles button:has-text("U10")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);
await p.check('.pinpop input[type=checkbox]');await p.waitForTimeout(150);await p.click('.pinpop button:has-text("Low")').catch(async()=>{console.log('no low button:',await p.evaluate(()=>document.querySelector('.pinpop')&&document.querySelector('.pinpop').innerText))});
await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.click('#mcChip g.pin[data-pin="A1"]');await p.waitForTimeout(200);await p.evaluate(()=>{const e=document.querySelector('.mcpop, .pinpop');e.style.left=(-e.offsetWidth-14)+'px';e.style.top='0px';});await p.waitForTimeout(100);
chk(await S.mark(p,[['text:#mcTiles button|UD18',1,'l',-4,0],['text:#mcTiles button|U8',2,'l',-4,0],['text:#mcTiles button|U17',3,'l',-4,0],['text:#mcTiles button|P1',4,'l',-4,0],['text:#mcTiles button|U10',5,'b',0,2],['#mcChip',6,'tr',-30,10],['.pinpop',7,'tr',6,0],['#mcFaults',8,'l',-14,8],['#mcClear',9,'l',-16,0]]));
{const c=await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18);await S.snap(p,out+'memchips.png',c);}
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
// the RAM board connector P1, with a fault and the pin menu open
await p.click('#mcTiles button:has-text("P1")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="A5"]');await p.waitForTimeout(200);await p.check('.pinpop input[type=checkbox]');await p.waitForTimeout(200);await p.keyboard.press('Escape');
await p.click('#mcChip g.pin[data-pin="PRI1"]');await p.waitForTimeout(200);
chk(await S.mark(p,[['#mcChip g.pin[data-pin="ROMDEC"]',1,'r',34,0],['#mcChip g.pin[data-pin="A14"]',2,'r',22,0],['#mcChip g.pin[data-pin="D6"]',3,'r',22,0],['#mcChip g.pin[data-pin="A5"]',4,'l',-22,0],['.pinpop',5,'tr',6,0]]));
await S.snap(p,out+'p1.png',await S.clip(p,['#mcFig'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
// debug pane listing the fault
chk(await S.mark(p,[['#dbgList',1,'tl',-6,16]]));
await S.snap(p,out+'debug.png',await S.clip(p,['#pDebug']));
// memory bitmap
chk(await S.mark(p,[['#mmBands',1,'tl',70,60],['#mmLegend',2,'tl',-4,10],['#mmRead',3,'l',-4,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
// machine panel
chk(await S.mark(p,[['text:#osbState .hd|Memory banks',1,'r',-12,0],['text:#osbState .hd|Video',2,'r',-12,0],['text:#osbState .hd|System PIA',3,'r',-12,0],['text:#osbState .hd|IEEE',4,'r',-12,0],['text:#osbState .hd|Disk controller',5,'r',-12,0],['text:#osbState .hd|Stubs',6,'r',-12,0]]));
await S.snap(p,out+'machine.png',await S.clip(p,['#pMach']));
await b.close();
// the screen and the drives, after booting from the system disk (a page of its own: see the note at the top)
{const {b,p}=await S.open('file://'+root+'/osborne-executive/app/index.html',{width:1440,height:1000});
await p.setInputFiles('#osbRomFile',rom);await p.waitForTimeout(6000);
await p.setInputFiles('#osbDiskFile',disk);await p.waitForTimeout(500);
await p.click('#osbScreen');await p.keyboard.press('Enter',{delay:200});await p.waitForTimeout(16000);
await p.keyboard.type('dir',{delay:140});await p.keyboard.press('Enter',{delay:140});await p.waitForTimeout(700);
await p.click('#btnRun');await p.waitForTimeout(400);            // pause: the page's layout moves a little while the machine runs
const m=await S.mark(p,[['#osbScreen',1,'tl',18,18],['#osbLoadRom',2,'tl',-2,0],['#osbRestart',3,'tr',2,0],['#osbAlpha',4,'r',110,0],['#osbDrv0 .led',5,'l',-16,0],['#osbDrv0 [data-ej]',6,'tr',0,0],['#osbDrv0 [data-sv]',7,'tr',2,0],['#osbDrv0 .dinfo',8,'r',16,0],['#osbDrv1 [data-ins]',9,'tr',2,0],['#osbMsg',10,'l',-16,0]]);if(m.length)console.log('MISSING',m);
await S.snap(p,out+'screen.png',await S.clip(p,['#osbScreen','.osbdrives','#osbMsg'],36));await b.close()}
// toolbar at a narrower width
{const {b,p}=await S.open('file://'+root+'/osborne-executive/app/index.html',{width:940,height:800});
await p.setInputFiles('#osbRomFile',rom);await p.waitForTimeout(3000);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:940,height:y+6});await b.close()}
})();
