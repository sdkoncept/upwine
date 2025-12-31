import fs from 'fs'
import path from 'path'
import { getSql } from './postgres'

const dbPath = path.join(process.cwd(), 'upwine-data.json')

const DEFAULT_SETTINGS: Record<string, string> = {
  price_per_bottle: '2000',
  weekly_stock: '100',
  pickup_address: '24 Tony Anenih Avenue, G.R.A, Benin City',
  delivery_fee_min: '800',
  delivery_fee_max: '2200',
  admin_phone: '',
  admin_email: '',
}

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
  week_start_date: string
  total_bottles: number
  sold_bottles: number
  available_bottles: number
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

interface Database {
  orders: Order[]
  stock: Stock[]
  invoices: Invoice[]
  discount_codes: DiscountCode[]
  settings: Record<string, string>
  nextOrderId: number
  nextInvoiceId: number
  nextDiscountCodeId: number
}

function usesPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

function getWeekStartDateISO(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().slice(0, 10) // YYYY-MM-DD
}

// ---------------------------
// JSON fallback implementation
// ---------------------------

function getDefaultDatabase(): Database {
  return {
    orders: [],
    stock: [],
    invoices: [],
    discount_codes: [],
    settings: { ...DEFAULT_SETTINGS },
    nextOrderId: 1,
    nextInvoiceId: 1,
    nextDiscountCodeId: 1,
  }
}

function loadDatabase(): Database {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8')
      const parsed = JSON.parse(data) as Database
      // Backfill defaults if older file is missing fields
      parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
      parsed.orders = parsed.orders || []
      parsed.stock = parsed.stock || []
      parsed.invoices = parsed.invoices || []
      parsed.discount_codes = parsed.discount_codes || []
      parsed.nextOrderId = parsed.nextOrderId || 1
      parsed.nextInvoiceId = parsed.nextInvoiceId || 1
      parsed.nextDiscountCodeId = parsed.nextDiscountCodeId || 1
      return parsed
    }
  } catch (error) {
    console.error('Error loading database:', error)
  }
  return getDefaultDatabase()
}

function saveDatabase(db: Database): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error('Error saving database:', error)
  }
}

function ensureJsonInitialized(): void {
  const db = loadDatabase()

  // Ensure defaults exist
  db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) }

  // Ensure current week stock exists
  const currentWeek = getWeekStartDateISO()
  const weekStock = (db.stock || []).find((s) => s.week_start_date === currentWeek)
  if (!weekStock) {
    const weeklyStock = parseInt(db.settings.weekly_stock || '100', 10)
    db.stock.push({
      week_start_date: currentWeek,
      total_bottles: weeklyStock,
      sold_bottles: 0,
      available_bottles: weeklyStock,
    })
  }

  saveDatabase(db)
}

// ---------------------------
// Postgres implementation
// ---------------------------

async function ensurePostgresInitialized(): Promise<void> {
  const sql = getSql()

  // Seed settings (only if missing)
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await sql`
      insert into public.settings (key, value)
      values (${key}, ${value})
      on conflict (key) do nothing
    `
  }

  const weekStart = getWeekStartDateISO()
  const weeklyStock = parseInt(DEFAULT_SETTINGS.weekly_stock || '100', 10)

  // Ensure current week stock row exists
  await sql`
    insert into public.stock_weeks (week_start_date, total_bottles, sold_bottles, available_bottles)
    values (${weekStart}::date, ${weeklyStock}, 0, ${weeklyStock})
    on conflict (week_start_date) do nothing
  `
}

let initPromise: Promise<void> | null = null

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (usesPostgres()) {
        await ensurePostgresInitialized()
      } else {
        ensureJsonInitialized()
      }
    })()
  }
  return initPromise
}

// ---------------------------
// Public API (used by routes)
// ---------------------------

export async function initDatabase(): Promise<void> {
  // Keep this callable for setup scripts, but also auto-run via ensureInitialized().
  initPromise = null
  await ensureInitialized()
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return db.settings[key] || null
  }

  const sql = getSql()
  const rows = await sql<{ value: string }[]>`
    select value
    from public.settings
    where key = ${key}
    limit 1
  `
  return rows[0]?.value ?? null
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    db.settings[key] = value
    saveDatabase(db)
    return
  }

  const sql = getSql()
  await sql`
    insert into public.settings (key, value, updated_at)
    values (${key}, ${value}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `
}

