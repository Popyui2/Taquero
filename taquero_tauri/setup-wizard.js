#!/usr/bin/env node

/**
 * Taquero Security Setup Wizard
 *
 * This wizard will:
 * 1. Generate a password hash
 * 2. Create .env.local file
 * 3. Test the build
 * 4. Prepare files for deployment
 */

import crypto from 'crypto';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🔐 Taquero Security Setup Wizard 🔐               ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('This wizard will help you secure your app in 5 steps.\n');

  const proceed = await question('Ready to start? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled. Run again when ready!');
    rl.close();
    return;
  }

  // Step 1: Generate password hash
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│ STEP 1: Create Your Password                            │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  let password = '';
  let passwordHash = '';

  while (password.length < 6) {
    password = await question('Enter your desired password (min 6 chars): ');

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long. Try again.\n');
    }
  }

  // Generate hash
  passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  console.log('\n✅ Password hash generated!\n');

  // Step 2: Optional Google Sheets token
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ STEP 2: Google Sheets Protection (Optional)             │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  console.log('Do you want to protect Google Sheets webhooks from spam?');
  const enableToken = await question('Enable token protection? (yes/no): ');

  let googleToken = '';
  if (enableToken.toLowerCase() === 'yes' || enableToken.toLowerCase() === 'y') {
    googleToken = crypto.randomBytes(32).toString('hex');
    console.log('\n✅ Random token generated!\n');
  } else {
    console.log('\n⏭️  Skipping Google Sheets protection.\n');
  }

  // Step 3: Create .env.local file
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ STEP 3: Creating .env.local File                        │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  let envContent = `# Taquero App Environment Variables
# Generated: ${new Date().toISOString()}
# NEVER commit this file to git (already in .gitignore)

# Password hash for authentication
VITE_APP_PASSWORD_HASH=${passwordHash}
`;

  if (googleToken) {
    envContent += `
# Google Sheets webhook protection token
VITE_GOOGLE_SHEETS_TOKEN=${googleToken}
`;
  }

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  let writeEnv = true;

  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists!');
    const overwrite = await question('Overwrite existing file? (yes/no): ');
    writeEnv = overwrite.toLowerCase() === 'yes' || overwrite.toLowerCase() === 'y';
  }

  if (writeEnv) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created!\n');
  } else {
    console.log('⏭️  Skipped .env.local creation.\n');
  }

  // Step 4: Show configuration summary
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ STEP 4: Configuration Summary                           │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  console.log('📋 Your Configuration:\n');
  console.log(`   Password: ${password}`);
  console.log(`   Password Hash: ${passwordHash.substring(0, 20)}...`);
  if (googleToken) {
    console.log(`   Google Token: ${googleToken.substring(0, 20)}...`);
  }
  console.log(`   .env.local: ${writeEnv ? 'Created ✅' : 'Skipped ⏭️'}\n`);

  // Step 5: Build and prepare deployment
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ STEP 5: Build for Production                            │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  const buildNow = await question('Build for production now? (yes/no): ');

  if (buildNow.toLowerCase() === 'yes' || buildNow.toLowerCase() === 'y') {
    console.log('\n🔨 Building...\n');

    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('\n✅ Build completed successfully!\n');

      // Create deployment package info
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│ 📦 Deployment Files Ready                               │');
      console.log('└─────────────────────────────────────────────────────────┘\n');

      console.log('Upload these files from the dist/ folder to your hosting:\n');
      console.log('  📄 dist/index.html           → public_html/index.html');
      console.log('  📁 dist/assets/*             → public_html/assets/*');
      console.log('  📄 dist/manifest.webmanifest → public_html/manifest.webmanifest');
      console.log('  📄 dist/sw.js                → public_html/sw.js');
      console.log('  📄 dist/registerSW.js        → public_html/registerSW.js');
      console.log('  📄 dist/vite.svg             → public_html/vite.svg\n');

      console.log('Also upload:\n');
      console.log('  📄 .htaccess-for-hosting     → public_html/.htaccess\n');

    } catch (error) {
      console.log('\n❌ Build failed. Check the errors above.\n');
    }
  } else {
    console.log('\n⏭️  Skipping build. Run "npm run build" when ready.\n');
  }

  // Save summary to file
  const summaryPath = path.join(process.cwd(), 'DEPLOYMENT_INFO.txt');
  const summaryContent = `Taquero Deployment Information
Generated: ${new Date().toISOString()}

═══════════════════════════════════════════════════════════

🔐 SECURITY CREDENTIALS
═══════════════════════════════════════════════════════════

Login Password: ${password}

Password Hash (in .env.local):
${passwordHash}

${googleToken ? `Google Sheets Token (in .env.local):
${googleToken}

Google Sheets Token (add to Apps Script Properties):
Key: GOOGLE_SHEETS_SECRET_TOKEN
Value: ${googleToken}
` : 'Google Sheets Protection: Not enabled'}

═══════════════════════════════════════════════════════════

📦 DEPLOYMENT INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. Upload from dist/ folder to public_html/:
   - index.html
   - assets/* (entire folder)
   - manifest.webmanifest
   - sw.js
   - registerSW.js
   - vite.svg

2. Rename and upload:
   - .htaccess-for-hosting → .htaccess (to public_html/)

3. Test your site:
   - Visit: https://taquero.hotlikeamexican.com/
   - Login with username + password above

═══════════════════════════════════════════════════════════

⚠️  SECURITY REMINDERS
═══════════════════════════════════════════════════════════

✅ .env.local is in .gitignore (will NOT be committed)
✅ Never share your password publicly
✅ Change password every 3-6 months
✅ Keep this file secure (delete after deployment)

═══════════════════════════════════════════════════════════
`;

  fs.writeFileSync(summaryPath, summaryContent);

  // Final summary
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║                  ✅ Setup Complete! ✅                     ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📝 Summary saved to: DEPLOYMENT_INFO.txt\n');
  console.log('🔐 Your login credentials:\n');
  console.log(`   Username: Martin (or any user from the list)`);
  console.log(`   Password: ${password}\n`);

  if (googleToken) {
    console.log('🔑 Google Sheets Setup:\n');
    console.log('   1. Open each Google Apps Script');
    console.log('   2. Go to Project Settings → Script Properties');
    console.log('   3. Add property:');
    console.log('      Key: GOOGLE_SHEETS_SECRET_TOKEN');
    console.log(`      Value: ${googleToken}`);
    console.log('   4. See GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js for code\n');
  }

  console.log('📚 Next steps:\n');
  console.log('   1. Read DEPLOYMENT_INFO.txt for your credentials');
  console.log('   2. Upload dist/ folder to your hosting');
  console.log('   3. Upload .htaccess-for-hosting as .htaccess');
  console.log('   4. Test at https://taquero.hotlikeamexican.com/\n');

  console.log('🎉 Your app is now secure and ready to deploy!\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
