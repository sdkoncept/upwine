import { supabase, pgPool } from './supabase'

// Type definitions
export interface Order {
  id: number
  order_number: string
  customer_name: string
  phone: string
  email?: string
  address?: string
  quantity: number
  delivery_type: string
  delivery_fee: number
  total_amount: number
  payment_method: string
  payment_status: string
  payment_reference?: string
  paystack_reference?: string
  status: string
  delivery_time?: string
  created_at: string
  updated_at: string
}

export interface Stock {
  id?: number
  week_start_date: string
  total_bottles: number
  sold_bottles: number
  available_bottles: number
  created_at?: string
}

export interface Invoice {
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
  updated_at: string
}

export interface DiscountCode {
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

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

// ============ INITIALIZATION ============

export async function initDatabase() {
  if (!supabase) {
    console.warn('Supabase not configured, skipping initialization')
    return
  }

  try {
    // Ensure current week stock exists
    const currentWeek = getWeekStartDate()
    const { data: existingStock } = await supabase
      .from('stock')
      .select('*')
      .eq('week_start_date', currentWeek)
      .single()
      .catch(() => ({ data: null }))

    if (!existingStock) {
      await supabase.from('stock').insert({
        week_start_date: currentWeek,
        total_bottles: 100,
        sold_bottles: 0,
        available_bottles: 100,
      })
    }
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// ============ STOCK FUNCTIONS ============

export async function getCurrentStock() {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const currentWeek = getWeekStartDate()
  const { data, error } = await supabase
    .from('stock')
    .select('*')
    .eq('week_start_date', currentWeek)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching stock:', error)
  }

  if (!data) {
    // Create default stock for current week
    const { data: newStock } = await supabase
      .from('stock')
      .insert({
        week_start_date: currentWeek,
        total_bottles: 100,
        sold_bottles: 0,
        available_bottles: 100,
      })
      .select()
      .single()

    if (newStock) {
      return {
        available_bottles: newStock.available_bottles,
        total_bottles: newStock.total_bottles,
        sold_bottles: newStock.sold_bottles,
      }
    }
    return { available_bottles: 100, total_bottles: 100, sold_bottles: 0 }
  }

  return {
    available_bottles: data.available_bottles,
    total_bottles: data.total_bottles,
    sold_bottles: data.sold_bottles,
  }
}

export async function resetWeeklyStock(bottles: number = 100) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const currentWeek = getWeekStartDate()
  const { error } = await supabase
    .from('stock')
    .upsert({
      week_start_date: currentWeek,
      total_bottles: bottles,
      sold_bottles: 0,
      available_bottles: bottles,
    }, {
      onConflict: 'week_start_date'
    })

  if (error) {
    throw new Error(`Failed to reset stock: ${error.message}`)
  }
}

// ============ SETTINGS FUNCTIONS ============

export async function getSetting(key: string): Promise<string | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Setting not found
    }
    console.error('Error fetching setting:', error)
    return null
  }

  return data?.value || null
}

