import { NextResponse } from 'next/server'
import { getSetting, updateSetting } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Check if user is authenticated
async function checkAuth() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin_auth')
  return authCookie?.value === 'authenticated'
}

// GET - Retrieve settings
export async function GET(request: Request) {
  try {
    const authenticated = await checkAuth()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const value = getSetting(key)
      return NextResponse.json({ key, value })
    }

    // Return all settings (you can filter sensitive ones)
    return NextResponse.json({
      admin_phone: getSetting('admin_phone') || '',
      admin_email: getSetting('admin_email') || '',
      price_per_bottle: getSetting('price_per_bottle') || '2000',
      pickup_address: getSetting('pickup_address') || '',
    })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update a setting
export async function PATCH(request: Request) {
  try {
    const authenticated = await checkAuth()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Validate admin_phone format if updating phone
    if (key === 'admin_phone' && value) {
      const cleanPhone = value.replace(/\D/g, '')
      if (!cleanPhone.startsWith('234') || cleanPhone.length < 12 || cleanPhone.length > 13) {
        return NextResponse.json(
          { error: 'Invalid phone format. Expected: 234XXXXXXXXXX' },
          { status: 400 }
        )
      }
      updateSetting(key, cleanPhone)
    } else {
      updateSetting(key, value.toString())
    }

    return NextResponse.json({ success: true, key, value: getSetting(key) })
  } catch (error: any) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update setting' },
      { status: 500 }
    )
  }
}

