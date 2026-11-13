// Annotated screenshots for z80-bench/docs. Run: node z80-bench.js && python3 compress.py ../../z80-bench/docs/img
const S=require('./shot.js');const root=require('path').resolve(__dirname,'../..');const out=root+'/z80-bench/docs/img/';require('fs').mkdirSync(out,{recursive:true});
(async()=>{const {b,p}=await S.open('file://'+root+'/z80-bench/app/index.html',{width:1440,height:1000});
const chk=m=>{if(m.length)console.log('MISSING',m)};
// state: run some instructions, set breakpoints and stops
for(let i=0;i<14;i++)await p.click('#btnStep');
await p.click('#dis .dis-row[data-a="14"]');           // break at 000E
await p.click('#dis .dis-row[data-a="16"]');await p.click('#dis .dis-row[data-a="16"]'); // break after 0010
await p.fill('#dbgAddr','0012');await p.click('#dbgAdd');
await p.click('#btnStep');await p.waitForTimeout(300);
// 1 overview
chk(await S.mark(p,[['#btnReset',1,'tl',0,-2],['panel:pinout',2],['panel:program',3],['panel:i/o',4],['panel:disassembly',5],['panel:memory',6],['#pBitmap',7],['#pRegs',8],['#pDebug',9],['#pTiming',10],['#pSystem',11]]));
await S.snap(p,out+'overview.png',{x:0,y:0,width:1440,height:await p.evaluate(()=>document.documentElement.scrollHeight)});
// 3 pinout
chk(await S.mark(p,[['text:#chip text|CLK',1,'l',-14,0],['text:#chip text|INT',2,'l',-14,0],['text:#chip text|RESET',3,'r',14,0],['text:#chip text|D4',4,'l',-14,0],['#brCycle',5,'l',-125,0]]));
await S.snap(p,out+'pinout.png',await S.clip(p,['panel:pinout']));
// 4 program
chk(await S.mark(p,[['#modeAsm',1,'l',-14,0],['#asmIn',2,'tr',-16,16],['#loadAddr',3,'t',0,-2],['#clearFirst',4,'r',150,0],['#btnLoad',5,'b',0,4],['#btnImport',6,'b',0,4],['#btnToHex',7,'r',14,0],['#loadMsg',8,'r',-10,0]]));
await S.snap(p,out+'program.png',await S.clip(p,['panel:program']));
// 5 disassembly
chk(await S.mark(p,[['#dis .dis-row.pc, #dis .dis-row.exec',1,'r',6,0],['#dis .dis-row.isbp',2,'l',10,0],['#dis .dis-row.isbpa',3,'l',10,0]]));
await S.snap(p,out+'disassembly.png',await S.clip(p,['panel:disassembly']));
// 6 memory + bitmap
chk(await S.mark(p,[['#memFrom',1,'t',0,-12],['#memPC',2,'t',20,-12],['#memFollow',3,'l',-4,0],['#memView',4,'tr',4,-2],['#memDumpBin',5,'r',14,0]]));
await S.snap(p,out+'memory.png',await S.clip(p,['panel:memory']));
chk(await S.mark(p,[['#bmpBands',1,'tl',60,40],['#bmpRead',2,'l',-2,0]]));
const c=await S.clip(p,['#pBitmap']);c.height=Math.min(c.height,420);await S.snap(p,out+'bitmap.png',c);
// 7 registers with stop popup
await p.locator('#regs .stopbtn').nth(1).click();await p.waitForTimeout(200);
chk(await S.mark(p,[['#reg_3',1,'r',6,0],['#reg_1',2,'t',6,-38],['#flag_0',3,'r',14,0],['#imSel',4,'r',14,0],['#cpuState',5,'r',16,0],['#pRegs .fold',6,'l',-14,0]]));
{const c=await S.clip(p,['#pRegs']);c.x-=150;c.width+=150;await S.snap(p,out+'registers.png',c);}
await p.keyboard.press('Escape');await p.click('#pRegs h2');
// 8 debug
chk(await S.mark(p,[['#dbgType',1,'tl',0,0],['#dbgAdd',2,'r',14,0],['#dbgList',3,'tl',-6,16]]));
await S.snap(p,out+'debug.png',await S.clip(p,['#pDebug']));
// 9 timing
chk(await S.mark(p,[['#tnow',1,'tr',-6,6],['#timing',2,'tl',6,30]]));
await S.snap(p,out+'timing.png',await S.clip(p,['#pTiming']));
// 10 system + io
chk(await S.mark(p,[['#memSize',1,'l',-12,0],['#unmapped',2,'l',-12,0],['#intVec',3,'l',-12,0],['#inDefault',4,'l',-12,0],['#btnPort',5,'r',14,0]]));
await S.snap(p,out+'system.png',await S.clip(p,['#pSystem']));
chk(await S.mark(p,[['#latches',1,'tr',-6,9],['#iolog',2,'tr',-6,14]]));
await S.snap(p,out+'io.png',await S.clip(p,['panel:i/o']));
await b.close();
// toolbar, at a narrower width so it stays readable
{const {b,p}=await S.open('file://'+root+'/z80-bench/app/index.html',{width:880,height:800});
for(let i=0;i<14;i++)await p.click('#btnStep');await p.click('#dis .dis-row[data-a="14"]');await p.click('#btnRun');await p.waitForTimeout(400);
await S.mark(p,[['#btnReset',1,'b',0,6],['#btnMaster',2,'b',0,6],['#btnClock',3,'b',0,6],['#btnStep',4,'b',0,6],['#btnRun',5,'b',0,6],['#speed',6,'b',0,6],['#status',7,'r',16,0],['#cntT',8,'l',-75,0]]);
const y=await p.evaluate(()=>document.querySelector('section.panel').getBoundingClientRect().top+scrollY);
await S.snap(p,out+'toolbar.png',{x:0,y:0,width:880,height:y+6});await b.close()}
})();