export async function getCurrentStock(): Promise<{
  available_bottles: number
  total_bottles: number
  sold_bottles: number
}> {
  await ensureInitialized()

  const weekStart = getWeekStartDateISO()

  if (!usesPostgres()) {
    const db = loadDatabase()
    let stock = (db.stock || []).find((s) => s.week_start_date === weekStart)
    if (!stock) {
      const weeklyStock = parseInt(db.settings.weekly_stock || '100', 10)
      stock = {
        week_start_date: weekStart,
        total_bottles: weeklyStock,
        sold_bottles: 0,
        available_bottles: weeklyStock,
      }
      db.stock.push(stock)
      saveDatabase(db)
    }
    return {
      available_bottles: stock.available_bottles,
      total_bottles: stock.total_bottles,
      sold_bottles: stock.sold_bottles,
    }
  }

  const sql = getSql()
  const rows = await sql<
    { total_bottles: number; sold_bottles: number; available_bottles: number }[]
  >`
    select total_bottles, sold_bottles, available_bottles
    from public.stock_weeks
    where week_start_date = ${weekStart}::date
    limit 1
  `

  if (!rows[0]) {
    await ensurePostgresInitialized()
    return getCurrentStock()
  }

  return rows[0]
}

export async function resetWeeklyStock(bottles: number = 100): Promise<void> {
  await ensureInitialized()

  const weekStart = getWeekStartDateISO()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const existingIndex = (db.stock || []).findIndex((s) => s.week_start_date === weekStart)
    const newStock: Stock = {
      week_start_date: weekStart,
      total_bottles: bottles,
      sold_bottles: 0,
      available_bottles: bottles,
    }

    if (existingIndex >= 0) db.stock[existingIndex] = newStock
    else db.stock.push(newStock)

    saveDatabase(db)
    return
  }

  const sql = getSql()
  await sql`
    insert into public.stock_weeks (week_start_date, total_bottles, sold_bottles, available_bottles, updated_at)
    values (${weekStart}::date, ${bottles}, 0, ${bottles}, now())
    on conflict (week_start_date) do update
      set total_bottles = excluded.total_bottles,
          sold_bottles = excluded.sold_bottles,
          available_bottles = excluded.available_bottles,
          updated_at = now()
  `
}

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
}): Promise<{ orderNumber: string; totalAmount: number }> {
  await ensureInitialized()

  const pricePerBottle = parseInt((await getSetting('price_per_bottle')) || '2000', 10)
  const weeklyStockSetting = parseInt((await getSetting('weekly_stock')) || '100', 10)
  const totalAmount = orderData.quantity * pricePerBottle + orderData.delivery_fee
  const orderNumber = `UPW${Date.now().toString().slice(-8)}`
  const now = new Date().toISOString()
  const weekStart = getWeekStartDateISO()

  if (!usesPostgres()) {
    const db = loadDatabase()

    const stock = await getCurrentStock()
    if (orderData.quantity > stock.available_bottles) {
      throw new Error('Insufficient stock')
    }

    const newOrder: Order = {
      id: db.nextOrderId++,
      order_number: orderNumber,
      customer_name: orderData.customer_name,
      phone: orderData.phone,
      email: orderData.email || undefined,
      address: orderData.address || undefined,
      quantity: orderData.quantity,
      delivery_type: orderData.delivery_type,
      delivery_fee: orderData.delivery_fee,
      total_amount: totalAmount,
      payment_method: orderData.payment_method,
      payment_status: 'pending',
      status: 'pending',
      delivery_time: orderData.delivery_time,
      created_at: now,
      updated_at: now,
    }

    db.orders.push(newOrder)

    // Update stock
    const weekStock = (db.stock || []).find((s) => s.week_start_date === weekStart)
    if (weekStock) {
      weekStock.sold_bottles += orderData.quantity
      weekStock.available_bottles -= orderData.quantity
    }

    saveDatabase(db)
    return { orderNumber, totalAmount }
  }

  const sql = getSql()
  await sql.begin(async (tx) => {
    const stockRows = await tx<
      { available_bottles: number; sold_bottles: number; total_bottles: number }[]
    >`
      select available_bottles, sold_bottles, total_bottles
      from public.stock_weeks
      where week_start_date = ${weekStart}::date
      for update
    `

    if (!stockRows[0]) {
      await tx`
        insert into public.stock_weeks (week_start_date, total_bottles, sold_bottles, available_bottles)
        values (${weekStart}::date, ${weeklyStockSetting}, 0, ${weeklyStockSetting})
      `
      // re-lock after insert
      const retry = await tx<
        { available_bottles: number; sold_bottles: number; total_bottles: number }[]
      >`
        select available_bottles, sold_bottles, total_bottles
        from public.stock_weeks
        where week_start_date = ${weekStart}::date
        for update
      `
      stockRows[0] = retry[0]
    }

    const stock = stockRows[0]
    if (orderData.quantity > stock.available_bottles) {
      throw new Error('Insufficient stock')
    }

    await tx`
      insert into public.orders (
        order_number, customer_name, phone, email,
        delivery_type, address, delivery_fee,
        quantity, total_amount,
        payment_method, payment_status,
        status, delivery_time,
        created_at, updated_at
      )
      values (
        ${orderNumber}, ${orderData.customer_name}, ${orderData.phone}, ${orderData.email || null},
        ${orderData.delivery_type}, ${orderData.address || null}, ${orderData.delivery_fee},
        ${orderData.quantity}, ${totalAmount},
        ${orderData.payment_method}, 'pending',
        'pending', ${orderData.delivery_time || null},
        ${now}::timestamptz, ${now}::timestamptz
      )
    `

    await tx`
      update public.stock_weeks
      set
        sold_bottles = sold_bottles + ${orderData.quantity},
        available_bottles = available_bottles - ${orderData.quantity},
        updated_at = now()
      where week_start_date = ${weekStart}::date
    `
  })

  return { orderNumber, totalAmount }
}

