param(
    [string]$InputFile = "C:\Users\Adam\Downloads\scvmrack-20260603T031502Z.sql",
    [string]$OutputFile = "C:\Users\Adam\Downloads\scvmrack-user-data.sql"
)

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 1
}

$capture = $false
$result = @(
    "SET client_encoding = 'UTF8';",
    "SET standard_conforming_strings = on;",
    ""
)

$lines = Get-Content $InputFile
foreach ($line in $lines) {
    if ($line -match '^COPY public\.(account|characters|"user") ') {
        $capture = $true
    }
    if ($capture) {
        $result += $line
    }
    if ($capture -and $line -eq '\.') {
        $capture = $false
        $result += ""
    }
}

$result | Set-Content $OutputFile -Encoding UTF8

$userCount     = ($result | Where-Object { $_ -match '^COPY public\."user"' } | Measure-Object).Count
$accountCount  = ($result | Where-Object { $_ -match '^COPY public\.account' } | Measure-Object).Count
$charCount     = ($result | Where-Object { $_ -match '^COPY public\.characters' } | Measure-Object).Count

Write-Host "Done. Written to: $OutputFile"
Write-Host "Blocks captured: user=$userCount  account=$accountCount  characters=$charCount"
Write-Host "Total lines: $($result.Count)"
