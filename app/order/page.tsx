'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CartItem {
  size: '1L' | '5L' | '10L'
  quantity: number
  price_per_unit: number
}

export default function OrderPage() {
  const router = useRouter()
  const [stock, setStock] = useState({ available_bottles: 100 })
  const [pricePerLiter, setPricePerLiter] = useState(2000)
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedSize, setSelectedSize] = useState<'1L' | '5L' | '10L'>('1L')
  const [itemQuantity, setItemQuantity] = useState(1)

  useEffect(() => {
    fetch('/api/stock')
      .then(res => res.json())
      .then(data => setStock(data))
      .catch(err => console.error('Error fetching stock:', err))
    
    // Fetch price per liter from settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setPricePerLiter(parseInt(data.price_per_liter) || 2000)
      })
      .catch(err => console.error('Error fetching settings:', err))
  }, [])

  // Calculate price based on bottle size
  const getPriceForSize = (size: '1L' | '5L' | '10L') => {
    const liters = parseInt(size)
    return liters * pricePerLiter
  }

  // Calculate total items in cart
  const getTotalQuantity = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Calculate subtotal from cart
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0)
  }

  const estimatedDeliveryFee = deliveryType === 'delivery' ? 1000 : 0
  const subtotal = getSubtotal()
  const total = subtotal + estimatedDeliveryFee

  const handleDeliveryTypeChange = (type: 'pickup' | 'delivery') => {
    setDeliveryType(type)
  }

  const handleItemQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    const totalInCart = getTotalQuantity()
    if (totalInCart + newQuantity - itemQuantity > stock.available_bottles) {
      alert(`Only ${stock.available_bottles} bottles available. You have ${totalInCart} in cart.`)
      return
    }
    setItemQuantity(newQuantity)
  }

  const addToCart = () => {
    const totalInCart = getTotalQuantity()
    if (totalInCart + itemQuantity > stock.available_bottles) {
      alert(`Only ${stock.available_bottles} bottles available. You have ${totalInCart} in cart.`)
      return
    }

    const pricePerUnit = getPriceForSize(selectedSize)
    
    // Check if this size already exists in cart
    const existingItemIndex = cart.findIndex(item => item.size === selectedSize)
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedCart = [...cart]
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + itemQuantity
      }
      setCart(updatedCart)
    } else {
      // Add new item to cart
      setCart([...cart, {
        size: selectedSize,
        quantity: itemQuantity,
        price_per_unit: pricePerUnit
      }])
    }
    
    // Reset form
    setItemQuantity(1)
    setSelectedSize('1L')
  }

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
  }

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(index)
      return
    }
    
    const totalInCart = getTotalQuantity()
    const currentItemQuantity = cart[index].quantity
    if (totalInCart + newQuantity - currentItemQuantity > stock.available_bottles) {
      alert(`Only ${stock.available_bottles} bottles available`)
      return
    }
    
    const updatedCart = [...cart]
    updatedCart[index] = {
      ...updatedCart[index],
      quantity: newQuantity
    }
    setCart(updatedCart)
  }

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to your cart first')
      return
    }
    
    const totalInCart = getTotalQuantity()
    if (totalInCart > stock.available_bottles) {
      alert('Insufficient stock')
      return
    }
    
    // Encode cart items as JSON in URL
    const cartJson = encodeURIComponent(JSON.stringify(cart))
    router.push(`/checkout?cart=${cartJson}&type=${deliveryType}`)
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
                <p className="text-[#a8d4c0]">Multiple Sizes Available • Tapped Fresh Daily</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">₦{pricePerLiter.toLocaleString()}</div>
                <div className="text-[#a8d4c0]">per liter</div>
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
                  <div className="text-[#5a8a7a] text-sm">
                    {getTotalQuantity() > 0 && `${getTotalQuantity()} in your cart`}
                    {getTotalQuantity() === 0 && 'Limited weekly batch'}
                  </div>
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

            {/* Add to Cart Section */}
            <div className="border-t border-[#e8f0ec] pt-8 mb-8">
              <label className="block text-lg font-bold text-[#2d5a4a] mb-4">
                Add Items to Cart
              </label>
              
              {/* Bottle Size Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5a8a7a] mb-2">Bottle Size</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['1L', '5L', '10L'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-4 border-2 rounded-2xl text-center transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-[#2d5a4a] bg-[#f0f7f4] shadow-md'
                          : 'border-[#e8f0ec] hover:border-[#d4e4db] hover:bg-[#f8fbf9]'
                      }`}
                    >
                      <div className="text-xl font-bold text-[#2d5a4a] mb-1">{size}</div>
                      <div className="text-xs text-[#5a8a7a]">₦{getPriceForSize(size).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5a8a7a] mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleItemQuantityChange(itemQuantity - 1)}
                    className="w-12 h-12 bg-[#e8f0ec] hover:bg-[#d4e4db] text-[#2d5a4a] font-bold text-xl rounded-xl transition-all duration-200 disabled:opacity-50"
                    disabled={itemQuantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => handleItemQuantityChange(parseInt(e.target.value) || 1)}
                    min="1"
                    max={stock.available_bottles}
                    className="w-20 text-center text-xl font-bold border-2 border-[#e8f0ec] rounded-xl py-2 text-[#2d5a4a] focus:border-[#2d5a4a] focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => handleItemQuantityChange(itemQuantity + 1)}
                    className="w-12 h-12 bg-[#e8f0ec] hover:bg-[#d4e4db] text-[#2d5a4a] font-bold text-xl rounded-xl transition-all duration-200 disabled:opacity-50"
                    disabled={itemQuantity >= stock.available_bottles}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                className="w-full bg-[#3d6a5a] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5a4a] transition-all duration-200 shadow-md"
              >
                + Add to Cart ({itemQuantity} × {selectedSize} = ₦{(itemQuantity * getPriceForSize(selectedSize)).toLocaleString()})
              </button>
            </div>

            {/* Cart Display */}
            {cart.length > 0 && (
              <div className="border-t border-[#e8f0ec] pt-8 mb-8">
                <h3 className="text-lg font-bold text-[#2d5a4a] mb-4">Your Cart ({getTotalQuantity()} items)</h3>
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-[#f8fbf9] rounded-xl p-4 flex items-center justify-between border border-[#e8f0ec]">
                      <div className="flex-1">
                        <div className="font-semibold text-[#2d5a4a] mb-1">
                          {item.size} Bottle{item.quantity > 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-[#5a8a7a]">
                          {item.quantity} × ₦{item.price_per_unit.toLocaleString()} = ₦{(item.quantity * item.price_per_unit).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 bg-white border border-[#e8f0ec] rounded-lg text-[#2d5a4a] hover:bg-[#e8f0ec] transition"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 bg-white border border-[#e8f0ec] rounded-lg text-[#2d5a4a] hover:bg-[#e8f0ec] transition"
                            disabled={getTotalQuantity() >= stock.available_bottles}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-600 hover:text-red-700 font-semibold px-3 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  <div className="mt-3 text-sm font-semibold text-[#b8860b]">₦1,600 - ₦3,000</div>
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
                      Available areas: G.R.A (₦1,600), Ring Road (₦2,000), Ugbowo (₦2,700), 
                      Aduwawa (₦3,000), and more. Select your exact area at checkout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-[#f8fbf9] rounded-2xl p-6 mb-8 border border-[#e8f0ec]">
              <h3 className="font-bold text-[#2d5a4a] mb-4">Order Summary</h3>
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-[#5a8a7a]">
                      <span>{item.quantity} × {item.size} @ ₦{item.price_per_unit.toLocaleString()}</span>
                      <span className="font-semibold text-[#2d5a4a]">₦{(item.quantity * item.price_per_unit).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#5a8a7a] border-t border-[#e8f0ec] pt-2">
                    <span>Subtotal ({getTotalQuantity()} items)</span>
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
                        ? `₦${(subtotal + 1600).toLocaleString()} - ₦${(subtotal + 3000).toLocaleString()}`
                        : `₦${total.toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[#5a8a7a] text-center py-4">Your cart is empty. Add items above to get started.</p>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleProceedToCheckout}
              disabled={cart.length === 0}
              className="w-full bg-[#2d5a4a] text-white py-5 rounded-2xl text-xl font-bold hover:bg-[#1e4035] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {cart.length > 0 ? `Proceed to Checkout → (${getTotalQuantity()} items)` : 'Add items to cart first'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
