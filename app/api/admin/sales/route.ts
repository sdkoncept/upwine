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
      const orders = await getOrdersForExport(startDate || undefined, endDate || undefined)
      return NextResponse.json({ orders })
    }

    // Get statistics
    const stats = await getSalesStats(startDate || undefined, endDate || undefined)

    // Get sales by date - use last 30 days if no range provided
    let salesByDate: any[] = []
    const now = new Date()
    const defaultEndDate = now.toISOString().split('T')[0]
    const defaultStartDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0]
    
    salesByDate = await getSalesByDate(
      startDate || defaultStartDate,
      endDate || defaultEndDate,
      groupBy || 'day'
    )

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