export async function getOrders(status?: string): Promise<Order[]> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    let orders = db.orders || []
    if (status) orders = orders.filter((o) => o.status === status)
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const sql = getSql()
  const rows = await sql<Order[]>`
    select
      id,
      order_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      delivery_type,
      delivery_fee,
      total_amount,
      payment_method,
      payment_status,
      payment_reference,
      paystack_reference,
      status,
      delivery_time,
      created_at::text,
      updated_at::text
    from public.orders
    ${status ? sql`where status = ${status}` : sql``}
    order by created_at desc
  `
  return rows
}

export async function getOrder(orderNumber: string): Promise<Order | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return (db.orders || []).find((o) => o.order_number === orderNumber) || null
  }

  const sql = getSql()
  const rows = await sql<Order[]>`
    select
      id,
      order_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      delivery_type,
      delivery_fee,
      total_amount,
      payment_method,
      payment_status,
      payment_reference,
      paystack_reference,
      status,
      delivery_time,
      created_at::text,
      updated_at::text
    from public.orders
    where order_number = ${orderNumber}
    limit 1
  `
  return rows[0] || null
}

export async function updateOrderPayment(
  orderNumber: string,
  paymentStatus: string,
  paystackReference?: string
): Promise<void> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const order = (db.orders || []).find((o) => o.order_number === orderNumber)
    if (order) {
      order.payment_status = paymentStatus
      if (paystackReference) order.paystack_reference = paystackReference
      order.updated_at = new Date().toISOString()
      if (paymentStatus === 'paid') order.status = 'confirmed'
      saveDatabase(db)
    }
    return
  }

  const sql = getSql()
  await sql`
    update public.orders
    set
      payment_status = ${paymentStatus},
      paystack_reference = ${paystackReference ?? null},
      updated_at = now(),
      status = case when ${paymentStatus} = 'paid' then 'confirmed' else status end
    where order_number = ${orderNumber}
  `
}

export async function getOrderByPaystackReference(reference: string): Promise<Order | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return (db.orders || []).find((o) => o.paystack_reference === reference) || null
  }

  const sql = getSql()
  const rows = await sql<Order[]>`
    select
      id,
      order_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      delivery_type,
      delivery_fee,
      total_amount,
      payment_method,
      payment_status,
      payment_reference,
      paystack_reference,
      status,
      delivery_time,
      created_at::text,
      updated_at::text
    from public.orders
    where paystack_reference = ${reference}
    limit 1
  `
  return rows[0] || null
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const order = (db.orders || []).find((o) => o.id === orderId)
    if (order) {
      order.status = status
      order.updated_at = new Date().toISOString()
      saveDatabase(db)
    }
    return
  }

  const sql = getSql()
  await sql`
    update public.orders
    set status = ${status}, updated_at = now()
    where id = ${orderId}
  `
}

