# Package.json Updates Required

Add these scripts to `packages/database/package.json`:

```json
{
  "scripts": {
    "db:migrate": "tsx src/cli/migrate.ts",
    "db:status": "tsx src/cli/migrate.ts status",
    "db:backup": "tsx src/cli/migrate.ts backup create",
    "migrate:up": "tsx src/cli/migrate.ts migrate up",
    "migrate:history": "tsx src/cli/migrate.ts migrate history"
  },
  "devDependencies": {
    "tsx": "^4.6.2"
  }
}
```

## Usage Examples:

```bash
# Check migration status
cd packages/database
npm run db:status

# Run pending migrations  
npm run migrate:up

# Create backup
npm run db:backup

# View migration history
npm run migrate:history
```
