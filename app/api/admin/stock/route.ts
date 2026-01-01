import { NextResponse } from 'next/server'
import { resetWeeklyStock, getCurrentStock, updateSetting } from '@/lib/db'

export async function GET() {
  try {
    const stock = await getCurrentStock()
    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bottles } = body

    if (!bottles || bottles < 0) {
      return NextResponse.json(
        { error: 'Valid bottle count is required' },
        { status: 400 }
      )
    }

    await resetWeeklyStock(bottles)
    
    return NextResponse.json({ success: true, bottles })
  } catch (error) {
    console.error('Error resetting stock:', error)
    return NextResponse.json(
      { error: 'Failed to reset stock' },
      { status: 500 }
    )
  }
}