export async function updateOrderAdmin(
  orderId: number,
  updates: { status?: string; payment_status?: string }
): Promise<void> {
  await ensureInitialized()

  const { status, payment_status } = updates
  if (!status && !payment_status) return

  if (!usesPostgres()) {
    const db = loadDatabase()
    const order = (db.orders || []).find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found')

    // Restore stock if cancelling (and was not previously cancelled)
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const weekStart = getWeekStartDateISO()
      const weekStock = (db.stock || []).find((s) => s.week_start_date === weekStart)
      if (weekStock) {
        weekStock.sold_bottles = Math.max(0, weekStock.sold_bottles - order.quantity)
        weekStock.available_bottles = weekStock.available_bottles + order.quantity
      }
    }

    if (payment_status) order.payment_status = payment_status
    if (status) order.status = status
    order.updated_at = new Date().toISOString()
    saveDatabase(db)
    return
  }

  const sql = getSql()
  const weekStart = getWeekStartDateISO()

  await sql.begin(async (tx) => {
    const orders = await tx<{ id: number; status: string; quantity: number }[]>`
      select id, status, quantity
      from public.orders
      where id = ${orderId}
      for update
    `

    const order = orders[0]
    if (!order) throw new Error('Order not found')

    // Restore stock if cancelling (and was not previously cancelled)
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await tx`
        update public.stock_weeks
        set
          sold_bottles = greatest(0, sold_bottles - ${order.quantity}),
          available_bottles = available_bottles + ${order.quantity},
          updated_at = now()
        where week_start_date = ${weekStart}::date
      `
    }

    await tx`
      update public.orders
      set
        status = coalesce(${status ?? null}, status),
        payment_status = coalesce(${payment_status ?? null}, payment_status),
        updated_at = now()
      where id = ${orderId}
    `
  })
}

export async function getSalesStats(
  startDate?: string,
  endDate?: string
): Promise<{
  total_orders: number
  total_bottles_sold: number
  total_revenue: number
  paid_revenue: number
  cod_revenue: number
  online_revenue: number
}> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    let orders = db.orders || []
    if (startDate) orders = orders.filter((o) => o.created_at.split('T')[0] >= startDate)
    if (endDate) orders = orders.filter((o) => o.created_at.split('T')[0] <= endDate)

    return {
      total_orders: orders.length,
      total_bottles_sold: orders.reduce((sum, o) => sum + o.quantity, 0),
      total_revenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
      paid_revenue: orders.filter((o) => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
      cod_revenue: orders.filter((o) => o.payment_method === 'cod').reduce((sum, o) => sum + o.total_amount, 0),
      online_revenue: orders
        .filter((o) => o.payment_method === 'online' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0),
    }
  }

  const sql = getSql()
  const start = startDate ?? null
  const end = endDate ?? null

  const rows = await sql<
    {
      total_orders: number
      total_bottles_sold: number
      total_revenue: number
      paid_revenue: number
      cod_revenue: number
      online_revenue: number
    }[]
  >`
    select
      count(*)::int as total_orders,
      coalesce(sum(quantity), 0)::int as total_bottles_sold,
      coalesce(sum(total_amount), 0)::int as total_revenue,
      coalesce(sum(case when payment_status = 'paid' then total_amount else 0 end), 0)::int as paid_revenue,
      coalesce(sum(case when payment_method = 'cod' then total_amount else 0 end), 0)::int as cod_revenue,
      coalesce(sum(case when payment_method = 'online' and payment_status = 'paid' then total_amount else 0 end), 0)::int as online_revenue
    from public.orders
    where (${start}::date is null or created_at::date >= ${start}::date)
      and (${end}::date is null or created_at::date <= ${end}::date)
  `

  return (
    rows[0] || {
      total_orders: 0,
      total_bottles_sold: 0,
      total_revenue: 0,
      paid_revenue: 0,
      cod_revenue: 0,
      online_revenue: 0,
    }
  )
}

