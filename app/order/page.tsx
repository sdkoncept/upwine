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
  const estimatedDeliveryFee = deliveryType === 'delivery' ? 1000 : 0
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
    router.push(`/checkout?quantity=${quantity}&type=${deliveryType}`)
  }

  if (stock.available_bottles === 0) {
    return (
      <main className="min-h-screen py-16 bg-gradient-to-b from-[#f5f9f7] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#e8f0ec] rounded-3xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-6">😔</div>
            <h2 className="text-3xl font-bold text-[#2d5a4a] mb-4">Sold Out This Week</h2>
            <p className="text-[#5a8a7a] mb-8 text-lg">
              We've sold out for this week. New stock will be available next Monday.
            </p>
            <a 
              href="/" 
              className="inline-block bg-[#2d5a4a] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#1e4035] transition-all duration-300"
            >
              Return to Home
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12 bg-gradient-to-b from-[#f5f9f7] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d5a4a] mb-4">
            Order Fresh Palm Wine
          </h1>
          <p className="text-[#5a8a7a] text-lg">
            Delightful and fruity, crafted from the heart of Edo State
          </p>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#e8f0ec] overflow-hidden">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-[#2d5a4a] to-[#3d6a5a] p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Fresh Natural Palm Wine
                </h2>
                <p className="text-[#a8d4c0]">1 Liter Bottle • Tapped Fresh Daily</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">₦{pricePerBottle.toLocaleString()}</div>
                <div className="text-[#a8d4c0]">per bottle</div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Stock Info */}
            <div className="bg-gradient-to-r from-[#e8f0ec] to-[#f0f7f4] rounded-2xl p-5 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🌴</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#2d5a4a]">
                    {stock.available_bottles} bottles available
                  </div>
                  <div className="text-[#5a8a7a] text-sm">Limited weekly batch</div>
                </div>
              </div>
              <div className="bg-[#2d5a4a] text-white px-4 py-2 rounded-full text-sm font-medium">
                In Stock
              </div>
            </div>

            {/* Product Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#2d5a4a] mb-4">What You Get</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  '✓ Fresh palm wine tapped from our farm',
                  '✓ Bottled within 48 hours of tapping',
                  '✓ No preservatives or additives',
                  '✓ Natural taste variation by batch',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#5a8a7a] bg-[#f8fbf9] px-4 py-3 rounded-xl">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="border-t border-[#e8f0ec] pt-8 mb-8">
              <label className="block text-lg font-bold text-[#2d5a4a] mb-4">
                How many bottles?
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-14 h-14 bg-[#e8f0ec] hover:bg-[#d4e4db] text-[#2d5a4a] font-bold text-2xl rounded-2xl transition-all duration-200 disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max={stock.available_bottles}
                  className="w-24 text-center text-2xl font-bold border-2 border-[#e8f0ec] rounded-2xl py-3 text-[#2d5a4a] focus:border-[#2d5a4a] focus:outline-none transition-colors"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-14 h-14 bg-[#e8f0ec] hover:bg-[#d4e4db] text-[#2d5a4a] font-bold text-2xl rounded-2xl transition-all duration-200 disabled:opacity-50"
                  disabled={quantity >= stock.available_bottles}
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-[#2d5a4a] mb-4">
                How do you want to receive it?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleDeliveryTypeChange('pickup')}
                  className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
                    deliveryType === 'pickup'
                      ? 'border-[#2d5a4a] bg-[#f0f7f4] shadow-md'
                      : 'border-[#e8f0ec] hover:border-[#d4e4db] hover:bg-[#f8fbf9]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      deliveryType === 'pickup' ? 'bg-[#2d5a4a] text-white' : 'bg-[#e8f0ec]'
                    }`}>
                      📍
                    </div>
                    <div className="font-bold text-[#2d5a4a] text-lg">Pickup</div>
                    {deliveryType === 'pickup' && (
                      <span className="ml-auto bg-[#2d5a4a] text-white text-xs px-3 py-1 rounded-full">Selected</span>
                    )}
                  </div>
                  <div className="text-sm text-[#5a8a7a] ml-13">
                    <p className="font-medium text-[#3d6a5a]">24 Tony Anenih Avenue, G.R.A</p>
                    <p>Benin City • 10 AM - 6 PM</p>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[#2d5a4a]">Free</div>
                </button>

                <button
                  onClick={() => handleDeliveryTypeChange('delivery')}
                  className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
                    deliveryType === 'delivery'
                      ? 'border-[#2d5a4a] bg-[#f0f7f4] shadow-md'
                      : 'border-[#e8f0ec] hover:border-[#d4e4db] hover:bg-[#f8fbf9]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      deliveryType === 'delivery' ? 'bg-[#2d5a4a] text-white' : 'bg-[#e8f0ec]'
                    }`}>
                      🚚
                    </div>
                    <div className="font-bold text-[#2d5a4a] text-lg">Delivery</div>
                    {deliveryType === 'delivery' && (
                      <span className="ml-auto bg-[#2d5a4a] text-white text-xs px-3 py-1 rounded-full">Selected</span>
                    )}
                  </div>
                  <div className="text-sm text-[#5a8a7a] ml-13">
                    <p className="font-medium text-[#3d6a5a]">Across Benin City</p>
                    <p>Select your area at checkout</p>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[#b8860b]">₦800 - ₦2,200</div>
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            {deliveryType === 'delivery' && (
              <div className="mb-8 bg-[#fff8e6] border border-[#ffeeba] rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="font-semibold text-[#856404] mb-1">Delivery Areas</p>
                    <p className="text-sm text-[#856404]">
                      Available areas: G.R.A (₦800), Ring Road (₦1,200), Ugbowo (₦1,900), 
                      Aduwawa (₦2,200), and more. Select your exact area at checkout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-[#f8fbf9] rounded-2xl p-6 mb-8 border border-[#e8f0ec]">
              <h3 className="font-bold text-[#2d5a4a] mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-[#5a8a7a]">
                  <span>{quantity} bottle{quantity > 1 ? 's' : ''} × ₦{pricePerBottle.toLocaleString()}</span>
                  <span className="font-semibold text-[#2d5a4a]">₦{subtotal.toLocaleString()}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-[#5a8a7a]">
                    <span>Delivery fee</span>
                    <span className="font-medium text-[#b8860b]">Select area at checkout</span>
                  </div>
                )}
                <div className="border-t border-[#e8f0ec] pt-3 flex justify-between">
                  <span className="text-lg font-bold text-[#2d5a4a]">Estimated Total</span>
                  <span className="text-lg font-bold text-[#2d5a4a]">
                    {deliveryType === 'delivery' 
                      ? `₦${(subtotal + 800).toLocaleString()} - ₦${(subtotal + 2200).toLocaleString()}`
                      : `₦${total.toLocaleString()}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleProceedToCheckout}
              disabled={loading || quantity > stock.available_bottles}
              className="w-full bg-[#2d5a4a] text-white py-5 rounded-2xl text-xl font-bold hover:bg-[#1e4035] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Processing...' : 'Proceed to Checkout →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