export async function updateSetting(key: string, value: string) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key'
    })

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`)
  }
}

// ============ ORDER FUNCTIONS ============

export async function createOrder(orderData: {
  customer_name: string
  phone: string
  email?: string
  address?: string | null
  quantity: number
  delivery_type: 'pickup' | 'delivery'
  delivery_fee: number
  payment_method: string
  delivery_time?: string
  discount_code_id?: number
  discount_amount?: number
}) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const stock = await getCurrentStock()
  
  if (orderData.quantity > stock.available_bottles) {
    throw new Error('Insufficient stock')
  }

  const pricePerBottle = parseInt(await getSetting('price_per_bottle') || '2000')
  const subtotal = orderData.quantity * pricePerBottle
  const discountAmount = orderData.discount_amount || 0
  const totalAmount = subtotal + orderData.delivery_fee - discountAmount

  const orderNumber = `UPW${Date.now().toString().slice(-8)}`
  const now = new Date().toISOString()

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: orderData.customer_name,
      phone: orderData.phone,
      email: orderData.email || null,
      address: orderData.address || null,
      quantity: orderData.quantity,
      delivery_type: orderData.delivery_type,
      delivery_fee: orderData.delivery_fee,
      total_amount: totalAmount,
      payment_method: orderData.payment_method,
      payment_status: 'pending',
      status: 'pending',
      delivery_time: orderData.delivery_time || null,
      discount_code_id: orderData.discount_code_id || null,
      discount_amount: discountAmount,
    })
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`)
  }

  // Update stock
  const currentWeek = getWeekStartDate()
  const { data: currentStock } = await supabase
    .from('stock')
    .select('*')
    .eq('week_start_date', currentWeek)
    .single()

  if (currentStock) {
    await supabase
      .from('stock')
      .update({
        sold_bottles: currentStock.sold_bottles + orderData.quantity,
        available_bottles: currentStock.available_bottles - orderData.quantity,
      })
      .eq('week_start_date', currentWeek)
  }

  return { orderNumber, totalAmount }
}

export async function getOrders(status?: string): Promise<Order[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return (data || []) as Order[]
}

export async function getOrder(orderNumber: string): Promise<Order | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching order:', error)
    return null
  }

  return data as Order
}

export async function getOrderById(id: number): Promise<Order | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching order by ID:', error)
    return null
  }

  return data as Order
}

export async function getOrderByPaystackReference(reference: string): Promise<Order | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('paystack_reference', reference)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching order by reference:', error)
    return null
  }

  return data as Order
}

export async function updateOrderStatus(orderId: number, status: string) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`)
  }
}

export async function updateOrderPayment(orderNumber: string, paymentStatus: string, paystackReference?: string) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const updates: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  }

  if (paystackReference) {
    updates.paystack_reference = paystackReference
  }

  if (paymentStatus === 'paid') {
    updates.status = 'confirmed'
  }

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('order_number', orderNumber)

  if (error) {
    throw new Error(`Failed to update order payment: ${error.message}`)
  }
}

export async function getSalesStats(startDate?: string, endDate?: string) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let query = supabase.from('orders').select('*')

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59`)
  }

  const { data: orders, error } = await query

  if (error) {
    console.error('Error fetching sales stats:', error)
    return {
      total_orders: 0,
      total_bottles_sold: 0,
      total_revenue: 0,
      paid_revenue: 0,
      cod_revenue: 0,
      online_revenue: 0,
    }
  }

  const orderList = (orders || []) as Order[]

  return {
    total_orders: orderList.length,
    total_bottles_sold: orderList.reduce((sum, o) => sum + o.quantity, 0),
    total_revenue: orderList.reduce((sum, o) => sum + o.total_amount, 0),
    paid_revenue: orderList.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
    cod_revenue: orderList.filter(o => o.payment_method === 'cod').reduce((sum, o) => sum + o.total_amount, 0),
    online_revenue: orderList.filter(o => o.payment_method === 'online' && o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
  }
}