export async function getSalesByDate(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' | 'year' = 'day'
): Promise<Array<{ date: string; orders_count: number; bottles_sold: number; revenue: number }>> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const orders = (db.orders || []).filter((o) => {
      const orderDate = o.created_at.split('T')[0]
      return orderDate >= startDate && orderDate <= endDate
    })

    const grouped: Record<string, { orders_count: number; bottles_sold: number; revenue: number }> = {}
    orders.forEach((order) => {
      const date = new Date(order.created_at)
      let key: string
      switch (groupBy) {
        case 'day':
          key = order.created_at.split('T')[0]
          break
        case 'week': {
          const weekNumber = Math.ceil((date.getDate() - date.getDay() + 1) / 7)
          key = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
          break
        }
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
      }

      if (!grouped[key]) grouped[key] = { orders_count: 0, bottles_sold: 0, revenue: 0 }
      grouped[key].orders_count++
      grouped[key].bottles_sold += order.quantity
      grouped[key].revenue += order.total_amount
    })

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const sql = getSql()

  const bucketExpr =
    groupBy === 'day'
      ? sql`to_char(date_trunc('day', created_at), 'YYYY-MM-DD')`
      : groupBy === 'week'
        ? sql`to_char(date_trunc('week', created_at), 'IYYY-"W"IW')`
        : groupBy === 'month'
          ? sql`to_char(date_trunc('month', created_at), 'YYYY-MM')`
          : sql`to_char(date_trunc('year', created_at), 'YYYY')`

  const rows = await sql<
    { date: string; orders_count: number; bottles_sold: number; revenue: number }[]
  >`
    select
      ${bucketExpr} as date,
      count(*)::int as orders_count,
      coalesce(sum(quantity), 0)::int as bottles_sold,
      coalesce(sum(total_amount), 0)::int as revenue
    from public.orders
    where created_at::date >= ${startDate}::date
      and created_at::date <= ${endDate}::date
    group by date
    order by date asc
  `

  return rows
}

export async function getOrdersForExport(startDate?: string, endDate?: string) {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    let orders = db.orders || []
    if (startDate) orders = orders.filter((o) => o.created_at.split('T')[0] >= startDate)
    if (endDate) orders = orders.filter((o) => o.created_at.split('T')[0] <= endDate)

    return orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o) => ({
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

  const sql = getSql()
  const start = startDate ?? null
  const end = endDate ?? null

  const rows = await sql<
    Array<{
      order_number: string
      customer_name: string
      phone: string
      email: string | null
      quantity: number
      total_amount: number
      delivery_fee: number
      delivery_type: string
      payment_method: string
      payment_status: string
      status: string
      created_at: string
    }>
  >`
    select
      order_number,
      customer_name,
      phone,
      email,
      quantity,
      total_amount,
      delivery_fee,
      delivery_type,
      payment_method,
      payment_status,
      status,
      created_at::text as created_at
    from public.orders
    where (${start}::date is null or created_at::date >= ${start}::date)
      and (${end}::date is null or created_at::date <= ${end}::date)
    order by created_at desc
  `
  return rows
}

// Migration function (kept for compatibility)
export async function migrateDatabase(): Promise<void> {
  console.log('No automatic migrations in app code. Use Supabase SQL editor/migrations.')
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
}): Promise<Invoice> {
  await ensureInitialized()

  const pricePerBottle =
    invoiceData.price_per_bottle ?? parseInt((await getSetting('price_per_bottle')) || '2000', 10)
  const deliveryFee = invoiceData.delivery_fee || 0
  const discount = invoiceData.discount || 0
  const subtotal = invoiceData.quantity * pricePerBottle
  const totalAmount = subtotal + deliveryFee - discount
  const invoiceNumber = `INV${Date.now().toString().slice(-8)}`
  const now = new Date().toISOString()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const newInvoice: Invoice = {
      id: db.nextInvoiceId++,
      invoice_number: invoiceNumber,
      customer_name: invoiceData.customer_name,
      phone: invoiceData.phone,
      email: invoiceData.email,
      address: invoiceData.address,
      quantity: invoiceData.quantity,
      price_per_bottle: pricePerBottle,
      delivery_fee: deliveryFee,
      discount,
      total_amount: totalAmount,
      notes: invoiceData.notes,
      status: 'draft',
      due_date: invoiceData.due_date,
      created_at: now,
      updated_at: now,
    }
    db.invoices.push(newInvoice)
    saveDatabase(db)
    return newInvoice
  }

  const sql = getSql()
  const rows = await sql<Invoice[]>`
    insert into public.invoices (
      invoice_number, customer_name, phone, email, address,
      quantity, price_per_bottle, delivery_fee, discount, total_amount,
      notes, status, due_date,
      created_at, updated_at
    )
    values (
      ${invoiceNumber}, ${invoiceData.customer_name}, ${invoiceData.phone}, ${invoiceData.email || null}, ${invoiceData.address || null},
      ${invoiceData.quantity}, ${pricePerBottle}, ${deliveryFee}, ${discount}, ${totalAmount},
      ${invoiceData.notes || null}, 'draft', ${invoiceData.due_date ? sql`${invoiceData.due_date}::date` : null},
      ${now}::timestamptz, ${now}::timestamptz
    )
    returning
      id,
      invoice_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      total_amount,
      notes,
      status,
      due_date::text,
      created_at::text,
      updated_at::text
  `

  return rows[0]
}

