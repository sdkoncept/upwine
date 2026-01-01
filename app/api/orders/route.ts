import { NextResponse } from 'next/server'
import { createOrder, getOrders, useDiscountCode, getDiscountCode, validateDiscountCode } from '@/lib/db'
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
      discount_code,
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

    // Handle discount code if provided
    let discountCodeId: number | undefined
    let discountAmount = 0
    
    if (discount_code && discount_code.trim()) {
      try {
        const pricePerBottle = parseInt(await getSetting('price_per_bottle') || '2000')
        const orderSubtotal = quantity * pricePerBottle
        const orderTotal = orderSubtotal + (delivery_fee || 0)
        
        // Validate discount code
        const validation = await validateDiscountCode(discount_code.trim(), orderTotal)
        
        if (validation.valid) {
          const discountCodeData = await getDiscountCode(discount_code.trim())
          if (discountCodeData) {
            discountCodeId = discountCodeData.id
            discountAmount = validation.discount
            // Mark discount code as used
            await useDiscountCode(discount_code.trim())
          }
        } else {
          // Discount code invalid - don't fail order, just log
          console.warn('Invalid discount code provided:', validation.error)
        }
      } catch (error) {
        console.error('Error processing discount code:', error)
        // Don't fail the order if discount code processing fails
      }
    }

    // Create order
    const { orderNumber, totalAmount } = await createOrder({
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: normalizedAddress,
      quantity,
      delivery_type,
      delivery_fee: delivery_fee || 0,
      payment_method,
      discount_code_id: discountCodeId,
      discount_amount: discountAmount,
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
      console.log('[Order API] Sending customer WhatsApp for COD order...');
      try {
        const customerMessage = formatOrderConfirmation(order)
        console.log('[Order API] Customer message formatted, sending to:', phone);
        await sendWhatsAppMessage(phone, customerMessage)
        console.log('[Order API] Customer WhatsApp sent successfully');
      } catch (error) {
        console.error('[Order API] Error sending customer WhatsApp:', error)
        // Don't fail the order if WhatsApp fails
      }
    } else {
      console.log('[Order API] Skipping customer WhatsApp (not COD)');
    }

    // Send WhatsApp notification to admin
    console.log('[Order API] Sending admin WhatsApp notification...');
    try {
      const adminPhone = await getSetting('admin_phone')
      console.log('[Order API] Admin phone from DB:', adminPhone);
      if (adminPhone) {
        const adminMessage = formatAdminNotification(order)
        console.log('[Order API] Admin message formatted, sending to:', adminPhone);
        await sendWhatsAppMessage(adminPhone, adminMessage)
        console.log('[Order API] Admin WhatsApp sent successfully');
      } else {
        console.warn('[Order API] Admin phone not set in database!');
      }
    } catch (error) {
      console.error('[Order API] Error sending admin WhatsApp:', error)
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
    
    const orders = await getOrders(status || undefined)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

