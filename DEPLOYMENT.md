# 🚀 Deployment Guide - AI Learning Community

Guide lengkap untuk deploy ke VPS (103.42.244.31) dan Supabase migrations.

---

## ✅ Pre-Deployment Checklist

### 1. **Environment Variables** ⚠️ CRITICAL

Sebelum deploy, pastikan file `.env.production` ada di VPS:

```bash
# Di VPS (via SSH):
ssh user@103.42.244.31

# Navigate to project directory
cd /path/to/ai-learning-community

# Copy .env.example to .env.production
cp .env.example .env.production

# Edit .env.production dengan actual values
nano .env.production
```

Isi minimal:
```env
NEXT_PUBLIC_SUPABASE_URL=https://oucvzigtxfsdquzhrpwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-dashboard>
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**NOTES:**
- `ANON_KEY` bisa dapat dari Supabase Dashboard → Project Settings → API
- `OPENROUTER_API_KEY` free tier di https://openrouter.ai/keys
- **JANGAN commit `.env.production` ke git!**

---

### 2. **Verify Build Locally First**

Sebelum push ke production, test build locally:

```bash
# Test compilation
npm run build

# Test linting
npm run lint

# Run tests
npm test -- --run

# If all pass, ready to deploy!
```

---

## 📦 Full Deployment Steps (VPS)

### Option A: Manual Deploy via Git (Recommended for now)

```bash
# SSH ke VPS
ssh user@103.42.244.31

# Navigate to project directory
cd /var/www/ai-learning-community

# Stop the app
pm2 stop all

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build the application
npm run build

# Update environment variables (if changed)
# Check if .env.production exists, edit if needed

# Start the application
pm2 start ecosystem.config.js
pm2 save

# Monitor logs
pm2 logs frontend
```

### Option B: Deploy Script (Automated)

Create `/var/www/ai-learning-community/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop app
echo -e "${YELLOW}Stopping application...${NC}"
pm2 stop all

# Step 2: Backup current build
echo -e "${YELLOW}Backing up previous version...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mv .next .next.backup_$TIMESTAMP

# Step 3: Pull latest code
echo -e "${YELLOW}Pulling latest code from GitHub...${NC}"
git pull origin main

# Step 4: Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production

# Step 5: Build
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Step 6: Verification
echo -e "${YELLOW}Verifying build...${NC}"
if [ ! -d ".next" ]; then
    echo -e "${RED}Build failed! Restoring backup...${NC}"
    rm -rf .next
    mv .next.backup_$TIMESTAMP .next
    exit 1
fi

# Step 7: Restart app
echo -e "${GREEN}Starting application...${NC}"
pm2 restart frontend

# Step 8: Health check
sleep 5
curl -f http://localhost:3000/api/health || {
    echo -e "${RED}Health check failed! Restarting...${NC}"
    pm2 restart frontend
}

# Step 9: Cleanup
echo -e "${YELLOW}Cleaning up old backups...${NC}"
find . -name '.next.backup_*' -mtime +7 -exec rm -rf {} \;

echo -e "${GREEN}✅ Deployment successful!${NC}"
pm2 logs frontend --lines 20
```

Make executable:
```bash
chmod +x /var/www/ai-learning-community/deploy.sh
```

Use anytime:
```bash
./deploy.sh
```

---

## 🔧 PM2 Configuration

### ecosystem.config.js

Create `/var/www/ai-learning-community/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1,
      },
      error_file: './logs/front-end-error.log',
      out_file: './logs/front-end-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '600M',
      instances: 1, // For Now.js single instance
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      merge_logs: true,
    },
  ],
};
```

Start PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd  # Add this on first setup
```

---

## 🗄️ SUPABASE MIGRATIONS (CRITICAL!)

Database migrations perlu dijalankan **sebelum atau setelah deploy**, tapi **setelah** environment variables configured.

### Via Supabase Dashboard (Easiest):

1. Go to: https://supabase.com/dashboard/project/oucvzigtxfsdquzhrpwf/editor
2. Click **"SQL Editor"** tab
3. Copy & paste each migration file content one by one:
   - `src/features/mentor/migrations/20260829_mentor_hub.sql`
   - `src/features/realtime/migrations/20260830_realtime_notifications.sql`
   - `src/features/ai-tutor/migrations/20260831_ai_tutor_production.sql`
4. Click **"Run"** button for each

### Via Command Line (Advanced):

```bash
# Install Supabase CLI globally (one-time)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref oucvzigtxfsdquzhrpwf

# Apply all migrations
# You may need to run each migration file separately:
npx supabase db push --db-url=<your-db-url>

# OR manually apply SQL files:
cat src/features/mentor/migrations/20260829_mentor_hub.sql | psql <your-db-url>
cat src/features/realtime/migrations/20260830_realtime_notifications.sql | psql <your-db-url>
cat src/features/ai-tutor/migrations/20260831_ai_tutor_production.sql | psql <your-db-url>
```

### Verify Migrations:

After running migrations, verify tables exist:

```sql
-- In Supabase SQL Editor or pgAdmin:

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should include:
-- mentoring_sessions
-- mentor_reviews  
-- mentor_availability
-- notifications
-- chat_history
-- chat_quota
```

---

## 🔐 NGINX Configuration (Optional but Recommended)

For HTTPS and better performance:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Optimize static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable with Certbot for HTTPS:
```bash
sudo certbot --nginx -d your-domain.com
```

---

## 📊 Monitoring & Maintenance

### PM2 Commands:

```bash
pm2 status              # View all app statuses
pm2 logs frontend       # View logs for frontend app
pm2 monit               # Interactive monitoring
pm2 restart frontend    # Restart specific app
pm2 flush               # Clear logs
```

### Log Rotation:

Add to `/etc/logrotate.d/frontend`:
```conf
/var/www/ai-learning-community/logs/*.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        pm2 reload frontend > /dev/null 2>&1 || true
    endscript
}
```

### Health Check Endpoint:

Create `/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

Then in Nginx:
```nginx
location /api/health {
    proxy_pass http://127.0.0.1:3000;
}
```

Monitor with: `curl http://localhost:3000/api/health`

---

## ⚠️ Troubleshooting

### Common Issues:

#### 1. Build Fails
```bash
# Clear next cache
rm -rf .next
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

#### 2. App Won't Start
```bash
# Check logs
pm2 logs frontend

# Check port in use
netstat -tulpn | grep 3000

# Check environment variables
echo $NODE_ENV
grep -r NEXT_PUBLIC_SUPABASE .env.production
```

#### 3. Database Connection Error
```bash
# Verify connection string
psql "<your-db-url>" -c "SELECT 1;"

# Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

#### 4. Memory Issues
```bash
# Reduce PM2 memory limit
pm2 set max_memory_restart 600M

# Increase swap space (on VPS)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 🎯 Post-Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] All database migrations applied
- [ ] App starts without errors
- [ ] `/mentor` route accessible
- [ ] Real-time notifications working (check browser console)
- [ ] AI Tutor responds (with correct API key)
- [ ] SSL/HTTPS working (if using domain)
- [ ] Logs being captured by PM2
- [ ] Automated backups configured
- [ ] Monitoring/alerting setup (optional)

---

## 📝 Rollback Procedure

If something goes wrong after deploy:

```bash
# SSH to VPS
ssh user@103.42.244.31
cd /var/www/ai-learning-community

# Find last working backup
ls -lt .next.backup_*

# Restore old version
rm -rf .next
mv .next.backup_<timestamp> .next

# Restart app
pm2 restart frontend
```

---

**Last Updated:** 2026-08-28  
**Deployed By:** Multi-Agent System ✅
