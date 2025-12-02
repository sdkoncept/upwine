'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stock, setStock] = useState({ available_bottles: 100, total_bottles: 100 })
  const [newStock, setNewStock] = useState(100)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth')
      const data = await res.json()
      if (data.authenticated) {
        setAuthenticated(true)
        fetchData()
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

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const calculateSubtotal = (order: Order) => {
    return order.total_amount - order.delivery_fee
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

  if (checkingAuth) {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl">Checking authentication...</div>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return null
  }

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="text-primary hover:underline"
                          >
                            {order.order_number}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline">
                            {order.phone}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">₦{order.total_amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.payment_method === 'cod' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.payment_method === 'cod' ? 'COD' : order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </button>
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'completed')}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  Complete
                                </button>
                              </>
                            )}
                            {order.status === 'completed' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                className="text-green-600 hover:text-green-800"
                              >
                                Deliver
                              </button>
                            )}
                          </div>
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

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">Order Details</h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Header */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Order Number</div>
                    <div className="text-lg font-semibold">{selectedOrder.order_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Order Date</div>
                    <div className="text-lg">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">{selectedOrder.customer_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">
                        <a href={`tel:${selectedOrder.phone}`} className="text-blue-600 hover:underline">
                          {selectedOrder.phone}
                        </a>
                      </div>
                    </div>
                    {selectedOrder.email && (
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">
                          <a href={`mailto:${selectedOrder.email}`} className="text-blue-600 hover:underline">
                            {selectedOrder.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-500">Delivery Type</div>
                      <div className="font-medium">
                        {selectedOrder.delivery_type === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                      </div>
                    </div>
                    {selectedOrder.delivery_type === 'delivery' && selectedOrder.address && (
                      <div>
                        <div className="text-sm text-gray-500">Delivery Address</div>
                        <div className="font-medium">{selectedOrder.address}</div>
                      </div>
                    )}
                    {selectedOrder.delivery_type === 'pickup' && (
                      <div>
                        <div className="text-sm text-gray-500">Pickup Location</div>
                        <div className="font-medium">24 Tony Anenih Avenue, G.R.A, Benin City</div>
                      </div>
                    )}
                    {selectedOrder.delivery_time && (
                      <div>
                        <div className="text-sm text-gray-500">Preferred Delivery Time</div>
                        <div className="font-medium">{selectedOrder.delivery_time}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Payment Method</div>
                        <div className="font-medium">
                          {selectedOrder.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Payment Status</div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            selectedOrder.payment_method === 'cod' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedOrder.payment_method === 'cod' ? 'Pending (COD)' : 
                             selectedOrder.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedOrder.payment_method === 'online' && selectedOrder.paystack_reference && (
                      <div>
                        <div className="text-sm text-gray-500">Paystack Reference</div>
                        <div className="font-mono text-sm">{selectedOrder.paystack_reference}</div>
                      </div>
                    )}
                    {selectedOrder.payment_reference && (
                      <div>
                        <div className="text-sm text-gray-500">Payment Reference</div>
                        <div className="font-mono text-sm">{selectedOrder.payment_reference}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity</span>
                      <span className="font-medium">{selectedOrder.quantity} bottle{selectedOrder.quantity !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per Bottle</span>
                      <span className="font-medium">₦1,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₦{calculateSubtotal(selectedOrder).toLocaleString()}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₦{selectedOrder.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total Amount</span>
                      <span className="text-primary">₦{selectedOrder.total_amount.toLocaleString()}</span>
                    </div>
                    {selectedOrder.payment_method === 'cod' && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm text-yellow-800">
                          <strong>COD Amount:</strong> ₦{selectedOrder.total_amount.toLocaleString()} to be collected on delivery
                        </div>
                      </div>
                    )}
                    {selectedOrder.payment_method === 'online' && selectedOrder.payment_status === 'paid' && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="text-sm text-green-800">
                          <strong>Paid:</strong> ₦{selectedOrder.total_amount.toLocaleString()} via Paystack
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Status */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Order Status</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'completed')
                        }}
                        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {selectedOrder.status === 'completed' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'delivered')
                        }}
                        className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}