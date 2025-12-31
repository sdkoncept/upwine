'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const navLinks = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/order', label: 'Order Now', icon: '🍷' },
    { href: '/track', label: 'Track Order', icon: '📦' },
    { href: '/lookup', label: 'Invoice/Receipt', icon: '📄' },
    { href: '/about', label: 'About', icon: 'ℹ️' },
    { href: '/contact', label: 'Contact', icon: '📞' },
    { href: '/admin', label: 'Admin', icon: '⚙️' },
  ]

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 p-2 rounded-lg hover:bg-gray-100 transition"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span 
            className={`block h-0.5 w-full bg-[#2d5a4a] rounded transition-all duration-300 origin-center ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span 
            className={`block h-0.5 w-full bg-[#2d5a4a] rounded transition-all duration-300 ${
              isOpen ? 'opacity-0 scale-0' : ''
            }`}
          />
          <span 
            className={`block h-0.5 w-full bg-[#2d5a4a] rounded transition-all duration-300 origin-center ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </div>
      </button>

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu Panel */}
      <div 
        className={`fixed top-0 right-0 w-[280px] h-full bg-white z-40 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="text-xl font-bold text-[#2d5a4a] flex items-center gap-2">
              <span className="text-2xl">🌴</span> Upwyne
            </div>
            <p className="text-sm text-gray-500 mt-1">Fresh Palm Wine</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      pathname === link.href
                        ? 'bg-[#2d5a4a] text-white'
                        : 'text-gray-700 hover:bg-[#f0f7f4] hover:text-[#2d5a4a]'
                    }`}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/order"
              className="block w-full bg-[#2d5a4a] text-white text-center py-3 rounded-xl font-semibold hover:bg-[#1e4035] transition shadow-lg"
            >
              Order Fresh Palm Wine 🍷
            </Link>
            <p className="text-xs text-gray-400 text-center mt-3">
              Delivered within 24-48 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
