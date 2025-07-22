#!/bin/bash
echo "🔧 Setting up external monitoring..."

echo "1. UptimeRobot Setup:"
echo "   • Create account at uptimerobot.com"
echo "   • Add HTTP monitor for your /api/health endpoint"
echo "   • Set check interval to 5 minutes"
echo "   • Configure Discord/email alerts"

echo "2. Discord Webhook Alerts (optional):"
echo "   • Create webhook in your Discord server"
echo "   • Add DISCORD_WEBHOOK_URL to environment variables"
echo "   • Alerts will be sent for critical errors"

echo "3. Error Tracking:"
echo "   • All errors logged in admin dashboard"
echo "   • Discord bot errors automatically tracked"
echo "   • Database performance monitored"
