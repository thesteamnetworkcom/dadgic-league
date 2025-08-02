// src/app/dashboard/page-debug.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function DebugDashboard() {
  const { user, loading, error } = useAuth()

  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono">
      <h1 className="text-xl mb-4">Debug Dashboard</h1>
      
      <div className="space-y-2 text-sm">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User exists: {user ? 'true' : 'false'}</div>
        <div>Error: {error || 'none'}</div>
        
        {user && (
          <div className="mt-4">
            <div>User Data:</div>
            <pre className="text-xs bg-gray-900 p-2 mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}