'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'
import { AlertTriangle, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  pageName?: string
}

export function PageErrorBoundary({ children, pageName }: Props) {
  const customFallback = (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Page Error</h2>
        <p className="text-neutral-300 mb-6">
          There was a problem loading {pageName || 'this page'}. Please try refreshing or go back to the dashboard.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <ErrorBoundary 
      fallback={customFallback}
      onError={(error, errorInfo) => {
        console.error(`Page error in ${pageName}:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
