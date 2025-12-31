'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: number
  order_number: string
  customer_name: string
  phone: string
  email?: string
  address?: string
  quantity: number
  delivery_fee: number
  total_amount: number
  delivery_type: string
  payment_method: string
  payment_status: string
  payment_reference?: string
  paystack_reference?: string
  status: string
  delivery_time?: string
  created_at: string
  updated_at?: string
}

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

interface Settings {
  price_per_bottle: string
  weekly_stock: string
  pickup_address: string
  delivery_fee_min: string
  delivery_fee_max: string
  admin_phone: string
  admin_email: string
}

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stock, setStock] = useState({ available_bottles: 100, total_bottles: 100 })
  const [newStock, setNewStock] = useState(100)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'stock' | 'sales' | 'settings'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Sales Dashboard State
  const [stats, setStats] = useState<SalesStats>({
    total_orders: 0,
    total_bottles_sold: 0,
    total_revenue: 0,
    paid_revenue: 0,
    cod_revenue: 0,
    online_revenue: 0,
  })
  const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([])
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'year' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day')
  
  // Settings State
  const [settings, setSettings] = useState<Settings>({
    price_per_bottle: '2000',
    weekly_stock: '100',
    pickup_address: '24 Tony Anenih Avenue, G.R.A, Benin City',
    delivery_fee_min: '800',
    delivery_fee_max: '2200',
    admin_phone: '',
    admin_email: '',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authenticated && activeTab === 'sales') {
      fetchSalesData()
    }
  }, [authenticated, activeTab, dateFilter, customStartDate, customEndDate, groupBy])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth')
      const data = await res.json()
      if (data.authenticated) {
        setAuthenticated(true)
        fetchData()
        fetchSettings()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setCheckingAuth(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, stockRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/admin/stock')
      ])
      const ordersData = await ordersRes.json()
      const stockData = await stockRes.json()
      setOrders(ordersData)
      setStock(stockData)
      setNewStock(stockData.total_bottles)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

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
    try {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (dateFilter !== 'all') params.append('groupBy', groupBy)

      const res = await fetch(`/api/admin/sales?${params.toString()}`)
      const data = await res.json()
      setStats(data.stats || {
        total_orders: 0,
        total_bottles_sold: 0,
        total_revenue: 0,
        paid_revenue: 0,
        cod_revenue: 0,
        online_revenue: 0,
      })
      setSalesByDate(data.salesByDate || [])
    } catch (error) {
      console.error('Error fetching sales data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
    } catch (error) {
      router.push('/admin/login')
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchData()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    }
  }

  const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus })
      })
      fetchData()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: paymentStatus })
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status')
    }
  }

  const cancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? This will return the bottles to stock.')) return
    
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      fetchData()
      setShowOrderDetails(false)
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order')
    }
  }

  const resetStock = async () => {
    if (!confirm(`Reset weekly stock to ${newStock} bottles?`)) return

    try {
      await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bottles: newStock })
      })
      alert('Stock reset successfully!')
      fetchData()
    } catch (error) {
      console.error('Error resetting stock:', error)
      alert('Failed to reset stock')
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSavingSettings(false)
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

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const calculateSubtotal = (order: Order) => {
    return order.total_amount - order.delivery_fee
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter)

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const confirmedOrders = orders.filter(o => o.status === 'confirmed')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  const formatDate = (dateStr: string) => {
    if (groupBy === 'week') return dateStr
    if (groupBy === 'year') return dateStr
    try {
      if (groupBy === 'day') {
        const [year, month, day] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      if (groupBy === 'month') {
        const [year, month] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    } catch (e) {
      return dateStr
    }
    return dateStr
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5a4a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return null
  }

  if (loading) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5a4a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2d5a4a]">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your Upwyne business</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4035] transition flex items-center gap-2"
            >
              <span>🔄</span> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-400">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-400">
            <div className="text-2xl font-bold text-blue-600">{confirmedOrders.length + completedOrders.length}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-400">
            <div className="text-2xl font-bold text-green-600">{deliveredOrders.length}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-[#2d5a4a]">
            <div className="text-2xl font-bold text-[#2d5a4a]">{stock.available_bottles}</div>
            <div className="text-sm text-gray-600">In Stock</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <nav className="flex overflow-x-auto">
            {[
              { key: 'orders', label: 'Orders', icon: '📋', count: orders.length },
              { key: 'stock', label: 'Stock', icon: '🍷' },
              { key: 'sales', label: 'Sales Analytics', icon: '📊' },
              { key: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 min-w-max px-6 py-4 font-medium text-sm transition flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-[#2d5a4a] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Filters */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Orders' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === filter.value
                        ? 'bg-[#2d5a4a] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="text-[#2d5a4a] font-medium hover:underline"
                          >
                            {order.order_number}
                          </button>
                          <div className="text-xs text-gray-500">
                            {order.delivery_type === 'pickup' ? '📍' : '🚚'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                          <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline">
                            {order.phone}
                          </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{order.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">₦{order.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.payment_method === 'cod' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.payment_method === 'cod' ? 'COD' : order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <Link
                              href={`/invoice/${order.order_number}`}
                              target="_blank"
                              className="text-green-600 hover:text-green-800"
                              title="View Invoice"
                            >
                              📄
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No orders found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🍷</span> Current Stock
              </h2>
              <div className="bg-gradient-to-br from-[#2d5a4a] to-[#3d6a5a] rounded-xl p-6 text-white mb-6">
                <div className="text-5xl font-bold mb-2">{stock.available_bottles}</div>
                <div className="text-[#a8d4c0]">bottles available this week</div>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[#a8d4c0]">Total</div>
                    <div className="font-semibold">{stock.total_bottles}</div>
                  </div>
                  <div>
                    <div className="text-[#a8d4c0]">Sold</div>
                    <div className="font-semibold">{stock.total_bottles - stock.available_bottles}</div>
                  </div>
                </div>
              </div>

              {/* Stock Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Stock Level</span>
                  <span className="font-medium text-[#2d5a4a]">
                    {Math.round((stock.available_bottles / stock.total_bottles) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2d5a4a] to-[#4a7c6a] rounded-full transition-all duration-500"
                    style={{ width: `${(stock.available_bottles / stock.total_bottles) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔄</span> Reset Stock
              </h2>
              <p className="text-gray-600 mb-4">
                Reset the weekly stock count. Typically done every Monday morning for a new batch.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Stock Amount
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:border-[#2d5a4a] focus:outline-none text-lg font-semibold"
                  />
                </div>
                <button
                  onClick={resetStock}
                  className="w-full bg-[#2d5a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition"
                >
                  Reset Stock to {newStock} Bottles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
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
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {dateFilter !== 'all' && dateFilter !== 'day' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as any)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                )}

                <div className="flex items-end">
                  <button
                    onClick={exportToCSV}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <span>📥</span> Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                <div className="text-3xl font-bold text-blue-600">{stats.total_orders || 0}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="text-sm text-gray-600 mb-1">Bottles Sold</div>
                <div className="text-3xl font-bold text-green-600">{stats.total_bottles_sold || 0}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-purple-600">₦{(stats.total_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="text-sm text-gray-600 mb-1">COD Revenue</div>
                <div className="text-3xl font-bold text-yellow-600">₦{(stats.cod_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <div className="text-sm text-gray-600 mb-1">Online Revenue</div>
                <div className="text-3xl font-bold text-indigo-600">₦{(stats.online_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
                <div className="text-sm text-gray-600 mb-1">Paid Revenue</div>
                <div className="text-3xl font-bold text-emerald-600">₦{(stats.paid_revenue || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Sales Chart */}
            {salesByDate.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📈</span> Revenue Chart
                </h3>
                <div className="h-64 flex items-end gap-2 overflow-x-auto pb-4">
                  {salesByDate.map((item, index) => {
                    const maxRevenue = Math.max(...salesByDate.map(s => s.revenue), 1)
                    const heightPercent = (item.revenue / maxRevenue) * 100
                    return (
                      <div key={index} className="flex flex-col items-center min-w-[60px] group">
                        <div className="relative flex flex-col items-center flex-1 w-full">
                          {/* Tooltip */}
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div className="font-semibold">₦{item.revenue.toLocaleString()}</div>
                            <div className="text-gray-300">{item.orders_count} orders</div>
                            <div className="text-gray-300">{item.bottles_sold} bottles</div>
                          </div>
                          {/* Bar */}
                          <div 
                            className="w-10 bg-gradient-to-t from-[#2d5a4a] to-[#4a7c6a] rounded-t-lg transition-all duration-500 hover:from-[#1e4035] hover:to-[#3d6a5a] cursor-pointer"
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          >
                            <div className="w-full h-2 bg-white/20 rounded-t-lg"></div>
                          </div>
                        </div>
                        {/* Label */}
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-t from-[#2d5a4a] to-[#4a7c6a]"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Hover over bars for details
                  </div>
                </div>
              </div>
            )}

            {/* Bottles Sold Chart */}
            {salesByDate.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🍷</span> Bottles Sold Chart
                </h3>
                <div className="h-48 flex items-end gap-2 overflow-x-auto pb-4">
                  {salesByDate.map((item, index) => {
                    const maxBottles = Math.max(...salesByDate.map(s => s.bottles_sold), 1)
                    const heightPercent = (item.bottles_sold / maxBottles) * 100
                    return (
                      <div key={index} className="flex flex-col items-center min-w-[60px] group">
                        <div className="relative flex flex-col items-center flex-1 w-full">
                          {/* Value label */}
                          <div className="absolute -top-6 text-xs font-semibold text-[#2d5a4a] opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.bottles_sold}
                          </div>
                          {/* Bar */}
                          <div 
                            className="w-10 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all duration-500 hover:from-amber-600 hover:to-amber-500 cursor-pointer"
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          >
                            <div className="w-full h-2 bg-white/30 rounded-t-lg"></div>
                          </div>
                        </div>
                        {/* Label */}
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sales Table */}
            {salesByDate.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Sales Over Time</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bottles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesByDate.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatDate(item.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.orders_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.bottles_sold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2d5a4a]">₦{item.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span>💰</span> Business Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Bottle (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.price_per_bottle}
                    onChange={(e) => setSettings({ ...settings, price_per_bottle: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Stock Default
                  </label>
                  <input
                    type="number"
                    value={settings.weekly_stock}
                    onChange={(e) => setSettings({ ...settings, weekly_stock: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Address
                  </label>
                  <textarea
                    value={settings.pickup_address}
                    onChange={(e) => setSettings({ ...settings, pickup_address: e.target.value })}
                    rows={2}
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span>📱</span> Notification Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Phone (for WhatsApp notifications)
                  </label>
                  <input
                    type="tel"
                    value={settings.admin_phone}
                    onChange={(e) => setSettings({ ...settings, admin_phone: e.target.value })}
                    placeholder="08012345678"
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter Nigerian format without +234</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={settings.admin_email}
                    onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                    placeholder="admin@upwyne.com"
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full mt-6 bg-[#2d5a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a]">Order Details</h2>
                  <p className="text-sm text-gray-500">{selectedOrder.order_number}</p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer</h3>
                    <p className="font-semibold text-[#2d5a4a]">{selectedOrder.customer_name}</p>
                    <p className="text-gray-600">
                      <a href={`tel:${selectedOrder.phone}`} className="text-blue-600 hover:underline">
                        {selectedOrder.phone}
                      </a>
                    </p>
                    {selectedOrder.email && (
                      <p className="text-gray-600 text-sm">{selectedOrder.email}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Delivery</h3>
                    <p className="font-semibold">
                      {selectedOrder.delivery_type === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                    </p>
                    {selectedOrder.delivery_type === 'delivery' && selectedOrder.address && (
                      <p className="text-gray-600 text-sm">{selectedOrder.address}</p>
                    )}
                    {selectedOrder.delivery_type === 'pickup' && (
                      <p className="text-gray-600 text-sm">24 Tony Anenih Avenue, G.R.A</p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{selectedOrder.quantity} × Palm Wine (1L)</span>
                      <span className="font-medium">₦{calculateSubtotal(selectedOrder).toLocaleString()}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₦{selectedOrder.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total</span>
                      <span className="text-[#2d5a4a]">₦{selectedOrder.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment</h3>
                    <p className="font-semibold mb-2">
                      {selectedOrder.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                    </p>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                    </span>
                    {selectedOrder.payment_method === 'cod' && selectedOrder.payment_status !== 'paid' && (
                      <button
                        onClick={() => updatePaymentStatus(selectedOrder.id, 'paid')}
                        className="block mt-3 text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Order Status</h3>
                    <span className={`px-3 py-1 text-sm rounded-full capitalize ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Ordered: {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        ✓ Confirm Order
                      </button>
                      <button
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      📦 Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      🎉 Mark Delivered
                    </button>
                  )}
                  <Link
                    href={`/invoice/${selectedOrder.order_number}`}
                    target="_blank"
                    className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4035] transition font-medium flex items-center gap-2"
                  >
                    📄 View Invoice
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
