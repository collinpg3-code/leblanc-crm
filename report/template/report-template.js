/* LeBlanc Solutions — report template.
 * Turns a Penthera scan JSON into a branded, plain-English HTML report.
 * The "report division": all client-facing phrasing lives here.
 */
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const SEV_LABEL = { critical: "CRITICAL", high: "HIGH", medium: "MED", low: "LOW", info: "INFO" };

/* Plain-English knowledge base. Keyed by a test against the finding title.
 * Each entry: { plain, analogy, meaning, fix }. Add entries as new checks appear. */
const KB = [
  { match: /content-security-policy/i, sev: "medium", plain: "No shield against injected scripts",
    analogy: "Like leaving the upstairs windows unlocked — anything that climbs in can walk around freely.",
    meaning: "Your site doesn't tell the browser which scripts are allowed to run. A script slipped in through a plugin flaw or a third-party tag would execute on your pages — including your quote and contact forms.",
    fix: "Add a Content-Security-Policy. Roll it out in report-only mode first so nothing breaks, then switch it on." },
  { match: /x-frame-options|clickjack/i, sev: "low", plain: "Your pages can be framed by a fake site",
    analogy: "Like someone taping a photo of your storefront over your real front door.",
    meaning: "Without this setting, an attacker can load your site inside their own page and trick visitors into clicking things they can't see.",
    fix: "Send an X-Frame-Options (or CSP frame-ancestors) header so other sites can't embed yours." },
  { match: /strict-transport|hsts|https.*enforc/i, sev: "low", plain: "Secure connection isn't strictly enforced",
    analogy: "Like a good lock on a door that can still be nudged open on the very first push.",
    meaning: "The padlock works, but a visitor's first request can be downgraded to an unencrypted connection on shared Wi-Fi before the secure one kicks in.",
    fix: "Add a Strict-Transport-Security header so every visit is forced onto HTTPS." },
  { match: /referrer-policy/i, sev: "info", plain: "Visitor trails can leak to other sites",
    analogy: "Like handing a stranger a note of exactly where your customer just came from.",
    meaning: "Internal page addresses can be passed along to third-party sites as visitors click outbound links.",
    fix: "Set a Referrer-Policy header to limit what's shared." },
  { match: /permissions-policy/i, sev: "info", plain: "Browser features left switched on",
    analogy: "Like leaving every appliance plugged in and running when you only use one.",
    meaning: "Camera, location and other browser features aren't restricted, widening what a malicious script could try to reach.",
    fix: "Add a Permissions-Policy header that only allows the features you actually use." },
  { match: /wp-login|login page|admin/i, sev: "info", plain: "Your admin door opens onto the public street",
    analogy: "Like a shop's back-office door opening straight onto a busy sidewalk.",
    meaning: "Your WordPress login page is reachable by anyone on the internet, so automated bots can sit there trying password after password.",
    fix: "Add login rate-limiting and two-factor sign-in, and consider moving the login to a non-obvious address." },
  { match: /active params|parameter/i, sev: "info", plain: "A form endpoint worth double-checking",
    analogy: "Like a mail slot you should make sure only accepts letters, not anything shoved through it.",
    meaning: "This address accepts input (such as a name and an attachment). It's worth confirming it rejects anything unexpected and limits file uploads.",
    fix: "Validate and sanitise the inputs, and cap file type and size on any upload." },
  { match: /dmarc|spoof|subdomain policy/i, sev: "info", plain: "Look-alike email from your subdomains",
    analogy: "Like someone printing letterhead with your address on it and mailing it out.",
    meaning: "Your main domain is protected against spoofing, but mail sent from your subdomains isn't — so it can be forged in your name.",
    fix: "Tighten your DMARC record so subdomains are covered by the same quarantine policy." },
  { match: /robots\.txt/i, sev: "info", plain: "Standard search-engine file is public (normal)",
    analogy: "Like the sign on your door listing your opening hours — meant to be read.",
    meaning: "This file is supposed to be public. We note it only so your report is complete; no action needed.",
    fix: "No change required." },
];

