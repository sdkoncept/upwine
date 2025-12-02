#!/usr/bin/env node

/**
 * Test WhatsApp sending directly
 */

require('dotenv').config({ path: '.env.local' });

const { sendWhatsAppMessage, formatAdminNotification } = require('../lib/whatsapp');

async function test() {
  console.log('🧪 Testing WhatsApp Configuration...\n');
  
  // Check env vars
  console.log('Environment Variables:');
  console.log(`  WHATSAPP_SERVICE: ${process.env.WHATSAPP_SERVICE || 'NOT SET'}`);
  console.log(`  TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET'}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET'}`);
  console.log(`  TWILIO_WHATSAPP_FROM: ${process.env.TWILIO_WHATSAPP_FROM || 'NOT SET'}`);
  console.log('');

  const adminPhone = '2347061350647';
  const testOrder = {
    order_number: 'TEST001',
    customer_name: 'Test Customer',
    phone: '2348123456789',
    quantity: 1,
    total_amount: 1200,
    delivery_type: 'pickup',
    payment_method: 'cod'
  };

  const message = formatAdminNotification(testOrder);
  
  console.log('Sending test message to:', adminPhone);
  console.log('Message:', message);
  console.log('');

  try {
    await sendWhatsAppMessage(adminPhone, message);
    console.log('✅ Message sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

test();

