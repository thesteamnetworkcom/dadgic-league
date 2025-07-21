'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  resetKeys?: Array<string | number>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      errorId: this.state.errorId
    }

    // Log to console for development
    console.error('🚨 React Error Boundary caught an error:', errorData)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Store error details in state for display
    this.setState({ errorInfo })

    // Log to external service (implement in production)
    this.logErrorToService(errorData)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some(key => prevProps.resetKeys?.includes(key) === false)) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private logErrorToService(errorData: any) {
    // TODO: Send to external error tracking service in production
    // For now, store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('mtg-tracker-errors') || '[]')
      errors.push(errorData)
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10)
      }
      localStorage.setItem('mtg-tracker-errors', JSON.stringify(errors))
    } catch (e) {
      // localStorage might be full or disabled
      console.warn('Could not store error in localStorage:', e)
    }
  }

  private resetErrorBoundary = () => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined 
      })
    }, 100)
  }

  private refreshPage = () => {
    window.location.reload()
  }

  private goHome = () => {
    window.location.href = '/'
  }

  private copyErrorDetails = async () => {
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      errorId: this.state.errorId
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      alert('Error details copied to clipboard!')
    } catch (e) {
      console.error('Failed to copy error details:', e)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl shadow-lg p-8 max-w-lg w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-white text-center mb-4">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-neutral-300 text-center mb-6">
              The MTG Tracker encountered an unexpected error. Don't worry - your data is safe. 
              Try refreshing the page or return to the dashboard.
            </p>

            {/* Error ID for support */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 mb-6">
              <p className="text-sm text-neutral-400 text-center">
                Error ID: <code className="text-neutral-200">{this.state.errorId}</code>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.resetErrorBoundary}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={this.refreshPage}
                className="w-full flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>

              <button
                onClick={this.goHome}
                className="w-full flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>

              {/* Developer Actions */}
              <details className="mt-4">
                <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-300 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Developer Details
                </summary>
                <div className="mt-2 space-y-2">
                  <button
                    onClick={this.copyErrorDetails}
                    className="w-full text-left text-sm text-neutral-400 hover:text-neutral-300 p-2 bg-neutral-800 rounded border border-neutral-600"
                  >
                    Copy Error Details
                  </button>
                  {this.state.error && (
                    <div className="text-xs text-red-400 bg-neutral-800 p-2 rounded border border-neutral-600 font-mono">
                      {this.state.error.message}
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
