// Receipt generation and sending

import { getOrder } from './db'
import { sendWhatsAppMessage } from './whatsapp'

export interface ReceiptData {
  order_number: string
  customer_name: string
  phone: string
  email?: string
  quantity: number
  total_amount: number
  delivery_fee: number
  delivery_type: string
  address?: string
  payment_method: string
  payment_status: string
  created_at: string
}

/**
 * Generate receipt text
 */
export function generateReceiptText(order: ReceiptData): string {
  const date = new Date(order.created_at).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  let receipt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  receipt += `        🍷 UPWINE RECEIPT 🍷\n`
  receipt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  receipt += `Order Number: ${order.order_number}\n`
  receipt += `Date: ${date}\n\n`
  receipt += `Customer Details:\n`
  receipt += `Name: ${order.customer_name}\n`
  receipt += `Phone: ${order.phone}\n`
  if (order.email) {
    receipt += `Email: ${order.email}\n`
  }
  receipt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  receipt += `Order Details:\n`
  receipt += `Product: Fresh Natural Palm Wine (1L)\n`
  receipt += `Quantity: ${order.quantity} bottle(s)\n`
  receipt += `Price per bottle: ₦2,000\n`
  
  const subtotal = order.total_amount - order.delivery_fee
  receipt += `Subtotal: ₦${subtotal.toLocaleString()}\n`
  
  if (order.delivery_fee > 0) {
    receipt += `Delivery Fee: ₦${order.delivery_fee.toLocaleString()}\n`
  }
  
  receipt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  receipt += `TOTAL: ₦${order.total_amount.toLocaleString()}\n`
  receipt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  receipt += `Delivery: ${order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}\n`
  if (order.delivery_type === 'pickup') {
    receipt += `Location: 24 Tony Anenih Avenue, G.R.A, Benin City\n`
  } else if (order.address) {
    receipt += `Address: ${order.address}\n`
  }
  
  receipt += `\nPayment Method: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}\n`
  receipt += `Payment Status: ${order.payment_status === 'paid' ? '✅ Paid' : 'Pending'}\n`
  
  receipt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  receipt += `Thank you for your order!\n`
  receipt += `We'll contact you soon for delivery.\n`
  receipt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`

  return receipt
}

/**
 * Send receipt to customer via WhatsApp
 */
export async function sendReceiptToCustomer(orderNumber: string): Promise<void> {
  const order = await getOrder(orderNumber)
  
  if (!order) {
    throw new Error('Order not found')
  }

  const receiptText = generateReceiptText(order)
  
  try {
    await sendWhatsAppMessage(order.phone, receiptText)
    
    // Also send to email if available (can be implemented later)
    if (order.email) {
      // Email sending can be added here
      console.log('Receipt email would be sent to:', order.email)
    }
  } catch (error) {
    console.error('Error sending receipt:', error)
    throw error
  }
}

/**
 * Generate receipt HTML for email (optional)
 */
export function generateReceiptHTML(order: ReceiptData): string {
  const date = new Date(order.created_at).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const subtotal = order.total_amount - order.delivery_fee

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2d5016; padding-bottom: 20px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .total { font-size: 24px; font-weight: bold; color: #2d5016; border-top: 2px solid #2d5016; padding-top: 10px; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🍷 UPWINE RECEIPT 🍷</h1>
        <p>Order Number: ${order.order_number}</p>
        <p>Date: ${date}</p>
      </div>
      
      <div class="section">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${order.customer_name}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        ${order.email ? `<p><strong>Email:</strong> ${order.email}</p>` : ''}
      </div>
      
      <div class="section">
        <h3>Order Details</h3>
        <p><strong>Product:</strong> Fresh Natural Palm Wine (1L)</p>
        <p><strong>Quantity:</strong> ${order.quantity} bottle(s)</p>
        <p><strong>Price per bottle:</strong> ₦2,000</p>
        <p><strong>Subtotal:</strong> ₦${subtotal.toLocaleString()}</p>
        ${order.delivery_fee > 0 ? `<p><strong>Delivery Fee:</strong> ₦${order.delivery_fee.toLocaleString()}</p>` : ''}
        <p class="total">Total: ₦${order.total_amount.toLocaleString()}</p>
      </div>
      
      <div class="section">
        <h3>Delivery Information</h3>
        <p><strong>Type:</strong> ${order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
        ${order.delivery_type === 'pickup' 
          ? '<p><strong>Location:</strong> 24 Tony Anenih Avenue, G.R.A, Benin City</p>'
          : order.address ? `<p><strong>Address:</strong> ${order.address}</p>` : ''
        }
      </div>
      
      <div class="section">
        <p><strong>Payment Method:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status === 'paid' ? '✅ Paid' : 'Pending'}</p>
      </div>
      
      <div class="footer">
        <p>Thank you for your order!</p>
        <p>We'll contact you soon for delivery.</p>
        <p>Upwine - Fresh Natural Palm Wine from Our Farm</p>
      </div>
    </body>
    </html>
  `
}

