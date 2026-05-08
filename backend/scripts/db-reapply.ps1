# scripts/db-reapply.ps1
# Reapply functions and views without resetting the database
# Usage: powershell -ExecutionPolicy Bypass -File scripts/db-reapply.ps1
param(
    [string]$Host = "localhost",
    [string]$Port = "5432",
    [string]$User = "p1002_scmgrinder",
    [string]$Db = "p1002_scmgrinder"
)

Write-Host "`nReapplying functions and views..." -ForegroundColor Cyan

Write-Host "`nFunctions:" -ForegroundColor Yellow
Get-ChildItem -Path "init/03-functions/*.sql" | ForEach-Object {
    Write-Host "  -> $($_.Name)" -ForegroundColor Gray
    & psql -h $Host -p $Port -U $User -d $Db -f $_.FullName
    if ($LASTEXITCODE -ne 0) { Write-Host "  FAILED!" -ForegroundColor Red; exit 1 }
}

Write-Host "`nViews:" -ForegroundColor Yellow
Get-ChildItem -Path "init/04-views/*.sql" | ForEach-Object {
    Write-Host "  -> $($_.Name)" -ForegroundColor Gray
    & psql -h $Host -p $Port -U $User -d $Db -f $_.FullName
    if ($LASTEXITCODE -ne 0) { Write-Host "  FAILED!" -ForegroundColor Red; exit 1 }
}

Write-Host "`nRefreshing materialized views..." -ForegroundColor Yellow
& psql -h $Host -p $Port -U $User -d $Db -c "REFRESH MATERIALIZED VIEW item_search;"

Write-Host "`nDone!" -ForegroundColor Green
