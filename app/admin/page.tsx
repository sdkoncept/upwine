'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  size: '1L' | '5L' | '10L'
  quantity: number
  price_per_unit: number
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  phone: string
  email?: string
  address?: string
  quantity: number // Keep for backward compatibility
  bottle_size?: '1L' | '5L' | '10L' // Keep for backward compatibility
  price_per_bottle?: number // Keep for backward compatibility
  order_items?: OrderItem[] // New: cart items
  delivery_fee: number
  total_amount: number
  delivery_type: string
  payment_method: string
  payment_status: string
  payment_reference?: string
  paystack_reference?: string
  status: string
  delivery_time?: string
  created_at: string
  updated_at?: string
}

interface SalesStats {
  total_orders: number
  total_bottles_sold: number
  total_revenue: number
  paid_revenue: number
  cod_revenue: number
  online_revenue: number
}

interface SalesByDate {
  date: string
  orders_count: number
  bottles_sold: number
  revenue: number
}

interface Settings {
  price_per_bottle: string
  price_per_liter: string
  weekly_stock: string
  pickup_address: string
  delivery_fee_min: string
  delivery_fee_max: string
  admin_phone: string
  admin_email: string
}

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  phone: string
  email?: string
  address?: string
  quantity: number
  price_per_bottle: number
  delivery_fee: number
  discount: number
  total_amount: number
  notes?: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  due_date?: string
  created_at: string
}

