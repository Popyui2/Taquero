#!/bin/bash

# Taquero Automated Deployment Script
# This script builds and deploys Taquero to your hosting

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌮 Taquero Deployment Script${NC}"
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

# Step 2: Upload via FTP
echo -e "${BLUE}🚀 Uploading to server...${NC}"

# Load FTP credentials from file
if [ ! -f ".ftp-credentials" ]; then
    echo -e "${RED}❌ .ftp-credentials file not found!${NC}"
    echo "Please create .ftp-credentials with your FTP details"
    exit 1
fi

source .ftp-credentials

LOCAL_DIR="dist"

# Use lftp to mirror upload (only uploads changed files)
lftp -c "
set ftp:ssl-allow no
set ftp:passive-mode on
set net:timeout 30
set net:max-retries 3
set net:reconnect-interval-base 5
debug 3
open -u $FTP_USER,$FTP_PASS -p ${FTP_PORT:-21} $FTP_HOST
mirror --reverse \
       --delete \
       --verbose \
       --exclude .htaccess \
       --exclude .htpasswd \
       $LOCAL_DIR $FTP_REMOTE_DIR
bye
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Visit: https://taquero.hotlikeamexican.com${NC}"
echo ""
