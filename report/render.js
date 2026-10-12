/* LeBlanc Solutions — report renderer.
 * Usage: node report/render.js <scan.json> [clientName] [outDir]
 * Produces <outDir>/<slug>-report.html and .pdf in the LeBlanc brand.
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { renderReport } = require("./template/report-template.js");

async function main() {
  const scanPath = process.argv[2];
  const clientName = process.argv[3] || null;
  const outDir = process.argv[4] || path.resolve(__dirname, "..", "reports");
  if (!scanPath) { console.error("Usage: node report/render.js <scan.json> [clientName] [outDir]"); process.exit(1); }

  const scan = JSON.parse(fs.readFileSync(path.resolve(scanPath), "utf-8"));
  const brand = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "brand", "brand.json"), "utf-8"));
  const domain = (scan.target || "site").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const slug = domain.replace(/[^a-z0-9.-]/gi, "_");

  const html = renderReport(scan, { client: clientName || domain }, brand);
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, `${slug}-report.html`);
  const pdfPath = path.join(outDir, `${slug}-report.pdf`);
  fs.writeFileSync(htmlPath, html);

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.pdf({ path: pdfPath, format: "Letter", printBackground: true, preferCSSPageSize: true });
  await browser.close();

  console.log("HTML:", htmlPath);
  console.log("PDF :", pdfPath);
}
main().catch((e) => { console.error(e); process.exit(1); });
