# Simple wrapper to run the migrations from root
# Just calls the actual migration script in the supabase directory

Write-Host "Running EZpass database migrations..."
$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "supabase\run_migrations.ps1"
& $scriptPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Migrations failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Migrations completed successfully!" -ForegroundColor Green 