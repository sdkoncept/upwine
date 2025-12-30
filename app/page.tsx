'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [stock, setStock] = useState({ available_bottles: 100, total_bottles: 100 })

  useEffect(() => {
    fetch('/api/stock')
      .then(res => res.json())
      .then(data => setStock(data))
      .catch(err => console.error('Error fetching stock:', err))

    // Refresh stock every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/stock')
        .then(res => res.json())
        .then(data => setStock(data))
        .catch(err => console.error('Error fetching stock:', err))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Upwine
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Fresh natural palm wine from our farm in Benin City
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
              You get fresh palm wine tapped and bottled on the same day. We produce 100 bottles a week. 
              Stock stays open until we sell out.
            </p>

            {/* Stock Display */}
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto mb-8">
              <div className="text-4xl font-bold text-primary mb-2">
                {stock.available_bottles}
              </div>
              <div className="text-gray-600 mb-4">
                bottles available this week
              </div>
              <div className="text-2xl font-semibold text-gray-800 mb-2">
                ₦2,000
              </div>
              <div className="text-gray-600">
                per 1 liter bottle
              </div>
            </div>

            <Link
              href="/order"
              className="inline-block bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-secondary transition shadow-lg"
            >
              Order Your Bottles
            </Link>
          </div>
        </div>
      </section>

      {/* Freshness Notice */}
      <section className="py-12 bg-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-800 mb-2">
              ⚡ Freshness Guaranteed
            </div>
            <p className="text-gray-600">
              Palm wine stays fresh for 5 days. We bottle and deliver within 24 to 48 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Upwine */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">
            Why Choose Upwine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="text-xl font-semibold mb-2">Natural & Fresh</h3>
              <p className="text-gray-600">
                Natural palm wine from our own farm, tapped fresh daily
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold mb-2">No Additives</h3>
              <p className="text-gray-600">
                We do not add sugar or preservatives. Pure and natural taste
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🧼</div>
              <h3 className="text-xl font-semibold mb-2">Clean Process</h3>
              <p className="text-gray-600">
                We bottle under clean conditions for your safety
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Same day pickup or dispatch delivery across Benin City
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pickup & Delivery Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-semibold text-primary mb-4">
                📍 Pickup Location
              </h3>
              <p className="text-gray-700 text-lg mb-2">
                24 Tony Anenih Avenue, G.R.A, Benin City
              </p>
              <p className="text-gray-600">
                Pickup hours: 10 AM - 6 PM, Monday to Friday
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-semibold text-primary mb-4">
                🚚 Delivery Service
              </h3>
              <p className="text-gray-700 text-lg mb-2">
                Delivery available across Benin City
              </p>
              <p className="text-gray-600">
                Delivery fee: ₦800 - ₦2,200 based on your selected area in Benin City. 
                Select your area at checkout. Our dispatch rider will contact you before arrival.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