function enrich(f) {
  const kb = KB.find((e) => e.match.test(f.title || ""));
  return {
    severity: (f.severity || "info").toLowerCase(),
    plain: kb ? kb.plain : (f.title || "Finding"),
    analogy: kb ? kb.analogy : "",
    meaning: kb ? kb.meaning : (f.description || ""),
    fix: kb ? kb.fix : "Review and remediate per the technical detail.",
    raw: f.title || "",
  };
}

function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* Build derived findings the raw list doesn't carry as its own entries. */
function derived(scan) {
  const out = [];
  const secHdrs = (scan.fingerprint && scan.fingerprint.security) || [];
  if (!secHdrs.map((s) => String(s).toLowerCase()).includes("strict-transport-security")) {
    out.push({ title: "HTTPS not strictly enforced (HSTS)", severity: "low" });
  }
  const dmarc = scan.emailAuth && scan.emailAuth.dmarc;
  if (dmarc && /sp=none/i.test(dmarc)) {
    out.push({ title: "DMARC subdomain policy is none", severity: "info" });
  }
  return out;
}

function strengths(scan) {
  const s = [];
  if (scan.tls && scan.tls.valid) {
    s.push(["Your connection is properly locked", `Valid ${esc(scan.tls.protocol || "TLS")} certificate from ${esc(scan.tls.issuer || "a trusted authority")}, renewing in ${esc(scan.tls.daysUntilExpiry)} days.`]);
  }
  const files = ((scan.endpoints && scan.endpoints.list) || []).filter((e) => e.status === 403);
  if (files.length) {
    s.push(["Secret files are sealed off", `Sensitive paths like .env, .git and service-account keys all correctly refuse access (${files.length} checked).`]);
  }
  const libs = scan.jsLibraries || [];
  const vulnCount = libs.reduce((n, l) => n + ((l.vulnerabilities || []).length), 0);
  if (libs.length && vulnCount === 0) {
    s.push(["No outdated parts with known holes", `Your site's JavaScript components (${libs.map((l) => esc(l.name)).join(", ")}) are current, with no known published flaws.`]);
  }
  if (scan.emailAuth && scan.emailAuth.spf) {
    s.push(["Basic email protection is on", "SPF and a DMARC policy are configured, which helps stop others sending email as you."]);
  }
  return s;
}

