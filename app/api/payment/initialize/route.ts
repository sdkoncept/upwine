import { NextResponse } from 'next/server'
import { initializePaystackPayment, generatePaymentReference } from '@/lib/paystack'
import { getOrder, updateOrderPayment } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_number, email } = body

    if (!order_number || !email) {
      return NextResponse.json(
        { error: 'Order number and email are required' },
        { status: 400 }
      )
    }

    // Get order details
    const order = await getOrder(order_number)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.payment_method !== 'online') {
      return NextResponse.json(
        { error: 'Order is not set for online payment' },
        { status: 400 }
      )
    }

    // Generate payment reference
    const paymentReference = generatePaymentReference(order_number)

    // Initialize Paystack payment
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/callback`
    
    const paystackResponse = await initializePaystackPayment({
      email,
      amount: order.total_amount * 100, // Convert to kobo
      reference: paymentReference,
      callback_url: callbackUrl,
      metadata: {
        order_number: order_number,
        customer_name: order.customer_name,
        phone: order.phone,
      },
    })

    // Update order with Paystack reference
    await updateOrderPayment(order_number, 'pending', paystackResponse.data.reference)

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
    })
  } catch (error: any) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}

