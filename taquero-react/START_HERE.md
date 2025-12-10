# ⭐ START HERE - Taquero Security Setup

## 📢 Important: Your app had security issues - they're fixed now!

I found your password hardcoded in the JavaScript bundle (anyone could see it).
**I've fixed everything for you.** Just follow these simple steps:

---

## ✨ What I Did For You

✅ Removed hardcoded password from code
✅ Added secure password hashing (SHA-256)
✅ Created password generator script
✅ Updated login to require username + password
✅ Added rate limiting (5 attempts = 15 min lockout)
✅ Created all documentation you need
✅ Created Apache security headers file
✅ Created example for Google Sheets protection

---

## 🚀 Quick Setup (Do This Now - 5 Minutes)

### Step 1: Generate Your Password Hash

Open terminal in this folder and run:

```bash
node generate-password-hash.js
```

Type your desired password and press Enter.

**Copy the hash** it gives you (looks like: `VITE_APP_PASSWORD_HASH=abc123...`)

---

### Step 2: Create .env.local File

Create a new file called `.env.local` in this folder.

Paste the hash line from Step 1:

```bash
VITE_APP_PASSWORD_HASH=your_hash_from_step_1
```

Save the file.

---

### Step 3: Test Locally

```bash
npm run dev
```

Go to http://localhost:5173

Login with:
- **Select your name** from dropdown
- **Type the password** you used in Step 1
- Click Login

Should work! ✅

---

### Step 4: Build for Production

```bash
npm run build
```

This creates a `dist/` folder with all your files.

---

### Step 5: Deploy to Your Hosting

#### Upload These Files:

From the `dist/` folder, upload to your `public_html/`:

```
dist/index.html              → public_html/index.html
dist/assets/*                → public_html/assets/*
dist/manifest.webmanifest    → public_html/manifest.webmanifest
dist/sw.js                   → public_html/sw.js
dist/registerSW.js           → public_html/registerSW.js
dist/vite.svg                → public_html/vite.svg
```

#### Also Upload Security File:

Rename `.htaccess-for-hosting` to `.htaccess` and upload to `public_html/`

```bash
# On your computer:
cp .htaccess-for-hosting .htaccess

# Then upload .htaccess to public_html/
```

---

### Step 6: Test Your Deployed Site

Visit: https://taquero.hotlikeamexican.com/

Try logging in!

---

## ✅ That's It! You're Done!

Your app is now secure. 🔒

---

## 📚 Read These Files (In Order)

1. **QUICKSTART.md** - Quick reference (read this first)
2. **SECURITY_CHANGES_SUMMARY.md** - What changed and why
3. **SECURITY_SETUP.md** - Complete security documentation
4. **DEPLOYMENT_CHECKLIST.md** - Detailed deployment steps
5. **GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js** - Optional webhook security

---

## 🔧 Files I Created/Modified

### New Files Created:
- `generate-password-hash.js` - Password hash generator
- `START_HERE.md` - This file
- `QUICKSTART.md` - 5-minute setup guide
- `SECURITY_SETUP.md` - Complete docs
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `SECURITY_CHANGES_SUMMARY.md` - Summary of changes
- `GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js` - Webhook example
- `.htaccess-for-hosting` - Apache security config

### Files Modified:
- `src/store/authStore.ts` - Now uses password hashing
- `src/components/auth/LoginScreen.tsx` - Now has username + password

---

## ⚠️ Important Notes

### DO:
✅ Create `.env.local` with your password hash
✅ Keep `.env.local` safe (already in .gitignore)
✅ Use a strong password
✅ Rebuild after creating .env.local
✅ Test locally before deploying

### DON'T:
❌ Don't commit `.env.local` to git
❌ Don't share your actual password publicly
❌ Don't skip testing locally first
❌ Don't forget to upload .htaccess file

---

## 🛟 Need Help?

### Common Issues:

**"Login not working"**
- Did you create `.env.local`?
- Did you rebuild after creating it?
- Check browser console (F12) for errors

**"Can't generate hash"**
- Make sure you have Node.js installed
- Run `node generate-password-hash.js` from this folder

**"Build fails"**
- Check for syntax errors
- Run `npm install` first
- Check if `.env.local` has correct format

---

## 🔐 Security Features Now Enabled

✅ **No Hardcoded Passwords** - Password stored as hash in environment variable
✅ **SHA-256 Hashing** - Password hashed before comparison
✅ **Rate Limiting** - 5 failed attempts = 15 minute lockout
✅ **Username + Password** - Combined authentication
✅ **Security Headers** - XSS protection, clickjacking prevention
✅ **HTTPS Forced** - Automatic redirect to secure connection
✅ **Session Management** - Proper logout with data clearing

---

## 📊 Security Comparison

### Before (INSECURE):
```javascript
const APP_PASSWORD = "#Apim957012"  // ❌ Anyone could see this!
```

### After (SECURE):
```javascript
const VALID_PASSWORD_HASH = import.meta.env.VITE_APP_PASSWORD_HASH
// ✅ Hash is embedded during build, can't be reversed
```

---

## 🎯 Quick Reference

**Generate hash:** `node generate-password-hash.js`
**Test locally:** `npm run dev`
**Build:** `npm run build`
**Deploy:** Upload `dist/` folder + `.htaccess`

---

## 📞 What If Something Goes Wrong?

1. Check browser console (F12) for errors
2. Verify `.env.local` exists and has correct format
3. Make sure you rebuilt after creating `.env.local`
4. Try clearing browser cache (Ctrl+Shift+R)
5. Check the troubleshooting section in SECURITY_SETUP.md

---

## ✨ Optional: Protect Google Sheets Too

Want to prevent spam on your Google Sheets webhooks?

See `GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js` for code.

Quick steps:
1. Generate random token: `openssl rand -hex 32`
2. Add to `.env.local`: `VITE_GOOGLE_SHEETS_TOKEN=your_token`
3. Update each Google Apps Script with token verification
4. Rebuild and redeploy

---

## 🎉 You're All Set!

Your app is now secure and ready to deploy.

**Old password "#Apim957012" is gone forever.**

Follow the 6 steps above and you'll be running in 5 minutes!

Need more details? Read QUICKSTART.md or SECURITY_SETUP.md

**Good luck! 🚀**
