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
      {/* Hero Section with Banner Background */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/banner.jpg')` }}
        />
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Stock & Price Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 max-w-sm mx-auto border border-white/50">
            <div className="text-6xl md:text-7xl font-bold text-[#2d5a4a] mb-2">
              {stock.available_bottles}
            </div>
            <div className="text-[#5a8a7a] font-medium mb-6">
              bottles available this week
            </div>
            
            <div className="border-t border-[#e0ebe6] pt-6 mb-6">
              <div className="text-4xl font-bold text-[#2d5a4a] mb-1">
                ₦2,000
              </div>
              <div className="text-[#5a8a7a]">
                per 1 liter bottle
              </div>
            </div>

            <Link
              href="/order"
              className="inline-block w-full bg-[#2d5a4a] text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-[#1e4035] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Order Your Bottles
            </Link>
          </div>
        </div>
      </section>

      {/* Freshness Notice */}
      <section className="py-12 bg-gradient-to-r from-[#f0f7f4] to-[#e8f3ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-semibold text-[#2d5a4a]">Freshness Guaranteed</span>
            </div>
            <p className="text-[#5a8a7a] mt-4 text-lg">
              Palm wine stays fresh for 5 days. We bottle and deliver within 24 to 48 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Upwyne */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-[#2d5a4a] mb-4">
            Why Choose Upwyne
          </h2>
          <p className="text-center text-[#5a8a7a] mb-12 max-w-2xl mx-auto">
            Delightful and fruity palm wine crafted from the heart of Edo State
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🌿', title: 'Natural & Fresh', desc: 'Natural palm wine from our own farm, tapped fresh daily' },
              { icon: '✨', title: 'No Additives', desc: 'We do not add sugar or preservatives. Pure and natural taste' },
              { icon: '🧴', title: 'Clean Process', desc: 'We bottle under clean conditions for your safety' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Same day pickup or dispatch delivery across Benin City' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group bg-gradient-to-b from-white to-[#f8fbf9] rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-[#e8f0ec] hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#e8f0ec] to-[#d4e4db] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[#2d5a4a] mb-3 text-center">{item.title}</h3>
                <p className="text-[#5a8a7a] text-center leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pickup & Delivery Info */}
      <section className="py-20 bg-gradient-to-b from-[#f5f9f7] to-[#edf4f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-[#2d5a4a] mb-12">
            How to Get Your Palm Wine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-[#e0ebe6] hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-[#e8f0ec] rounded-2xl flex items-center justify-center text-2xl mb-5">
                📍
              </div>
              <h3 className="text-2xl font-bold text-[#2d5a4a] mb-4">
                Pickup Location
              </h3>
              <p className="text-[#3d6a5a] text-lg mb-2 font-medium">
                24 Tony Anenih Avenue, G.R.A, Benin City
              </p>
              <p className="text-[#5a8a7a]">
                Pickup hours: 10 AM - 6 PM, Monday to Friday
              </p>
              <div className="mt-4 pt-4 border-t border-[#e8f0ec]">
                <span className="inline-block bg-[#e8f0ec] text-[#2d5a4a] px-4 py-2 rounded-full text-sm font-medium">
                  Free Pickup
                </span>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-[#e0ebe6] hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-[#e8f0ec] rounded-2xl flex items-center justify-center text-2xl mb-5">
                🚚
              </div>
              <h3 className="text-2xl font-bold text-[#2d5a4a] mb-4">
                Delivery Service
              </h3>
              <p className="text-[#3d6a5a] text-lg mb-2 font-medium">
                Delivery available across Benin City
              </p>
              <p className="text-[#5a8a7a]">
                Our dispatch rider will contact you before arrival.
              </p>
              <div className="mt-4 pt-4 border-t border-[#e8f0ec]">
                <span className="inline-block bg-[#fff8e6] text-[#b8860b] px-4 py-2 rounded-full text-sm font-medium">
                  ₦800 - ₦2,200 delivery fee
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#2d5a4a]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to taste fresh palm wine?
          </h2>
          <p className="text-[#a8d4c0] mb-8 text-lg">
            Order now and get your bottles delivered fresh within 24-48 hours
          </p>
          <Link
            href="/order"
            className="inline-block bg-white text-[#2d5a4a] px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#f0f7f4] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Order Now →
          </Link>
        </div>
      </section>
    </main>
  )
}
