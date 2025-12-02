#!/usr/bin/env node

/**
 * Script to set admin phone number
 * Usage: node scripts/set-admin-phone.js 2348123456789
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'upwine.db');
const db = new Database(dbPath);

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('Usage: node scripts/set-admin-phone.js <phone_number>');
  console.error('Example: node scripts/set-admin-phone.js 2348123456789');
  console.error('\nFormat: 234XXXXXXXXXX (Nigeria country code + phone without leading 0)');
  process.exit(1);
}

// Validate phone format (should be 234XXXXXXXXXX)
const cleanPhone = phoneNumber.replace(/\D/g, '');
if (!cleanPhone.startsWith('234') || cleanPhone.length < 12 || cleanPhone.length > 13) {
  console.error('Invalid phone format. Expected: 234XXXXXXXXXX');
  console.error('Example: 2348123456789 (Nigeria country code + phone number)');
  process.exit(1);
}

try {
  // Update admin phone in settings
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run('admin_phone', cleanPhone);
  
  console.log(`✅ Admin phone number set successfully!`);
  console.log(`   Phone: +${cleanPhone}`);
  console.log(`\nYou will now receive WhatsApp notifications at this number when orders are placed.`);
} catch (error) {
  console.error('❌ Error setting admin phone:', error.message);
  process.exit(1);
} finally {
  db.close();
}

