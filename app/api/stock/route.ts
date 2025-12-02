import { NextResponse } from 'next/server'
import { getCurrentStock } from '@/lib/db'

export async function GET() {
  try {
    const stock = getCurrentStock()
    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}

