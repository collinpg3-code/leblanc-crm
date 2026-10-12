const puppeteer=require("puppeteer");const path=require("path");
const base="file:///C:/tools/leblanc-solutions/site/";
const shots=[
  ["index.html",1280,"home-desktop",true],
  ["index.html",390,"home-mobile",true],
  ["showcase/clean.html",1280,"clean",true],
  ["showcase/premium.html",1280,"premium",true],
];
(async()=>{
  const b=await puppeteer.launch({headless:"new",args:["--no-sandbox"]});
  for(const [f,w,name,full] of shots){
    const p=await b.newPage();
    await p.setViewport({width:w,height:900,deviceScaleFactor:1});
    await p.goto(base+f,{waitUntil:"networkidle0"});
    await p.evaluate(()=>document.fonts&&document.fonts.ready);
    await new Promise(r=>setTimeout(r,400));
    await p.screenshot({path:`site/_qa_${name}.png`,fullPage:full});
    await p.close();
    console.log("shot",name);
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