interface DiscountCode {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount?: number
  max_uses?: number
  used_count: number
  expires_at?: string
  is_active: boolean
  description?: string
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stock, setStock] = useState({ available_bottles: 100, total_bottles: 100 })
  const [newStock, setNewStock] = useState(100)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'stock' | 'sales' | 'invoices' | 'discount-codes' | 'settings'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Order Lookup State
  const [searchOrderNumber, setSearchOrderNumber] = useState('')
  const [lookupOrder, setLookupOrder] = useState<Order | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // Sales Dashboard State
  const [stats, setStats] = useState<SalesStats>({
    total_orders: 0,
    total_bottles_sold: 0,
    total_revenue: 0,
    paid_revenue: 0,
    cod_revenue: 0,
    online_revenue: 0,
  })
  const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([])
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'year' | 'custom'>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day')
  
  // Settings State
  const [settings, setSettings] = useState<Settings>({
    price_per_bottle: '2000',
    price_per_liter: '2000',
    weekly_stock: '100',
    pickup_address: '24 Tony Anenih Avenue, G.R.A, Benin City',
    delivery_fee_min: '1600',
    delivery_fee_max: '3000',
    admin_phone: '',
    admin_email: '',
  })
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Invoice State
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    quantity: 1,
    price_per_bottle: 2000,
    delivery_fee: 0,
    discount: 0,
    notes: '',
    due_date: '',
  })
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  
  // Discount Code State
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [showCreateDiscountCode, setShowCreateDiscountCode] = useState(false)
  const [selectedDiscountCode, setSelectedDiscountCode] = useState<DiscountCode | null>(null)
  const [showDiscountCodeDetails, setShowDiscountCodeDetails] = useState(false)
  const [discountCodeForm, setDiscountCodeForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
    description: '',
  })
  const [creatingDiscountCode, setCreatingDiscountCode] = useState(false)

  // WhatsApp Import State
  const [showWhatsAppImport, setShowWhatsAppImport] = useState(false)
  const [whatsAppText, setWhatsAppText] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authenticated && activeTab === 'sales') {
      fetchSalesData()
    }
  }, [authenticated, activeTab, dateFilter, customStartDate, customEndDate, groupBy])

  useEffect(() => {
    if (authenticated && activeTab === 'invoices') {
      fetchInvoices()
    }
  }, [authenticated, activeTab])

  useEffect(() => {
    if (authenticated && activeTab === 'discount-codes') {
      fetchDiscountCodes()
    }
  }, [authenticated, activeTab])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth')
      const data = await res.json()
      if (data.authenticated) {
        setAuthenticated(true)
        fetchData()
        fetchSettings()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setCheckingAuth(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, stockRes] = await Promise.all([
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/admin/stock', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
      ])
      const ordersData = await ordersRes.json()
      const stockData = await stockRes.json()
      setOrders(ordersData)
      if (stockData && stockData.available_bottles !== undefined) {
        setStock(stockData)
        setNewStock(stockData.total_bottles || stockData.available_bottles)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate = ''
    let endDate = now.toISOString().split('T')[0]

    switch (dateFilter) {
      case 'day':
        startDate = endDate
        break
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(now.getFullYear() - 1)
        startDate = yearAgo.toISOString().split('T')[0]
        break
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return { startDate: undefined, endDate: undefined }
        }
        startDate = customStartDate
        endDate = customEndDate
        break
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined }
    }

    return { startDate, endDate }
  }

  const fetchSalesData = async () => {
    try {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (dateFilter !== 'all') params.append('groupBy', groupBy)

      const res = await fetch(`/api/admin/sales?${params.toString()}`)
      const data = await res.json()
      setStats(data.stats || {
        total_orders: 0,
        total_bottles_sold: 0,
        total_revenue: 0,
        paid_revenue: 0,
        cod_revenue: 0,
        online_revenue: 0,
      })
      setSalesByDate(data.salesByDate || [])
    } catch (error) {
      console.error('Error fetching sales data:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices')
      const data = await res.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const resetInvoiceForm = () => {
    setInvoiceForm({
      customer_name: '',
      phone: '',
      email: '',
      address: '',
      quantity: 1,
      price_per_bottle: parseInt(settings.price_per_bottle) || 2000,
      delivery_fee: 0,
      discount: 0,
      notes: '',
      due_date: '',
    })
  }

  // Smart Parser Function for WhatsApp Messages
  const parseWhatsAppOrder = (text: string) => {
    const order: any = {
      customer_name: '',
      phone: '',
      email: '',
      address: '',
      delivery_type: 'pickup',
      payment_method: 'cod',
      order_items: [],
      notes: ''
    }

    // Extract name (common patterns)
    const namePatterns = [
      /(?:name|customer|client)[\s:]*([^\n,]+)/i,
      /(?:i'm|i am|my name is|this is)\s+([^\n,]+)/i,
    ]
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        order.customer_name = match[1].trim().replace(/[^a-zA-Z\s]/g, '').trim()
        if (order.customer_name) break
      }
    }

    // Extract phone (Nigerian formats: 080, 070, 234, etc.)
    const phonePatterns = [
      /(?:phone|number|tel|contact)[\s:]*([0-9\s+\-()]{10,15})/i,
      /(0[789][01]\d{8})/g,
      /(234[789][01]\d{8})/g,
      /([789][01]\d{8})/g
    ]
    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match) {
        let phone = Array.isArray(match) ? match[0] : match[1]
        phone = phone.replace(/\D/g, '')
        if (phone.startsWith('234')) {
          phone = '0' + phone.slice(3)
        } else if (phone.length === 9) {
          phone = '0' + phone
        }
        if (phone.length >= 10) {
          order.phone = phone
          break
        }
      }
    }

    // Extract email
    const emailMatch = text.match(/(?:email)[\s:]*([^\s\n]+@[^\s\n]+)/i) || 
                       text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
    if (emailMatch) {
      order.email = (emailMatch[1] || emailMatch[0]).trim()
    }

    // Extract address (look for delivery-related keywords)
    const addressPatterns = [
      /(?:address|location|deliver to|ship to|address:)[\s:]*([^\n]+)/i,
      /(g\.r\.a|ring road|airport road|ugbowo|aduwawa|ekewan|ikpoba hill|siluko|new lagos road|third east circular|second east circular|first east circular)[^,\n]*/i
    ]
    for (const pattern of addressPatterns) {
      const match = text.match(pattern)
      if (match) {
        const address = match[1] ? match[1].trim() : match[0].trim()
        if (address.length > 3) {
          order.address = address
          order.delivery_type = 'delivery'
          break
        }
      }
    }

    // Extract items (patterns: 2x1L, 3x5L, 1x10L, 2 × 1L, etc.)
    const itemPatterns = [
      /(?:items?|order|bottles?|quantity)[\s:]*([^\n]+)/i,
      /(\d+)\s*x\s*(\d+)?(L|liter)/gi,
      /(\d+)\s*×\s*(\d+)?(L|liter)/gi
    ]
    
    let itemsText = ''
    for (const pattern of itemPatterns.slice(0, 1)) {
      const match = text.match(pattern)
      if (match) {
        itemsText = match[1] || match[0]
        break
      }
    }

    const itemMatches = itemsText.match(/(\d+)\s*x?\s*(\d+)?(L|liter)/gi) || 
                       text.match(/(\d+)\s*x?\s*(\d+)?(L|liter)/gi) ||
                       []
    
    if (itemMatches && itemMatches.length > 0) {
      const pricePerLiter = parseInt(settings.price_per_liter || '2000')
      order.order_items = itemMatches.map(match => {
        const parts = match.match(/(\d+)\s*x?\s*(\d+)?(L|liter)/i)
        if (!parts) return null
        const quantity = parseInt(parts[1] || '1')
        const sizeStr = parts[2] || '1'
        const size = `${sizeStr}L` as '1L' | '5L' | '10L'
        if (!['1L', '5L', '10L'].includes(size)) return null
        const liters = parseInt(size)
        return {
          size: size,
          quantity: quantity,
          price_per_unit: liters * pricePerLiter
        }
      }).filter(Boolean) as any[]
    }

    // Extract payment method
    if (text.match(/cod|cash.*delivery|pay.*pickup|pay.*on.*delivery/i)) {
      order.payment_method = 'cod'
    } else if (text.match(/online|card|paystack|transfer|bank/i)) {
      order.payment_method = 'online'
    }

    // Extract notes
    const notesMatch = text.match(/(?:note|comment|message|remarks)[\s:]*([^\n]+)/i)
    if (notesMatch) {
      order.notes = notesMatch[1].trim()
    }

    // Calculate total quantity for invoice form
    order.quantity = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1

    return order
  }

  // Handle WhatsApp import
  const handleWhatsAppImport = () => {
    if (!whatsAppText.trim()) {
      alert('Please paste the WhatsApp message')
      return
    }
    
    const parsed = parseWhatsAppOrder(whatsAppText)
    
    // Validate required fields
    if (!parsed.customer_name) {
      alert('Could not extract customer name. Please check the message format.\n\nExample format:\nName: John Doe\nPhone: 08012345678\nItems: 2x1L, 1x5L')
      return
    }
    if (!parsed.phone) {
      alert('Could not extract phone number. Please check the message format.\n\nExample format:\nName: John Doe\nPhone: 08012345678\nItems: 2x1L, 1x5L')
      return
    }
    if (!parsed.order_items || parsed.order_items.length === 0) {
      alert('Could not extract order items. Please use format: 2x1L, 1x5L, 3x10L, etc.\n\nExample format:\nName: John Doe\nPhone: 08012345678\nItems: 2x1L, 1x5L')
      return
    }
    
    // Fill invoice form with parsed data
    const firstItem = parsed.order_items[0]
    const totalQuantity = parsed.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    
    setInvoiceForm({
      customer_name: parsed.customer_name,
      phone: parsed.phone,
      email: parsed.email || '',
      address: parsed.address || '',
      quantity: totalQuantity,
      price_per_bottle: firstItem?.price_per_unit || parseInt(settings.price_per_liter || '2000'),
      delivery_fee: parsed.delivery_type === 'delivery' ? 2000 : 0,
      discount: 0,
      notes: parsed.notes || `Imported from WhatsApp\n\nOriginal message:\n${whatsAppText.substring(0, 200)}${whatsAppText.length > 200 ? '...' : ''}`,
      due_date: '',
    })
    
    setShowWhatsAppImport(false)
    setShowCreateInvoice(true)
    setWhatsAppText('')
    
    alert(`Order imported successfully!\n\nCustomer: ${parsed.customer_name}\nPhone: ${parsed.phone}\nItems: ${parsed.order_items.length} item(s)\n\nPlease review and adjust the invoice form as needed.`)
  }

  const createNewInvoice = async () => {
    if (!invoiceForm.customer_name.trim() || !invoiceForm.phone.trim()) {
      alert('Please fill in customer name and phone number')
      return
    }
    if (invoiceForm.quantity < 1) {
      alert('Quantity must be at least 1')
      return
    }

    setCreatingInvoice(true)
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm)
      })
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
      } else {
        alert(`Invoice ${data.invoice.invoice_number} created successfully!`)
        setShowCreateInvoice(false)
        resetInvoiceForm()
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setCreatingInvoice(false)
    }
  }

  const sendInvoice = async (invoiceId: number) => {
    setSendingInvoice(true)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
      } else if (data.warning) {
        alert(data.warning)
        fetchInvoices()
      } else {
        alert('Invoice sent successfully via WhatsApp!')
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Failed to send invoice')
    } finally {
      setSendingInvoice(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: number, status: string) => {
    try {
      await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchInvoices()
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: status as Invoice['status'] })
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
      alert('Failed to update invoice status')
    }
  }

  const deleteInvoice = async (invoiceId: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      fetchInvoices()
      setShowInvoiceDetails(false)
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice')
    }
  }

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDetails(true)
  }

  const copyInvoiceLink = (invoiceNumber: string) => {
    const url = `${window.location.origin}/view-invoice/${invoiceNumber}`
    navigator.clipboard.writeText(url)
    alert('Invoice link copied to clipboard!')
  }

  const shareViaWhatsApp = (invoice: Invoice) => {
    const url = `${window.location.origin}/view-invoice/${invoice.invoice_number}`
    const message = `Hello ${invoice.customer_name}! Here's your invoice from Upwyne for ${invoice.quantity} bottle(s) of palm wine. Total: ₦${invoice.total_amount.toLocaleString()}. View invoice: ${url}`
    const whatsappUrl = `https://wa.me/${invoice.phone.replace(/^0/, '234')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Discount Code Functions
  const fetchDiscountCodes = async () => {
    try {
      const res = await fetch('/api/admin/discount-codes')
      const data = await res.json()
      setDiscountCodes(data)
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    }
  }

  const resetDiscountCodeForm = () => {
    setDiscountCodeForm({
      code: '',
      type: 'percentage',
      value: 10,
      min_order_amount: '',
      max_uses: '',
      expires_at: '',
      description: '',
    })
  }

  const createNewDiscountCode = async () => {
    if (!discountCodeForm.code.trim()) {
      alert('Please enter a discount code')
      return
    }
    if (discountCodeForm.value <= 0) {
      alert('Discount value must be greater than 0')
      return
    }
    if (discountCodeForm.type === 'percentage' && discountCodeForm.value > 100) {
      alert('Percentage discount cannot exceed 100%')
      return
    }

    setCreatingDiscountCode(true)
    try {
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCodeForm.code.trim(),
          type: discountCodeForm.type,
          value: discountCodeForm.value,
          min_order_amount: discountCodeForm.min_order_amount ? parseFloat(discountCodeForm.min_order_amount) : undefined,
          max_uses: discountCodeForm.max_uses ? parseInt(discountCodeForm.max_uses) : undefined,
          expires_at: discountCodeForm.expires_at || undefined,
          description: discountCodeForm.description?.trim(),
        })
      })
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
      } else {
        alert(`Discount code ${data.discount_code.code} created successfully!`)
        setShowCreateDiscountCode(false)
        resetDiscountCodeForm()
        fetchDiscountCodes()
      }
    } catch (error) {
      console.error('Error creating discount code:', error)
      alert('Failed to create discount code')
    } finally {
      setCreatingDiscountCode(false)
    }
  }

  const updateDiscountCodeStatus = async (codeId: number, isActive: boolean) => {
    try {
      await fetch(`/api/admin/discount-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      })
      fetchDiscountCodes()
    } catch (error) {
      console.error('Error updating discount code status:', error)
      alert('Failed to update discount code status')
    }
  }

  const deleteDiscountCode = async (codeId: number) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return
    
    try {
      await fetch(`/api/admin/discount-codes/${codeId}`, {
        method: 'DELETE',
      })
      fetchDiscountCodes()
      setShowDiscountCodeDetails(false)
    } catch (error) {
      console.error('Error deleting discount code:', error)
      alert('Failed to delete discount code')
    }
  }

  const openDiscountCodeDetails = (code: DiscountCode) => {
    setSelectedDiscountCode(code)
    setShowDiscountCodeDetails(true)
  }

  // Order Lookup Functions
  const searchOrder = () => {
    if (!searchOrderNumber.trim()) {
      setLookupError('Please enter an order number')
      return
    }

    setIsSearching(true)
    setLookupError('')
    setLookupOrder(null)

    const orderNum = searchOrderNumber.trim().toUpperCase()
    const found = orders.find(o => o.order_number === orderNum)

    if (found) {
      setLookupOrder(found)
      setLookupError('')
    } else {
      setLookupError(`Order ${orderNum} not found. Please check the order number.`)
    }
    setIsSearching(false)
  }

  const clearLookup = () => {
    setSearchOrderNumber('')
    setLookupOrder(null)
    setLookupError('')
  }

  const handleLookupKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchOrder()
    }
  }

  const markLookupOrderAsPickedUp = async () => {
    if (!lookupOrder) return
    
    // If COD and not paid, mark as paid first
    if (lookupOrder.payment_method === 'cod' && lookupOrder.payment_status !== 'paid') {
      await updatePaymentStatus(lookupOrder.id, 'paid')
    }
    
    await updateOrderStatus(lookupOrder.id, 'delivered')
    
    // Update the lookup order state
    setLookupOrder({ ...lookupOrder, status: 'delivered', payment_status: 'paid' })
    alert(`Order ${lookupOrder.order_number} marked as picked up!`)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
    } catch (error) {
      router.push('/admin/login')
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchData()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    }
  }

  const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus })
      })
      fetchData()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: paymentStatus })
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status')
    }
  }

  const cancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? This will return the bottles to stock.')) return
    
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      fetchData()
      setShowOrderDetails(false)
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order')
    }
  }

  const resetStock = async () => {
    if (!confirm(`Reset today's stock to ${newStock} bottles?`)) return

    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bottles: newStock }),
        cache: 'no-store',
      })
      
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
        return
      }
      
      alert('Stock reset successfully!')
      
      // Force refresh stock immediately
      const stockRes = await fetch('/api/admin/stock', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const stockData = await stockRes.json()
      if (stockData && stockData.available_bottles !== undefined) {
        setStock(stockData)
      }
      
      fetchData()
    } catch (error) {
      console.error('Error resetting stock:', error)
      alert('Failed to reset stock')
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const exportToCSV = () => {
    const { startDate, endDate } = getDateRange()
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `/api/admin/sales/export?${params.toString()}`
    window.open(url, '_blank')
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const calculateSubtotal = (order: Order) => {
    // If order has cart items, calculate from items, otherwise use total - delivery fee
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0)
    }
    return order.total_amount - order.delivery_fee
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter)

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const confirmedOrders = orders.filter(o => o.status === 'confirmed')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  const formatDate = (dateStr: string) => {
    if (groupBy === 'week') return dateStr
    if (groupBy === 'year') return dateStr
    try {
      if (groupBy === 'day') {
        const [year, month, day] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      if (groupBy === 'month') {
        const [year, month] = dateStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    } catch (e) {
      return dateStr
    }
    return dateStr
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5a4a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return null
  }

  if (loading) {
    return (
      <main className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5a4a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2d5a4a]">
            Admin Dashboard
          </h1>
            <p className="text-gray-600 mt-1">Manage your Upwyne business</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://profit-pilot-16d6909c.base44.app"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <span>💰</span> Profit & Loss Calculator
            </a>
            <button
              onClick={fetchData}
              className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4035] transition flex items-center gap-2"
            >
              <span>🔄</span> Refresh
            </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-400">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-400">
            <div className="text-2xl font-bold text-blue-600">{confirmedOrders.length + completedOrders.length}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-400">
            <div className="text-2xl font-bold text-green-600">{deliveredOrders.length}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-[#2d5a4a]">
            <div className="text-2xl font-bold text-[#2d5a4a]">{stock.available_bottles}</div>
            <div className="text-sm text-gray-600">In Stock</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <nav className="flex overflow-x-auto">
            {[
              { key: 'orders', label: 'Orders', icon: '📋', count: orders.length },
              { key: 'invoices', label: 'Invoices', icon: '📄', count: invoices.length },
              { key: 'discount-codes', label: 'Discount Codes', icon: '🎟️', count: discountCodes.length },
              { key: 'stock', label: 'Stock', icon: '🍷' },
              { key: 'sales', label: 'Sales Analytics', icon: '📊' },
              { key: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
            <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 min-w-max px-6 py-4 font-medium text-sm transition flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-[#2d5a4a] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
            </button>
            ))}
          </nav>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Lookup - For Pickup Customers */}
            <div className="bg-gradient-to-r from-[#2d5a4a] to-[#3d6a5a] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span>🔍</span> Quick Order Lookup
              </h3>
              <p className="text-sm text-[#a8d4c0] mb-4">
                Enter order number when customer arrives for pickup
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchOrderNumber}
                  onChange={(e) => setSearchOrderNumber(e.target.value.toUpperCase())}
                  onKeyPress={handleLookupKeyPress}
                  placeholder="Enter order number (e.g., UPW12345678)"
                  className="flex-1 border-2 border-white/20 bg-white/10 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:border-white focus:outline-none font-mono"
                />
                <div className="flex gap-2">
                  <button
                    onClick={searchOrder}
                    disabled={isSearching}
                    className="bg-white text-[#2d5a4a] px-6 py-3 rounded-lg font-semibold hover:bg-[#f0f7f4] transition disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Find Order'}
                  </button>
                  {(lookupOrder || lookupError) && (
                    <button
                      onClick={clearLookup}
                      className="bg-white/20 text-white px-4 py-3 rounded-lg font-semibold hover:bg-white/30 transition"
                    >
                      Clear
                    </button>
                  )}
              </div>
              </div>

              {/* Lookup Error */}
              {lookupError && (
                <div className="mt-4 bg-red-500/20 border border-red-400/50 rounded-lg p-4 text-white">
                  <p className="flex items-center gap-2">
                    <span>❌</span> {lookupError}
                  </p>
                </div>
              )}

              {/* Lookup Result */}
              {lookupOrder && (
                <div className="mt-4 bg-white rounded-xl p-5 text-gray-800">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">
                          {lookupOrder.delivery_type === 'pickup' ? '📍' : '🚚'}
                        </span>
                        <div>
                          <h4 className="text-xl font-bold text-[#2d5a4a]">{lookupOrder.order_number}</h4>
                          <p className="text-sm text-gray-500">
                            {lookupOrder.delivery_type === 'pickup' ? 'Pickup Order' : 'Delivery Order'}
                          </p>
              </div>
            </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <p className="font-semibold">{lookupOrder.customer_name}</p>
              </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-semibold">
                            <a href={`tel:${lookupOrder.phone}`} className="text-blue-600 hover:underline">
                              {lookupOrder.phone}
                            </a>
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Items:</span>
                          {lookupOrder.order_items && lookupOrder.order_items.length > 0 ? (
                            <div className="space-y-1">
                              {lookupOrder.order_items.map((item, idx) => (
                                <p key={idx} className="font-semibold">
                                  {item.quantity} × {item.size} @ ₦{item.price_per_unit.toLocaleString()} = ₦{(item.quantity * item.price_per_unit).toLocaleString()}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="font-semibold">
                              {lookupOrder.quantity} × {lookupOrder.bottle_size || '1L'} bottle{lookupOrder.quantity > 1 ? 's' : ''}
                              {lookupOrder.price_per_bottle && ` @ ₦${lookupOrder.price_per_bottle.toLocaleString()}`}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500">Order Status:</span>
                          <p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              lookupOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              lookupOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              lookupOrder.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                              lookupOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {lookupOrder.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Box */}
                    <div className={`w-full md:w-64 rounded-xl p-4 ${
                      lookupOrder.payment_status === 'paid' 
                        ? 'bg-green-50 border-2 border-green-200' 
                        : 'bg-amber-50 border-2 border-amber-200'
                    }`}>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                        <p className="text-3xl font-bold text-[#2d5a4a]">
                          ₦{lookupOrder.total_amount.toLocaleString()}
                        </p>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {lookupOrder.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                          </p>
                          {lookupOrder.payment_status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              ✓ PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              ⏳ PENDING
                            </span>
                          )}
                        </div>
                        {lookupOrder.payment_status !== 'paid' && (
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Collect ₦{lookupOrder.total_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                    {lookupOrder.status !== 'delivered' && lookupOrder.status !== 'cancelled' && (
                      <button
                        onClick={markLookupOrderAsPickedUp}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <span>✓</span> 
                        {lookupOrder.payment_status !== 'paid' ? 'Collect Payment & Complete' : 'Mark as Picked Up'}
                      </button>
                    )}
                    {lookupOrder.payment_method === 'cod' && lookupOrder.payment_status !== 'paid' && lookupOrder.status !== 'delivered' && (
                      <button
                        onClick={() => {
                          updatePaymentStatus(lookupOrder.id, 'paid')
                          setLookupOrder({ ...lookupOrder, payment_status: 'paid' })
                        }}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        💵 Mark as Paid
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedOrder(lookupOrder)
                        setShowOrderDetails(true)
                      }}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      👁️ Full Details
                    </button>
                    <Link
                      href={`/invoice/${lookupOrder.order_number}`}
                      target="_blank"
                      className="bg-[#2d5a4a] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#1e4035] transition flex items-center gap-2"
                    >
                      📄 Invoice
                    </Link>
                  </div>

                  {/* Already Delivered Notice */}
                  {lookupOrder.status === 'delivered' && (
                    <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                      <p className="text-green-800 font-medium">
                        ✅ This order has already been delivered/picked up
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Filters */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Orders' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === filter.value
                        ? 'bg-[#2d5a4a] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="text-[#2d5a4a] font-medium hover:underline"
                          >
                            {order.order_number}
                          </button>
                          <div className="text-xs text-gray-500">
                            {order.delivery_type === 'pickup' ? '📍' : '🚚'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                          <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline">
                            {order.phone}
                          </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {order.order_items && order.order_items.length > 0 ? (
                            <div className="space-y-1">
                              {order.order_items.map((item, idx) => (
                                <div key={idx}>{item.quantity}×{item.size}</div>
                              ))}
                            </div>
                          ) : (
                            <>{order.quantity} × {order.bottle_size || '1L'}</>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">₦{order.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.payment_method === 'cod' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.payment_method === 'cod' ? 'COD' : order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <Link
                              href={`/invoice/${order.order_number}`}
                              target="_blank"
                                  className="text-green-600 hover:text-green-800"
                              title="View Invoice"
                            >
                              📄
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No orders found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Manual Invoices</h2>
                <p className="text-gray-500 text-sm">Create and send invoices to premium customers</p>
              </div>
                              <button
                onClick={() => {
                  resetInvoiceForm()
                  setShowCreateInvoice(true)
                }}
                className="bg-[#2d5a4a] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition flex items-center gap-2"
              >
                <span>➕</span> Create Invoice
              </button>
              <button
                onClick={() => {
                  setWhatsAppText('')
                  setShowWhatsAppImport(true)
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
              >
                📱 Import from WhatsApp
              </button>
            </div>

            {/* Invoice Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-gray-400">
                <div className="text-2xl font-bold text-gray-600">{invoices.filter(i => i.status === 'draft').length}</div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-400">
                <div className="text-2xl font-bold text-blue-600">{invoices.filter(i => i.status === 'sent').length}</div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-400">
                <div className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length}</div>
                <div className="text-sm text-gray-600">Paid</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-400">
                <div className="text-2xl font-bold text-purple-600">₦{invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openInvoiceDetails(invoice)}
                            className="text-[#2d5a4a] font-medium hover:underline"
                          >
                            {invoice.invoice_number}
                          </button>
                          <div className="text-xs text-gray-500">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.customer_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                          <a href={`tel:${invoice.phone}`} className="text-blue-600 hover:underline">
                            {invoice.phone}
                          </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{invoice.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">₦{invoice.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openInvoiceDetails(invoice)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <Link
                              href={`/view-invoice/${invoice.invoice_number}`}
                              target="_blank"
                                className="text-green-600 hover:text-green-800"
                              title="View Invoice"
                            >
                              📄
                            </Link>
                            <button
                              onClick={() => shareViaWhatsApp(invoice)}
                              className="text-[#25D366] hover:text-green-700"
                              title="Share via WhatsApp"
                            >
                              💬
                              </button>
                            <button
                              onClick={() => copyInvoiceLink(invoice.invoice_number)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Copy Link"
                            >
                              🔗
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-4">📄</div>
                    <p>No invoices yet</p>
                    <p className="text-sm">Click "Create Invoice" to send your first invoice</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🍷</span> Current Stock
            </h2>
              <div className="bg-gradient-to-br from-[#2d5a4a] to-[#3d6a5a] rounded-xl p-6 text-white mb-6">
                <div className="text-5xl font-bold mb-2">{stock.available_bottles}</div>
                <div className="text-[#a8d4c0]">bottles available this week</div>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[#a8d4c0]">Total</div>
                    <div className="font-semibold">{stock.total_bottles}</div>
                  </div>
                  <div>
                    <div className="text-[#a8d4c0]">Sold</div>
                    <div className="font-semibold">{stock.total_bottles - stock.available_bottles}</div>
                  </div>
                </div>
              </div>

              {/* Stock Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Stock Level</span>
                  <span className="font-medium text-[#2d5a4a]">
                    {Math.round((stock.available_bottles / stock.total_bottles) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2d5a4a] to-[#4a7c6a] rounded-full transition-all duration-500"
                    style={{ width: `${(stock.available_bottles / stock.total_bottles) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔄</span> Reset Stock
              </h2>
              <p className="text-gray-600 mb-4">
                Reset today's stock count. Stock automatically resets to 100 bottles every day at midnight.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Stock Amount
                  </label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  min="0"
                    className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:border-[#2d5a4a] focus:outline-none text-lg font-semibold"
                />
                </div>
                <button
                  onClick={resetStock}
                  className="w-full bg-[#2d5a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition"
                >
                  Reset Stock to {newStock} Bottles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Profit & Loss Calculator Link */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <span>💰</span> Profit & Loss Calculator
                  </h3>
                  <p className="text-purple-100 text-sm">
                    Calculate your business profitability and track financial performance
                  </p>
                </div>
                <a
                  href="https://profit-pilot-16d6909c.base44.app"
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center gap-2 whitespace-nowrap"
                >
                  Open Calculator
                  <span>→</span>
                </a>
              </div>
            </div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="day">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {dateFilter === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {dateFilter !== 'all' && dateFilter !== 'day' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as any)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#2d5a4a] focus:outline-none"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                )}

                <div className="flex items-end">
                <button
                    onClick={exportToCSV}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                >
                    <span>📥</span> Export CSV
                </button>
                </div>
              </div>
              </div>
              
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                <div className="text-3xl font-bold text-blue-600">{stats.total_orders || 0}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="text-sm text-gray-600 mb-1">Bottles Sold</div>
                <div className="text-3xl font-bold text-green-600">{stats.total_bottles_sold || 0}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-purple-600">₦{(stats.total_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="text-sm text-gray-600 mb-1">COD Revenue</div>
                <div className="text-3xl font-bold text-yellow-600">₦{(stats.cod_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <div className="text-sm text-gray-600 mb-1">Online Revenue</div>
                <div className="text-3xl font-bold text-indigo-600">₦{(stats.online_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
                <div className="text-sm text-gray-600 mb-1">Paid Revenue</div>
                <div className="text-3xl font-bold text-emerald-600">₦{(stats.paid_revenue || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📈</span> Revenue Chart
              </h3>
              {salesByDate.length > 0 ? (
                <>
                  <div className="h-64 flex items-end gap-2 overflow-x-auto pb-4">
                    {salesByDate.map((item, index) => {
                      const maxRevenue = Math.max(...salesByDate.map(s => s.revenue), 1)
                      const heightPercent = (item.revenue / maxRevenue) * 100
                      return (
                        <div key={index} className="flex flex-col items-center min-w-[60px] group">
                          <div className="relative flex flex-col items-center flex-1 w-full">
                            {/* Tooltip */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div className="font-semibold">₦{item.revenue.toLocaleString()}</div>
                              <div className="text-gray-300">{item.orders_count} orders</div>
                              <div className="text-gray-300">{item.bottles_sold} bottles</div>
                            </div>
                            {/* Bar */}
                            <div 
                              className="w-10 bg-gradient-to-t from-[#2d5a4a] to-[#4a7c6a] rounded-t-lg transition-all duration-500 hover:from-[#1e4035] hover:to-[#3d6a5a] cursor-pointer"
                              style={{ height: `${Math.max(heightPercent, 5)}%` }}
                            >
                              <div className="w-full h-2 bg-white/20 rounded-t-lg"></div>
                            </div>
                          </div>
                          {/* Label */}
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            {formatDate(item.date)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-[#2d5a4a] to-[#4a7c6a]"></div>
                      <span className="text-sm text-gray-600">Revenue</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Hover over bars for details
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-medium">No sales data yet</p>
                  <p className="text-sm">Chart will appear when you have orders</p>
                </div>
              )}
            </div>

            {/* Bottles Sold Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🍷</span> Bottles Sold Chart
              </h3>
              {salesByDate.length > 0 ? (
                <div className="h-48 flex items-end gap-2 overflow-x-auto pb-4">
                  {salesByDate.map((item, index) => {
                    const maxBottles = Math.max(...salesByDate.map(s => s.bottles_sold), 1)
                    const heightPercent = (item.bottles_sold / maxBottles) * 100
                    return (
                      <div key={index} className="flex flex-col items-center min-w-[60px] group">
                        <div className="relative flex flex-col items-center flex-1 w-full">
                          {/* Value label */}
                          <div className="absolute -top-6 text-xs font-semibold text-[#2d5a4a] opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.bottles_sold}
                          </div>
                          {/* Bar */}
                          <div 
                            className="w-10 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all duration-500 hover:from-amber-600 hover:to-amber-500 cursor-pointer"
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          >
                            <div className="w-full h-2 bg-white/30 rounded-t-lg"></div>
                          </div>
                        </div>
                        {/* Label */}
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  <p>No sales data to display</p>
                </div>
              )}
            </div>

            {/* Sales Table */}
            {salesByDate.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Sales Over Time</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bottles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesByDate.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatDate(item.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.orders_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.bottles_sold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2d5a4a]">₦{item.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discount Codes Tab */}
        {activeTab === 'discount-codes' && (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Discount Codes</h2>
                <p className="text-gray-500 text-sm">Create and manage discount codes for customers</p>
              </div>
              <button
                onClick={() => {
                  resetDiscountCodeForm()
                  setShowCreateDiscountCode(true)
                }}
                className="bg-[#2d5a4a] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition flex items-center gap-2"
              >
                <span>➕</span> Create Discount Code
              </button>
            </div>

            {/* Discount Codes List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Min Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Uses</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Expires</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {discountCodes.map((code) => {
                      const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                      const isMaxedOut = code.max_uses && code.used_count >= code.max_uses
                      const isActive = code.is_active && !isExpired && !isMaxedOut
                      
                      return (
                        <tr key={code.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-mono font-semibold text-[#2d5a4a]">{code.code}</div>
                            {code.description && (
                              <div className="text-xs text-gray-500">{code.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              code.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {code.type === 'percentage' ? `${code.value}%` : `₦${code.value.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {code.type === 'percentage' 
                              ? `${code.value}% off` 
                              : `₦${code.value.toLocaleString()} off`}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                            {code.min_order_amount ? `₦${code.min_order_amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                            {code.max_uses ? `${code.used_count}/${code.max_uses}` : `${code.used_count} uses`}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                            {code.expires_at 
                              ? new Date(code.expires_at).toLocaleDateString()
                              : 'No expiry'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              isActive ? 'bg-green-100 text-green-800' :
                              isExpired ? 'bg-red-100 text-red-800' :
                              isMaxedOut ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {isActive ? 'Active' :
                               isExpired ? 'Expired' :
                               isMaxedOut ? 'Maxed Out' :
                               'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openDiscountCodeDetails(code)}
                                className="text-blue-600 hover:text-blue-800"
                                title="View Details"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => updateDiscountCodeStatus(code.id, !code.is_active)}
                                className={code.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                                title={code.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {code.is_active ? '⏸️' : '▶️'}
                              </button>
                              <button
                                onClick={() => deleteDiscountCode(code.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {discountCodes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-4">🎟️</div>
                    <p>No discount codes yet</p>
                    <p className="text-sm">Click "Create Discount Code" to add your first code</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span>💰</span> Business Settings
              </h2>
              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Liter (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.price_per_liter}
                    onChange={(e) => setSettings({ ...settings, price_per_liter: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                    placeholder="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1L: ₦{parseInt(settings.price_per_liter || '2000').toLocaleString()}, 
                    5L: ₦{(parseInt(settings.price_per_liter || '2000') * 5).toLocaleString()}, 
                    10L: ₦{(parseInt(settings.price_per_liter || '2000') * 10).toLocaleString()}
                  </p>
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Stock Default
                  </label>
                  <input
                    type="number"
                    value={settings.weekly_stock}
                    onChange={(e) => setSettings({ ...settings, weekly_stock: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Address
                  </label>
                  <textarea
                    value={settings.pickup_address}
                    onChange={(e) => setSettings({ ...settings, pickup_address: e.target.value })}
                    rows={2}
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
                  </div>
                </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span>📱</span> Notification Settings
              </h2>
              <div className="space-y-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Phone (for WhatsApp notifications)
                  </label>
                  <input
                    type="tel"
                    value={settings.admin_phone}
                    onChange={(e) => setSettings({ ...settings, admin_phone: e.target.value })}
                    placeholder="08012345678"
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter Nigerian format without +234</p>
                    </div>
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={settings.admin_email}
                    onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                    placeholder="admin@upwyne.com"
                    className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full mt-6 bg-[#2d5a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a]">Order Details</h2>
                  <p className="text-sm text-gray-500">{selectedOrder.order_number}</p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer</h3>
                    <p className="font-semibold text-[#2d5a4a]">{selectedOrder.customer_name}</p>
                    <p className="text-gray-600">
                        <a href={`tel:${selectedOrder.phone}`} className="text-blue-600 hover:underline">
                          {selectedOrder.phone}
                        </a>
                    </p>
                    {selectedOrder.email && (
                      <p className="text-gray-600 text-sm">{selectedOrder.email}</p>
                    )}
                      </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Delivery</h3>
                    <p className="font-semibold">
                      {selectedOrder.delivery_type === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                    </p>
                    {selectedOrder.delivery_type === 'delivery' && selectedOrder.address && (
                      <p className="text-gray-600 text-sm">{selectedOrder.address}</p>
                    )}
                    {selectedOrder.delivery_type === 'pickup' && (
                      <p className="text-gray-600 text-sm">24 Tony Anenih Avenue, G.R.A</p>
                    )}
                    </div>
                        </div>

                {/* Order Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      // Display cart items
                      selectedOrder.order_items.map((item, index) => (
                        <div key={index} className="flex justify-between mb-2 pb-2 border-b border-gray-200 last:border-0">
                          <span className="text-gray-600">
                            {item.quantity} × {item.size} @ ₦{item.price_per_unit.toLocaleString()}
                          </span>
                          <span className="font-medium">₦{(item.quantity * item.price_per_unit).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      // Backward compatibility: single item display
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {selectedOrder.quantity} × Palm Wine ({selectedOrder.bottle_size || '1L'})
                          {selectedOrder.price_per_bottle && ` @ ₦${selectedOrder.price_per_bottle.toLocaleString()}`}
                        </span>
                        <span className="font-medium">₦{calculateSubtotal(selectedOrder).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₦{selectedOrder.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total</span>
                      <span className="text-[#2d5a4a]">₦{selectedOrder.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment</h3>
                    <p className="font-semibold mb-2">
                      {selectedOrder.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                    </p>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                    </span>
                    {selectedOrder.payment_method === 'cod' && selectedOrder.payment_status !== 'paid' && (
                      <button
                        onClick={() => updatePaymentStatus(selectedOrder.id, 'paid')}
                        className="block mt-3 text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Mark as Paid
                      </button>
                    )}
                      </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Order Status</h3>
                    <span className={`px-3 py-1 text-sm rounded-full capitalize ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Ordered: {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                    </div>
                      </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        ✓ Confirm Order
                      </button>
                      <button
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      📦 Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      🎉 Mark Delivered
                    </button>
                  )}
                  <Link
                    href={`/invoice/${selectedOrder.order_number}`}
                    target="_blank"
                    className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4035] transition font-medium flex items-center gap-2"
                  >
                    📄 View Invoice
                  </Link>
                </div>
              </div>
            </div>
                      </div>
                    )}

        {/* WhatsApp Import Modal */}
        {showWhatsAppImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a] flex items-center gap-2">
                    📱 Import Order from WhatsApp
                  </h2>
                  <p className="text-sm text-gray-500">Paste WhatsApp message to auto-fill invoice form</p>
                </div>
                <button
                  onClick={() => {
                    setShowWhatsAppImport(false)
                    setWhatsAppText('')
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Format Guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Order Format Guide for WhatsApp Group:</h3>
                  <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono bg-blue-100 p-3 rounded">
{`Name: John Doe
Phone: 08012345678
Items: 2x1L, 1x5L, 3x10L
Address: G.R.A, 123 Main St (if delivery)
Payment: COD`}
                  </pre>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 The parser will extract: Name, Phone, Items, Address, and Payment method automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste WhatsApp Message:
                  </label>
                  <textarea
                    value={whatsAppText}
                    onChange={(e) => setWhatsAppText(e.target.value)}
                    placeholder="Paste the WhatsApp order message here..."
                    className="w-full border-2 border-gray-300 rounded-lg p-4 h-64 focus:border-[#2d5a4a] focus:outline-none font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleWhatsAppImport}
                    disabled={!whatsAppText.trim()}
                    className="flex-1 bg-[#2d5a4a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e4035] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    ✓ Parse & Import to Invoice Form
                  </button>
                  <button
                    onClick={() => {
                      setShowWhatsAppImport(false)
                      setWhatsAppText('')
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                      <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a]">Create Invoice</h2>
                  <p className="text-sm text-gray-500">Send invoice to a premium customer</p>
                      </div>
                <button
                  onClick={() => setShowCreateInvoice(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
                </div>

              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={invoiceForm.customer_name}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={invoiceForm.phone}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, phone: e.target.value })}
                        placeholder="08012345678"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                      <input
                        type="email"
                        value={invoiceForm.email}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                      <input
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                        </div>
                      </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address (optional)</label>
                    <textarea
                      value={invoiceForm.address}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, address: e.target.value })}
                      placeholder="Enter delivery address"
                      rows={2}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                    />
                    </div>
                </div>

                {/* Order Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Order Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (bottles) *</label>
                      <input
                        type="number"
                        min="1"
                        value={invoiceForm.quantity}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Bottle (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={invoiceForm.price_per_bottle}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, price_per_bottle: parseInt(e.target.value) || 0 })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={invoiceForm.delivery_fee}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, delivery_fee: parseInt(e.target.value) || 0 })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseInt(e.target.value) || 0 })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      placeholder="Any additional notes for the customer"
                      rows={2}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Invoice Preview */}
                <div className="bg-[#f0f7f4] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Preview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{invoiceForm.quantity} × Palm Wine (₦{invoiceForm.price_per_bottle.toLocaleString()})</span>
                      <span className="font-medium">₦{(invoiceForm.quantity * invoiceForm.price_per_bottle).toLocaleString()}</span>
                    </div>
                    {invoiceForm.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₦{invoiceForm.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {invoiceForm.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₦{invoiceForm.discount.toLocaleString()}</span>
                    </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg text-[#2d5a4a]">
                      <span>Total</span>
                      <span>₦{((invoiceForm.quantity * invoiceForm.price_per_bottle) + invoiceForm.delivery_fee - invoiceForm.discount).toLocaleString()}</span>
                        </div>
                      </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowCreateInvoice(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewInvoice}
                    disabled={creatingInvoice}
                    className="flex-1 bg-[#2d5a4a] text-white px-4 py-3 rounded-lg hover:bg-[#1e4035] transition font-medium disabled:opacity-50"
                  >
                    {creatingInvoice ? 'Creating...' : 'Create Invoice'}
                  </button>
                </div>
              </div>
                        </div>
                      </div>
                    )}

        {/* Invoice Details Modal */}
        {showInvoiceDetails && selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a]">Invoice Details</h2>
                  <p className="text-sm text-gray-500">{selectedInvoice.invoice_number}</p>
                  </div>
                <button
                  onClick={() => setShowInvoiceDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
                </div>

              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer</h3>
                    <p className="font-semibold text-[#2d5a4a]">{selectedInvoice.customer_name}</p>
                    <p className="text-gray-600">
                      <a href={`tel:${selectedInvoice.phone}`} className="text-blue-600 hover:underline">
                        {selectedInvoice.phone}
                      </a>
                    </p>
                    {selectedInvoice.email && (
                      <p className="text-gray-600 text-sm">{selectedInvoice.email}</p>
                    )}
                    {selectedInvoice.address && (
                      <p className="text-gray-600 text-sm mt-2">{selectedInvoice.address}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Info</h3>
                    <p className="text-gray-600">
                      <span className="font-medium">Created:</span> {new Date(selectedInvoice.created_at).toLocaleDateString()}
                    </p>
                    {selectedInvoice.due_date && (
                      <p className="text-gray-600">
                        <span className="font-medium">Due:</span> {new Date(selectedInvoice.due_date).toLocaleDateString()}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className={`px-3 py-1 text-sm rounded-full capitalize ${
                        selectedInvoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        selectedInvoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedInvoice.status}
                    </span>
                    </div>
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{selectedInvoice.quantity} × Palm Wine (₦{selectedInvoice.price_per_bottle.toLocaleString()})</span>
                      <span className="font-medium">₦{(selectedInvoice.quantity * selectedInvoice.price_per_bottle).toLocaleString()}</span>
                    </div>
                    {selectedInvoice.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₦{selectedInvoice.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₦{selectedInvoice.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg text-[#2d5a4a]">
                      <span>Total</span>
                      <span>₦{selectedInvoice.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                    <p className="text-gray-700">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {selectedInvoice.status === 'draft' && (
                    <>
                      <button
                        onClick={() => shareViaWhatsApp(selectedInvoice)}
                        className="flex-1 bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2"
                      >
                        💬 Send via WhatsApp
                      </button>
                      <button
                        onClick={() => sendInvoice(selectedInvoice.id)}
                        disabled={sendingInvoice}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                      >
                        {sendingInvoice ? 'Sending...' : '📤 Send Invoice'}
                      </button>
                    </>
                  )}
                  {selectedInvoice.status === 'sent' && (
                      <button
                      onClick={() => updateInvoiceStatus(selectedInvoice.id, 'paid')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      ✓ Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => copyInvoiceLink(selectedInvoice.invoice_number)}
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition font-medium flex items-center gap-2"
                  >
                    🔗 Copy Link
                  </button>
                  <Link
                    href={`/view-invoice/${selectedInvoice.invoice_number}`}
                    target="_blank"
                    className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4035] transition font-medium flex items-center gap-2"
                  >
                    📄 View Invoice
                  </Link>
                  {(selectedInvoice.status === 'draft' || selectedInvoice.status === 'cancelled') && (
                    <button
                      onClick={() => deleteInvoice(selectedInvoice.id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
                    >
                      🗑️ Delete
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Discount Code Modal */}
        {showCreateDiscountCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a]">Create Discount Code</h2>
                  <p className="text-sm text-gray-500">Create a new discount code for customers</p>
                </div>
                <button
                  onClick={() => setShowCreateDiscountCode(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Code Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Code Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={discountCodeForm.code}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, code: e.target.value.toUpperCase() })}
                        placeholder="WELCOME10"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">Code will be converted to uppercase</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        value={discountCodeForm.type}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, type: e.target.value as 'percentage' | 'fixed' })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₦)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value * {discountCodeForm.type === 'percentage' ? '(0-100%)' : '(₦)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={discountCodeForm.type === 'percentage' ? 100 : undefined}
                        step={discountCodeForm.type === 'percentage' ? 1 : 100}
                        value={discountCodeForm.value}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, value: parseFloat(e.target.value) || 0 })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                      <input
                        type="text"
                        value={discountCodeForm.description}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, description: e.target.value })}
                        placeholder="Welcome discount for new customers"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Restrictions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Restrictions (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₦)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={discountCodeForm.min_order_amount}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, min_order_amount: e.target.value })}
                        placeholder="5000"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Uses</label>
                      <input
                        type="number"
                        min="1"
                        value={discountCodeForm.max_uses}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, max_uses: e.target.value })}
                        placeholder="100"
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
                      <input
                        type="date"
                        value={discountCodeForm.expires_at}
                        onChange={(e) => setDiscountCodeForm({ ...discountCodeForm, expires_at: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 px-4 focus:border-[#2d5a4a] focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-[#f0f7f4] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Preview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Code:</span>
                      <span className="font-mono font-semibold text-[#2d5a4a]">{discountCodeForm.code || 'CODE'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium">
                        {discountCodeForm.type === 'percentage' 
                          ? `${discountCodeForm.value}% off` 
                          : `₦${discountCodeForm.value.toLocaleString()} off`}
                      </span>
                    </div>
                    {discountCodeForm.min_order_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Order:</span>
                        <span className="font-medium">₦{parseFloat(discountCodeForm.min_order_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {discountCodeForm.max_uses && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Uses:</span>
                        <span className="font-medium">{discountCodeForm.max_uses}</span>
                      </div>
                    )}
                    {discountCodeForm.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium">{new Date(discountCodeForm.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowCreateDiscountCode(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewDiscountCode}
                    disabled={creatingDiscountCode}
                    className="flex-1 bg-[#2d5a4a] text-white px-4 py-3 rounded-lg hover:bg-[#1e4035] transition font-medium disabled:opacity-50"
                  >
                    {creatingDiscountCode ? 'Creating...' : 'Create Discount Code'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discount Code Details Modal */}
        {showDiscountCodeDetails && selectedDiscountCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d5a4a]">Discount Code Details</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedDiscountCode.code}</p>
                </div>
                <button
                  onClick={() => setShowDiscountCodeDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Code Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Code Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">
                          {selectedDiscountCode.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <span className="ml-2 font-medium text-[#2d5a4a]">
                          {selectedDiscountCode.type === 'percentage' 
                            ? `${selectedDiscountCode.value}%` 
                            : `₦${selectedDiscountCode.value.toLocaleString()}`}
                        </span>
                      </div>
                      {selectedDiscountCode.description && (
                        <div>
                          <span className="text-gray-500">Description:</span>
                          <p className="mt-1 text-gray-700">{selectedDiscountCode.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Usage Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Used:</span>
                        <span className="ml-2 font-medium">{selectedDiscountCode.used_count} times</span>
                      </div>
                      {selectedDiscountCode.max_uses && (
                        <div>
                          <span className="text-gray-500">Limit:</span>
                          <span className="ml-2 font-medium">{selectedDiscountCode.max_uses} uses</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedDiscountCode.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedDiscountCode.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restrictions */}
                {(selectedDiscountCode.min_order_amount || selectedDiscountCode.max_uses || selectedDiscountCode.expires_at) && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Restrictions</h3>
                    <div className="space-y-2 text-sm">
                      {selectedDiscountCode.min_order_amount && (
                        <div>
                          <span className="text-gray-600">Minimum Order:</span>
                          <span className="ml-2 font-medium">₦{selectedDiscountCode.min_order_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedDiscountCode.max_uses && (
                        <div>
                          <span className="text-gray-600">Maximum Uses:</span>
                          <span className="ml-2 font-medium">{selectedDiscountCode.max_uses}</span>
                        </div>
                      )}
                      {selectedDiscountCode.expires_at && (
                        <div>
                          <span className="text-gray-600">Expires:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedDiscountCode.expires_at).toLocaleDateString()}
                            {new Date(selectedDiscountCode.expires_at) < new Date() && (
                              <span className="ml-2 text-red-600">(Expired)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      updateDiscountCodeStatus(selectedDiscountCode.id, !selectedDiscountCode.is_active)
                      setShowDiscountCodeDetails(false)
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium transition ${
                      selectedDiscountCode.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectedDiscountCode.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                  <button
                    onClick={() => {
                      deleteDiscountCode(selectedDiscountCode.id)
                    }}
                    className="bg-red-100 text-red-700 px-6 py-2.5 rounded-lg hover:bg-red-200 transition font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
