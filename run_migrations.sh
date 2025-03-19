#!/bin/bash
# Simple wrapper to run the migrations from root
# Just calls the actual migration script in the supabase directory

echo "Running EZpass database migrations..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/supabase/run_migrations.sh"

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "\e[31mMigrations failed with exit code $EXIT_CODE\e[0m"
    exit $EXIT_CODE
fi

echo -e "\e[32mMigrations completed successfully!\e[0m" 