export async function getInvoices(status?: string): Promise<Invoice[]> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    let invoices = db.invoices || []
    if (status) invoices = invoices.filter((i) => i.status === status)
    return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const sql = getSql()
  const rows = await sql<Invoice[]>`
    select
      id,
      invoice_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      total_amount,
      notes,
      status,
      due_date::text,
      created_at::text,
      updated_at::text
    from public.invoices
    ${status ? sql`where status = ${status}` : sql``}
    order by created_at desc
  `
  return rows
}

export async function getInvoice(invoiceNumber: string): Promise<Invoice | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return (db.invoices || []).find((i) => i.invoice_number === invoiceNumber) || null
  }

  const sql = getSql()
  const rows = await sql<Invoice[]>`
    select
      id,
      invoice_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      total_amount,
      notes,
      status,
      due_date::text,
      created_at::text,
      updated_at::text
    from public.invoices
    where invoice_number = ${invoiceNumber}
    limit 1
  `
  return rows[0] || null
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return (db.invoices || []).find((i) => i.id === id) || null
  }

  const sql = getSql()
  const rows = await sql<Invoice[]>`
    select
      id,
      invoice_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      total_amount,
      notes,
      status,
      due_date::text,
      created_at::text,
      updated_at::text
    from public.invoices
    where id = ${id}
    limit 1
  `
  return rows[0] || null
}

export async function updateInvoiceStatus(
  invoiceId: number,
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
): Promise<Invoice | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const invoice = (db.invoices || []).find((i) => i.id === invoiceId)
    if (invoice) {
      invoice.status = status
      invoice.updated_at = new Date().toISOString()
      saveDatabase(db)
      return invoice
    }
    return null
  }

  const sql = getSql()
  const rows = await sql<Invoice[]>`
    update public.invoices
    set status = ${status}, updated_at = now()
    where id = ${invoiceId}
    returning
      id,
      invoice_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      total_amount,
      notes,
      status,
      due_date::text,
      created_at::text,
      updated_at::text
  `
  return rows[0] || null
}

export async function updateInvoice(invoiceId: number, updates: Partial<Invoice>): Promise<Invoice | null> {
  await ensureInitialized()

  // Minimal implementation: load + apply updates + persist.
  const existing = await getInvoiceById(invoiceId)
  if (!existing) return null

  const next: Invoice = {
    ...existing,
    ...updates,
    id: existing.id,
    invoice_number: existing.invoice_number,
    updated_at: new Date().toISOString(),
  }

  // Recalculate total if relevant fields changed
  if (
    updates.quantity !== undefined ||
    updates.price_per_bottle !== undefined ||
    updates.delivery_fee !== undefined ||
    updates.discount !== undefined
  ) {
    const subtotal = next.quantity * next.price_per_bottle
    next.total_amount = subtotal + (next.delivery_fee || 0) - (next.discount || 0)
  }

  if (!usesPostgres()) {
    const db = loadDatabase()
    const idx = (db.invoices || []).findIndex((i) => i.id === invoiceId)
    if (idx === -1) return null
    db.invoices[idx] = next
    saveDatabase(db)
    return next
  }

  const sql = getSql()
  const rows = await sql<Invoice[]>`
    update public.invoices
    set
      customer_name = ${next.customer_name},
      phone = ${next.phone},
      email = ${next.email || null},
      address = ${next.address || null},
      quantity = ${next.quantity},
      price_per_bottle = ${next.price_per_bottle},
      delivery_fee = ${next.delivery_fee || 0},
      discount = ${next.discount || 0},
      total_amount = ${next.total_amount},
      notes = ${next.notes || null},
      status = ${next.status},
      due_date = ${next.due_date ? sql`${next.due_date}::date` : null},
      updated_at = now()
    where id = ${invoiceId}
    returning
      id,
      invoice_number,
      customer_name,
      phone,
      email,
      address,
      quantity,
      price_per_bottle,
      delivery_fee,
      discount,
      total_amount,
      notes,
      status,
      due_date::text,
      created_at::text,
      updated_at::text
  `
  return rows[0] || null
}

