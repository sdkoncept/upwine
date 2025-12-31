'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  phone: string
  email?: string
  address?: string
  quantity: number
  price_per_bottle: number
  delivery_fee: number
  discount: number
  total_amount: number
  notes?: string
  status: string
  due_date?: string
  created_at: string
}

export default function ViewInvoicePage() {
  const params = useParams()
  const invoiceNumber = params.invoiceNumber as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (invoiceNumber) {
      fetch(`/api/invoices/${invoiceNumber}`)
        .then(res => {
          if (!res.ok) throw new Error('Invoice not found')
          return res.json()
        })
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setInvoice(data)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching invoice:', err)
          setError('Invoice not found')
          setLoading(false)
        })
    }
  }, [invoiceNumber])

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const subtotal = invoice ? invoice.quantity * invoice.price_per_bottle : 0

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

  if (error || !invoice) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find this invoice. It may have been removed or the link is incorrect.</p>
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
              href="/order"
              className="flex items-center gap-2 bg-white text-[#2d5a4a] px-6 py-3 rounded-xl font-semibold border-2 border-[#2d5a4a] hover:bg-[#f0f7f4] transition"
            >
              <span>🍷</span> Place Order
            </Link>
          </div>

          {/* Status Banner */}
          {invoice.status === 'paid' && (
            <div className="no-print bg-green-100 border border-green-300 rounded-xl p-4 mb-6 text-center">
              <span className="text-green-800 font-semibold">✅ This invoice has been paid</span>
            </div>
          )}
          
          {invoice.status === 'cancelled' && (
            <div className="no-print bg-red-100 border border-red-300 rounded-xl p-4 mb-6 text-center">
              <span className="text-red-800 font-semibold">❌ This invoice has been cancelled</span>
            </div>
          )}

          {/* Invoice Document */}
          <div className="print-area bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-[#2d5a4a] to-[#3d6a5a] text-white p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">🌴 UPWYNE</h1>
                  <p className="text-[#a8d4c0]">Premium Palm Wine from Edo State</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">INVOICE</div>
                  <div className="text-[#a8d4c0] text-sm">#{invoice.invoice_number}</div>
                </div>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-8">
              {/* Invoice Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                  <p className="text-lg font-semibold text-[#2d5a4a]">{invoice.customer_name}</p>
                  <p className="text-gray-600">{invoice.phone}</p>
                  {invoice.email && <p className="text-gray-600">{invoice.email}</p>}
                  {invoice.address && <p className="text-gray-600">{invoice.address}</p>}
                </div>
                <div className="md:text-right">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Invoice Details</h3>
                  <p className="text-gray-600"><span className="font-medium">Date:</span> {formatDate(invoice.created_at)}</p>
                  {invoice.due_date && (
                    <p className="text-gray-600"><span className="font-medium">Due Date:</span> {formatDate(invoice.due_date)}</p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : invoice.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status === 'paid' ? '✓ Paid' : 
                       invoice.status === 'sent' ? 'Awaiting Payment' :
                       invoice.status === 'cancelled' ? 'Cancelled' : 'Draft'}
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
                      <td className="py-4 text-center text-gray-700">{invoice.quantity}</td>
                      <td className="py-4 text-right text-gray-700">₦{invoice.price_per_bottle.toLocaleString()}</td>
                      <td className="py-4 text-right font-medium text-[#2d5a4a]">₦{subtotal.toLocaleString()}</td>
                    </tr>
                    {invoice.delivery_fee > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-4" colSpan={2}>
                          <p className="font-medium text-[#2d5a4a]">Delivery Service</p>
                          <p className="text-sm text-gray-500">{invoice.address || 'Benin City'}</p>
                        </td>
                        <td className="py-4 text-right text-gray-500">-</td>
                        <td className="py-4 text-right font-medium text-[#2d5a4a]">₦{invoice.delivery_fee.toLocaleString()}</td>
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
                  {invoice.delivery_fee > 0 && (
                    <div className="flex justify-between py-2 text-gray-600">
                      <span>Delivery Fee</span>
                      <span>₦{invoice.delivery_fee.toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-2 text-green-600">
                      <span>Discount</span>
                      <span>-₦{invoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t-2 border-[#2d5a4a] text-xl font-bold text-[#2d5a4a]">
                    <span>Total</span>
                    <span>₦{invoice.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="bg-[#f0f7f4] rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-[#2d5a4a] mb-2">📝 Notes</h3>
                  <p className="text-gray-700">{invoice.notes}</p>
                </div>
              )}

              {/* Payment Info */}
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-amber-800 mb-2">💳 Payment Information</h3>
                  <p className="text-amber-700 text-sm">
                    Please contact us to arrange payment. You can pay via bank transfer, cash, or online payment.
                  </p>
                  <p className="text-amber-700 text-sm mt-2">
                    WhatsApp/Call: Contact us for payment details
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-6">
                <p className="font-semibold text-[#2d5a4a] mb-2">Thank you for choosing Upwyne!</p>
                <p>24 Tony Anenih Avenue, G.R.A, Benin City</p>
                <p>Fresh Palm Wine • Tapped Daily • No Additives</p>
                <p className="mt-2 text-xs">This invoice was generated electronically.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
