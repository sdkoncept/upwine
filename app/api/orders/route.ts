import { NextResponse } from 'next/server'
import { createOrder, getOrders } from '@/lib/db'
import { sendWhatsAppMessage, formatOrderConfirmation, formatAdminNotification } from '@/lib/whatsapp'
import { getSetting } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customer_name,
      phone,
      email,
      address,
      quantity,
      delivery_type,
      delivery_fee,
      payment_method,
    } = body

    // Validate required fields
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    if (!delivery_type || !['pickup', 'delivery'].includes(delivery_type)) {
      return NextResponse.json(
        { error: 'Invalid delivery type' },
        { status: 400 }
      )
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }

    // For delivery orders, address is required
    if (delivery_type === 'delivery' && (!address || !address.trim())) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    // Normalize address - use null for pickup orders
    const normalizedAddress = delivery_type === 'pickup' 
      ? null 
      : (address?.trim() || null)

    // Create order
    const { orderNumber, totalAmount } = createOrder({
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: normalizedAddress,
      quantity,
      delivery_type,
      delivery_fee: delivery_fee || 0,
      payment_method,
    })

    // Get order details for notifications
    const order = {
      order_number: orderNumber,
      customer_name,
      phone,
      quantity,
      total_amount: totalAmount,
      delivery_type,
      address,
      payment_method,
    }

    // Send WhatsApp confirmation to customer (only for COD, online payment sends receipt after payment)
    if (payment_method === 'cod') {
      try {
        const customerMessage = formatOrderConfirmation(order)
        await sendWhatsAppMessage(phone, customerMessage)
      } catch (error) {
        console.error('Error sending customer WhatsApp:', error)
        // Don't fail the order if WhatsApp fails
      }
    }

    // Send WhatsApp notification to admin
    try {
      const adminPhone = getSetting('admin_phone')
      if (adminPhone) {
        const adminMessage = formatAdminNotification(order)
        await sendWhatsAppMessage(adminPhone, adminMessage)
      }
    } catch (error) {
      console.error('Error sending admin WhatsApp:', error)
      // Don't fail the order if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      total_amount: totalAmount,
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const orders = getOrders(status || undefined)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

