import { NextResponse } from 'next/server'
import { getSetting, updateSetting } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = {
      price_per_bottle: getSetting('price_per_bottle') || '2000',
      weekly_stock: getSetting('weekly_stock') || '100',
      pickup_address: getSetting('pickup_address') || '24 Tony Anenih Avenue, G.R.A, Benin City',
      delivery_fee_min: getSetting('delivery_fee_min') || '800',
      delivery_fee_max: getSetting('delivery_fee_max') || '2200',
      admin_phone: getSetting('admin_phone') || '',
      admin_email: getSetting('admin_email') || '',
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const allowedKeys = [
      'price_per_bottle',
      'weekly_stock',
      'pickup_address',
      'delivery_fee_min',
      'delivery_fee_max',
      'admin_phone',
      'admin_email',
    ]

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updateSetting(key, body[key])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
