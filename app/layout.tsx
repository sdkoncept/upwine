import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Upwine - Fresh Natural Palm Wine from Our Farm',
  description: 'Fresh palm wine tapped and bottled from our farm in Benin City. Natural, clean, and delivered fresh.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-primary">
                Upwine
              </Link>
              <div className="flex space-x-6">
                <Link href="/" className="text-gray-700 hover:text-primary transition">
                  Home
                </Link>
                <Link href="/order" className="text-gray-700 hover:text-primary transition">
                  Order
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-primary transition">
                  About
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-primary transition">
                  Contact
                </Link>
                <Link href="/admin" className="text-gray-700 hover:text-primary transition">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
        <footer className="bg-gray-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Upwine</h3>
                <p className="text-gray-300">Fresh natural palm wine from our farm in Benin City.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-300">
                  <li><Link href="/" className="hover:text-white">Home</Link></li>
                  <li><Link href="/order" className="hover:text-white">Order Now</Link></li>
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Contact</h3>
                <p className="text-gray-300">
                  📍 24 Tony Anenih Avenue, G.R.A, Benin City<br />
                  📞 Call or WhatsApp us<br />
                  ⏰ Pickup: 10 AM - 6 PM
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
              <p>&copy; {new Date().getFullYear()} Upwine. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

