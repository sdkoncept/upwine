import { NextResponse } from 'next/server'
import { getOrder } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const order = getOrder(params.orderNumber)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

