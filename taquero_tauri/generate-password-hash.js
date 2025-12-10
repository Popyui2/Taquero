#!/usr/bin/env node

/**
 * Password Hash Generator for Taquero App
 *
 * Run this script to generate a secure hash for your password:
 *   node generate-password-hash.js
 *
 * Then copy the hash to your .env.local file
 */

import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 Taquero Password Hash Generator\n');
console.log('This will generate a secure hash for your password.');
console.log('You will add this hash to your .env.local file.\n');

rl.question('Enter your desired password: ', (password) => {
  if (!password || password.length < 6) {
    console.error('\n❌ Password must be at least 6 characters long');
    rl.close();
    process.exit(1);
  }

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  console.log('\n✅ Password hash generated successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Copy this line to your .env.local file:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`VITE_APP_PASSWORD_HASH=${hash}\n`);
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Never commit .env.local to git (already in .gitignore)');
  console.log('2. Keep your password safe and secure');
  console.log('3. Change your password regularly');
  console.log('4. Store this hash in GitHub Secrets for deployment\n');

  rl.close();
});
