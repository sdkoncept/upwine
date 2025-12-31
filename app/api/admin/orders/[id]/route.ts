import { NextResponse } from 'next/server'
import { updateOrderStatus, getSetting, getOrder, getCurrentStock, resetWeeklyStock } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const dbPath = path.join(process.cwd(), 'upwine-data.json')

function loadDatabase() {
  if (fs.existsSync(dbPath)) {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  }
  return { orders: [], stock: [], settings: {}, nextOrderId: 1 }
}

function saveDatabase(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

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
    const db = loadDatabase()

    // Get the current order
    const order = db.orders.find((o: any) => o.id === orderId)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update payment status if provided
    if (payment_status) {
      order.payment_status = payment_status
      order.updated_at = new Date().toISOString()
    }

    // Update order status if provided
    if (status) {
      // If cancelling an order that wasn't already cancelled, restore stock
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const currentWeek = getWeekStartDate()
        const weekStock = db.stock.find((s: any) => s.week_start_date === currentWeek)
        if (weekStock) {
          weekStock.sold_bottles -= order.quantity
          weekStock.available_bottles += order.quantity
        }
      }

      order.status = status
      order.updated_at = new Date().toISOString()
    }

    saveDatabase(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
