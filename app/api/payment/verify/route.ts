import { NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { getOrderByPaystackReference, updateOrderPayment } from '@/lib/db'
import { sendReceiptToCustomer } from '@/lib/receipt'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { getSetting } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const verification = await verifyPaystackPayment(reference)

    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', verified: false },
        { status: 400 }
      )
    }

    // Find order by Paystack reference
    const order = await getOrderByPaystackReference(reference) as any

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found for this payment reference' },
        { status: 404 }
      )
    }

    // Verify amount matches
    const expectedAmount = order.total_amount * 100 // Convert to kobo
    if (verification.data.amount !== expectedAmount) {
      return NextResponse.json(
        { error: 'Payment amount mismatch' },
        { status: 400 }
      )
    }

    // Update order payment status
    await updateOrderPayment(order.order_number, 'paid', reference)

    // Send receipt to customer
    try {
      await sendReceiptToCustomer(order.order_number)
    } catch (error) {
      console.error('Error sending receipt:', error)
      // Don't fail the verification if receipt sending fails
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
      // Don't fail the verification if admin notification fails
    }

    return NextResponse.json({
      success: true,
      verified: true,
      order_number: order.order_number,
      message: 'Payment verified successfully',
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment', verified: false },
      { status: 500 }
    )
  }
}

