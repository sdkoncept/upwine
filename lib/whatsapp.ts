// WhatsApp notification utility
// You'll need to integrate with a WhatsApp API service like Twilio, WhatsApp Business API, or a local service

export async function sendWhatsAppMessage(phone: string, message: string) {
  // Remove any non-digit characters and add country code if needed
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('234') ? cleanPhone : `234${cleanPhone.slice(1)}`;

  // TODO: Integrate with your WhatsApp API service
  // Example with Twilio WhatsApp API:
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const client = require('twilio')(accountSid, authToken);
  // 
  // await client.messages.create({
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:+${formattedPhone}`,
  //   body: message
  // });

  console.log(`WhatsApp message to ${formattedPhone}: ${message}`);
  
  // For now, return a promise that resolves (you can implement actual API call later)
  return Promise.resolve();
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

