// WhatsApp notification utility
// Supports multiple WhatsApp API services

export async function sendWhatsAppMessage(phone: string, message: string) {
  console.log('[WhatsApp] sendWhatsAppMessage called with phone:', phone);
  
  // Remove any non-digit characters and add country code if needed
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('234') ? cleanPhone : `234${cleanPhone.slice(1)}`;
  console.log('[WhatsApp] Formatted phone:', formattedPhone);

  // Check which WhatsApp service is configured
  const whatsappService = process.env.WHATSAPP_SERVICE || 'none';
  console.log('[WhatsApp] Service configured:', whatsappService);
  console.log('[WhatsApp] Environment check:', {
    WHATSAPP_SERVICE: process.env.WHATSAPP_SERVICE,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET',
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM || 'NOT SET'
  });
  
  try {
    switch (whatsappService.toLowerCase()) {
      case 'twilio':
        console.log('[WhatsApp] Attempting to send via Twilio...');
        return await sendViaTwilio(formattedPhone, message);
      case 'whatsapp-api':
        console.log('[WhatsApp] Attempting to send via WhatsApp API...');
        return await sendViaWhatsAppAPI(formattedPhone, message);
      case 'green-api':
        console.log('[WhatsApp] Attempting to send via Green API...');
        return await sendViaGreenAPI(formattedPhone, message);
      default:
        // Fallback: just log (for development/testing)
        console.log(`[WhatsApp] No service configured. Would send to ${formattedPhone}: ${message.substring(0, 50)}...`);
        return Promise.resolve();
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending WhatsApp message:', error);
    // Don't throw - we don't want to fail orders if WhatsApp fails
    return Promise.resolve();
  }
}

// Twilio WhatsApp API integration
async function sendViaTwilio(phone: string, message: string) {
  console.log('[WhatsApp/Twilio] Starting Twilio send...');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  console.log('[WhatsApp/Twilio] Credentials check:', {
    accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING',
    authToken: authToken ? 'SET' : 'MISSING',
    fromNumber: fromNumber || 'MISSING'
  });

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[WhatsApp/Twilio] Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM');
    return Promise.resolve();
  }

  try {
    console.log('[WhatsApp/Twilio] Importing Twilio library...');
    // Dynamic import to avoid requiring twilio if not used
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    console.log('[WhatsApp/Twilio] Creating message:', {
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:+${phone}`,
      messageLength: message.length
    });

    const result = await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:+${phone}`,
      body: message
    });

    console.log(`[WhatsApp/Twilio] ✅ Message sent successfully! SID: ${result.sid}`);
    console.log(`[WhatsApp/Twilio] Message sent via Twilio to +${phone}`);
  } catch (error: any) {
    console.error('[WhatsApp/Twilio] ❌ Error sending message:', error.message);
    console.error('[WhatsApp/Twilio] Full error:', error);
    throw error; // Re-throw so it's caught by outer try-catch
  }
}

// WhatsApp Business API (via Meta/Facebook)
async function sendViaWhatsAppAPI(phone: string, message: string) {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiUrl || !apiToken || !phoneNumberId) {
    console.warn('WhatsApp API credentials not configured');
    return Promise.resolve();
  }

  const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${error}`);
  }

  console.log(`WhatsApp message sent via WhatsApp API to +${phone}`);
}

// Green API (alternative WhatsApp API service)
async function sendViaGreenAPI(phone: string, message: string) {
  const apiUrl = process.env.GREEN_API_URL || 'https://api.green-api.com';
  const idInstance = process.env.GREEN_API_ID_INSTANCE;
  const apiTokenInstance = process.env.GREEN_API_TOKEN_INSTANCE;

  if (!idInstance || !apiTokenInstance) {
    console.warn('Green API credentials not configured');
    return Promise.resolve();
  }

  const response = await fetch(`${apiUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId: `${phone}@c.us`,
      message: message
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Green API error: ${error}`);
  }

  console.log(`WhatsApp message sent via Green API to +${phone}`);
}

export function formatOrderConfirmation(order: {
  order_number: string;
  customer_name: string;
  quantity: number;
  total_amount: number;
  delivery_type: string;
  address?: string;
  payment_method: string;
}) {
  const pickupAddress = '24 Tony Anenih Avenue, G.R.A, Benin City';
  
  let message = `🎉 Order Confirmed!\n\n`;
  message += `Order Number: ${order.order_number}\n`;
  message += `Customer: ${order.customer_name}\n`;
  message += `Quantity: ${order.quantity} bottle(s)\n`;
  message += `Total: ₦${order.total_amount.toLocaleString()}\n`;
  message += `Payment: ${order.payment_method}\n\n`;
  
  if (order.delivery_type === 'pickup') {
    message += `📍 Pickup Location:\n${pickupAddress}\n`;
    message += `⏰ Pickup Hours: 10 AM - 6 PM\n`;
  } else {
    message += `🚚 Delivery Address:\n${order.address}\n`;
    message += `Our dispatch rider will contact you before delivery.\n`;
  }
  
  message += `\nThank you for choosing Upwine! 🍷`;
  
  return message;
}

export function formatAdminNotification(order: {
  order_number: string;
  customer_name: string;
  phone: string;
  quantity: number;
  total_amount: number;
  delivery_type: string;
  address?: string;
  payment_method: string;
}) {
  let message = `🆕 New Order Received!\n\n`;
  message += `Order #: ${order.order_number}\n`;
  message += `Customer: ${order.customer_name}\n`;
  message += `Phone: ${order.phone}\n`;
  message += `Quantity: ${order.quantity} bottle(s)\n`;
  message += `Total: ₦${order.total_amount.toLocaleString()}\n`;
  message += `Type: ${order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}\n`;
  message += `Payment: ${order.payment_method}\n`;
  
  if (order.delivery_type === 'delivery' && order.address) {
    message += `Address: ${order.address}\n`;
  }
  
  return message;
}

