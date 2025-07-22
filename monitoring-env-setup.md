# Monitoring Environment Setup

## Required Environment Variables:

Add these to your `.env.local` or production environment:

```bash
# Optional: External error tracking service
ERROR_TRACKING_URL=https://your-error-service.com/api/errors

# Optional: Health check configuration
HEALTH_CHECK_INTERVAL=30000  # 30 seconds

# Optional: Error retention (defaults to 7 days)
ERROR_RETENTION_DAYS=7
```

## Health Check Endpoints:

Your app now has these monitoring endpoints:

- `GET /api/health` - Basic health status
- `GET /api/health/detailed` - Detailed health with error stats

## Integration Steps:

1. **Web App**: Error handlers are auto-initialized
2. **Discord Bot**: Add monitoring integration (see integration-example.ts)
3. **External Monitoring**: Point your uptime service to `/api/health`

## External Services Integration:

Configure these services to use your health endpoints:

- **Uptime Robot**: Monitor `/api/health`
- **Pingdom**: Monitor `/api/health`  
- **DataDog**: Custom integration via ERROR_TRACKING_URL
- **Sentry**: Replace ErrorLogger.sendToExternalService()
