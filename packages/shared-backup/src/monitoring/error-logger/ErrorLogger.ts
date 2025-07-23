export interface ErrorContext {
  component: string
  userId?: string
  action?: string
  metadata?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  environment: string
  version?: string
}

export interface LoggedError {
  id: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context: ErrorContext
  userAgent?: string
  url?: string
  sessionId?: string
}

export class ErrorLogger {
  private static errors: LoggedError[] = []
  private static maxStoredErrors = 1000
  private static errorCounts = new Map<string, number>()

  static async logError(
    error: Error | string,
    context: Partial<ErrorContext>,
    additionalData?: Record<string, any>
  ): Promise<string> {
    const errorId = this.generateErrorId()
    
    const errorObj = typeof error === 'string' 
      ? { name: 'CustomError', message: error }
      : { name: error.name, message: error.message, stack: error.stack }

    const fullContext: ErrorContext = {
      component: context.component || 'unknown',
      severity: context.severity || 'medium',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version,
      ...context
    }

    const loggedError: LoggedError = {
      id: errorId,
      error: errorObj,
      context: fullContext,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location?.href : undefined,
      sessionId: this.getSessionId(),
      ...additionalData
    }

    // Store error locally
    this.errors.unshift(loggedError)
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors)
    }

    // Update error counts
    const errorKey = `${fullContext.component}-${errorObj.name}`
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)

    // Log to console for development
    this.logToConsole(loggedError)

    // Send to external service if configured
    await this.sendToExternalService(loggedError)

    return errorId
  }

  static async logAPIError(
    endpoint: string,
    method: string,
    statusCode: number,
    errorMessage: string,
    userId?: string
  ): Promise<string> {
    return this.logError(
      `API Error: ${method} ${endpoint} - ${statusCode}`,
      {
        component: 'api',
        action: `${method} ${endpoint}`,
        userId,
        severity: statusCode >= 500 ? 'high' : 'medium',
        metadata: {
          endpoint,
          method,
          statusCode,
          errorMessage
        }
      }
    )
  }

  static async logUserAction(
    action: string,
    userId: string,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    if (success) return null // Only log failed actions

    return this.logError(
      `User Action Failed: ${action}`,
      {
        component: 'user-action',
        action,
        userId,
        severity: 'low',
        metadata
      }
    )
  }

  static async logDatabaseError(
    operation: string,
    table: string,
    error: Error,
    userId?: string
  ): Promise<string> {
    return this.logError(error, {
      component: 'database',
      action: `${operation} on ${table}`,
      userId,
      severity: 'high',
      metadata: {
        operation,
        table,
        databaseError: true
      }
    })
  }

  static async logDiscordBotError(
    command: string,
    userId: string,
    error: Error,
    conversationId?: string
  ): Promise<string> {
    return this.logError(error, {
      component: 'discord-bot',
      action: `command: ${command}`,
      userId,
      severity: 'medium',
      metadata: {
        command,
        conversationId,
        platform: 'discord'
      }
    })
  }

  static getRecentErrors(limit: number = 50): LoggedError[] {
    return this.errors.slice(0, limit)
  }

  static getErrorsByComponent(component: string, limit: number = 50): LoggedError[] {
    return this.errors
      .filter(error => error.context.component === component)
      .slice(0, limit)
  }

  static getErrorStats(): {
    totalErrors: number
    last24Hours: number
    byComponent: Record<string, number>
    bySeverity: Record<string, number>
    topErrors: Array<{ error: string, count: number }>
  } {
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)

    const recent = this.errors.filter(error => 
      new Date(error.context.timestamp).getTime() > last24Hours
    )

    const byComponent: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    recent.forEach(error => {
      byComponent[error.context.component] = (byComponent[error.context.component] || 0) + 1
      bySeverity[error.context.severity] = (bySeverity[error.context.severity] || 0) + 1
    })

    const topErrors = Array.from(this.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalErrors: this.errors.length,
      last24Hours: recent.length,
      byComponent,
      bySeverity,
      topErrors
    }
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('dadgic_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('dadgic_session_id', sessionId)
      }
      return sessionId
    }
    return 'server_session'
  }

  private static logToConsole(loggedError: LoggedError): void {
    const { error, context } = loggedError
    const icon = {
      low: '💙',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }[context.severity]

    console.group(`${icon} Error in ${context.component}`)
    console.error(`Message: ${error.message}`)
    console.log(`ID: ${loggedError.id}`)
    console.log(`Severity: ${context.severity}`)
    console.log(`Action: ${context.action || 'N/A'}`)
    console.log(`User: ${context.userId || 'Anonymous'}`)
    console.log(`Timestamp: ${context.timestamp}`)
    
    if (context.metadata) {
      console.log('Metadata:', context.metadata)
    }
    
    if (error.stack) {
      console.log('Stack:', error.stack)
    }
    
    console.groupEnd()
  }

  private static async sendToExternalService(loggedError: LoggedError): Promise<void> {
    // TODO: Implement external error tracking service
    // Examples: Sentry, LogRocket, DataDog, or custom endpoint
    
    try {
      const errorTrackingUrl = process.env.ERROR_TRACKING_URL
      if (!errorTrackingUrl) return

      await fetch(errorTrackingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loggedError)
      })
    } catch (error) {
      // Don't log errors about logging errors (infinite loop)
      console.warn('Failed to send error to external service:', error)
    }
  }

  static clearOldErrors(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge
    const initialLength = this.errors.length
    
    this.errors = this.errors.filter(error => 
      new Date(error.context.timestamp).getTime() > cutoff
    )
    
    return initialLength - this.errors.length
  }
}
