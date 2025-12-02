'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderNumber) {
      fetch(`/api/orders/${orderNumber}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Order not found')
          }
          return res.json()
        })
        .then(data => {
          if (data.error) {
            setOrder(null)
          } else {
            setOrder(data)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching order:', err)
          setOrder(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [orderNumber])

  if (loading) {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
            <Link href="/" className="text-primary hover:underline">Return to Home</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold text-primary mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your order has been received successfully.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
            <div className="text-2xl font-bold text-primary mb-4">
              Order Number: {order.order_number}
            </div>
            
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold">Customer:</span>
                <span>{order.customer_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Phone:</span>
                <span>{order.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Quantity:</span>
                <span>{order.quantity || 0} bottle(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-lg font-bold text-primary">
                  ₦{order.total_amount ? order.total_amount.toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Delivery Type:</span>
                <span>{order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              </div>
            </div>
          </div>

          {order.delivery_type === 'pickup' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-blue-800 mb-3">
                📍 Pickup Instructions
              </h3>
              <p className="text-blue-700 mb-2">
                <strong>Location:</strong> 24 Tony Anenih Avenue, G.R.A, Benin City
              </p>
              <p className="text-blue-700">
                <strong>Hours:</strong> 10 AM - 6 PM, Monday to Friday
              </p>
              <p className="text-sm text-blue-600 mt-4">
                Please bring your order number when you come to pick up.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-blue-800 mb-3">
                🚚 Delivery Information
              </h3>
              {order.address && (
                <p className="text-blue-700 mb-2">
                  <strong>Address:</strong> {order.address}
                </p>
              )}
              {order.phone && (
                <p className="text-blue-700">
                  Our dispatch rider will contact you at <strong>{order.phone}</strong> before arrival.
                </p>
              )}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              📱 What's Next?
            </h3>
            <p className="text-yellow-700">
              You will receive a WhatsApp and SMS confirmation in the next few minutes with your order details.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition"
            >
              Return to Home
            </Link>
            <Link
              href="/order"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Place Another Order
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </main>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}

