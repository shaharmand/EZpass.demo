# PowerShell Script to run SQL migrations for the EZpass database
# This script runs all SQL migrations in the migrations directory in order

# Environment variables
$SUPABASE_HOST = "db.pdqelugqwgdxhbhmdjws.supabase.co"

# If credentials are in .env file, load them
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#")) {
            $key, $value = $line.Split("=", 2)
            $env:$key = $value
        }
    }
}

# Check if service role key is set
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Error: SUPABASE_SERVICE_ROLE_KEY not set. Please set it in .env file or as an environment variable."
    exit 1
}

# Create a function to run SQL files
function Run-SqlFile {
    param (
        [string]$FilePath,
        [string]$Description = "Running SQL file"
    )
    
    Write-Host "---------------------------------------------"
    Write-Host "$Description: $FilePath"
    Write-Host "---------------------------------------------"
    
    # Execute the SQL file
    psql "postgres://postgres:$($env:SUPABASE_SERVICE_ROLE_KEY)@$SUPABASE_HOST`:5432/postgres" -f $FilePath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error executing $FilePath"
        exit $LASTEXITCODE
    }
    
    Write-Host "Completed successfully!"
    Write-Host ""
}

# Run all migrations in the standard migrations directory
$migrationFiles = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | 
                  Where-Object { -not $_.PSIsContainer } | 
                  Sort-Object Name

foreach ($file in $migrationFiles) {
    Run-SqlFile -FilePath $file.FullName -Description "Running migration"
}

# Run all standalone migrations in order
$standaloneMigrationFiles = Get-ChildItem -Path "supabase/migrations/standalone" -Filter "*.sql" | 
                           Where-Object { -not $_.PSIsContainer } | 
                           Sort-Object Name

foreach ($file in $standaloneMigrationFiles) {
    Run-SqlFile -FilePath $file.FullName -Description "Running standalone migration"
}

Write-Host "All migrations completed successfully!" 