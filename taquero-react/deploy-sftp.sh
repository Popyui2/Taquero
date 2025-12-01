#!/bin/bash

# Taquero Automated Deployment Script (SFTP Version)
# This script builds and deploys Taquero to your hosting via SFTP

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌮 Taquero Deployment Script (SFTP)${NC}"
echo ""

# Step 1: Build the app
echo -e "${BLUE}📦 Building production app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""

# Step 2: Upload via SFTP/rsync over SSH
echo -e "${BLUE}🚀 Uploading to server via SFTP...${NC}"

# Load credentials
if [ ! -f ".ftp-credentials" ]; then
    echo -e "${RED}❌ .ftp-credentials file not found!${NC}"
    exit 1
fi

source .ftp-credentials

# Use rsync over SSH (SFTP)
rsync -avz --delete \
      --exclude='.htaccess' \
      --exclude='.htpasswd' \
      -e "ssh -p ${SSH_PORT:-22}" \
      dist/ ${FTP_USER}@${FTP_HOST}:${FTP_REMOTE_DIR}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure SSH access is enabled in cPanel"
    echo "2. Check your SSH port (usually 22 or 2222)"
    echo "3. Try manual upload via cPanel File Manager"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Visit: https://taquero.hotlikeamexican.com${NC}"
echo ""
