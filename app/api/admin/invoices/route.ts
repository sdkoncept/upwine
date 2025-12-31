import { NextResponse } from 'next/server'
import { createInvoice, getInvoices } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const invoices = getInvoices(status || undefined)
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      notes,
      due_date,
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

    const invoice = createInvoice({
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      address: address?.trim(),
      quantity,
      price_per_bottle,
      delivery_fee: delivery_fee || 0,
      discount: discount || 0,
      notes: notes?.trim(),
      due_date,
    })

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
