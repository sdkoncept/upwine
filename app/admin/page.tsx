'use client'

import { useEffect, useState } from 'react'

interface Order {
  id: number
  order_number: string
  customer_name: string
  phone: string
  quantity: number
  total_amount: number
  delivery_type: string
  payment_method: string
  status: string
  created_at: string
  address?: string
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stock, setStock] = useState({ available_bottles: 100, total_bottles: 100 })
  const [newStock, setNewStock] = useState(100)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders')

  useEffect(() => {
    fetchData()
  }, [])

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

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchData()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
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

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

  if (loading) {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stock'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Stock Management
            </button>
          </nav>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-800">{pendingOrders.length}</div>
                <div className="text-yellow-600">Pending Orders</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-800">{completedOrders.length}</div>
                <div className="text-blue-600">Completed Orders</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-800">{deliveredOrders.length}</div>
                <div className="text-green-600">Delivered Orders</div>
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">All Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.order_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">₦{order.total_amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.delivery_type === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Mark Complete
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                className="text-green-600 hover:text-green-800"
                              >
                                Mark Delivered
                              </button>
                            </div>
                          )}
                          {order.status === 'completed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="text-green-600 hover:text-green-800"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No orders yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Stock Management
            </h2>

            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stock.available_bottles}
                </div>
                <div className="text-gray-600">bottles available this week</div>
                <div className="text-sm text-gray-500 mt-2">
                  Total: {stock.total_bottles} | Sold: {stock.total_bottles - stock.available_bottles}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Reset Weekly Stock
              </h3>
              <p className="text-gray-600 mb-4">
                Use this to reset stock for a new week (typically done every Monday morning).
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  min="0"
                  className="border-2 border-gray-300 rounded py-2 px-4 w-32"
                />
                <button
                  onClick={resetStock}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-secondary transition"
                >
                  Reset Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

