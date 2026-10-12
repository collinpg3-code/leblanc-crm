<#
.SYNOPSIS  Fetch a brand DESIGN.md reference from VoltAgent/awesome-design-md.
.DESCRIPTION
    Downloads design-md/<brand>/DESIGN.md (and its preview HTML) into
    design-refs/<brand>/ so the Fix & Build division can build UI that follows a
    proven, high-quality design system. Pure reference material (markdown/HTML) —
    nothing is executed.
.EXAMPLE  .\get-design-ref.ps1 ferrari
.EXAMPLE  .\get-design-ref.ps1 -List
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)] [string]$Brand,
    [switch]$List
)
$ErrorActionPreference = "Stop"
$repo = "VoltAgent/awesome-design-md"
$root = Split-Path $PSScriptRoot -Parent
$ua = @{ "User-Agent" = "leblanc-solutions" }

if ($List -or -not $Brand) {
    $t = Invoke-RestMethod "https://api.github.com/repos/$repo/git/trees/main?recursive=1" -Headers $ua
    $brands = $t.tree | Where-Object { $_.path -match '^design-md/[^/]+/DESIGN\.md$' } |
        ForEach-Object { ($_.path -split '/')[1] } | Sort-Object -Unique
    Write-Host "Available brand design references ($($brands.Count)):" -ForegroundColor Cyan
    $brands -join ", "
    if (-not $Brand) { return }
}

$outDir = Join-Path $root "design-refs\$Brand"
New-Item -ItemType Directory -Force $outDir | Out-Null
$base = "https://raw.githubusercontent.com/$repo/main/design-md/$Brand"
foreach ($f in @("DESIGN.md", "preview.html", "preview-dark.html")) {
    try {
        Invoke-WebRequest "$base/$f" -Headers $ua -OutFile (Join-Path $outDir $f)
        Write-Host "  saved $Brand/$f" -ForegroundColor Green
    } catch { Write-Host "  (no $f)" -ForegroundColor DarkGray }
}
Write-Host "Reference ready: design-refs\$Brand\DESIGN.md" -ForegroundColor Cyan
