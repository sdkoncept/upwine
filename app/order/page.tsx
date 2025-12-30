'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrderPage() {
  const router = useRouter()
  const [stock, setStock] = useState({ available_bottles: 100 })
  const [quantity, setQuantity] = useState(1)
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/stock')
      .then(res => res.json())
      .then(data => setStock(data))
      .catch(err => console.error('Error fetching stock:', err))
  }, [])

  const pricePerBottle = 2000
  const subtotal = quantity * pricePerBottle
  const estimatedDeliveryFee = deliveryType === 'delivery' ? 1000 : 0 // Estimated for display
  const total = subtotal + estimatedDeliveryFee

  const handleDeliveryTypeChange = (type: 'pickup' | 'delivery') => {
    setDeliveryType(type)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > stock.available_bottles) {
      alert(`Only ${stock.available_bottles} bottles available`)
      return
    }
    setQuantity(newQuantity)
  }

  const handleProceedToCheckout = () => {
    if (quantity > stock.available_bottles) {
      alert('Insufficient stock')
      return
    }
    // Fee will be calculated automatically in checkout based on address
    router.push(`/checkout?quantity=${quantity}&type=${deliveryType}`)
  }

  if (stock.available_bottles === 0) {
    return (
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sold Out This Week</h2>
            <p className="text-gray-600 mb-6">
              We've sold out for this week. New stock will be available next Monday.
            </p>
            <a href="/" className="text-primary hover:underline">Return to Home</a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Order Fresh Natural Palm Wine
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Fresh Natural Palm Wine, 1 Liter
            </h2>
            <p className="text-3xl font-bold text-primary mb-4">
              ₦{pricePerBottle.toLocaleString()} per bottle
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-lg font-semibold text-green-800">
                {stock.available_bottles} bottles left this week
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Fresh palm wine tapped and bottled from our farm</li>
              <li>✓ We keep each batch for a maximum of 48 hours before delivery</li>
              <li>✓ No preservatives or additives</li>
              <li>✓ Taste varies slightly by batch, since it is natural</li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max={stock.available_bottles}
                  className="w-20 text-center text-xl font-semibold border-2 border-gray-300 rounded py-2"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  disabled={quantity >= stock.available_bottles}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Delivery Option
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleDeliveryTypeChange('pickup')}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    deliveryType === 'pickup'
                      ? 'border-primary bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold mb-1">📍 Pickup</div>
                  <div className="text-sm text-gray-600">
                    24 Tony Anenih Avenue, G.R.A, Benin City
                  </div>
                  <div className="text-sm text-gray-600">10 AM - 6 PM</div>
                </button>
                <button
                  onClick={() => handleDeliveryTypeChange('delivery')}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    deliveryType === 'delivery'
                      ? 'border-primary bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold mb-1">🚚 Delivery</div>
                  <div className="text-sm text-gray-600">
                    Across Benin City
                  </div>
                  <div className="text-sm text-gray-600">
                    Fee: ₦800 - ₦2,200 (based on selected area)
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    💡 Select your area at checkout
                  </div>
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <strong>📍 Delivery Areas Available:</strong>
                  <p className="mt-2">
                    Select your area at checkout. Delivery fees range from ₦800 to ₦2,200 
                    depending on your location in Benin City.
                  </p>
                  <p className="mt-2 text-xs">
                    Available areas: G.R.A (₦800), Ring Road (₦1,200), Ugbowo (₦1,900), 
                    Aduwawa (₦2,200), and more...
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-semibold text-gray-500">
                    Select area at checkout
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-lg font-semibold">Estimated Total:</span>
                <span className="text-lg font-bold text-primary">
                  {deliveryType === 'delivery' 
                    ? `₦${(subtotal + 800).toLocaleString()} - ₦${(subtotal + 2200).toLocaleString()}`
                    : `₦${total.toLocaleString()}`
                  }
                </span>
              </div>
              {deliveryType === 'delivery' && (
                <p className="text-xs text-gray-500 mt-2">
                  * Final total calculated after selecting delivery area
                </p>
              )}
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={loading || quantity > stock.available_bottles}
              className="w-full bg-primary text-white py-4 rounded-lg text-lg font-semibold hover:bg-secondary transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