export async function getSalesByDate(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' | 'year' = 'day') {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', `${endDate}T23:59:59`)

  if (error) {
    console.error('Error fetching sales by date:', error)
    return []
  }

  const orderList = (orders || []) as Order[]
  const grouped: Record<string, { orders_count: number; bottles_sold: number; revenue: number }> = {}

  orderList.forEach(order => {
    let key: string
    const date = new Date(order.created_at)
    
    switch (groupBy) {
      case 'day':
        key = order.created_at.split('T')[0]
        break
      case 'week':
        const weekNumber = Math.ceil((date.getDate() - date.getDay() + 1) / 7)
        key = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
        break
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      case 'year':
        key = date.getFullYear().toString()
        break
      default:
        key = order.created_at.split('T')[0]
    }
    
    if (!grouped[key]) {
      grouped[key] = { orders_count: 0, bottles_sold: 0, revenue: 0 }
    }
    
    grouped[key].orders_count++
    grouped[key].bottles_sold += order.quantity
    grouped[key].revenue += order.total_amount
  })
  
  return Object.entries(grouped)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getOrdersForExport(startDate?: string, endDate?: string) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59`)
  }

  const { data: orders, error } = await query

  if (error) {
    console.error('Error fetching orders for export:', error)
    return []
  }

  return (orders || []).map((o: Order) => ({
    order_number: o.order_number,
    customer_name: o.customer_name,
    phone: o.phone,
    email: o.email || null,
    quantity: o.quantity,
    total_amount: o.total_amount,
    delivery_fee: o.delivery_fee,
    delivery_type: o.delivery_type,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    status: o.status,
    created_at: o.created_at,
  }))
}

// ============ INVOICE FUNCTIONS ============

export async function createInvoice(invoiceData: {
  customer_name: string
  phone: string
  email?: string
  address?: string
  quantity: number
  price_per_bottle?: number
  delivery_fee?: number
  discount?: number
  notes?: string
  due_date?: string
}) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const pricePerBottle = invoiceData.price_per_bottle || parseInt(await getSetting('price_per_bottle') || '2000')
  const deliveryFee = invoiceData.delivery_fee || 0
  const discount = invoiceData.discount || 0
  const subtotal = invoiceData.quantity * pricePerBottle
  const totalAmount = subtotal + deliveryFee - discount

  const invoiceNumber = `INV${Date.now().toString().slice(-8)}`
  const now = new Date().toISOString()

  const { data: newInvoice, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      customer_name: invoiceData.customer_name,
      phone: invoiceData.phone,
      email: invoiceData.email || null,
      address: invoiceData.address || null,
      quantity: invoiceData.quantity,
      price_per_bottle: pricePerBottle,
      delivery_fee: deliveryFee,
      discount: discount,
      total_amount: totalAmount,
      notes: invoiceData.notes || null,
      status: 'draft',
      due_date: invoiceData.due_date || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create invoice: ${error.message}`)
  }

  return newInvoice as Invoice
}

export async function getInvoices(status?: string): Promise<Invoice[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return (data || []) as Invoice[]
}

export async function getInvoice(invoiceNumber: string): Promise<Invoice | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching invoice:', error)
    return null
  }

  return data as Invoice
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching invoice:', error)
    return null
  }

  return data as Invoice
}

export async function updateInvoiceStatus(invoiceId: number, status: 'draft' | 'sent' | 'paid' | 'cancelled'): Promise<Invoice | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select()
    .single()

  if (error) {
    console.error('Error updating invoice status:', error)
    return null
  }

  return data as Invoice
}

export async function updateInvoice(invoiceId: number, updates: Partial<Invoice>): Promise<Invoice | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const updateData: any = { ...updates, updated_at: new Date().toISOString() }
  
  // Recalculate total if quantity, price, delivery fee, or discount changed
  if (updates.quantity !== undefined || updates.price_per_bottle !== undefined || 
      updates.delivery_fee !== undefined || updates.discount !== undefined) {
    const { data: currentInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (currentInvoice) {
      const invoice = { ...currentInvoice, ...updates } as Invoice
      const subtotal = invoice.quantity * invoice.price_per_bottle
      updateData.total_amount = subtotal + invoice.delivery_fee - invoice.discount
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)
    .select()
    .single()

  if (error) {
    console.error('Error updating invoice:', error)
    return null
  }

  return data as Invoice
}

export async function deleteInvoice(invoiceId: number): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)

  if (error) {
    console.error('Error deleting invoice:', error)
    return false
  }

  return true
}

// ============ DISCOUNT CODE FUNCTIONS ============

