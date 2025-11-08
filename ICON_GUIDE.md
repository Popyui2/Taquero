# PWA Icon Guide

Your PWA needs two icon sizes: 192x192px and 512x512px

## Quick Option: Use Online Generator

### Method 1: Favicon.io (Easiest)
1. Go to https://favicon.io/favicon-generator/
2. Settings:
   - Text: 🌶️ or "MPI"
   - Background: #e74c3c (red)
   - Font: Choose any
3. Click "Download"
4. Extract and rename:
   - `android-chrome-192x192.png` → `icon-192.png`
   - `android-chrome-512x512.png` → `icon-512.png`
5. Upload both to `/icons/` folder

### Method 2: RealFaviconGenerator
1. Go to https://realfavicongenerator.net/
2. Upload any image (your restaurant logo, chili pepper, etc.)
3. Download the package
4. Extract and find the Android icons
5. Rename and upload to `/icons/` folder

## Create Your Own (Simple Text Icon)

If you want a quick text-based icon:

1. Open `icon-generator.html` (included in this folder) in a browser
2. Right-click on the generated images
3. Save as `icon-192.png` and `icon-512.png`
4. Upload to `/icons/` folder

## Use Your Restaurant Logo

If you have a logo:

1. Open in any image editor (GIMP, Photoshop, Canva, etc.)
2. Resize to 192x192px (save as `icon-192.png`)
3. Resize to 512x512px (save as `icon-512.png`)
4. Make sure background is not transparent (use solid color)
5. Upload to `/icons/` folder

## Quick Test

After creating icons, check they work:
1. Navigate to your icon URL: `https://recordkeeping.hotlikeamexican.com/icons/icon-192.png`
2. Should display your icon

## Recommended Design

For a compliance app:
- Simple and professional
- High contrast (easy to see on tablet)
- Recognizable at small sizes
- Red/white color scheme (matches your restaurant)
- Could use: 🌶️ emoji, "MPI" text, or clipboard icon
