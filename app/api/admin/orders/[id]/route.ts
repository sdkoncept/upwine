import { NextResponse } from 'next/server'
import { updateOrderStatus, getOrderById, updateOrderPayment } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, payment_status } = body

    const orderId = parseInt(id)

    // Get the current order
    const order = await getOrderById(orderId)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const updates: any = { updated_at: new Date().toISOString() }

    // Update payment status if provided
    if (payment_status) {
      updates.payment_status = payment_status
    }

    // Update order status if provided
    if (status) {
      // If cancelling an order that wasn't already cancelled, restore stock
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const currentWeek = getWeekStartDate()
        if (supabase) {
          const { data: weekStock } = await supabase
            .from('stock')
            .select('*')
            .eq('week_start_date', currentWeek)
            .single()

          if (weekStock) {
            await supabase
              .from('stock')
              .update({
                sold_bottles: weekStock.sold_bottles - order.quantity,
                available_bottles: weekStock.available_bottles + order.quantity,
              })
              .eq('week_start_date', currentWeek)
          }
        }
      }

      updates.status = status
    }

    await updateOrderStatus(orderId, updates.status || order.status)
    
    if (updates.payment_status) {
      await updateOrderPayment(order.order_number, updates.payment_status)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
