# Database Migration System

This directory contains all database migrations for the EZpass application.

## Structure

The migrations directory is organized as follows:

- `migrations/*.sql` - Core migrations that are applied in order by filename (prefixed with date)
- `migrations/standalone/*.sql` - Standalone migrations that can be applied individually

## Migration Naming Convention

All migration files follow this naming pattern:

```
YYYYMMDD_description_of_migration.sql
```

For example:
- `20240319_create_exams_tables.sql`
- `20240320_add_question_submissions_table.sql`

## Running Migrations

### Using the Migration Scripts

Two scripts are provided to run all migrations in the correct order:

- `supabase/run_migrations.ps1` - For Windows environments (PowerShell)
- `supabase/run_migrations.sh` - For Unix/Linux environments (Bash)

To run all migrations:

```bash
# Unix/Linux
cd /path/to/project
bash supabase/run_migrations.sh

# Windows
cd \path\to\project
powershell -File supabase\run_migrations.ps1
```

### Running Individual Migrations

Individual migrations can be run directly using psql:

```bash
export SUPABASE_HOST="db.pdqelugqwgdxhbhmdjws.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

psql "postgres://postgres:$SUPABASE_SERVICE_ROLE_KEY@$SUPABASE_HOST:5432/postgres" -f path/to/migration.sql
```

## Adding New Migrations

1. Create a new SQL file with the naming convention `YYYYMMDD_description.sql`
2. Place it in the appropriate directory:
   - If it's a core database change: `migrations/`
   - If it's a standalone migration (data import, etc.): `migrations/standalone/`
3. Add appropriate comments at the top of the file to describe the migration
4. Test your migration locally before committing

## Schema Updates

After running migrations, the updated schema is automatically reflected in:

- `supabase/updated_schema.sql` - The complete database schema

## Best Practices

- Always start your migration file with a comment explaining what it does
- Include both "up" (apply) and "down" (rollback) operations when possible
- Use explicit transactions for safety
- Test migrations in development before applying to production
- Add constraints and indexes as needed for performance
- Document any manual steps that might be required

## Data Migration Notes

Data migrations should be idempotent when possible, meaning they can be run multiple times without causing issues. This can be achieved using techniques like:

- Using IF NOT EXISTS clauses
- Checking if data already exists before inserting
- Using ON CONFLICT clauses for UPSERT operations 