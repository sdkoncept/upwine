import { NextResponse } from 'next/server'
import { getOrdersForExport } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const orders = await getOrdersForExport(startDate || undefined, endDate || undefined)

    // Convert to CSV
    const headers = [
      'Order Number',
      'Customer Name',
      'Phone',
      'Email',
      'Quantity',
      'Total Amount',
      'Delivery Fee',
      'Delivery Type',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Date Created'
    ]

    const csvRows = [
      headers.join(','),
      ...orders.map(order => [
        order.order_number,
        `"${order.customer_name.replace(/"/g, '""')}"`,
        order.phone,
        order.email || '',
        order.quantity,
        order.total_amount,
        order.delivery_fee,
        order.delivery_type,
        order.payment_method,
        order.payment_status,
        order.status,
        order.created_at
      ].join(','))
    ]

    const csv = csvRows.join('\n')

    // Generate filename with date range
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : 'all_time'
    const filename = `upwine_sales_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting sales data:', error)
    return NextResponse.json(
      { error: 'Failed to export sales data' },
      { status: 500 }
    )
  }
}

