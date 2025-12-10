# Taquero - Secure Deployment Guide for taquero.hotlikeamexican.com

**Last Updated:** 2025-12-01
**Target:** Shared Web Hosting (cPanel/Plesk)
**Domain:** taquero.hotlikeamexican.com

---

## Security Improvements Implemented

### ✅ What We've Done:
1. **Moved password to environment variables** - No longer hardcoded in source
2. **Moved all Google Sheets URLs to environment variables** - Protected from public view
3. **Added rate limiting to login** - 5 attempts, then 15-minute lockout
4. **Created `.env.example`** - Template for configuration

### 🔒 Additional Security (You Need to Implement):
- `.htaccess` protection (IP whitelist recommended)
- Cloudflare (highly recommended for bot protection)
- Regular security audits

---

## Pre-Deployment Checklist

### 1. Create `.env.local` File

Copy the example file and fill in your actual values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

```bash
# Application Password - CHANGE THIS TO A STRONG PASSWORD
VITE_APP_PASSWORD=YourStrongPasswordHere123!

# Google Sheets Webhook URLs - Get these from your Google Apps Scripts
VITE_TEMPERATURE_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_COOKING_BATCH_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_INCIDENTS_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_STAFF_SICKNESS_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_PROVING_METHODS_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_COMPLAINTS_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_ALLERGENS_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_SUPPLIERS_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_DELIVERIES_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_TRANSPORT_TEMP_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_B2B_SALES_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_CLEANING_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_EQUIPMENT_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_TRACEABILITY_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_COOLING_BATCH_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_PROVING_COOLING_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
VITE_PROVING_REHEATING_SHEET_URL=https://script.google.com/macros/s/YOUR_ACTUAL_URL_HERE/exec
```

**IMPORTANT:**
- `.env.local` is already in `.gitignore` and will NOT be committed to git
- Never share this file or commit it to version control
- Keep a backup copy in a secure location (password manager, encrypted drive)

---

## Build Process

### 2. Build the Production App

```bash
# Install dependencies (if not already done)
npm install

# Build with environment variables
npm run build
```

The build output will be in the `dist/` folder with your environment variables baked in.

**Note:** The fallback URLs in the code will only be used if environment variables are missing during build.

---

## Deployment to Shared Hosting

### 3. Upload Files via FTP/cPanel File Manager

**Option A: FTP (Recommended)**
1. Connect to your hosting via FTP (FileZilla, Cyberduck, etc.)
2. Navigate to the subdomain root: `/public_html/taquero/` (or similar)
3. Upload ALL contents of the `dist/` folder to the subdomain root
4. Ensure `index.html` is in the root of your subdomain

**Option B: cPanel File Manager**
1. Login to cPanel
2. Go to File Manager
3. Navigate to subdomain root
4. Upload `dist/` contents
5. Extract if uploaded as ZIP

**Files to upload:**
```
/public_html/taquero/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
├── fonts/
├── manifest.webmanifest
├── registerSW.js
├── sw.js
└── workbox-[hash].js
```

---

## Security Configuration

### 4. Create `.htaccess` File (CRITICAL)

Create a file named `.htaccess` in your subdomain root (`/public_html/taquero/.htaccess`):

#### **Option A: IP Whitelist (RECOMMENDED for restaurant-only access)**

Find your restaurant's public IP address:
```bash
# Visit this URL from restaurant or run:
curl ifconfig.me
```

Then create `.htaccess`:

```apache
# Taquero Security Configuration
# Allow only specific IP addresses

<RequireAll>
    # Replace with your actual IPs
    Require ip 123.456.789.000  # Restaurant public IP
    Require ip 987.654.321.000  # Your home IP (optional)
</RequireAll>

# Block common bots
RewriteEngine On
RewriteCond %{HTTP_USER_AGENT} (bot|crawler|spider|scraper) [NC]
RewriteRule .* - [F,L]

# Prevent directory listing
Options -Indexes

# Security headers
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "no-referrer-when-downgrade"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# Block access to sensitive files
<FilesMatch "\.(env|log|json|config)$">
    Require all denied
</FilesMatch>

# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# React Router - send all requests to index.html
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### **Option B: HTTP Basic Authentication (If IP whitelist not possible)**

If you need to access from multiple changing IPs (mobile, travel, etc.):

```apache
# Taquero Security Configuration
# HTTP Basic Authentication

AuthType Basic
AuthName "Taquero - Hot Like A Mexican"
AuthUserFile /home/youruser/.htpasswd
Require valid-user

# Block common bots
RewriteEngine On
RewriteCond %{HTTP_USER_AGENT} (bot|crawler|spider|scraper) [NC]
RewriteRule .* - [F,L]

# Prevent directory listing
Options -Indexes

# Security headers
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "no-referrer-when-downgrade"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# React Router
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Create `.htpasswd` file via SSH or cPanel:
```bash
htpasswd -c /home/youruser/.htpasswd taquero
# Enter password when prompted
```

---

### 5. Create `robots.txt` (Block Search Engines)