export async function deleteInvoice(invoiceId: number): Promise<boolean> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const index = (db.invoices || []).findIndex((i) => i.id === invoiceId)
    if (index !== -1) {
      db.invoices.splice(index, 1)
      saveDatabase(db)
      return true
    }
    return false
  }

  const sql = getSql()
  const rows = await sql<{ id: number }[]>`
    delete from public.invoices
    where id = ${invoiceId}
    returning id
  `
  return Boolean(rows[0])
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
}): Promise<DiscountCode> {
  await ensureInitialized()

  const now = new Date().toISOString()
  const normalizedCode = codeData.code.toUpperCase()

  if (!usesPostgres()) {
    const db = loadDatabase()

    const existingCode = (db.discount_codes || []).find((dc) => dc.code.toUpperCase() === normalizedCode)
    if (existingCode) throw new Error('Discount code already exists')

    const newCode: DiscountCode = {
      id: db.nextDiscountCodeId++,
      code: normalizedCode,
      type: codeData.type,
      value: codeData.value,
      min_order_amount: codeData.min_order_amount,
      max_uses: codeData.max_uses,
      used_count: 0,
      expires_at: codeData.expires_at,
      is_active: true,
      description: codeData.description,
      created_at: now,
      updated_at: now,
    }

    db.discount_codes.push(newCode)
    saveDatabase(db)
    return newCode
  }

  const sql = getSql()
  const rows = await sql<DiscountCode[]>`
    insert into public.discount_codes (
      code, type, value,
      min_order_amount, max_uses, used_count,
      expires_at, is_active, description,
      created_at, updated_at
    )
    values (
      ${normalizedCode}, ${codeData.type}, ${codeData.value},
      ${codeData.min_order_amount ?? null}, ${codeData.max_uses ?? null}, 0,
      ${codeData.expires_at ? sql`${codeData.expires_at}::timestamptz` : null},
      true,
      ${codeData.description ?? null},
      ${now}::timestamptz, ${now}::timestamptz
    )
    returning
      id,
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      used_count,
      expires_at::text,
      is_active,
      description,
      created_at::text,
      updated_at::text
  `
  return rows[0]
}

export async function getDiscountCodes(activeOnly: boolean = false): Promise<DiscountCode[]> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    let codes = db.discount_codes || []
    if (activeOnly) {
      const now = new Date()
      codes = codes.filter((code) => {
        if (!code.is_active) return false
        if (code.expires_at && new Date(code.expires_at) < now) return false
        if (code.max_uses && code.used_count >= code.max_uses) return false
        return true
      })
    }
    return codes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const sql = getSql()
  const rows = await sql<DiscountCode[]>`
    select
      id,
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      used_count,
      expires_at::text,
      is_active,
      description,
      created_at::text,
      updated_at::text
    from public.discount_codes
    ${
      activeOnly
        ? sql`where is_active = true
              and (expires_at is null or expires_at >= now())
              and (max_uses is null or used_count < max_uses)`
        : sql``
    }
    order by created_at desc
  `
  return rows
}

export async function getDiscountCode(code: string): Promise<DiscountCode | null> {
  await ensureInitialized()

  const normalizedCode = code.toUpperCase()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return (db.discount_codes || []).find((dc) => dc.code.toUpperCase() === normalizedCode) || null
  }

  const sql = getSql()
  const rows = await sql<DiscountCode[]>`
    select
      id,
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      used_count,
      expires_at::text,
      is_active,
      description,
      created_at::text,
      updated_at::text
    from public.discount_codes
    where code = ${normalizedCode}
    limit 1
  `
  return rows[0] || null
}

