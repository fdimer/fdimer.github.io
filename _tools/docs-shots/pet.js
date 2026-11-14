// Annotated screenshots for pet/docs. The ROMs are not in the repo: pass the folder that holds your own PET ROM files.
// Run: PET_ROMS=/path/to/roms node pet.js && python3 compress.py ../../pet/docs/img
const S=require('./shot.js');const fs=require('fs');const root=require('path').resolve(__dirname,'../..');const out=root+'/pet/docs/img/';fs.mkdirSync(out,{recursive:true});
const dir=process.env.PET_ROMS;if(!dir){console.error('set PET_ROMS');process.exit(1)}
const roms=['basic-2-c000','basic-2-d000','edit-2-n','kernal-2','characters-2'].map(n=>{const f=fs.readdirSync(dir).find(x=>x.startsWith(n)&&x.endsWith('.bin'));if(!f)throw new Error('missing '+n);return dir+'/'+f});
const url='file://'+root+'/pet/app/index.html';
const boot=async(p,prog)=>{await p.setInputFiles('#ptRomFile',roms);await p.waitForTimeout(5000);if(!prog)return;await p.click('#ptScreen');
  for(const line of ['10 PRINT "6502 BENCH ON A PET"','20 GOTO 10','RUN']){await p.keyboard.type(line,{delay:110});await p.keyboard.press('Enter',{delay:110});await p.waitForTimeout(400)}
  await p.waitForTimeout(2500)};
(async()=>{const {b,p}=await S.open(url,{width:1440,height:1000});
const chk=m=>{if(m.length)console.log('MISSING',m)};
await boot(p,true);
console.log(await p.evaluate(()=>[document.querySelector('#status').textContent,document.querySelector('#ptScrInfo').textContent,document.querySelector('#ptMsg').textContent]));
await p.click('#btnRun');await p.waitForTimeout(300);await p.click('#btnStep');await p.click('#btnStep');
// show RAM, not ROM, in the hex view, and cover every ROM band of the bitmap (the ROMs are copyrighted)
await p.uncheck('#memFollow');await p.fill('#memFrom','0400');await p.press('#memFrom','Enter');await p.waitForTimeout(300);
const bands=await p.evaluate(()=>[...document.querySelectorAll('#mmBands > *')].map(e=>(e.innerText||'').trim().split('\n')[0]));console.log(bands);
if(bands.length!==await p.evaluate(()=>document.querySelectorAll('#mmBands canvas').length))throw new Error('bands and canvases do not match');
for(let i=0;i<bands.length;i++)if(/ROM/i.test(bands[i]))if(!await S.cover(p,'#mmBands canvas',i,'ROM: contents not shown in this picture'))throw new Error('cover failed');
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['#pScreen',2],['#pMemChips',3],['panel:pinout',4],['panel:program',5],['panel:i/o',6],['panel:disassembly',7],['section.panel:has(#memView)',8],['#pMemMap',9],['#pRegs',10],['#pDebug',11],['#pTiming',12],['#pMach',13]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
// screen, sockets and keyboard
chk(await S.mark(p,[['#ptScreen',1,'tl',18,18],['#ptLoadRom',2,'t',0,-2],['#ptRestart',3,'t',0,-2],['#ptBasic',4,'t',0,-2],['#ptRam',5,'t',0,-2],['#ptSound',6,'r',70,0],['#ptPrgIn',7,'b',0,2],['#ptListing',8,'r',14,0],['#ptSockets',9,'tl',-2,6],['#ptKb',10,'tl',-2,6]]));
await S.snap(p,out+'screen.png',await S.clip(p,['#ptScreen','#ptKb'],20));
// memory chips, with a fault and the pin menu open
await p.click('#mcTiles button:has-text("UI2")');await p.waitForTimeout(200);
await p.click('#mcChip g.pin[data-pin="DOUT"]');await p.waitForTimeout(200);await p.check('.mcpop input[type=checkbox]');await p.waitForTimeout(150);await p.click('.mcpop button:has-text("Low")');await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.click('#mcChip g.pin[data-pin="A1"]');await p.waitForTimeout(200);await p.evaluate(()=>{const e=document.querySelector('.mcpop, .pinpop');e.style.left=(-e.offsetWidth-14)+'px';e.style.top='0px';});await p.waitForTimeout(100);
chk(await S.mark(p,[['text:#mcTiles button|UI',1,'l',-4,0],['text:#mcTiles button|UJ',2,'l',-4,0],['text:#mcTiles button|UF',3,'l',-4,0],['text:#mcTiles button|UD',4,'l',-4,0],['#mcChip',5,'tr',-30,10],['.mcpop, .pinpop',6,'tr',6,0],['#mcFaults',7,'l',-14,8],['#mcClear',8,'l',-16,0]]));
await S.snap(p,out+'memchips.png',await S.clip(p,['#mcTiles','#mcFig','#mcInfo'],18));
await p.keyboard.press('Escape');await p.click('#pMemChips h2');
// PET hardware panel
chk(await S.mark(p,[['text:#ptState .hd|PIA 1',1,'r',-12,0],['text:#ptState .hd|PIA 2',2,'r',-12,0],['text:#ptState .hd|VIA',3,'r',-12,0],['text:#ptState .hd|Video',4,'r',-12,0],['text:#ptState .hd|Machine',5,'r',-12,0]]));
await S.snap(p,out+'hardware.png',await S.clip(p,['#pMach']));
// memory bitmap
chk(await S.mark(p,[['#mmBands',1,'tr',-30,60],['#mmLegend',2,'tl',-4,10],['#mmRead',3,'l',-4,0]]));
await S.snap(p,out+'bitmap.png',await S.clip(p,['#pMemMap']));
await b.close();
// toolbar at a narrower width
{const {b,p}=await S.open(url,{width:940,height:800});await boot(p,false);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:940,height:y+6});await b.close()}
})();
