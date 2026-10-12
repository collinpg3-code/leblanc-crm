/* Render social share image (og-image.png 1200x630) + apple-touch-icon.png (180x180). */
const puppeteer = require("puppeteer");
const path = require("path");
const OUT = path.resolve(__dirname, "..", "site");

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap" rel="stylesheet">`;

const shield = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 4h24v13c0 6.2-4.6 10.3-12 13C8.6 27.3 4 23.2 4 17Z" fill="#16605E"/>
  <path d="M4 9.5h24" stroke="#fff" stroke-width="1.5" opacity=".5"/>
  <circle cx="7.6" cy="6.8" r="1" fill="#fff" opacity=".6"/><circle cx="11" cy="6.8" r="1" fill="#fff" opacity=".6"/>
  <path d="m10.5 16.6 4 4.2 8-8.4" fill="none" stroke="#fff" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ogHtml = `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{background:#15232E;color:#fff;font-family:'Archivo',sans-serif;display:flex;flex-direction:column;justify-content:center;padding:90px;position:relative;overflow:hidden}
.cubes{position:absolute;right:70px;top:70px;display:flex;gap:14px;opacity:.5}
.cubes i{width:26px;height:26px;background:#1FC3D1;transform:rotate(45deg);display:block}
.cubes i:nth-child(2){opacity:.6}.cubes i:nth-child(3){opacity:.35}
.brand{display:flex;align-items:center;gap:18px;margin-bottom:46px}
.brand svg{width:64px;height:64px}
.brand .t{font-family:'Newsreader',serif;font-size:40px;line-height:1}
.brand .b{font-size:17px;letter-spacing:.34em;color:#9FB0BB;font-weight:600}
h1{font-family:'Newsreader',serif;font-weight:500;font-size:74px;line-height:1.05;max-width:16ch;letter-spacing:-.01em}
.sub{margin-top:30px;font-size:26px;color:#C7D0DC;max-width:30ch;line-height:1.4}
.url{position:absolute;left:90px;bottom:70px;font-size:22px;color:#1FC3D1;font-weight:600;letter-spacing:.02em}
.rule{position:absolute;left:90px;bottom:120px;width:120px;height:3px;background:#1FC3D1}
</style></head><body>
<div class="cubes"><i></i><i></i><i></i></div>
<div class="brand">${shield}<div><div class="t">LeBlanc</div><div class="b">SOLUTIONS</div></div></div>
<h1>A home inspection for your website.</h1>
<div class="sub">Security checks, fixes &amp; secure redesign for small businesses.</div>
<div class="rule"></div>
<div class="url">leblancsols.com</div>
</body></html>`;

const touchHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0}html,body{width:180px;height:180px}
body{background:#15232E;display:flex;align-items:center;justify-content:center}
svg{width:130px;height:130px}
</style></head><body>${shield}</body></html>`;

(async () => {
  const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  // OG image
  let p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await p.setContent(ogHtml, { waitUntil: "networkidle0" });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: path.join(OUT, "og-image.png") });
  await p.close();
  // apple touch icon
  p = await b.newPage();
  await p.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
  await p.setContent(touchHtml, { waitUntil: "networkidle0" });
  await p.screenshot({ path: path.join(OUT, "apple-touch-icon.png") });
  await p.close();
  await b.close();
  console.log("wrote og-image.png + apple-touch-icon.png");
})().catch(e => { console.error(e); process.exit(1); });
