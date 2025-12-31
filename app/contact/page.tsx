'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', phone: '', email: '', message: '' })
    }, 3000)
  }

  // WhatsApp message with pre-filled text
  const whatsappMessage = encodeURIComponent('Hi! I\'m interested in ordering palm wine from Upwyne. 🌴')
  const whatsappLink = `https://wa.me/2348123456789?text=${whatsappMessage}` // Replace with actual number

  return (
    <main className="min-h-screen py-16 bg-gradient-to-b from-[#f5f9f7] to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d5a4a] mb-4">
            Get in Touch
          </h1>
          <p className="text-[#5a8a7a] text-lg max-w-2xl mx-auto">
            Have questions about our palm wine or need help with an order? We're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#e8f0ec]">
            <h2 className="text-2xl font-bold text-[#2d5a4a] mb-6 flex items-center gap-2">
              <span>✉️</span> Send Us a Message
            </h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border-2 border-[#e8f0ec] rounded-xl py-3 px-4 focus:border-[#2d5a4a] focus:outline-none transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#e8f0ec] rounded-xl py-3 px-4 focus:border-[#2d5a4a] focus:outline-none transition"
                    placeholder="08012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#e8f0ec] rounded-xl py-3 px-4 focus:border-[#2d5a4a] focus:outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2d5a4a] mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full border-2 border-[#e8f0ec] rounded-xl py-3 px-4 focus:border-[#2d5a4a] focus:outline-none transition resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2d5a4a] text-white py-4 rounded-xl text-lg font-semibold hover:bg-[#1e4035] transition shadow-lg hover:shadow-xl"
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#e8f0ec]">
              <h2 className="text-2xl font-bold text-[#2d5a4a] mb-6 flex items-center gap-2">
                <span>📞</span> Quick Contact
              </h2>
              
              <div className="space-y-6">
                {/* WhatsApp Button */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl transition group"
                >
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition">
                    💬
                  </div>
                  <div>
                    <div className="font-bold text-green-800">Chat on WhatsApp</div>
                    <div className="text-sm text-green-600">Quick response • Available daily</div>
                  </div>
                </a>

                {/* Call Button */}
                <a
                  href="tel:+2348123456789"
                  className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition group"
                >
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition">
                    📱
                  </div>
                  <div>
                    <div className="font-bold text-blue-800">Call Us</div>
                    <div className="text-sm text-blue-600">Mon-Fri • 10 AM - 6 PM</div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:hello@upwyne.com"
                  className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl transition group"
                >
                  <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition">
                    ✉️
                  </div>
                  <div>
                    <div className="font-bold text-purple-800">Email Us</div>
                    <div className="text-sm text-purple-600">hello@upwyne.com</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#e8f0ec]">
              <h2 className="text-2xl font-bold text-[#2d5a4a] mb-6 flex items-center gap-2">
                <span>📍</span> Visit Us
              </h2>
              <div className="space-y-4">
                <div className="bg-[#f0f7f4] rounded-xl p-4">
                  <div className="font-semibold text-[#2d5a4a] mb-1">Pickup Location</div>
                  <p className="text-[#5a8a7a]">24 Tony Anenih Avenue, G.R.A, Benin City</p>
                </div>
                <div className="bg-[#f0f7f4] rounded-xl p-4">
                  <div className="font-semibold text-[#2d5a4a] mb-1">Operating Hours</div>
                  <p className="text-[#5a8a7a]">Monday - Friday: 10 AM - 6 PM</p>
                  <p className="text-[#5a8a7a]">Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gradient-to-br from-[#2d5a4a] to-[#3d6a5a] rounded-3xl shadow-xl p-8 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🚚</span> Delivery Service
              </h2>
              <p className="text-[#a8d4c0] mb-4">
                We deliver fresh palm wine across Benin City within 24-48 hours of your order.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#a8d4c0]">Delivery Fee:</span>
                  <span className="font-semibold">₦800 - ₦2,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a8d4c0]">Delivery Time:</span>
                  <span className="font-semibold">24-48 hours</span>
                </div>
              </div>
              <Link
                href="/order"
                className="mt-6 block w-full bg-white text-[#2d5a4a] text-center py-3 rounded-xl font-semibold hover:bg-[#f0f7f4] transition"
              >
                Order Now →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-[#2d5a4a] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'How long does palm wine stay fresh?',
                a: 'Fresh palm wine stays good for about 5 days when refrigerated. We bottle and deliver within 24-48 hours to ensure maximum freshness.'
              },
              {
                q: 'Do you add sugar or preservatives?',
                a: 'No! Our palm wine is 100% natural with no additives. The sweetness comes naturally from fresh palm sap.'
              },
              {
                q: 'Can I pick up my order?',
                a: 'Yes! You can pick up from our location at 24 Tony Anenih Avenue, G.R.A, Benin City between 10 AM - 6 PM.'
              },
              {
                q: 'How do I track my order?',
                a: 'Use the Track Order page with your order number. You\'ll also receive WhatsApp updates on your order status.'
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-[#e8f0ec]">
                <h3 className="font-bold text-[#2d5a4a] mb-2">{faq.q}</h3>
                <p className="text-[#5a8a7a] text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
