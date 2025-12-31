'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
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

export default function InvoicePage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (orderNumber) {
      fetch(`/api/orders/${orderNumber}`)
        .then(res => {
          if (!res.ok) throw new Error('Order not found')
          return res.json()
        })
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setOrder(data)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching order:', err)
          setError('Order not found')
          setLoading(false)
        })
    }
  }, [orderNumber])

  const handlePrint = () => {
    window.print()
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

  const pricePerBottle = 2000
  const subtotal = order ? order.quantity * pricePerBottle : 0

  if (loading) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5a4a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find an invoice for this order number.</p>
            <Link href="/" className="inline-block bg-[#2d5a4a] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1e4035] transition">
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          nav, footer {
            display: none !important;
          }
        }
      `}</style>

      <main className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          {/* Action Buttons */}
          <div className="no-print flex flex-wrap gap-4 mb-6 justify-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#2d5a4a] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1e4035] transition shadow-lg"
            >
              <span>🖨️</span> Print Invoice
            </button>
            <Link
              href={`/order-confirmation?order=${order.order_number}`}
              className="flex items-center gap-2 bg-white text-[#2d5a4a] px-6 py-3 rounded-xl font-semibold border-2 border-[#2d5a4a] hover:bg-[#f0f7f4] transition"
            >
              <span>📋</span> View Order Details
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              <span>🏠</span> Home
            </Link>
          </div>

          {/* Invoice Document */}
          <div ref={invoiceRef} className="print-area bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-[#2d5a4a] to-[#3d6a5a] text-white p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">UPWYNE</h1>
                  <p className="text-[#a8d4c0]">Premium Palm Wine from Edo State</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">INVOICE</div>
                  <div className="text-[#a8d4c0] text-sm">#{order.order_number}</div>
                </div>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-8">
              {/* Invoice Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                  <p className="text-lg font-semibold text-[#2d5a4a]">{order.customer_name}</p>
                  <p className="text-gray-600">{order.phone}</p>
                  {order.email && <p className="text-gray-600">{order.email}</p>}
                  {order.address && <p className="text-gray-600">{order.address}</p>}
                </div>
                <div className="md:text-right">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Invoice Details</h3>
                  <p className="text-gray-600"><span className="font-medium">Date:</span> {formatDate(order.created_at)}</p>
                  <p className="text-gray-600"><span className="font-medium">Payment:</span> {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status === 'paid' ? '✓ Paid' : 'Payment Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#2d5a4a]">
                      <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase">Item</th>
                      <th className="text-center py-3 text-sm font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Unit Price</th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">
                        <p className="font-medium text-[#2d5a4a]">Fresh Natural Palm Wine</p>
                        <p className="text-sm text-gray-500">1 Liter Bottle • Tapped Fresh</p>
                      </td>
                      <td className="py-4 text-center text-gray-700">{order.quantity}</td>
                      <td className="py-4 text-right text-gray-700">₦{pricePerBottle.toLocaleString()}</td>
                      <td className="py-4 text-right font-medium text-[#2d5a4a]">₦{subtotal.toLocaleString()}</td>
                    </tr>
                    {order.delivery_fee > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-4" colSpan={2}>
                          <p className="font-medium text-[#2d5a4a]">Delivery Service</p>
                          <p className="text-sm text-gray-500">{order.address || 'Benin City'}</p>
                        </td>
                        <td className="py-4 text-right text-gray-500">-</td>
                        <td className="py-4 text-right font-medium text-[#2d5a4a]">₦{order.delivery_fee.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Section */}
              <div className="flex justify-end mb-8">
                <div className="w-full md:w-72">
                  <div className="flex justify-between py-2 text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  {order.delivery_fee > 0 && (
                    <div className="flex justify-between py-2 text-gray-600">
                      <span>Delivery Fee</span>
                      <span>₦{order.delivery_fee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t-2 border-[#2d5a4a] text-xl font-bold text-[#2d5a4a]">
                    <span>Total</span>
                    <span>₦{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className={`rounded-xl p-6 mb-8 ${
                order.delivery_type === 'pickup' 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {order.delivery_type === 'pickup' ? '📍 Pickup Information' : '🚚 Delivery Information'}
                </h3>
                {order.delivery_type === 'pickup' ? (
                  <>
                    <p className="text-gray-700"><strong>Location:</strong> 24 Tony Anenih Avenue, G.R.A, Benin City</p>
                    <p className="text-gray-700"><strong>Hours:</strong> 10 AM - 6 PM, Monday to Friday</p>
                  </>
                ) : (
                  <p className="text-gray-700"><strong>Delivery Address:</strong> {order.address}</p>
                )}
              </div>

              {/* Order Status */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-3">Order Status</h3>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'pending' && '⏳'}
                    {order.status === 'confirmed' && '✅'}
                    {order.status === 'completed' && '📦'}
                    {order.status === 'delivered' && '🎉'}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-6">
                <p className="font-semibold text-[#2d5a4a] mb-2">Thank you for choosing Upwyne!</p>
                <p>24 Tony Anenih Avenue, G.R.A, Benin City</p>
                <p>Fresh Palm Wine • Tapped Daily • No Additives</p>
                <p className="mt-2 text-xs">This invoice was generated electronically and is valid without a signature.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
