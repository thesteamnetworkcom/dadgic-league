import { HealthChecker } from '@dadgic/shared'

export async function GET() {
  try {
    const health = await HealthChecker.runAllChecks()
    
    // Set appropriate HTTP status based on health
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503

    return Response.json(health, { status: statusCode })
  } catch (error) {
    console.error('Health check endpoint error:', error)
    return Response.json({
      overall: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}