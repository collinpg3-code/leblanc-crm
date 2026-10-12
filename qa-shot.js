const puppeteer=require("puppeteer");const fs=require("fs");const path=require("path");
(async()=>{
 const html=fs.readFileSync("reports/m22detailing.com-report.html","utf-8");
 const b=await puppeteer.launch({headless:"new",args:["--no-sandbox"]});
 const p=await b.newPage();await p.setViewport({width:816,height:1056,deviceScaleFactor:1});
 await p.setContent(html,{waitUntil:"networkidle0"});await p.evaluate(()=>document.fonts&&document.fonts.ready);
 const pages=await p.$$(".page");
 for(let i=0;i<pages.length;i++){await pages[i].screenshot({path:`reports/_qa_${i+1}.png`});}
 await b.close();console.log("shots:",pages.length);
})().catch(e=>{console.error(e);process.exit(1);});
