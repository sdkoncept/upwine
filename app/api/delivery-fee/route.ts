import { NextResponse } from 'next/server'
import { calculateDeliveryFee } from '@/lib/delivery'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      )
    }

    const result = await calculateDeliveryFee(address)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculating delivery fee:', error)
    return NextResponse.json(
      { error: 'Failed to calculate delivery fee', fee: 1000, distance: null },
      { status: 500 }
    )
  }
}