export async function validateDiscountCode(
  code: string,
  orderAmount: number
): Promise<{ valid: boolean; discount: number; error?: string }> {
  await ensureInitialized()

  const discountCode = await getDiscountCode(code)

  if (!discountCode) return { valid: false, discount: 0, error: 'Invalid discount code' }
  if (!discountCode.is_active) return { valid: false, discount: 0, error: 'This discount code is not active' }

  if (discountCode.expires_at) {
    const expiresAt = new Date(discountCode.expires_at)
    if (expiresAt < new Date()) return { valid: false, discount: 0, error: 'This discount code has expired' }
  }

  if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
    return { valid: false, discount: 0, error: 'This discount code has reached its usage limit' }
  }

  if (discountCode.min_order_amount && orderAmount < discountCode.min_order_amount) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum order amount of ₦${discountCode.min_order_amount.toLocaleString()} required`,
    }
  }

  let discount = 0
  if (discountCode.type === 'percentage') {
    discount = Math.round(orderAmount * (discountCode.value / 100))
  } else {
    discount = discountCode.value
    if (discount > orderAmount) discount = orderAmount
  }

  return { valid: true, discount }
}

export async function markDiscountCodeUsed(code: string): Promise<DiscountCode | null> {
  await ensureInitialized()

  const normalizedCode = code.toUpperCase()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const discountCode = (db.discount_codes || []).find((dc) => dc.code.toUpperCase() === normalizedCode)
    if (discountCode) {
      discountCode.used_count++
      discountCode.updated_at = new Date().toISOString()
      saveDatabase(db)
      return discountCode
    }
    return null
  }

  const sql = getSql()
  const rows = await sql<DiscountCode[]>`
    update public.discount_codes
    set used_count = used_count + 1, updated_at = now()
    where code = ${normalizedCode}
    returning
      id,
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      used_count,
      expires_at::text,
      is_active,
      description,
      created_at::text,
      updated_at::text
  `
  return rows[0] || null
}

export async function getDiscountCodeById(id: number): Promise<DiscountCode | null> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    return (db.discount_codes || []).find((dc) => dc.id === id) || null
  }

  const sql = getSql()
  const rows = await sql<DiscountCode[]>`
    select
      id,
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      used_count,
      expires_at::text,
      is_active,
      description,
      created_at::text,
      updated_at::text
    from public.discount_codes
    where id = ${id}
    limit 1
  `
  return rows[0] || null
}

export async function updateDiscountCode(id: number, updates: Partial<DiscountCode>): Promise<DiscountCode | null> {
  await ensureInitialized()

  const existing = await getDiscountCodeById(id)
  if (!existing) return null

  const next: DiscountCode = {
    ...existing,
    ...updates,
    id: existing.id,
    code: (updates.code ? updates.code.toUpperCase() : existing.code).toUpperCase(),
    updated_at: new Date().toISOString(),
  }

  if (!usesPostgres()) {
    const db = loadDatabase()
    const idx = (db.discount_codes || []).findIndex((dc) => dc.id === id)
    if (idx === -1) return null
    db.discount_codes[idx] = next
    saveDatabase(db)
    return next
  }

  const sql = getSql()
  const rows = await sql<DiscountCode[]>`
    update public.discount_codes
    set
      code = ${next.code},
      type = ${next.type},
      value = ${next.value},
      min_order_amount = ${next.min_order_amount ?? null},
      max_uses = ${next.max_uses ?? null},
      used_count = ${next.used_count},
      expires_at = ${next.expires_at ? sql`${next.expires_at}::timestamptz` : null},
      is_active = ${next.is_active},
      description = ${next.description ?? null},
      updated_at = now()
    where id = ${id}
    returning
      id,
      code,
      type,
      value,
      min_order_amount,
      max_uses,
      used_count,
      expires_at::text,
      is_active,
      description,
      created_at::text,
      updated_at::text
  `
  return rows[0] || null
}

export async function deleteDiscountCode(id: number): Promise<boolean> {
  await ensureInitialized()

  if (!usesPostgres()) {
    const db = loadDatabase()
    const index = (db.discount_codes || []).findIndex((dc) => dc.id === id)
    if (index !== -1) {
      db.discount_codes.splice(index, 1)
      saveDatabase(db)
      return true
    }
    return false
  }

  const sql = getSql()
  const rows = await sql<{ id: number }[]>`
    delete from public.discount_codes
    where id = ${id}
    returning id
  `
  return Boolean(rows[0])
}

export default {}
