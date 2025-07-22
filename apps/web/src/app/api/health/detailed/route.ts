import { HealthChecker, ErrorLogger } from '@dadgic/shared'

export async function GET() {
  try {
    const [health, errorStats] = await Promise.all([
      HealthChecker.runAllChecks(),
      Promise.resolve(ErrorLogger.getErrorStats())
    ])

    const detailedHealth = {
      ...health,
      errorStats,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    }

    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503

    return Response.json(detailedHealth, { status: statusCode })
  } catch (error) {
    console.error('Detailed health check error:', error)
    return Response.json({
      overall: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}