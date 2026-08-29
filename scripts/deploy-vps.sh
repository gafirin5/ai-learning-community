#!/bin/bash

# AI Learning Community - VPS Deployment Script
# Run this on the VPS via SSH

set -e

VPS_DIR="/home/gafirin5/ai-learning-community"

echo "🚀 Starting AI Learning Community Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}► ${NC}$1"; }
log_success() { echo -e "${GREEN}✓ ${NC}$1"; }
log_warn() { echo -e "${YELLOW}⚠ ${NC}$1"; }
log_error() { echo -e "${RED}✗ ${NC}$1"; }

# Step 1: Navigate to project directory
log_info "Navigating to project directory..."
cd "$VPS_DIR" || { log_error "Failed to navigate to $VPS_DIR"; exit 1; }
log_success "In project directory"

# Step 2: Stop application
log_info "Stopping application..."
pm2 stop frontend || true
pm2 save
log_success "Application stopped"

# Step 3: Pull latest code from GitHub
log_info "Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main
log_success "Code updated"

# Step 4: Install dependencies
log_info "Installing dependencies..."
npm ci --production
log_success "Dependencies installed"

# Step 5: Build application
log_info "Building production version..."
npm run build
log_success "Build completed successfully"

# Step 6: Start application
log_info "Starting application..."
pm2 start npm --name "frontend" -- start
pm2 save
log_success "Application started"

# Step 7: Health check
log_info "Performing health check..."
sleep 5
curl -s http://localhost:3000 > /dev/null && log_success "Server is responding" || log_warn "Server not responding yet, checking logs..."

# Step 8: Show recent logs
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Recent Logs (Last 20 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs frontend --lines 20 --nostream | tail -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Visit your application:"
echo "  • http://103.42.244.31"
echo "  • http://103.42.244.31/mentor"
echo "  • http://103.42.244.31/login"
echo ""
echo "Monitor with:"
echo "  pm2 logs frontend"
echo "  pm2 status"
echo ""
echo "To rollback:"
echo "  cd $VPS_DIR && git reset --hard HEAD~1 && npm run build && pm2 restart frontend"
echo ""
