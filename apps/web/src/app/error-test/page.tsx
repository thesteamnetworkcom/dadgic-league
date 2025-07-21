import { ErrorBoundaryDemo } from '@/components/ErrorBoundaryDemo'

export default function ErrorTestPage() {
  return (
    <div className="min-h-screen bg-neutral-900 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Error Boundary Testing</h1>
          <p className="text-neutral-400">Test how the app handles different types of errors</p>
        </div>
        
        <ErrorBoundaryDemo />
      </div>
    </div>
  )
}
