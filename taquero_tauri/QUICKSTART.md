# 🚀 Quick Start - Secure Taquero App (5 Minutes)

## What Changed?

Your app is now SECURE! No more hardcoded passwords visible to everyone.

---

## Step 1: Generate Password Hash (1 minute)

Run this in your terminal:

```bash
node generate-password-hash.js
```

Type your desired password and press Enter. You'll get output like this:

```
✅ Password hash generated successfully!

═══════════════════════════════════════════════════════════
Copy this line to your .env.local file:
═══════════════════════════════════════════════════════════

VITE_APP_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8

═══════════════════════════════════════════════════════════
```

---

## Step 2: Create .env.local File (30 seconds)

Create a file called `.env.local` in the project root and paste the hash:

```bash
VITE_APP_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

**Note:** Replace with YOUR actual hash from Step 1!

---

## Step 3: Test It (1 minute)

```bash
npm run dev
```

Go to http://localhost:5173

Try logging in:
- **Select your name** from dropdown (Martin, Andres, etc.)
- **Enter the password** you used in Step 1
- Click **Login**

✅ Should work!

Now try with WRONG password → Should fail ✅

---

## Step 4: Build & Deploy (2 minutes)

Build for production:

```bash
npm run build
```

Upload the `dist/` folder contents to your hosting at taquero.hotlikeamexican.com

**Done!** 🎉

---

## What's Secure Now?

✅ Password is hashed (not visible in code)
✅ Hash is in environment variable (not committed to git)
✅ Rate limiting (5 wrong attempts = locked for 15 minutes)
✅ Combined username + password authentication
✅ Session management

---

## Important Files Created

- `generate-password-hash.js` - Generates secure password hashes
- `SECURITY_SETUP.md` - Complete security documentation
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js` - Secure webhook example
- `QUICKSTART.md` - This file

---

## Files Modified

- `src/store/authStore.ts` - Now uses password hashing
- `src/components/auth/LoginScreen.tsx` - Now asks for username + password

---

## Need More Info?

- **Security Setup:** Read `SECURITY_SETUP.md`
- **Deployment:** Read `DEPLOYMENT_CHECKLIST.md`
- **Google Sheets Protection:** See `GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js`

---

## Changing Password Later

1. Run `node generate-password-hash.js` with new password
2. Update `.env.local` with new hash
3. Rebuild: `npm run build`
4. Redeploy

That's it!

---

## If You're Stuck

Check the browser console (F12) for errors. Most issues are:
- Forgot to create `.env.local`
- Forgot to rebuild after creating `.env.local`
- Typo in the hash (extra space, missing character)

---

**Your password is now secure! The old hardcoded "#Apim957012" is gone forever.** 🔒
