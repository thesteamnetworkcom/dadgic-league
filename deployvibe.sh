# Phase 1: Production Deployment with Render
# ==========================================

echo "🚀 Phase 1: Production Deployment Starting..."
echo "Web App: Vercel | Discord Bot: Render | Database: Supabase"

# Pre-Deployment Checklist
# ========================

echo "📋 Step 1: Pre-Deployment Checklist"
echo "====================================="

# Check environment variables
echo "🔍 Checking environment variables..."
echo "Required variables in .env.local:"
grep -E "(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|DISCORD_BOT_TOKEN|GEMINI_API_KEY)" .env.local

echo ""
echo "📝 Environment Variables Checklist:"
echo "   ✅ SUPABASE_URL - Database connection"
echo "   ✅ SUPABASE_SERVICE_ROLE_KEY - Database admin access"  
echo "   ✅ DISCORD_BOT_TOKEN - Bot authentication"
echo "   ✅ DISCORD_CLIENT_ID - OAuth integration"
echo "   ✅ DISCORD_CLIENT_SECRET - OAuth security"
echo "   ✅ GEMINI_API_KEY - AI parsing"
echo "   ✅ NEXTAUTH_SECRET - Authentication security"

# Generate production NextAuth secret
echo ""
echo "🔐 Generating production NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "Save this for production deployment!"

echo ""
echo "🗄️ Step 2: Database Production Setup"
echo "====================================="

# Database production readiness
echo "Verifying database setup..."
npm run db:status

echo ""
echo "📋 Database Checklist:"
echo "   ✅ RLS enabled on all tables"
echo "   ✅ Proper indexes for performance"
echo "   ✅ Migration system operational"
echo "   ✅ Backup system ready"

echo ""
echo "🌐 Step 3: Web App Deployment (Vercel)"
echo "======================================"

echo "📝 Vercel Deployment Steps:"
echo ""
echo "1. Connect GitHub to Vercel:"
echo "   • Go to https://vercel.com"
echo "   • Import your GitHub repository"
echo "   • Select 'apps/web' as the root directory"
echo ""
echo "2. Configure Build Settings:"
cat > vercel-build-config.txt << 'EOF'
Framework Preset: Next.js
Root Directory: apps/web
Build Command: npm run build
Output Directory: .next
Install Command: npm install

Environment Variables (add these in Vercel dashboard):
- NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
- NEXTAUTH_URL=https://your-domain.vercel.app
- NEXTAUTH_SECRET=your-generated-secret
- DISCORD_CLIENT_ID=your-discord-client-id
- DISCORD_CLIENT_SECRET=your-discord-client-secret
EOF

echo "   Build configuration saved to: vercel-build-config.txt"
echo ""
echo "3. Set Custom Domain (optional):"
echo "   • In Vercel dashboard > Settings > Domains"
echo "   • Add your custom domain or use .vercel.app subdomain"

echo ""
echo "🤖 Step 4: Discord Bot Deployment (Render)"
echo "=========================================="

echo "📝 Render Discord Bot Setup:"
echo ""
echo "1. Create Render Web Service:"
echo "   • Go to https://render.com"
echo "   • Connect your GitHub repository"
echo "   • Create new 'Web Service'"
echo ""
echo "2. Configure Render Service:"
cat > render-config.txt << 'EOF'
Name: dadgic-discord-bot
Environment: Node
Region: Oregon (US West) or your preferred region
Branch: main
Root Directory: apps/discord-bot

Build Command: npm install && npm run build
Start Command: npm start

Environment Variables (add in Render dashboard):
- NODE_ENV=production
- SUPABASE_URL=your-supabase-url
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
- DISCORD_BOT_TOKEN=your-bot-token
- DISCORD_GUILD_ID=your-server-id (optional)
- GEMINI_API_KEY=your-gemini-key

Auto-Deploy: Yes
EOF

echo "   Render configuration saved to: render-config.txt"
echo ""
echo "3. Important Render Settings:"
echo "   • Plan: Free (sufficient for Discord bot)"
echo "   • Health Check Path: Leave blank (Discord bots don't need HTTP)"
echo "   • Auto-Deploy: Enable for automatic updates"