export async function createDiscountCode(codeData: {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount?: number
  max_uses?: number
  expires_at?: string
  description?: string
}) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  // Check if code already exists
  const { data: existing } = await supabase
    .from('discount_codes')
    .select('id')
    .eq('code', codeData.code.toUpperCase())
    .single()

  if (existing) {
    throw new Error('Discount code already exists')
  }

  const { data: newCode, error } = await supabase
    .from('discount_codes')
    .insert({
      code: codeData.code.toUpperCase(),
      type: codeData.type,
      value: codeData.value,
      min_order_amount: codeData.min_order_amount || null,
      max_uses: codeData.max_uses || null,
      used_count: 0,
      expires_at: codeData.expires_at || null,
      is_active: true,
      description: codeData.description || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create discount code: ${error.message}`)
  }

  return newCode as DiscountCode
}

export async function getDiscountCodes(activeOnly: boolean = false): Promise<DiscountCode[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let query = supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) {
    const now = new Date().toISOString()
    query = query
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching discount codes:', error)
    return []
  }

  let codes = (data || []) as DiscountCode[]

  if (activeOnly) {
    codes = codes.filter(code => {
      if (code.max_uses && code.used_count >= code.max_uses) return false
      return true
    })
  }

  return codes
}

export async function getDiscountCode(code: string): Promise<DiscountCode | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching discount code:', error)
    return null
  }

  return data as DiscountCode
}

export async function validateDiscountCode(code: string, orderAmount: number): Promise<{ valid: boolean; discount: number; error?: string }> {
  const discountCode = await getDiscountCode(code)
  
  if (!discountCode) {
    return { valid: false, discount: 0, error: 'Invalid discount code' }
  }
  
  if (!discountCode.is_active) {
    return { valid: false, discount: 0, error: 'This discount code is not active' }
  }
  
  // Check expiration
  if (discountCode.expires_at) {
    const now = new Date()
    const expiresAt = new Date(discountCode.expires_at)
    if (expiresAt < now) {
      return { valid: false, discount: 0, error: 'This discount code has expired' }
    }
  }
  
  // Check max uses
  if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
    return { valid: false, discount: 0, error: 'This discount code has reached its usage limit' }
  }
  
  // Check minimum order amount
  if (discountCode.min_order_amount && orderAmount < discountCode.min_order_amount) {
    return { 
      valid: false, 
      discount: 0, 
      error: `Minimum order amount of ₦${discountCode.min_order_amount.toLocaleString()} required` 
    }
  }
  
  // Calculate discount
  let discount = 0
  if (discountCode.type === 'percentage') {
    discount = Math.round(orderAmount * (discountCode.value / 100))
  } else {
    discount = discountCode.value
    // Don't allow discount to exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount
    }
  }
  
  return { valid: true, discount }
}

export async function useDiscountCode(code: string): Promise<DiscountCode | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data: currentCode } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!currentCode) {
    return null
  }

  const { data: updated, error } = await supabase
    .from('discount_codes')
    .update({
      used_count: currentCode.used_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentCode.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating discount code usage:', error)
    return null
  }

  return updated as DiscountCode
}

export async function getDiscountCodeById(id: number): Promise<DiscountCode | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching discount code:', error)
    return null
  }

  return data as DiscountCode
}

export async function updateDiscountCode(id: number, updates: Partial<DiscountCode>): Promise<DiscountCode | null> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const updateData: any = { ...updates, updated_at: new Date().toISOString() }
  
  // Ensure code is uppercase if updating
  if (updates.code) {
    updateData.code = updates.code.toUpperCase()
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating discount code:', error)
    return null
  }

  return data as DiscountCode
}

export async function deleteDiscountCode(id: number): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting discount code:', error)
    return false
  }

  return true
}

// Migration function
export async function migrateDatabase() {
  console.log('Supabase database - migration handled by SQL script')
  await initDatabase()
}

// Initialize database on import (async)
initDatabase().catch(console.error)

export default {}
