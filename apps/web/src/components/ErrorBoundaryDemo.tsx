'use client'

import { useState } from 'react'
import { ComponentErrorBoundary } from './error-boundaries'
import { AlertTriangle, Bomb } from 'lucide-react'

// Component that can be made to crash for testing
function CrashableComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('Test error: Component intentionally crashed!')
  }
  
  return (
    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-green-300">
        <span>✅ Component is working normally</span>
      </div>
    </div>
  )
}

export function ErrorBoundaryDemo() {
  const [shouldCrash, setShouldCrash] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const toggleCrash = () => {
    setShouldCrash(!shouldCrash)
    // Increment reset key to help error boundary reset
    setResetKey(prev => prev + 1)
  }

  const triggerAsyncError = () => {
    // Simulate an async error - this should be caught by AsyncErrorBoundary
    setTimeout(() => {
      throw new Error('Test async error: Async operation failed!')
    }, 100)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Error Boundary Testing
        </h2>
        
        <p className="text-neutral-300 mb-6">
          Use these buttons to test how the error boundaries handle different types of errors:
        </p>

        <div className="space-y-4">
          {/* Component Error Test */}
          <div>
            <h3 className="font-semibold text-white mb-2">Component Error Test</h3>
            <div className="space-y-2">
              <ComponentErrorBoundary 
                componentName="Test Component" 
                resetKeys={[resetKey]}
              >
                <CrashableComponent shouldCrash={shouldCrash} />
              </ComponentErrorBoundary>
              <button
                onClick={toggleCrash}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Bomb className="w-4 h-4" />
                {shouldCrash ? 'Fix Component' : 'Crash Component'}
              </button>
            </div>
          </div>

          {/* Async Error Test */}
          <div>
            <h3 className="font-semibold text-white mb-2">Async Error Test</h3>
            <div className="space-y-2">
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <span className="text-blue-300">
                  ✅ Click button to trigger async error
                </span>
              </div>
              <button
                onClick={triggerAsyncError}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Bomb className="w-4 h-4" />
                Trigger Async Error
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-neutral-700/50 rounded-lg">
          <p className="text-sm text-neutral-400">
            💡 <strong>Tip:</strong> The component error should be caught by the error boundary and show a nice error message instead of crashing the page.
          </p>
        </div>
      </div>
    </div>
  )
}