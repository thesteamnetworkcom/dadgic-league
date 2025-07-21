'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode, useEffect, useState } from 'react'

interface Props {
  children: ReactNode
  onAsyncError?: (error: Error) => void
}

export function AsyncErrorBoundary({ children, onAsyncError }: Props) {
  const [asyncError, setAsyncError] = useState<Error | null>(null)
  const [resetKey, setResetKey] = useState(0)

  // Set up global error handlers for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      setAsyncError(error)
      setResetKey(prev => prev + 1) // Increment reset key
      
      if (onAsyncError) {
        onAsyncError(error)
      }
      
      // Prevent the default browser behavior
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(event.message)
      
      setAsyncError(error)
      setResetKey(prev => prev + 1) // Increment reset key
      
      if (onAsyncError) {
        onAsyncError(error)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [onAsyncError])

  // If there's an async error, throw it to be caught by ErrorBoundary
  useEffect(() => {
    if (asyncError) {
      throw asyncError
    }
  }, [asyncError])

  return (
    <ErrorBoundary
      resetKeys={[resetKey]}
      onError={(error, errorInfo) => {
        console.error('Async error caught by boundary:', error, errorInfo)
        // Reset async error state when boundary resets
        setAsyncError(null)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
