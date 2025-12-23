Param()
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dirs = @(
    "frontend",
    "frontend\public",
    "frontend\src",
    "frontend\src\components",
    "frontend\src\components\cards",
    "frontend\src\components\layout",
    "frontend\src\components\providers",
    "frontend\src\components\wallet",
    "frontend\src\data",
    "frontend\src\pages",
    "frontend\src\styles",
    "frontend\src\types",
    "frontend\src\utils",
    "smart-contracts",
    "smart-contracts\solana",
    "smart-contracts\aptos",
    "smart-contracts\algorand"
)
foreach ($d in $dirs) {
    $p = Join-Path $root $d
    New-Item -ItemType Directory -Path $p -Force | Out-Null
}
Write-Output "Directories ensured."