function renderReport(scan, meta, brand) {
  const b = brand;
  const C = b.colors, S = C.sev;
  const client = meta.client || (scan.target || "").replace(/^https?:\/\//, "");
  const domain = (scan.target || "").replace(/^https?:\/\//, "");
  const date = meta.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // findings: raw + derived, enriched, then merged by plain-English title so
  // several raw findings of the same kind become one card naming every endpoint.
  const enriched = [...(scan.findings || []), ...derived(scan)].map(enrich)
    .filter((f) => !/robots\.txt/i.test(f.raw)); // drop the "normal" noise
  const byPlain = new Map();
  for (const f of enriched) {
    if (!byPlain.has(f.plain)) byPlain.set(f.plain, { ...f, paths: [] });
    const g = byPlain.get(f.plain);
    const m = String(f.raw).match(/\/[^\s]+/);
    if (m && !g.paths.includes(m[0])) g.paths.push(m[0]);
  }
  const all = [...byPlain.values()].map((f) => {
    if (f.paths.length > 1) f.meaning = `${f.meaning} Affected: ${f.paths.join(", ")}.`;
    return f;
  }).sort((a, b2) => SEV_RANK[a.severity] - SEV_RANK[b2.severity]);

  const tally = all.reduce((m, f) => { m[f.severity] = (m[f.severity] || 0) + 1; return m; }, {});
  const tallyStr = ["critical","high","medium","low","info"]
    .filter((k) => tally[k]).map((k) => `${tally[k]} ${k === "medium" ? "medium" : k}`).join(" · ");

  const top3 = all.filter((f) => f.fix && f.fix !== "No change required.").slice(0, 3);
  const str = strengths(scan);

  const chip = (sev) => `<span class="chip" style="background:${S[sev] || S.info}">${SEV_LABEL[sev] || "INFO"}</span>`;

  const findingCard = (f, i) => `
    <div class="finding">
      <div class="finding-head">
        ${chip(f.severity)}
        <h3>${esc(f.plain)}</h3>
      </div>
      ${f.analogy ? `<p class="analogy">${esc(f.analogy)}</p>` : ""}
      <p class="meaning">${esc(f.meaning)}</p>
      <div class="fix"><span class="fix-label">The fix</span>${esc(f.fix)}</div>
    </div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${b.fonts.googleHref}" rel="stylesheet">
<style>
  :root{
    --ink:${C.ink};--navy:${C.navy};--slate:${C.slate};--teal:${C.teal};
    --canvas:${C.canvas};--panel:${C.panel};--line:${C.line};--white:${C.white};
    --serif:'${b.fonts.serif}',Georgia,serif;--sans:'${b.fonts.sans}',system-ui,sans-serif;
  }
  @page{size:Letter;margin:0;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:var(--sans);color:var(--ink);font-size:11pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{width:8.5in;min-height:11in;padding:0.85in 0.9in;background:var(--white);position:relative;page-break-after:always;}
  .page:last-child{page-break-after:auto;}
  h1,h2,h3{font-family:var(--serif);font-weight:500;color:var(--ink);line-height:1.15;}
  .eyebrow{font-family:var(--sans);font-size:8.5pt;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);font-weight:600;margin-bottom:.35in;}
  .wordmark .top{font-family:var(--serif);font-size:15pt;line-height:1;color:var(--ink);}
  .wordmark .bot{font-family:var(--sans);font-size:9pt;letter-spacing:.34em;color:var(--slate);font-weight:600;}
  /* cover */
  .cover{background:var(--canvas);}
  .cover .wordmark{margin-bottom:2.2in;}
  .cover h1{font-size:40pt;margin:.1in 0 .25in;}
  .cover .sub{font-size:13pt;color:var(--slate);max-width:5in;line-height:1.5;}
  .cover .rule{width:2.4in;height:2px;background:var(--teal);margin:.5in 0;}
  .cover .meta{font-size:10.5pt;color:var(--slate);}
  .cover .meta strong{color:var(--ink);}
  .cover .domain{font-family:var(--serif);font-size:18pt;color:var(--teal);margin:.05in 0 .35in;}
  .footer{position:absolute;bottom:.5in;left:.9in;right:.9in;display:flex;justify-content:space-between;font-size:8.5pt;color:var(--slate);border-top:1px solid var(--line);padding-top:.12in;}
  /* summary */
  .lead{font-family:var(--serif);font-size:20pt;line-height:1.25;margin:.1in 0 .3in;max-width:6in;}
  .tally{display:inline-block;background:var(--panel);border:1px solid var(--line);padding:.12in .22in;font-size:11pt;color:var(--ink);margin-bottom:.35in;}
  .tally b{color:var(--teal);}
  .cols{display:flex;gap:.4in;}
  .col{flex:1;}
  .strength{display:flex;gap:.14in;margin-bottom:.18in;}
  .strength .dot{flex:none;width:.26in;height:.26in;background:var(--teal);color:#fff;font-size:10pt;text-align:center;line-height:.26in;margin-top:.02in;}
  .strength h4{font-family:var(--sans);font-size:11pt;font-weight:600;margin-bottom:.02in;}
  .strength p{font-size:9.5pt;color:var(--slate);}
  .sec-title{font-size:22pt;margin-bottom:.08in;}
  .sec-intro{color:var(--slate);max-width:6in;margin-bottom:.3in;font-size:11pt;}
  /* findings */
  .finding{border:1px solid var(--line);border-left:4px solid var(--teal);padding:.2in .24in;margin-bottom:.2in;background:var(--white);break-inside:avoid;}
  .finding-head{display:flex;align-items:center;gap:.14in;margin-bottom:.08in;}
  .finding-head h3{font-size:14pt;}
  .chip{color:#fff;font-family:var(--sans);font-size:7.5pt;font-weight:700;letter-spacing:.08em;padding:.04in .1in;border-radius:2px;flex:none;}
  .analogy{font-family:var(--serif);font-style:italic;color:var(--teal);font-size:11pt;margin-bottom:.08in;}
  .meaning{font-size:10.5pt;color:var(--ink);margin-bottom:.12in;}
  .fix{font-size:10pt;background:var(--panel);border:1px solid var(--line);padding:.12in .16in;color:var(--ink);}
  .fix-label{display:block;font-family:var(--sans);font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);font-weight:700;margin-bottom:.04in;}
  .ranked{counter-reset:r;}
  .ranked .finding{counter-increment:r;}
  .ranked .finding-head h3::before{content:counter(r) ".  ";color:var(--slate);}
  .close h1{font-size:28pt;margin-bottom:.2in;}
  .close p{color:var(--slate);max-width:5.4in;margin-bottom:.14in;font-size:11pt;}
  .close .cta{margin-top:.35in;font-size:12pt;}
  .close .cta b{color:var(--teal);}
</style></head><body>

<section class="page cover">
  <div class="wordmark"><div class="top">${esc(b.wordmarkTop)}</div><div class="bot">${esc(b.wordmarkBottom)}</div></div>
  <div class="eyebrow">Website Security Report</div>
  <h1>${esc(client)}</h1>
  <div class="domain">${esc(domain)}</div>
  <p class="sub">A home inspection for your website — the common, fixable problems we found, in plain English, ranked by what matters.</p>
  <div class="rule"></div>
  <div class="meta"><strong>Prepared by</strong> ${esc(b.name)} &nbsp;·&nbsp; ${esc(date)}<br>Non-destructive external assessment &nbsp;·&nbsp; Authorised engagement</div>
  <div class="footer"><span>${esc(b.name)}</span><span>${esc(b.url)}</span></div>
</section>

<section class="page">
  <div class="eyebrow">The bottom line</div>
  <h2 class="lead">${tally.critical || tally.high ? "A few important fixes, and a solid foundation underneath." : "Good foundations. A handful of quick fixes will close the gaps."}</h2>
  <div class="tally">${tallyStr ? tallyStr.replace(/(\d+)/g, "<b>$1</b>") : "No issues found"} — each with its fix, in the order that matters.</div>
  <div class="cols">
    <div class="col">
      <div class="eyebrow" style="margin-bottom:.14in">What's working well</div>
      ${str.map((s) => `<div class="strength"><div class="dot">✓</div><div><h4>${s[0]}</h4><p>${s[1]}</p></div></div>`).join("")}
    </div>
    <div class="col">
      <div class="eyebrow" style="margin-bottom:.14in">Your top fixes</div>
      ${top3.map((f, i) => `<div class="strength"><div class="dot" style="background:${S[f.severity] || S.info}">${i + 1}</div><div><h4>${esc(f.plain)}</h4><p>${esc(f.fix)}</p></div></div>`).join("")}
    </div>
  </div>
  <div class="footer"><span>${esc(b.name)}</span><span>${esc(b.url)}</span></div>
</section>

<section class="page">
  <div class="eyebrow">What we found</div>
  <h2 class="sec-title">The full list, ranked</h2>
  <p class="sec-intro">Most break-ins rely on the same handful of mistakes. Here's what we found on your site, worst first, each with what it means and how to close it.</p>
  <div class="ranked">
    ${all.map(findingCard).join("")}
  </div>
  <div class="footer"><span>${esc(b.name)}</span><span>${esc(b.url)}</span></div>
</section>

<section class="page close" style="background:var(--canvas)">
  <div class="wordmark" style="margin-bottom:1.6in"><div class="top">${esc(b.wordmarkTop)}</div><div class="bot">${esc(b.wordmarkBottom)}</div></div>
  <div class="eyebrow">What happens next</div>
  <h1>You fix, we re-check</h1>
  <p>Work down the ranked list. When you're done, tell us and we scan again to confirm each item is actually closed — so you can see the before and after.</p>
  <p>Prefer we handle it? We also implement the fixes for you, and can redesign the site to be secure from the ground up.</p>
  <div class="cta">Get in touch &nbsp;·&nbsp; <b>${esc(b.contact)}</b></div>
  <p style="margin-top:.5in;font-size:8.5pt;">This report finds common, fixable problems so you can close them before someone else finds them. It is not a guarantee against every possible attack, a full manual penetration test, or a compliance certificate. We test only sites you own or are authorised to test.</p>
  <div class="footer"><span>${esc(b.name)}</span><span>© ${new Date().getFullYear()} ${esc(b.name)}</span></div>
</section>

</body></html>`;
}

module.exports = { renderReport };
