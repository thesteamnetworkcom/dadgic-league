#!/bin/bash

# ============================================================================
# Fix: Create AI Parse API Route and Debug JSON Error
# ============================================================================

echo "🔧 Fixing API Route Creation and JSON Error..."
echo "=============================================="

echo "📁 Creating missing API route directory structure..."

# Ensure the directory structure exists
mkdir -p apps/web/src/app/api/ai/parse

echo "✅ Directory structure created"

echo "🔗 Creating AI Parse API Route..."

# Create the actual API route file
cat > apps/web/src/app/api/ai/parse/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Parse API called')
    
    const body = await request.json()
    console.log('📝 Request body:', { textLength: body.text?.length })
    
    // Basic validation
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Text is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (body.text.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Text must be at least 10 characters',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // For now, let's test without the AI service to isolate the issue
    console.log('🧪 Testing without AI service first...')
    
    // Mock response to test the API flow
    const mockResult = {
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        game_length_minutes: 90,
        turns: 8,
        notes: 'Parsed by mock service',
        players: [
          { name: 'Player1', commander: 'Test Commander 1', result: 'win' as const },
          { name: 'Player2', commander: 'Test Commander 2', result: 'lose' as const }
        ],
        confidence: 0.8,
        processing_time_ms: 100
      },
      timestamp: new Date().toISOString()
    }

    console.log('✅ Mock AI Parse Success')
    return NextResponse.json(mockResult)

  } catch (error) {
    console.error('❌ AI Parse API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Parse API is running',
    timestamp: new Date().toISOString()
  })
}
EOF

echo "✅ Created basic API route for testing"

echo "🧪 Creating debug test script..."

# Create debug test script
cat > debug-api.sh << 'EOF'
#!/bin/bash

echo "🔍 Debugging AI API Issue..."
echo "==========================="

echo "1. 📂 Checking file structure:"
echo "   API Route file exists:"
ls -la apps/web/src/app/api/ai/parse/route.ts 2>/dev/null && echo "   ✅ route.ts exists" || echo "   ❌ route.ts missing"

echo ""
echo "2. 🌐 Testing API endpoint (make sure dev server is running):"
echo "   Health check:"
echo "   curl http://localhost:3000/api/ai/parse"
echo ""
echo "   POST test:"
echo '   curl -X POST http://localhost:3000/api/ai/parse \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"text":"Alice won with Atraxa, Bob lost with Krenko"}'"'"''

echo ""
echo "3. 🐛 Common issues and fixes:"
echo "   Issue: '<!DOCTYPE' error means you're getting HTML instead of JSON"
echo "   Causes:"
echo "     • API route not found (404 page returned)"
echo "     • Dev server not running"
echo "     • Wrong URL being called"
echo "     • Next.js routing issue"
echo ""
echo "   Fixes:"
echo "     • Restart dev server: npm run dev"
echo "     • Check URL: should be http://localhost:3000/api/ai/parse"
echo "     • Check browser Network tab for actual request/response"
echo "     • Look at server logs for errors"

echo ""
echo "4. 📋 Manual testing steps:"
echo "   a) Make sure dev server is running (npm run dev)"
echo "   b) Open browser to http://localhost:3000/api/ai/parse"
echo "   c) Should see JSON response with 'AI Parse API is running'"
echo "   d) If you see HTML instead, the route isn't working"

echo ""
echo "5. 🔧 If still not working, check:"
echo "   • File is in: apps/web/src/app/api/ai/parse/route.ts"
echo "   • File has proper Next.js App Router export format"
echo "   • No syntax errors in the file"
echo "   • Dev server restarted after creating file"

EOF

chmod +x debug-api.sh

echo "✅ Created debug script: debug-api.sh"

echo ""
echo "🔧 Quick fixes to try:"
echo "==================="

echo "1. 📂 Verify the file was created:"
echo "   ls -la apps/web/src/app/api/ai/parse/route.ts"

echo ""
echo "2. 🔄 Restart your dev server:"
echo "   Stop: Ctrl+C"
echo "   Start: npm run dev"

echo ""
echo "3. 🧪 Test the API directly in browser:"
echo "   Visit: http://localhost:3000/api/ai/parse"
echo "   Should see: {'success': true, 'message': 'AI Parse API is running'}"

echo ""
echo "4. 🔍 If you still get HTML/<!DOCTYPE error:"
echo "   • The API route isn't being recognized"
echo "   • Check the file path is exactly: apps/web/src/app/api/ai/parse/route.ts"
echo "   • Make sure you're using Next.js 13+ App Router"
echo "   • Restart dev server"

echo ""
echo "5. 📱 Test with the updated client code:"

# Create a minimal test client for debugging
cat > apps/web/src/app/test-api/page.tsx << 'EOF'
'use client'

import { useState } from 'react'

export default function TestAPI() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      console.log('🧪 Testing API...')
      
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Alice won with Atraxa, Bob lost with Krenko'
        })
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', response.headers)

      const data = await response.json()
      console.log('📡 Response data:', data)
      
      setResult(data)
    } catch (error) {
      console.error('❌ API Test Error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test AI API'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-bold">Debug Info:</h3>
        <p>• API endpoint: /api/ai/parse</p>
        <p>• Method: POST</p>
        <p>• Check browser console for detailed logs</p>
        <p>• Check Network tab to see actual request/response</p>
      </div>
    </div>
  )
}
EOF

echo "✅ Created test page: http://localhost:3000/test-api"

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Run: ./debug-api.sh"
echo "2. Restart dev server: npm run dev"
echo "3. Test in browser: http://localhost:3000/api/ai/parse"
echo "4. If working, test with: http://localhost:3000/test-api"
echo "5. Check browser console and Network tab for errors"
echo ""
echo "Let me know what you see and I'll help debug further!"