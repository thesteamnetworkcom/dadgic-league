#!/bin/bash

echo "🧪 Testing API Routes (Phase 2A-3 Part 2)..."
echo "============================================"

echo "🔧 Prerequisites:"
echo "1. Dev server running (npm run dev)"
echo "2. Database properly configured"
echo "3. GEMINI_API_KEY in apps/web/.env.local"

echo ""
echo "📋 Testing API Endpoints:"
echo "========================"

echo ""
echo "1. 🤖 AI Parsing API (from Part 2A-2):"
echo "curl http://localhost:3000/api/ai/parse"

echo ""
echo "2. 👥 Players API:"
echo "# List players"
echo "curl http://localhost:3000/api/players"
echo ""
echo "# Create player"
echo 'curl -X POST http://localhost:3000/api/players \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name":"Test Player","discord_username":"testuser"}'"'"
echo ""
echo "# Search players"
echo 'curl "http://localhost:3000/api/players/search?q=test"'

echo ""
echo "3. 🎮 Games API:"
echo "# List games"
echo "curl http://localhost:3000/api/games"
echo ""
echo "# Create game (requires players to exist first)"
echo 'curl -X POST http://localhost:3000/api/games \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"date":"2024-01-20","players":[{"discord_username":"Test Player","commander_deck":"Atraxa","result":"win"},{"discord_username":"testuser","commander_deck":"Krenko","result":"lose"}]}'"'"

echo ""
echo "🔍 Manual Testing Steps:"
echo "======================="
echo "1. Create a test player first:"
echo "   POST /api/players with {\"name\":\"TestUser\",\"discord_username\":\"testuser\"}"
echo ""
echo "2. Create another test player:"
echo "   POST /api/players with {\"name\":\"Alice\",\"discord_username\":\"alice\"}"
echo ""
echo "3. Create a test game:"
echo "   POST /api/games with game data using the players above"
echo ""
echo "4. List games to see your created game:"
echo "   GET /api/games"
echo ""
echo "5. Get specific game details:"
echo "   GET /api/games/{game-id}"

echo ""
echo "✅ Success Indicators:"
echo "===================="
echo "• All endpoints return JSON (not HTML)"
echo "• Player creation works without errors"
echo "• Player search returns results"
echo "• Game creation links players properly"
echo "• Game listing shows created games"
echo "• No 'Cannot find module' errors in logs"

echo ""
echo "❌ Common Issues:"
echo "==============="
echo "• Import errors: Build shared package (npm run build --workspace=packages/shared)"
echo "• Player not found: Create players before creating games"
echo "• Validation errors: Check request format matches API types"
echo "• Database errors: Verify database connection and table structure"
