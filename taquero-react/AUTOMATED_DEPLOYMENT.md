# Automated Deployment for Taquero

## One-Time Setup (5 minutes)

### 1. Install lftp

```bash
sudo apt install -y lftp
```

### 2. Configure FTP Credentials

Edit the `.ftp-credentials` file:

```bash
nano .ftp-credentials
```

Change these values to your actual FTP credentials:

```bash
FTP_HOST="ftp.hotlikeamexican.com"
FTP_USER="your_actual_ftp_username"     # ← Change this
FTP_PASS="your_actual_ftp_password"     # ← Change this
FTP_REMOTE_DIR="/home/bebeauty/public_html/taquero"
```

**Note:** This file is in `.gitignore` and will NOT be committed to git.

---

## Deploy to Production (Every Time)

After making any code changes, just run:

```bash
./deploy.sh
```

That's it! The script will:
1. ✅ Build the production app
2. ✅ Upload changed files to your server
3. ✅ Skip unchanged files (fast!)
4. ✅ Preserve `.htaccess` on server

**Total time:** ~10-15 seconds

---

## Example Usage

```bash
# Make your code changes
nano src/pages/modules/FridgeTemps.tsx

# Deploy!
./deploy.sh
```

**Output:**
```
🌮 Taquero Deployment Script

📦 Building production app...
✓ built in 3.16s
✅ Build complete!

🚀 Uploading to server...
Transferring file `index.html'
Transferring file `assets/index-abc123.js'
✅ Deployment complete!
🌐 Visit: https://taquero.hotlikeamexican.com
```

---

## Troubleshooting

### "lftp: command not found"
```bash
sudo apt install -y lftp
```

### "FTP connection failed"
- Check your FTP credentials in `.ftp-credentials`
- Verify FTP_HOST is correct
- Try connecting manually: `ftp ftp.hotlikeamexican.com`

### ".ftp-credentials file not found"
```bash
cp .ftp-credentials.example .ftp-credentials
nano .ftp-credentials
# Fill in your actual FTP details
```

---

## Security Notes

- ✅ `.ftp-credentials` is in `.gitignore` (never committed)
- ✅ `.env.local` is in `.gitignore` (never committed)
- ⚠️ Keep these files backed up securely (password manager)
- ⚠️ Never share these files

---

## What Gets Uploaded

The script uploads **only the `dist/` folder contents** to:
```
/home/bebeauty/public_html/taquero/
```

**Files preserved on server:**
- `.htaccess` (not overwritten)
- `.htpasswd` (not overwritten)

**Files uploaded:**
- All contents of `dist/` folder
- Overwrites existing files
- Deletes removed files (mirrors exactly)

---

## Advanced: Deploy-Only Mode

If you've already built and just want to upload:

```bash
# Skip build, just upload
lftp -c "
source .ftp-credentials
set ftp:ssl-allow no
open -u \$FTP_USER,\$FTP_PASS \$FTP_HOST
mirror --reverse --delete --verbose --exclude .htaccess --exclude .htpasswd dist \$FTP_REMOTE_DIR
bye
"
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Build + Deploy |
| `npm run dev` | Test locally |
| `npm run build` | Build only |
| `npm run preview` | Preview production build locally |

---

**You're all set!** Just run `./deploy.sh` after any changes. 🚀
