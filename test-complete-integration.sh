#!/bin/bash

echo "🧪 Testing Complete API Integration (Phase 2A-3 Complete)..."
echo "=========================================================="

echo "🔧 Prerequisites:"
echo "1. All 3 parts of Phase 2A-3 completed"
echo "2. Shared package built: npm run build --workspace=packages/shared"
echo "3. Dev server running: npm run dev"
echo "4. GEMINI_API_KEY in apps/web/.env.local"

echo ""
echo "📋 Full Integration Test Sequence:"
echo "================================="

echo ""
echo "Step 1: Test AI Parsing API"
echo "---------------------------"
echo 'curl -X POST http://localhost:3000/api/ai/parse \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"text":"Alice won with Atraxa, Bob lost with Krenko"}'"'"

echo ""
echo "Step 2: Create Test Players"
echo "--------------------------"
echo 'curl -X POST http://localhost:3000/api/players \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name":"Alice","discord_username":"alice"}'"'"
echo ""
echo 'curl -X POST http://localhost:3000/api/players \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name":"Bob","discord_username":"bob"}'"'"

echo ""
echo "Step 3: Create Test Game"
echo "-----------------------"
echo 'curl -X POST http://localhost:3000/api/games \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"date":"2024-01-20","players":[{"discord_username":"alice","commander_deck":"Atraxa","result":"win"},{"discord_username":"bob","commander_deck":"Krenko","result":"lose"}]}'"'"

echo ""
echo "Step 4: List Games"
echo "-----------------"
echo "curl http://localhost:3000/api/games"

echo ""
echo "🖥️ Web App Integration Test:"
echo "
