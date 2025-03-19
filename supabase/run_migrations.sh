#!/bin/bash
# Bash Script to run SQL migrations for the EZpass database
# This script runs all SQL migrations in the migrations directory in order

# Environment variables
SUPABASE_HOST="db.pdqelugqwgdxhbhmdjws.supabase.co"

# If credentials are in .env file, load them
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if service role key is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_SERVICE_ROLE_KEY not set. Please set it in .env file or as an environment variable."
    exit 1
fi

# Create a function to run SQL files
run_sql_file() {
    file_path=$1
    description=${2:-"Running SQL file"}
    
    echo "---------------------------------------------"
    echo "$description: $file_path"
    echo "---------------------------------------------"
    
    # Execute the SQL file
    psql "postgres://postgres:$SUPABASE_SERVICE_ROLE_KEY@$SUPABASE_HOST:5432/postgres" -f "$file_path"
    
    if [ $? -ne 0 ]; then
        echo "Error executing $file_path"
        exit 1
    fi
    
    echo "Completed successfully!"
    echo ""
}

# Run all migrations in the standard migrations directory
for file in $(find supabase/migrations -maxdepth 1 -name "*.sql" | sort); do
    run_sql_file "$file" "Running migration"
done

# Run all standalone migrations in order
for file in $(find supabase/migrations/standalone -name "*.sql" | sort); do
    run_sql_file "$file" "Running standalone migration"
done

echo "All migrations completed successfully!" 