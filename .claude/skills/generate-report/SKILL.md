---
name: generate-report
description: Turn a Penthera scan JSON into a clean, plain-English, LeBlanc-branded PDF report. Use when a scan JSON exists and the user wants the client deliverable.
---

# generate-report

## Build
```powershell
cd C:\tools\leblanc-solutions
node report/render.js "<path-to-scan.json>" "<Client Name>"
```
Writes `reports/<domain>-report.html` and `reports/<domain>-report.pdf`.
Brand = `brand/brand.json`; phrasing = `report/template/report-template.js`.

## QA (required before sending)
```powershell
node qa-shot.js   # screenshots each page to reports/_qa_*.png
```
Read the PNGs. Check: no overflow/overlap/cut-off text, findings correct and ranked,
brand colors/fonts right. Fix in the template or brand file, then regenerate — never
hand-edit the HTML/PDF output.

## Add a new finding type
Append to the `KB` array in `report/template/report-template.js`:
`{ match: /regex-on-title/i, sev, plain, analogy, meaning, fix }` — analogy in the
home-inspection voice.

## Deliver
Send the PDF to the user. Note any `[...]` blanks they must fill (company, contact, pricing).
