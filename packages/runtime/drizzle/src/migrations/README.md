# Database Migrations

**WARNING: DO NOT MANUALLY DELETE OR MODIFY MIGRATION FILES**

## Important Rules

1. **NEVER delete migration files manually** - Even when regenerating migrations, the existing files must remain
2. **NEVER edit migration files after they're generated** - Drizzle tracks them in `meta/_journal.json`
3. **NEVER reorder or rename migration files** - The sequence must remain intact
4. **NEVER commit migrations without their corresponding `meta/` snapshots**

## Why This Matters

- Deleting a migration breaks the migration history for anyone who has already applied it
- The `meta/` folder tracks all migrations - deleting files creates inconsistencies
- Other developers or environments may have already run migrations you delete
- Production databases depend on the complete migration sequence

## How to Generate New Migrations

### Standard Migration (Use This 99% of the Time)

```bash
# Generate a new migration based on schema changes
pnpm nx run @signa/runtime-drizzle:db:generate

# This will create:
# - A new numbered SQL file (e.g., 0007_xxx.sql)
# - A new snapshot in meta/ (e.g., 0007_snapshot.json)
# - Update meta/_journal.json with the new entry
```

### Custom Migration (Only for Special Cases)

```bash
# Use this ONLY when Drizzle can't auto-generate (PostgreSQL extensions, custom SQL, etc.)
pnpm nx run @signa/runtime-drizzle:db:generate-custom

# Then manually write your SQL in the generated empty migration file
# Examples: CREATE EXTENSION, custom functions, triggers, etc.
```

**When to use `db:generate-custom`:**

- Adding PostgreSQL extensions (`CREATE EXTENSION`)
- Creating custom database functions
- Adding triggers or rules
- Any SQL that Drizzle doesn't support in schemas

**When to use `db:generate` (normal):**

- Adding/removing tables
- Adding/removing columns
- Changing column types
- Adding indexes, constraints, foreign keys
- Creating enums
- 99% of all schema changes

## Migration Workflow

1. **Modify schema** in `src/schemas/*.schema.ts`
2. **Generate migration**: Run the generate command above
3. **Review the SQL** in the new migration file
4. **Test locally** before committing
5. **Commit both** the `.sql` file AND the `meta/` updates together
6. **Apply to database**: `pnpm nx run @signa/runtime-drizzle:db:migrate`

## If You Accidentally Delete a Migration

1. Check git history: `git log -- src/migrations/`
2. Restore the file: `git checkout HEAD~n -- src/migrations/XXXX_name.sql`
3. Verify `meta/_journal.json` still references it
4. Do NOT regenerate - restore the original file

## Current Migration Status

Last migration: Check `meta/_journal.json` for the latest entry.

---

**Remember:** Migrations are a permanent historical record. Treat them like commits in git - once created and shared, they should never be removed or modified.
