import { ErrorLogger } from '@dadgic/shared'

export class WebErrorHandler {
  static initialize(): void {
    // Global error handler for unhandled errors
    window.addEventListener('error', (event) => {
      ErrorLogger.logError(
        event.error || new Error(event.message),
        {
          component: 'window',
          action: 'unhandled-error',
          severity: 'high',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'javascript-error'
          }
        }
      )
    })

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      ErrorLogger.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'window',
          action: 'unhandled-promise-rejection',
          severity: 'high',
          metadata: {
            type: 'promise-rejection'
          }
        }
      )
    })

    console.log('✅ Web error handlers initialized')
  }

  static async logRouteError(route: string, error: Error, userId?: string): Promise<string> {
    return ErrorLogger.logError(error, {
      component: 'router',
      action: `navigate to ${route}`,
      userId,
      severity: 'medium',
      metadata: {
        route,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    })
  }

  static async logFormError(
    formName: string, 
    error: Error, 
    formData?: Record<string, any>,
    userId?: string
  ): Promise<string> {
    return ErrorLogger.logError(error, {
      component: 'form',
      action: `submit ${formName}`,
      userId,
      severity: 'medium',
      metadata: {
        formName,
        hasFormData: !!formData,
        formFields: formData ? Object.keys(formData) : []
      }
    })
  }

  static async logAPIError(
    endpoint: string,
    method: string,
    status: number,
    error: string,
    userId?: string
  ): Promise<string> {
    return ErrorLogger.logAPIError(endpoint, method, status, error, userId)
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  WebErrorHandler.initialize()
}
