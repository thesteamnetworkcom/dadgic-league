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
