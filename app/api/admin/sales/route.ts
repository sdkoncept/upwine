import { NextResponse } from 'next/server'
import { getSalesStats, getSalesByDate, getOrdersForExport } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | 'year' | null
    const exportData = searchParams.get('export') === 'true'

    if (exportData) {
      // Return orders for CSV export
      const orders = getOrdersForExport(startDate || undefined, endDate || undefined)
      return NextResponse.json({ orders })
    }

    // Get statistics
    const stats = getSalesStats(startDate || undefined, endDate || undefined)

    // Get sales by date if date range is provided
    let salesByDate: any[] = []
    if (startDate && endDate) {
      salesByDate = getSalesByDate(
        startDate,
        endDate,
        groupBy || 'day'
      )
    }

    return NextResponse.json({
      stats: {
        total_orders: stats.total_orders || 0,
        total_bottles_sold: stats.total_bottles_sold || 0,
        total_revenue: stats.total_revenue || 0,
        paid_revenue: stats.paid_revenue || 0,
        cod_revenue: stats.cod_revenue || 0,
        online_revenue: stats.online_revenue || 0,
      },
      salesByDate,
    })
  } catch (error) {
    console.error('Error fetching sales data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}

