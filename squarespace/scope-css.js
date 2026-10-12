/* Scope a stylesheet under a wrapper id for safe injection into Squarespace.
 * Usage: node scope-css.js <input.css> <#wrapper>
 * - prefixes every selector with the wrapper
 * - :root / html / body  -> the wrapper itself
 * - "html.js X"          -> "html.js <wrapper> X" (the .js class stays on <html>)
 * - @keyframes passthrough; @media recurse
 * Prints the scoped CSS to stdout.
 */
const fs = require("fs");
const input = fs.readFileSync(process.argv[2], "utf8");
const W = process.argv[3] || "#lb-site";

function stripComments(s){ return s.replace(/\/\*[\s\S]*?\*\//g, ""); }

function prefixSelector(sel){
  return sel.split(",").map(function(part){
    var s = part.trim();
    if(!s) return s;
    // keyframe stops like 0%, from, to, 50%
    if(/^(from|to|\d+%)$/.test(s)) return s;
    // leading html.js  -> keep html.js, scope the rest
    var m = s.match(/^html\.js\b\s*(.*)$/);
    if(m){ return m[1] ? ("html.js " + W + " " + m[1]) : ("html.js " + W); }
    if(/^html\b/.test(s)) return W + s.replace(/^html/, "");
    if(/^:root\b/.test(s)) return W + s.replace(/^:root/, "");
    if(/^body\b/.test(s)) return W + s.replace(/^body/, "");
    if(s === "*") return W + " *";
    if(/^\*/.test(s)) return W + " " + s;
    return W + " " + s;
  }).join(", ");
}

function scopeBlock(css){
  var out = "", i = 0, n = css.length;
  while(i < n){
    // find next rule: read selector until '{' or '}' or '@'
    // handle at-rules
    var atMatch = css.slice(i).match(/^\s*@([a-zA-Z-]+)([^{;]*)([{;])/);
    if(atMatch){
      var name = atMatch[1], params = atMatch[2], open = atMatch[3];
      if(open === ";"){ out += "@" + name + params + ";\n"; i += atMatch[0].length; continue; }
      // block at-rule
      var bodyStart = i + atMatch[0].length;
      var depth = 1, j = bodyStart;
      while(j < n && depth > 0){ if(css[j]==="{")depth++; else if(css[j]==="}")depth--; j++; }
      var inner = css.slice(bodyStart, j-1);
      if(/^keyframes$/i.test(name) || /^-webkit-keyframes$/i.test(name) || /^font-face$/i.test(name)){
        out += "@" + name + params + "{" + inner + "}\n"; // passthrough
      } else if(/^media$/i.test(name) || /^supports$/i.test(name)){
        out += "@" + name + params + "{\n" + scopeBlock(inner) + "}\n";
      } else {
        out += "@" + name + params + "{" + inner + "}\n";
      }
      i = j; continue;
    }
    var brace = css.indexOf("{", i);
    if(brace === -1){ break; }
    var sel = css.slice(i, brace).trim();
    var k = brace + 1, d = 1;
    while(k < n && d > 0){ if(css[k]==="{")d++; else if(css[k]==="}")d--; k++; }
    var decl = css.slice(brace+1, k-1).trim();
    if(sel) out += prefixSelector(sel) + "{" + decl + "}\n";
    i = k;
  }
  return out;
}

process.stdout.write(scopeBlock(stripComments(input)));
