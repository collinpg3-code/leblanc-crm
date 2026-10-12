/* Build Squarespace paste files for a page.
 * Usage: node build-sqsp.js <page.html> <scoped.css> <outPrefix>
 * Produces <outPrefix>-head.html (Page Header Code Injection) and
 *          <outPrefix>-body.html (Code Block content, wrapped in #lb-site).
 */
const fs = require("fs");
const page = fs.readFileSync(process.argv[2], "utf8");
const css = fs.readFileSync(process.argv[3], "utf8");
const out = process.argv[4];

// extract <body> inner
var body = page.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].trim();
// point showcase demo links at the Squarespace page slugs
body = body.replace(/showcase\/clean\.html/g, "/clean-demo")
           .replace(/showcase\/premium\.html/g, "/premium-demo")
           .replace(/assets\/hero\.mp4/g, "assets/hero.mp4"); // home has no video; no-op

var chromeHide = [
"/* --- fit a full custom page into Squarespace (this page only) --- */",
"#header,#footer-sections,.sqs-announcement-bar-dropzone,.header-announcement-bar-wrapper{display:none!important;}",
"#sections>.page-section,#sections>.page-section .content-wrapper{padding:0!important;margin:0!important;}",
".page-section .content-wrapper{max-width:none!important;width:100%!important;}",
".fluid-engine{padding:0!important;}",
".fluid-engine .fe-block{grid-column:1/-1!important;}",
".sqs-block.code-block,.sqs-block.code-block .sqs-block-content{padding:0!important;margin:0!important;}",
".preFade,.preFade *{opacity:1!important;}",
"html,body{margin:0!important;}"
].join("\n");

var head = [
'<link rel="preconnect" href="https://fonts.googleapis.com">',
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
'<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap&family=Playfair+Display:wght@500;600&family=Inter:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500" rel="stylesheet">',
'<script>document.documentElement.classList.add("js");</script>',
"<style>",
chromeHide,
css.trim(),
"</style>"
].join("\n");

var codeblock = '<div id="lb-site">\n' + body + '\n</div>';

fs.writeFileSync(out + "-head.html", head);
fs.writeFileSync(out + "-body.html", codeblock);
console.log("wrote", out + "-head.html", "(" + head.length + "b)");
console.log("wrote", out + "-body.html", "(" + codeblock.length + "b)");
