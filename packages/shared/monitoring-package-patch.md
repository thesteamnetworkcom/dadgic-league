# Monitoring Package Updates

Add these scripts to your package.json files:

## Root package.json:
```json
{
  "scripts": {
    "monitor:health": "npm run monitor:health --workspace=packages/shared",
    "monitor:errors": "npm run monitor:errors --workspace=packages/shared", 
    "monitor:stats": "npm run monitor:stats --workspace=packages/shared"
  }
}
```

## packages/shared/package.json:
```json
{
  "scripts": {
    "monitor": "tsx src/monitoring/cli/monitor.ts",
    "monitor:health": "tsx src/monitoring/cli/monitor.ts health",
    "monitor:errors": "tsx src/monitoring/cli/monitor.ts errors",
    "monitor:stats": "tsx src/monitoring/cli/monitor.ts stats"
  }
}
```

## Usage Examples:
```bash
# Check system health
npm run monitor:health

# View recent errors  
npm run monitor:errors

# Show error statistics
npm run monitor:stats
```
