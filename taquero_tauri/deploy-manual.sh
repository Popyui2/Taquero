#!/bin/bash

# Taquero Build Script (Manual Upload)
# This builds the app, then you upload via cPanel File Manager

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌮 Building Taquero for Production${NC}"
echo ""

# Build
npm run build

if [ $? -ne 0 ]; then
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo -e "${BLUE}📁 Files ready in: dist/${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Login to cPanel: https://your-cpanel-url.com"
echo "2. Go to File Manager"
echo "3. Navigate to: /home/bebeauty/public_html/taquero/"
echo "4. Select all files EXCEPT .htaccess (if it exists)"
echo "5. Delete selected files"
echo "6. Click Upload"
echo "7. Select ALL files from: $(pwd)/dist/"
echo "8. Upload and wait for completion"
echo ""
echo -e "${GREEN}Or use Nautilus/Files:${NC}"
echo "1. Open Files (Nautilus)"
echo "2. Connect to: sftp://Developer@hotlikeamexican.com"
echo "3. Navigate to: /home/bebeauty/public_html/taquero/"
echo "4. Drag all files from $(pwd)/dist/ to that folder"
echo ""
echo -e "${BLUE}Visit: https://taquero.hotlikeamexican.com${NC}"
echo ""
