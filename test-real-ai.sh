#!/bin/bash

echo "🧪 Testing Real AI Integration..."
echo "==============================="

echo "🔧 Prerequisites:"
echo "1. GEMINI_API_KEY must be in your apps/web/.env.local file"
echo "2. Dev server must be running (npm run dev)"
echo "3. @google/generative-ai package must be installed"

echo ""
echo "📦 Checking dependencies..."
npm list @google/generative-ai --depth=0 2>/dev/null || echo "⚠️  @google/generative-ai may need to be installed"

echo ""
echo "🌐 Testing Real AI Parsing:"
echo ""
echo "Test 1: Health Check"
echo "curl http://localhost:3000/api/ai/parse"
echo ""
echo "Test 2: Simple Game Parse"
echo 'curl -X POST http://localhost:3000/api/ai/parse \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"text":"Alice won with Atraxa, Bob lost with Krenko, Charlie third with Meren"}'"'"
echo ""
echo "Test 3: Complex Game Parse"  
echo 'curl -X POST http://localhost:3000/api/ai/parse \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"text":"Had a great 4-player commander game today. I played Atraxa and managed to win after about 90 minutes and 12 turns. Sarah was playing Meren, Mike had Krenko, and David brought his Teysa deck. Close game!"}'"'"

echo ""
echo "🔍 What to look for:"
echo "✅ No environment variable errors in server logs"
echo "✅ Real AI responses with proper commander names"
echo "✅ Confidence scores between 0.1 and 1.0"
echo "✅ Processing times under 20 seconds"
echo "✅ Properly formatted JSON responses"

echo ""
echo "❌ Common issues:"
echo "• GEMINI_API_KEY missing: Check apps/web/.env.local file"
echo "• API key invalid: Verify key from Google AI Studio"
echo "• Timeout errors: Check internet connection"
echo "• Parse errors: AI returned unexpected format"

echo ""
echo "🖥️ UI Testing:"
echo "1. Go to http://localhost:3000/report"
echo "2. Switch to AI mode"
echo "3. Enter: 'Alice won with Atraxa, Bob lost with Krenko'"
echo "4. Click 'Parse Game'"
echo "5. Should auto-fill structured form with parsed data"
