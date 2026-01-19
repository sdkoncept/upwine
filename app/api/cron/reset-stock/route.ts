import { NextResponse } from 'next/server'
import { resetDailyStock } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// This endpoint can be called by a cron service (Railway, Vercel Cron, etc.) at midnight
// To use with Railway Cron: https://railway.app/cron
// To use with Vercel Cron: Add to vercel.json

export async function GET(request: Request) {
  try {
    // Optional: Add a secret token for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    // Check if authorized (optional security measure)
    if (authHeader !== `Bearer ${cronSecret}`) {
      // Allow without auth for now, but you can enable this for security
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stock amount from settings (default 100)
    const stockAmount = 100 // You can fetch from settings if needed

    const result = await resetDailyStock(stockAmount)

    return NextResponse.json({
      success: true,
      message: `Stock reset to ${stockAmount} bottles for ${result.date}`,
      date: result.date,
      bottles: result.bottles,
    })
  } catch (error: any) {
    console.error('Cron job error - failed to reset stock:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset stock',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
