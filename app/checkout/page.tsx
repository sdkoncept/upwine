'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDeliveryFeeForDestination, getDestinationsSortedByFee } from '@/lib/delivery-destinations'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    delivery_destination: '',
    address_details: '', // For additional address details like street number, landmarks
    payment_method: 'cod',
  })

  const quantity = parseInt(searchParams.get('quantity') || '1')
  const deliveryType = (searchParams.get('type') || 'pickup') as 'pickup' | 'delivery'

  const pricePerBottle = 2000
  const subtotal = quantity * pricePerBottle
  const total = subtotal + deliveryFee

  useEffect(() => {
    if (deliveryType === 'pickup') {
      setFormData(prev => ({ ...prev, delivery_destination: '', address_details: '' }))
      setDeliveryFee(0)
    }
  }, [deliveryType])

  // Calculate delivery fee when destination changes
  useEffect(() => {
    if (deliveryType === 'delivery' && formData.delivery_destination) {
      const fee = getDeliveryFeeForDestination(formData.delivery_destination)
      setDeliveryFee(fee)
    } else if (deliveryType === 'pickup') {
      setDeliveryFee(0)
    }
  }, [formData.delivery_destination, deliveryType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.customer_name || !formData.customer_name.trim()) {
      alert('Please enter your full name')
      return
    }

    if (!formData.phone || !formData.phone.trim()) {
      alert('Please enter your phone number')
      return
    }

    // Validate phone number format (basic check)
    const phoneRegex = /^[0-9]{10,11}$/
    const cleanPhone = formData.phone.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      alert('Please enter a valid phone number (10-11 digits)')
      return
    }

    if (deliveryType === 'delivery' && !formData.delivery_destination) {
      alert('Please select a delivery destination')
      return
    }

    if (quantity < 1) {
      alert('Please select at least 1 bottle')
      return
    }

    setLoading(true)

    try {
      // Combine destination and address details for full address
      const fullAddress = deliveryType === 'delivery' 
        ? `${formData.delivery_destination}${formData.address_details ? ', ' + formData.address_details : ''}`
        : null // Use null for pickup orders

      const orderPayload = {
        customer_name: formData.customer_name.trim(),
        phone: cleanPhone,
        email: formData.email?.trim() || undefined,
        address: fullAddress,
        quantity,
        delivery_type: deliveryType,
        delivery_fee: deliveryFee || 0,
        payment_method: formData.payment_method,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      const data = await response.json()

      if (response.ok && data.order_number) {
        // If online payment, initialize Paystack payment
        if (formData.payment_method === 'online') {
          // Email is required for Paystack
          if (!formData.email || !formData.email.trim()) {
            alert('Email is required for online payment')
            setLoading(false)
            return
          }

          // Initialize payment
          const paymentResponse = await fetch('/api/payment/initialize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order_number: data.order_number,
              email: formData.email.trim(),
            }),
          })

          const paymentData = await paymentResponse.json()

          if (paymentResponse.ok && paymentData.authorization_url) {
            // Redirect to Paystack
            window.location.href = paymentData.authorization_url
          } else {
            alert(paymentData.error || 'Failed to initialize payment. Please try again.')
            setLoading(false)
          }
        } else {
          // Cash on Delivery - redirect to confirmation
          router.push(`/order-confirmation?order=${data.order_number}`)
        }
      } else {
        // Show error message
        const errorMsg = data.error || 'Failed to place order. Please try again.'
        alert(errorMsg)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Customer Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email {formData.payment_method === 'online' ? <span className="text-red-500">*</span> : '(Optional)'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={formData.payment_method === 'online'}
                  className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                  placeholder="your@email.com"
                />
                {formData.payment_method === 'online' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email is required for online payment receipts
                  </p>
                )}
              </div>

              {deliveryType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Destination <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="delivery_destination"
                      value={formData.delivery_destination}
                      onChange={handleInputChange}
                      required={deliveryType === 'delivery'}
                      className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                    >
                      <option value="">Select your area...</option>
                      {getDestinationsSortedByFee().map((dest) => (
                        <option key={dest.name} value={dest.name}>
                          {dest.name} - ₦{dest.fee.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {deliveryFee > 0 && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm text-blue-800">
                          <strong>Delivery Fee:</strong> ₦{deliveryFee.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Address Details (Optional)
                    </label>
                    <textarea
                      name="address_details"
                      value={formData.address_details}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                      placeholder="Street number, building name, landmarks, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add specific details like street number or landmarks to help our rider find you easily
                    </p>
                  </div>
                </>
              )}

              {deliveryType === 'pickup' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-semibold text-green-800 mb-1">Pickup Location:</div>
                  <div className="text-green-700">
                    24 Tony Anenih Avenue, G.R.A, Benin City
                  </div>
                  <div className="text-sm text-green-600 mt-2">
                    Pickup hours: 10 AM - 6 PM
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>
                {formData.payment_method === 'cod' && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800">
                      <strong>✓ Cash on Delivery Selected</strong>
                      <p className="mt-1 text-xs">
                        You can place your order now and pay when you receive it.
                      </p>
                    </div>
                  </div>
                )}
                {formData.payment_method === 'online' && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>Online Payment</strong>
                      <p className="mt-1 text-xs">
                        You will be redirected to complete payment after placing your order.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-lg text-lg font-semibold hover:bg-secondary transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Placing Order...
                  </span>
                ) : (
                  'Place Order Now'
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 h-fit">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-semibold">Fresh Palm Wine (1L)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{quantity} bottle(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per bottle:</span>
                <span className="font-semibold">₦{pricePerBottle.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-semibold">₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <div className={`mt-6 border rounded-lg p-4 ${
              formData.payment_method === 'cod' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`text-sm ${
                formData.payment_method === 'cod' 
                  ? 'text-green-800' 
                  : 'text-yellow-800'
              }`}>
                <strong>
                  {formData.payment_method === 'cod' ? '✓ Cash on Delivery' : 'Payment Note'}:
                </strong>
                <p className="mt-1">
                  {formData.payment_method === 'cod' 
                    ? 'Your order will be confirmed immediately. Pay when you receive your order.'
                    : 'You will be redirected to complete payment after placing your order.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

