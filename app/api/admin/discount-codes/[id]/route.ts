import { NextResponse } from 'next/server'
import { getDiscountCodeById, updateDiscountCode, deleteDiscountCode } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const code = getDiscountCodeById(parseInt(id))
    
    if (!code) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(code)
  } catch (error) {
    console.error('Error fetching discount code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const codeId = parseInt(id)
    const code = getDiscountCodeById(codeId)

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      )
    }

    // Validate if updating type/value
    if (body.type && !['percentage', 'fixed'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "fixed"' },
        { status: 400 }
      )
    }

    if (body.value !== undefined && body.value <= 0) {
      return NextResponse.json(
        { error: 'Discount value must be greater than 0' },
        { status: 400 }
      )
    }

    if (body.type === 'percentage' && body.value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Ensure code is uppercase if updating
    if (body.code) {
      body.code = body.code.toUpperCase()
    }

    const updated = updateDiscountCode(codeId, body)
    return NextResponse.json({ success: true, discount_code: updated })
  } catch (error) {
    console.error('Error updating discount code:', error)
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = deleteDiscountCode(parseInt(id))
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting discount code:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    )
  }
}
