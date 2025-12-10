#!/usr/bin/env node

/**
 * Test Password Hash
 *
 * This script helps you verify your password is correct
 */

import crypto from 'crypto';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

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
  console.log('\n🔍 Password Tester\n');

  // Read .env.local
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found!');
    console.log('   Run: node setup-wizard.js\n');
    rl.close();
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const hashMatch = envContent.match(/VITE_APP_PASSWORD_HASH=([a-f0-9]+)/);

  if (!hashMatch) {
    console.log('❌ Could not find VITE_APP_PASSWORD_HASH in .env.local\n');
    rl.close();
    return;
  }

  const storedHash = hashMatch[1];
  console.log('Stored hash:', storedHash.substring(0, 20) + '...\n');

  // Test password
  const password = await question('Enter password to test: ');
  const testHash = crypto.createHash('sha256').update(password).digest('hex');

  console.log('\nYour password hash:', testHash.substring(0, 20) + '...');
  console.log('Stored hash:       ', storedHash.substring(0, 20) + '...\n');

  if (testHash === storedHash) {
    console.log('✅ PASSWORD MATCHES! This password should work.\n');
    console.log('If login still fails:');
    console.log('1. Make sure you rebuilt: npm run dev');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Clear localStorage (F12 → Application → Local Storage)\n');
  } else {
    console.log('❌ PASSWORD DOES NOT MATCH!\n');
    console.log('The password you entered does not match the hash in .env.local');
    console.log('\nOptions:');
    console.log('1. Try a different password');
    console.log('2. Check DEPLOYMENT_INFO.txt for the correct password');
    console.log('3. Run setup-wizard.js again to create a new password\n');
  }

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
