import { NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { getOrderByPaystackReference, updateOrderPayment } from '@/lib/db'
import { sendReceiptToCustomer } from '@/lib/receipt'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { getSetting } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature (Paystack security)
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(body))
      .digest('hex')

    const signature = request.headers.get('x-paystack-signature')
    
    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = body.event
    const data = body.data

    // Handle successful payment
    if (event === 'charge.success') {
      const reference = data.reference

      // Verify payment with Paystack
      const verification = await verifyPaystackPayment(reference)

      if (verification.status && verification.data.status === 'success') {
        // Find order by Paystack reference
        const order = await getOrderByPaystackReference(reference)

        if (order && order.payment_status !== 'paid') {
          // Update order payment status
          await updateOrderPayment(order.order_number, 'paid', reference)

          // Send receipt to customer
          try {
            await sendReceiptToCustomer(order.order_number)
          } catch (error) {
            console.error('Error sending receipt:', error)
          }

          // Notify admin
          try {
            const adminPhone = await getSetting('admin_phone')
            if (adminPhone) {
              const adminMessage = `✅ Payment Successful!\n\n` +
                `Order #: ${order.order_number}\n` +
                `Customer: ${order.customer_name}\n` +
                `Amount: ₦${order.total_amount.toLocaleString()}\n` +
                `Payment Reference: ${reference}\n` +
                `\nReceipt has been sent to customer.`
              
              await sendWhatsAppMessage(adminPhone, adminMessage)
            }
          } catch (error) {
            console.error('Error notifying admin:', error)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
