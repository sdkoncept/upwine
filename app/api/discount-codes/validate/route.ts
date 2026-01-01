import { NextResponse } from 'next/server'
import { validateDiscountCode } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, order_amount } = body

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    if (!order_amount || order_amount <= 0) {
      return NextResponse.json(
        { error: 'Valid order amount is required' },
        { status: 400 }
      )
    }

    const validation = await validateDiscountCode(code.trim(), parseFloat(order_amount))

    return NextResponse.json(validation)
  } catch (error: any) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate discount code', valid: false, discount: 0 },
      { status: 500 }
    )
  }
}
