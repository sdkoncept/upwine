'use client'

import { useState } from 'react'
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
  status: string
  created_at: string
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: '📝', description: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅', description: 'Order confirmed and being prepared' },
  { key: 'completed', label: 'Ready', icon: '📦', description: 'Your order is ready' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', description: 'Enjoy your palm wine!' },
]

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber.trim()) {
      setError('Please enter your order number')
      return
    }

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const response = await fetch(`/api/orders/${orderNumber.trim().toUpperCase()}`)
      
      if (!response.ok) {
        throw new Error('Order not found')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Optional: verify phone number matches
      if (phone && data.phone !== phone.replace(/\D/g, '')) {
        throw new Error('Phone number does not match this order')
      }

      setOrder(data)
    } catch (err: any) {
      setError(err.message || 'Order not found. Please check your order number.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!order) return -1
    if (order.status === 'cancelled') return -1
    return statusSteps.findIndex(step => step.key === order.status)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <main className="min-h-screen py-12 bg-gradient-to-b from-[#f5f9f7] to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d5a4a] mb-4">
            Track Your Order
          </h1>
          <p className="text-[#5a8a7a] text-lg">
            Enter your order number to see the current status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#e8f0ec] p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                Order Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g., UPW12345678"
                className="w-full border-2 border-[#e8f0ec] rounded-xl py-3 px-4 text-lg font-mono focus:border-[#2d5a4a] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                Phone Number (Optional - for verification)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full border-2 border-[#e8f0ec] rounded-xl py-3 px-4 focus:border-[#2d5a4a] focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2d5a4a] text-white py-4 rounded-xl text-lg font-semibold hover:bg-[#1e4035] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Searching...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Track Order
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && searched && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
            <div className="text-4xl mb-3">😕</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Order Not Found</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-3">
              Make sure you've entered the correct order number (e.g., UPW12345678)
            </p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            {order.status === 'cancelled' ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-red-800 mb-2">Order Cancelled</h2>
                <p className="text-red-700">This order has been cancelled.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl border border-[#e8f0ec] p-8">
                <h2 className="text-xl font-bold text-[#2d5a4a] mb-6 flex items-center gap-2">
                  <span>📋</span> Order Status
                </h2>
                
                {/* Progress Steps */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200"></div>
                  <div 
                    className="absolute left-6 top-0 w-0.5 bg-[#2d5a4a] transition-all duration-500"
                    style={{ 
                      height: `${Math.max(0, (getCurrentStepIndex() / (statusSteps.length - 1)) * 100)}%` 
                    }}
                  ></div>

                  {/* Steps */}
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const currentIndex = getCurrentStepIndex()
                      const isCompleted = index <= currentIndex
                      const isCurrent = index === currentIndex

                      return (
                        <div key={step.key} className="relative flex items-start gap-4">
                          {/* Step Icon */}
                          <div 
                            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-[#2d5a4a] text-white shadow-lg' 
                                : 'bg-gray-100 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-[#2d5a4a]/20 scale-110' : ''}`}
                          >
                            {step.icon}
                          </div>
                          
                          {/* Step Content */}
                          <div className={`flex-1 pb-4 ${isCompleted ? '' : 'opacity-50'}`}>
                            <h3 className={`font-semibold ${isCompleted ? 'text-[#2d5a4a]' : 'text-gray-500'}`}>
                              {step.label}
                              {isCurrent && (
                                <span className="ml-2 px-2 py-0.5 bg-[#e8f0ec] text-[#2d5a4a] text-xs rounded-full">
                                  Current
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-3xl shadow-xl border border-[#e8f0ec] p-8">
              <h2 className="text-xl font-bold text-[#2d5a4a] mb-6 flex items-center gap-2">
                <span>🍷</span> Order Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-[#e8f0ec]">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-mono font-semibold text-[#2d5a4a]">{order.order_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e8f0ec]">
                  <span className="text-gray-600">Date Ordered</span>
                  <span className="font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e8f0ec]">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium">{order.quantity} bottle{order.quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e8f0ec]">
                  <span className="text-gray-600">Delivery Type</span>
                  <span className="font-medium">
                    {order.delivery_type === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e8f0ec]">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">
                    {order.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Online'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e8f0ec]">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold text-[#2d5a4a]">
                  <span>Total Amount</span>
                  <span>₦{order.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Delivery Info */}
              {order.delivery_type === 'pickup' ? (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">📍 Pickup Location</h3>
                  <p className="text-blue-700">24 Tony Anenih Avenue, G.R.A, Benin City</p>
                  <p className="text-sm text-blue-600 mt-1">Hours: 10 AM - 6 PM, Mon-Fri</p>
                </div>
              ) : order.address && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-800 mb-2">🚚 Delivery Address</h3>
                  <p className="text-amber-700">{order.address}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/invoice/${order.order_number}`}
                className="flex-1 bg-[#2d5a4a] text-white text-center py-4 rounded-xl font-semibold hover:bg-[#1e4035] transition flex items-center justify-center gap-2"
              >
                <span>📄</span> View Invoice
              </Link>
              <Link
                href="/contact"
                className="flex-1 bg-white text-[#2d5a4a] text-center py-4 rounded-xl font-semibold border-2 border-[#2d5a4a] hover:bg-[#f0f7f4] transition flex items-center justify-center gap-2"
              >
                <span>📞</span> Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!order && !error && searched === false && (
          <div className="bg-[#f0f7f4] rounded-2xl p-6 text-center">
            <h3 className="text-lg font-semibold text-[#2d5a4a] mb-2">Where's my order number?</h3>
            <p className="text-[#5a8a7a] text-sm">
              You can find your order number in:
            </p>
            <ul className="text-[#5a8a7a] text-sm mt-2 space-y-1">
              <li>• The confirmation page after placing your order</li>
              <li>• The WhatsApp message we sent you</li>
              <li>• Your email receipt (if you provided an email)</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
