#!/bin/bash
echo "🧪 Testing Production Deployment..."

# Set your production URLs
WEB_URL="https://your-app.vercel.app"
RENDER_URL="https://your-bot.onrender.com"

echo "Testing web app health check..."
curl -f "$WEB_URL/api/health" || echo "❌ Web app health check failed"

echo "Testing detailed health check..."
curl -f "$WEB_URL/api/health/detailed" || echo "❌ Detailed health check failed"

echo "Testing authentication..."
curl -f "$WEB_URL/api/auth/providers" || echo "❌ Auth providers failed"

echo "📋 Manual Tests Required:"
echo "1. Visit $WEB_URL and sign in with Discord"
echo "2. Test Discord bot with /help command"
echo "3. Test game reporting workflow"
echo "4. Check admin monitoring dashboard"
echo "5. Verify error logging works"
