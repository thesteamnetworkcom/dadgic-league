#!/bin/bash

echo "🧪 Testing AI API Implementation..."
echo "=================================="

echo "1. 🔧 Build Test:"
echo "   cd apps/web && npm run build"

echo ""
echo "2. 🌐 Start Development Server:"
echo "   npm run dev"

echo ""
echo "3. 🧪 API Endpoint Tests:"
echo "   Test 1: Health Check"
echo "   curl http://localhost:3000/api/ai/parse"
echo ""
echo "   Test 2: Parse Game Text"
echo '   curl -X POST http://localhost:3000/api/ai/parse \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"text":"Alice won with Atraxa, Bob lost with Krenko, Charlie third with Meren"}'"'"

echo ""
echo "4. 🖥️ UI Testing Checklist:"
echo "   □ Navigate to /report page"
echo "   □ Test AI mode toggle works"
echo "   □ Enter game description: 'Alice won with Atraxa, Bob lost with Krenko'"
echo "   □ Click 'Parse Game' button"
echo "   □ Verify AI parsing works (should switch to structured mode)"
echo "   □ Check browser console for success logs"
echo "   □ Test structured mode still works"
echo "   □ Submit a complete game report"
echo "   □ Verify success redirect to dashboard"

echo ""
echo "5. 🔍 Debug Information:"
echo "   Check browser Network tab for API calls to /api/ai/parse"
echo "   Check server logs for AI service initialization"
echo "   Look for '✅ AI Parsing Service initialized successfully'"
echo "   Verify no environment variable errors"

echo ""
echo "✅ SUCCESS CRITERIA:"
echo "   • No environment variable errors in logs"
echo "   • AI parsing API returns structured data"
echo "   • Report page successfully uses AI parsing"
echo "   • Form auto-populates from AI results"
echo "   • Game submission works end-to-end"

