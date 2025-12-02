'use client'

import { useEffect, useState } from 'react'

interface SalesStats {
  total_orders: number
  total_bottles_sold: number
  total_revenue: number
  paid_revenue: number
  cod_revenue: number
  online_revenue: number
}

interface SalesByDate {
  date: string
  orders_count: number
  bottles_sold: number
  revenue: number
}

export default function SalesDashboard() {
  const [stats, setStats] = useState<SalesStats>({
    total_orders: 0,
    total_bottles_sold: 0,
    total_revenue: 0,
    paid_revenue: 0,
    cod_revenue: 0,
    online_revenue: 0,
  })
  const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'year' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day')

  useEffect(() => {
    fetchSalesData()
  }, [dateFilter, customStartDate, customEndDate, groupBy])

  const getDateRange = () => {
    const now = new Date()
    let startDate = ''
    let endDate = now.toISOString().split('T')[0]

    switch (dateFilter) {
      case 'day':
        startDate = endDate
        break
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(now.getFullYear() - 1)
        startDate = yearAgo.toISOString().split('T')[0]
        break
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return { startDate: undefined, endDate: undefined }
        }
        startDate = customStartDate
        endDate = customEndDate
        break
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined }
    }

    return { startDate, endDate }
  }

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (dateFilter !== 'all') params.append('groupBy', groupBy)

      const res = await fetch(`/api/admin/sales?${params.toString()}`)
      const data = await res.json()
      setStats(data.stats)
      setSalesByDate(data.salesByDate || [])
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const { startDate, endDate } = getDateRange()
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `/api/admin/sales/export?${params.toString()}`
    window.open(url, '_blank')
  }

  const formatDate = (dateStr: string) => {
    if (groupBy === 'week') {
      return dateStr // Already formatted as YYYY-WWW
    }
    if (groupBy === 'year') {
      return dateStr
    }
    // For day and month, try to parse the date
    try {
      if (groupBy === 'day') {
        // Format: YYYY-MM-DD
        const [year, month, day] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      if (groupBy === 'month') {
        // Format: YYYY-MM
        const [year, month] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    } catch (e) {
      return dateStr
    }
    return dateStr
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </>
          )}

          {dateFilter !== 'all' && dateFilter !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-sm text-blue-600 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-blue-800">{stats.total_orders}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-600 mb-1">Bottles Sold</div>
          <div className="text-3xl font-bold text-green-800">{stats.total_bottles_sold}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-purple-800">₦{stats.total_revenue.toLocaleString()}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-sm text-yellow-600 mb-1">COD Revenue</div>
          <div className="text-3xl font-bold text-yellow-800">₦{stats.cod_revenue.toLocaleString()}</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="text-sm text-indigo-600 mb-1">Online Revenue</div>
          <div className="text-3xl font-bold text-indigo-800">₦{stats.online_revenue.toLocaleString()}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="text-sm text-emerald-600 mb-1">Paid Revenue</div>
          <div className="text-3xl font-bold text-emerald-800">₦{stats.paid_revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Sales Chart Table */}
      {dateFilter !== 'all' && salesByDate.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Sales Over Time</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bottles Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesByDate.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.orders_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.bottles_sold}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">₦{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading sales data...</div>
      )}

      {!loading && dateFilter === 'all' && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
          Select a date range to view sales breakdown
        </div>
      )}
    </div>
  )
}

