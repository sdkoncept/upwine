'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LookupPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber.trim()) {
      setError('Please enter an order or invoice number')
      return
    }

    setLoading(true)
    setError('')

    const number = orderNumber.trim().toUpperCase()
    
    // Check if it's an invoice number (starts with INV)
    if (number.startsWith('INV')) {
      try {
        const response = await fetch(`/api/invoices/${number}`)
        
        if (!response.ok) {
          throw new Error('Invoice not found')
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Redirect to invoice page
        router.push(`/view-invoice/${number}`)
      } catch (err: any) {
        setError(err.message || 'Invoice not found. Please check your invoice number.')
        setLoading(false)
      }
    } else {
      // It's an order number (starts with UPW)
      try {
        const response = await fetch(`/api/orders/${number}`)
        
        if (!response.ok) {
          throw new Error('Order not found')
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Redirect to order invoice page
        router.push(`/invoice/${number}`)
      } catch (err: any) {
        setError(err.message || 'Order not found. Please check your order number.')
        setLoading(false)
      }
    }
  }

  return (
    <main className="min-h-screen py-16 bg-gradient-to-b from-[#f5f9f7] to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d5a4a] mb-4">
            Invoice & Receipt
          </h1>
          <p className="text-[#5a8a7a] text-lg">
            Enter your order or invoice number to view and download your document
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#e8f0ec] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                Order or Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="e.g., UPW12345678 or INV12345678"
                className="w-full border-2 border-[#e8f0ec] rounded-xl py-4 px-4 text-lg font-mono focus:border-[#2d5a4a] focus:outline-none transition text-center"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Order numbers start with UPW, Invoice numbers start with INV
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2d5a4a] text-white py-4 rounded-xl text-lg font-semibold hover:bg-[#1e4035] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Looking up...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  View Invoice
                </>
              )}
            </button>
          </form>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-[#e8f0ec]">
            <p className="text-center text-[#5a8a7a] text-sm mb-4">
              What would you like to do?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/track"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#f0f7f4] rounded-xl text-[#2d5a4a] font-medium hover:bg-[#e8f0ec] transition"
              >
                <span>📦</span> Track My Order
              </Link>
              <Link
                href="/order"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#f0f7f4] rounded-xl text-[#2d5a4a] font-medium hover:bg-[#e8f0ec] transition"
              >
                <span>🍷</span> Place New Order
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-[#fff8e6] rounded-2xl p-6 border border-[#ffeeba]">
          <h3 className="font-semibold text-[#856404] mb-2 flex items-center gap-2">
            <span>💡</span> Where can I find my number?
          </h3>
          <ul className="text-[#856404] text-sm space-y-1">
            <li>• <strong>Order number (UPW...):</strong> On confirmation page or WhatsApp message</li>
            <li>• <strong>Invoice number (INV...):</strong> Sent to you by our sales team</li>
            <li>• Check your email or WhatsApp messages for the number</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
