#!/usr/bin/env node

/**
 * Diagnostic script to check WhatsApp configuration
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking WhatsApp Configuration...\n');

// Check database
const dbPath = path.join(__dirname, '..', 'upwine.db');
let adminPhone = null;

try {
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_phone');
    adminPhone = result ? result.value : null;
    db.close();
  } else {
    console.log('❌ Database file not found:', dbPath);
  }
} catch (error) {
  console.log('❌ Error reading database:', error.message);
}

// Check environment variables
const whatsappService = process.env.WHATSAPP_SERVICE || 'none';
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;

console.log('📱 Configuration Status:');
console.log('─'.repeat(50));
console.log(`Admin Phone: ${adminPhone || '❌ NOT SET'}`);
console.log(`WhatsApp Service: ${whatsappService === 'none' ? '❌ NOT CONFIGURED' : `✅ ${whatsappService}`}`);

if (whatsappService === 'twilio') {
  console.log(`\nTwilio Configuration:`);
  console.log(`  Account SID: ${twilioAccountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Auth Token: ${twilioAuthToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  From Number: ${twilioFrom || '❌ Missing'}`);
}

console.log('\n' + '─'.repeat(50));

// Summary
const issues = [];

if (!adminPhone) {
  issues.push('Admin phone number is not set');
}

if (whatsappService === 'none') {
  issues.push('WHATSAPP_SERVICE environment variable is not set');
}

if (whatsappService === 'twilio') {
  if (!twilioAccountSid) issues.push('TWILIO_ACCOUNT_SID is missing');
  if (!twilioAuthToken) issues.push('TWILIO_AUTH_TOKEN is missing');
  if (!twilioFrom) issues.push('TWILIO_WHATSAPP_FROM is missing');
}

if (issues.length === 0) {
  console.log('✅ All configuration looks good!');
  console.log('\nIf messages still don\'t work:');
  console.log('1. Check server logs for WhatsApp errors');
  console.log('2. Verify Twilio sandbox is set up correctly');
  console.log('3. Make sure your phone number is added to Twilio sandbox');
} else {
  console.log('❌ Issues found:');
  issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  console.log('\n📖 See WHATSAPP_SETUP.md for setup instructions');
}

console.log('');

