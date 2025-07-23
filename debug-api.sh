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