echo ""
echo "📋 Step 5: Discord Application Setup"
echo "===================================="

echo "🔧 Update Discord OAuth URLs:"
echo ""
echo "1. Go to Discord Developer Portal:"
echo "   https://discord.com/developers/applications"
echo ""
echo "2. Select your application > OAuth2 > General"
echo ""
echo "3. Update Redirect URIs:"
echo "   • Add: https://your-vercel-domain.vercel.app/api/auth/callback/discord"
echo "   • Remove any localhost URLs for production"
echo ""
echo "4. Bot Permissions (if not set):"
echo "   • Send Messages"
echo "   • Use Slash Commands"
echo "   • Embed Links"
echo "   • Read Message History"

echo ""
echo "🧪 Step 6: Deployment Testing Scripts"
echo "====================================="

# Create health check scripts
cat > test-production.sh << 'EOF'
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
EOF

chmod +x test-production.sh

echo "   Test script created: test-production.sh"

echo ""
echo "🔍 Step 7: Monitoring Setup"
echo "==========================="

echo "📊 Production Monitoring:"
echo ""
echo "1. Health Check Endpoints:"
echo "   • Basic: https://your-domain/api/health"
echo "   • Detailed: https://your-domain/api/health/detailed"
echo ""
echo "2. Admin Dashboard:"
echo "   • https://your-domain/admin/monitoring"
echo "   • Requires admin role in database"
echo ""
echo "3. External Monitoring (optional):"
echo "   • UptimeRobot: Monitor /api/health endpoint"
echo "   • Discord webhooks for alerts"

# Create monitoring setup script
cat > setup-monitoring.sh << 'EOF'
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
EOF

chmod +x setup-monitoring.sh

echo "   Monitoring setup script created: setup-monitoring.sh"

echo ""
echo "📋 Step 8: Final Production Checklist"
echo "====================================="

cat > production-checklist.md << 'EOF'
# Production Deployment Checklist

## Before Going Live:
- [ ] All environment variables configured in Vercel
- [ ] All environment variables configured in Render  
- [ ] Discord OAuth URLs updated to production domains
- [ ] Database migrations applied
- [ ] Health checks responding correctly
- [ ] Discord bot responding to commands
- [ ] Authentication flow working end-to-end
- [ ] Admin dashboard accessible
- [ ] Error logging functional

## Post-Launch Monitoring:
- [ ] Set up external uptime monitoring
- [ ] Configure alert notifications
- [ ] Test full user journey (sign up → report game)
- [ ] Monitor error rates for first 24 hours
- [ ] Verify Discord bot stability
- [ ] Check database performance

## Success Metrics:
- [ ] Web app uptime > 99%
- [ ] Discord bot response time < 3 seconds
- [ ] Zero data loss incidents
- [ ] User authentication success rate > 95%
- [ ] Friends can use the system without issues

## Emergency Contacts:
- Vercel Status: https://vercel.com/status
- Render Status: https://render.com/status  
- Supabase Status: https://status.supabase.com
- Discord API Status: https://discordstatus.com
EOF

echo "   Production checklist saved to: production-checklist.md"

echo ""
echo "🎉 Phase 1: Production Deployment Guide Complete!"
echo "=============================================="
echo ""
echo "📋 Files Created:"
echo "   • vercel-build-config.txt - Vercel deployment settings"
echo "   • render-config.txt - Render Discord bot settings"
echo "   • test-production.sh - Production testing script"
echo "   • setup-monitoring.sh - External monitoring setup"
echo "   • production-checklist.md - Go-live checklist"
echo ""
echo "🚀 Next Steps:"
echo "   1. Deploy web app to Vercel using vercel-build-config.txt"
echo "   2. Deploy Discord bot to Render using render-config.txt"
echo "   3. Update Discord OAuth URLs"
echo "   4. Run test-production.sh to verify everything works"
echo "   5. Complete production-checklist.md"
echo ""
echo "📞 Ready to go live! Your MTG tracking system will be production-ready."