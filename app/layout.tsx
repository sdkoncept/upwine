import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import MobileNav from './components/MobileNav'

const outfit = Outfit({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Upwyne - Premium Palm Wine from Edo State',
  description: 'Delightful and fruity palm wine crafted from the heart of Edo State. Fresh, natural, and delivered to your doorstep.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        {/* Navigation */}
        <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#e8f0ec]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18 py-4">
              <Link href="/" className="text-2xl font-bold text-[#2d5a4a] tracking-tight flex items-center gap-2">
                <span className="text-3xl">🌴</span>
                <span>Upwyne</span>
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-[#5a8a7a] hover:text-[#2d5a4a] transition-colors font-medium">
                  Home
                </Link>
                <Link href="/order" className="text-[#5a8a7a] hover:text-[#2d5a4a] transition-colors font-medium">
                  Order
                </Link>
                <Link href="/track" className="text-[#5a8a7a] hover:text-[#2d5a4a] transition-colors font-medium">
                  Track Order
                </Link>
                <Link href="/about" className="text-[#5a8a7a] hover:text-[#2d5a4a] transition-colors font-medium">
                  About
                </Link>
                <Link href="/contact" className="text-[#5a8a7a] hover:text-[#2d5a4a] transition-colors font-medium">
                  Contact
                </Link>
                <Link 
                  href="/order" 
                  className="bg-[#2d5a4a] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#1e4035] transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Order Now
                </Link>
              </div>
              {/* Mobile menu */}
              <MobileNav />
            </div>
          </div>
        </nav>

        {children}

        {/* Footer */}
        <footer className="bg-[#1a3d32] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {/* Brand */}
              <div className="md:col-span-1">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>🌴</span> Upwyne
                </h3>
                <p className="text-[#a8d4c0] leading-relaxed">
                  Premium palm wine selection. Delightful and fruity, crafted from the heart of Edo State.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-[#a8d4c0] hover:text-white transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/order" className="text-[#a8d4c0] hover:text-white transition-colors">
                      Order Now
                    </Link>
                  </li>
                  <li>
                    <Link href="/track" className="text-[#a8d4c0] hover:text-white transition-colors">
                      Track Order
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-[#a8d4c0] hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-[#a8d4c0] hover:text-white transition-colors">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
                <ul className="space-y-3 text-[#a8d4c0]">
                  <li className="flex items-start gap-2">
                    <span>📍</span>
                    <span>24 Tony Anenih Avenue, G.R.A, Benin City</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>⏰</span>
                    <span>Pickup: 10 AM - 6 PM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📞</span>
                    <span>Call or WhatsApp us</span>
                  </li>
                </ul>
              </div>

              {/* Order CTA */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Get Fresh Palm Wine</h4>
                <p className="text-[#a8d4c0] mb-4">
                  Order now and enjoy fresh, natural palm wine delivered to your doorstep.
                </p>
                <Link 
                  href="/order"
                  className="inline-block bg-white text-[#2d5a4a] px-6 py-3 rounded-full font-semibold hover:bg-[#f0f7f4] transition-all duration-300"
                >
                  Order Now →
                </Link>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#2d5a4a] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[#a8d4c0] text-sm">
                © {new Date().getFullYear()} Upwyne. All rights reserved.
              </p>
              <p className="text-[#7ab39e] text-sm">
                Made with 🌴 in Benin City, Nigeria
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