Create `/public_html/taquero/robots.txt`:

```
User-agent: *
Disallow: /
```

This prevents Google and other search engines from indexing your app.

---

## Additional Security (Highly Recommended)

### 6. Set Up Cloudflare (FREE)

Cloudflare provides excellent protection against bots and attacks:

1. **Sign up:** https://cloudflare.com (free plan)
2. **Add your domain:** hotlikeamexican.com
3. **Update nameservers** at your domain registrar
4. **Enable Bot Fight Mode:** Dashboard → Security → Bots
5. **Enable "Under Attack Mode"** if you see unusual traffic
6. **Set up firewall rules:**
   - Block countries (if only serving NZ)
   - Rate limiting (additional layer)
   - Challenge suspicious visitors

**Benefits:**
- DDoS protection
- Bot filtering
- CDN (faster loading)
- Free SSL
- Analytics

---

## Testing Deployment

### 7. Test Your Deployment

1. **Test from restaurant WiFi:**
   - Visit `https://taquero.hotlikeamexican.com`
   - Should load instantly (if IP whitelisted)
   - Login with your new password from `.env.local`

2. **Test from different location (should be blocked if using IP whitelist):**
   - Visit from mobile data or different WiFi
   - Should see "403 Forbidden" or HTTP auth prompt

3. **Test login rate limiting:**
   - Try 5 wrong passwords
   - Should be locked for 15 minutes

4. **Test modules:**
   - Navigate to different FCP modules
   - Submit a test record
   - Verify it appears in Google Sheets

---

## Updating the App

### 8. How to Deploy Updates

When you make changes to the code:

```bash
# 1. Make your code changes
# 2. Build with your .env.local
npm run build

# 3. Upload new dist/ contents via FTP
# (Overwrite existing files)

# 4. Clear browser cache and test
# Ctrl+Shift+R (hard refresh)
```

**ProTip:** Keep your `.env.local` file safe - you'll need it for every build!

---

## Troubleshooting

### Issue: "VITE_APP_PASSWORD is undefined"
**Solution:** Make sure `.env.local` exists and contains `VITE_APP_PASSWORD=...`

### Issue: 403 Forbidden Error
**Solution:** Your IP changed - update `.htaccess` with new IP

### Issue: Login not working
**Solution:** Check that you're using the password from `.env.local`, not the old hardcoded one

### Issue: Google Sheets not saving
**Solution:** Check that all `VITE_*_SHEET_URL` variables are set in `.env.local`

### Issue: React Router not working (404 on refresh)
**Solution:** Make sure the `.htaccess` RewriteRules are in place

---

## Security Maintenance

### Regular Tasks:

**Weekly:**
- Check hosting access logs for suspicious activity
- Verify Google Sheets are receiving data correctly

**Monthly:**
- Review Cloudflare analytics
- Update npm packages: `npm update`
- Rebuild and redeploy: `npm run build`

**Quarterly:**
- Change your password (update `.env.local` and rebuild)
- Review and update IP whitelist if changed
- Check for Vite/React updates

---

## Emergency Procedures

### If Site is Under Attack:
1. **Enable Cloudflare "Under Attack Mode"** (if using Cloudflare)
2. **Restrict `.htaccess` to single IP** (restaurant only)
3. **Check hosting logs** in cPanel
4. **Contact your hosting provider** if needed

### If Password Compromised:
1. **Update password** in `.env.local`
2. **Rebuild:** `npm run build`
3. **Redeploy** dist/ folder
4. **Clear all browser caches** at restaurant
5. **Inform staff** of new password

---

## Backup Strategy

### What to Backup:

1. **`.env.local`** - Keep encrypted copy in password manager
2. **`src/` folder** - Your code (should be in git)
3. **Google Sheets** - Already backed up by Google
4. **`.htaccess`** - Save a copy locally

### Where to Store Backups:
- Password manager (1Password, Bitwarden, etc.)
- Encrypted cloud storage (not public GitHub!)
- External hard drive (encrypted)

---

## Final Checklist

Before going live, verify:

- [ ] `.env.local` created with strong password
- [ ] All Google Sheets URLs configured in `.env.local`
- [ ] `npm run build` completed successfully
- [ ] All `dist/` files uploaded to hosting
- [ ] `.htaccess` created with IP whitelist or HTTP auth
- [ ] `robots.txt` created
- [ ] HTTPS is working (green padlock)
- [ ] Login works from restaurant WiFi
- [ ] Access blocked from other IPs (if using whitelist)
- [ ] Rate limiting works (5 attempts = lockout)
- [ ] At least one module tested end-to-end
- [ ] Google Sheets receiving data
- [ ] Cloudflare configured (recommended)
- [ ] Backups of `.env.local` stored securely

---

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review browser console for errors (F12)
3. Check hosting error logs in cPanel
4. Verify `.env.local` has all required variables
5. Test with development server: `npm run dev`

---

**Remember:** Security is layered. Use IP whitelist + Cloudflare + rate limiting + HTTPS for maximum protection.

**Good luck with your deployment! 🌮**
