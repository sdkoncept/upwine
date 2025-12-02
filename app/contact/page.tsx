'use client'

import { useState } from 'react'

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

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Send Us a Message
            </h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-700 font-semibold">Message sent successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                    placeholder="08012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full border-2 border-gray-300 rounded py-2 px-4 focus:border-primary focus:outline-none"
                    placeholder="Your message..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Direct Contact
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold text-primary mb-2">
                    📞 Phone / WhatsApp
                  </div>
                  <p className="text-gray-700">
                    Call or WhatsApp us for orders and inquiries
                  </p>
                  <a href="https://wa.me/234" className="text-primary hover:underline">
                    Click to chat on WhatsApp
                  </a>
                </div>

                <div>
                  <div className="text-lg font-semibold text-primary mb-2">
                    📍 Pickup Location
                  </div>
                  <p className="text-gray-700">
                    24 Tony Anenih Avenue, G.R.A, Benin City
                  </p>
                </div>

                <div>
                  <div className="text-lg font-semibold text-primary mb-2">
                    ⏰ Operating Hours
                  </div>
                  <p className="text-gray-700">
                    Monday - Friday: 10 AM - 6 PM<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>

                <div>
                  <div className="text-lg font-semibold text-primary mb-2">
                    📧 Email
                  </div>
                  <p className="text-gray-700">
                    info@upwine.com
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🚚 Delivery Service
              </h3>
              <p className="text-green-700">
                We deliver across Benin City. Delivery fee ranges from ₦800 to ₦1,200 
                depending on your location. Our dispatch rider will contact you before arrival.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

