'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reference = searchParams.get('reference')
    
    if (!reference) {
      setStatus('failed')
      setError('Payment reference not found')
      return
    }

    // Verify payment
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference }),
        })

        const data = await response.json()

        if (response.ok && data.verified) {
          setStatus('success')
          setOrderNumber(data.order_number)
        } else {
          setStatus('failed')
          setError(data.error || 'Payment verification failed')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('failed')
        setError('An error occurred while verifying payment')
      }
    }

    verifyPayment()
  }, [searchParams])

  if (status === 'verifying') {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment...</h2>
            <p className="text-gray-600">Please wait while we verify your payment.</p>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-4xl font-bold text-primary mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your payment has been confirmed and your order is being processed.
            </p>

            {orderNumber && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <div className="text-lg font-semibold text-green-800 mb-2">
                  Order Number: {orderNumber}
                </div>
                <p className="text-green-700">
                  A receipt has been sent to your WhatsApp and email.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/order-confirmation?order=${orderNumber}`}
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition"
              >
                View Order Details
              </Link>
              <Link
                href="/"
                className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Payment Verification Failed
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {error || 'We were unable to verify your payment. Please contact support if you were charged.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition"
            >
              Contact Support
            </Link>
            <Link
              href="/"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </main>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}

