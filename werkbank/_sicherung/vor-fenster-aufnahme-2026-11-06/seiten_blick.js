// Ganze Seiten als Folge von Bildschirmen (so wie ein Gast sie beim Scrollen sieht), danach zusammengesetzt (seiten.py).
const path=require('path'), fs=require('fs');
const PW=require(path.join(process.env.HOME,'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const OUT=process.argv[2]; fs.mkdirSync(OUT,{recursive:true});
const B='http://localhost:8978/haus/Angelina%20Strelow/website/';
const SEITEN=['index','leistungen','ueber-mich','stimmen'];
(async()=>{
 const b=await PW.chromium.launch({headless:true});
 for(const [n,opt] of [['r',{viewport:{width:1440,height:932},reducedMotion:'reduce'}],['h',{viewport:{width:390,height:841},deviceScaleFactor:1.5,isMobile:true,hasTouch:true,reducedMotion:'reduce'}]]){
  const p=await (await b.newContext(opt)).newPage(); const vh=opt.viewport.height;
  for(const s of SEITEN){ await p.goto(B+s+'.html',{waitUntil:'load'}); await p.waitForTimeout(2600);
   const H=await p.evaluate(()=>document.documentElement.scrollHeight);
   for(let y=0;y<H;y+=400){await p.evaluate(v=>scrollTo(0,v),y); await p.waitForTimeout(60);}
   const st=await p.evaluate(()=>[...document.querySelectorAll('main > *')].map(e=>Math.round(e.getBoundingClientRect().top+scrollY)));
   const teile=[]; let k=0;
   for(let y=0;y<H;y+=vh,k++){ const yy=Math.min(y,H-vh); await p.evaluate(v=>scrollTo(0,v),yy); await p.waitForTimeout(k===0?900:650);
     if(k===0) await p.evaluate(()=>scrollTo(0,0));
     const f=path.join(OUT,`${s}-${n}-${String(k).padStart(2,'0')}.png`); await p.screenshot({path:f}); teile.push({f,y,yy}); }
   fs.writeFileSync(path.join(OUT,`${s}-${n}.json`),JSON.stringify({H,vh,st,teile}));
   console.log(s,n,H,teile.length);
  }
  await p.context().close();
 }
 await b.close();
})();
