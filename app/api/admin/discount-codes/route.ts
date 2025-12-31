import { NextResponse } from 'next/server'
import { createDiscountCode, getDiscountCodes } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    const codes = getDiscountCodes(activeOnly)
    return NextResponse.json(codes)
  } catch (error) {
    console.error('Error fetching discount codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      expires_at,
      description,
    } = body

    // Validate required fields
    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    if (!type || !['percentage', 'fixed'].includes(type)) {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "fixed"' },
        { status: 400 }
      )
    }

    if (value === undefined || value <= 0) {
      return NextResponse.json(
        { error: 'Discount value must be greater than 0' },
        { status: 400 }
      )
    }

    if (type === 'percentage' && value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    const discountCode = createDiscountCode({
      code: code.trim(),
      type,
      value: parseFloat(value),
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : undefined,
      max_uses: max_uses ? parseInt(max_uses) : undefined,
      expires_at: expires_at || undefined,
      description: description?.trim(),
    })

    return NextResponse.json({
      success: true,
      discount_code: discountCode,
    })
  } catch (error: any) {
    console.error('Error creating discount code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create discount code' },
      { status: 500 }
    )
  }
}
