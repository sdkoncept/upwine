import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'upwine.db');
const db = new Database(dbPath);

// Initialize database tables
export function initDatabase() {
  // Stock table - tracks weekly stock
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start_date TEXT NOT NULL,
      total_bottles INTEGER NOT NULL DEFAULT 100,
      sold_bottles INTEGER NOT NULL DEFAULT 0,
      available_bottles INTEGER NOT NULL DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      quantity INTEGER NOT NULL,
      delivery_type TEXT NOT NULL,
      delivery_fee INTEGER DEFAULT 0,
      total_amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      payment_reference TEXT,
      paystack_reference TEXT,
      status TEXT DEFAULT 'pending',
      delivery_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Initialize default settings
  const settings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settings.count === 0) {
    const insertSettings = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSettings.run('price_per_bottle', '2000');
    insertSettings.run('weekly_stock', '100');
    insertSettings.run('pickup_address', '24 Tony Anenih Avenue, G.R.A, Benin City');
    insertSettings.run('delivery_fee_min', '800');
    insertSettings.run('delivery_fee_max', '1200');
    insertSettings.run('admin_phone', '');
    insertSettings.run('admin_email', '');
  }

  // Initialize current week stock if not exists
  const currentWeek = getWeekStartDate();
  const weekStock = db.prepare('SELECT * FROM stock WHERE week_start_date = ?').get(currentWeek);
  if (!weekStock) {
    db.prepare(`
      INSERT INTO stock (week_start_date, total_bottles, sold_bottles, available_bottles)
      VALUES (?, 100, 0, 100)
    `).run(currentWeek);
  }
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getCurrentStock() {
  const currentWeek = getWeekStartDate();
  const stock = db.prepare('SELECT * FROM stock WHERE week_start_date = ?').get(currentWeek) as {
    available_bottles: number;
    total_bottles: number;
    sold_bottles: number;
  } | undefined;

  if (!stock) {
    // Create new week stock
    db.prepare(`
      INSERT INTO stock (week_start_date, total_bottles, sold_bottles, available_bottles)
      VALUES (?, 100, 0, 100)
    `).run(currentWeek);
    return { available_bottles: 100, total_bottles: 100, sold_bottles: 0 };
  }

  return stock;
}

export function createOrder(orderData: {
  customer_name: string;
  phone: string;
  email?: string;
  address?: string;
  quantity: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_fee: number;
  payment_method: string;
  delivery_time?: string;
}) {
  const stock = getCurrentStock();
  
  if (orderData.quantity > stock.available_bottles) {
    throw new Error('Insufficient stock');
  }

  const pricePerBottle = parseInt(getSetting('price_per_bottle') || '2000');
  const totalAmount = (orderData.quantity * pricePerBottle) + orderData.delivery_fee;

  // Generate order number
  const orderNumber = `UPW${Date.now().toString().slice(-8)}`;

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, customer_name, phone, email, address, quantity,
      delivery_type, delivery_fee, total_amount, payment_method, delivery_time, 
      payment_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  const paymentStatus = orderData.payment_method === 'cod' ? 'pending' : 'pending';

  insertOrder.run(
    orderNumber,
    orderData.customer_name,
    orderData.phone,
    orderData.email || null,
    orderData.address || null,
    orderData.quantity,
    orderData.delivery_type,
    orderData.delivery_fee,
    totalAmount,
    orderData.payment_method,
    orderData.delivery_time || null,
    paymentStatus
  );

  // Update stock
  const currentWeek = getWeekStartDate();
  db.prepare(`
    UPDATE stock 
    SET sold_bottles = sold_bottles + ?, 
        available_bottles = available_bottles - ?
    WHERE week_start_date = ?
  `).run(orderData.quantity, orderData.quantity, currentWeek);

  return { orderNumber, totalAmount };
}

export function getOrders(status?: string) {
  if (status) {
    return db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
}

export function updateOrderStatus(orderId: number, status: string) {
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, orderId);
}

export function getSetting(key: string): string | null {
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return result?.value || null;
}

export function updateSetting(key: string, value: string) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function resetWeeklyStock(bottles: number = 100) {
  const currentWeek = getWeekStartDate();
  db.prepare(`
    INSERT OR REPLACE INTO stock (week_start_date, total_bottles, sold_bottles, available_bottles)
    VALUES (?, ?, 0, ?)
  `).run(currentWeek, bottles, bottles);
}

export function getOrder(orderNumber: string) {
  return db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
}

export function updateOrderPayment(orderNumber: string, paymentStatus: string, paystackReference?: string) {
  db.prepare(`
    UPDATE orders 
    SET payment_status = ?, 
        paystack_reference = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_number = ?
  `).run(paymentStatus, paystackReference || null, orderNumber);
  
  // If payment is successful, update order status to confirmed
  if (paymentStatus === 'paid') {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?')
      .run('confirmed', orderNumber);
  }
}

export function getOrderByPaystackReference(reference: string) {
  return db.prepare('SELECT * FROM orders WHERE paystack_reference = ?').get(reference);
}

/**
 * Get sales statistics filtered by date range
 */
export function getSalesStats(startDate?: string, endDate?: string) {
  let query = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(quantity) as total_bottles_sold,
      SUM(total_amount) as total_revenue,
      SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
      SUM(CASE WHEN payment_method = 'cod' THEN total_amount ELSE 0 END) as cod_revenue,
      SUM(CASE WHEN payment_method = 'online' AND payment_status = 'paid' THEN total_amount ELSE 0 END) as online_revenue
    FROM orders
    WHERE 1=1
  `
  
  const params: any[] = []
  
  if (startDate) {
    query += ' AND DATE(created_at) >= DATE(?)'
    params.push(startDate)
  }
  
  if (endDate) {
    query += ' AND DATE(created_at) <= DATE(?)'
    params.push(endDate)
  }
  
  return db.prepare(query).get(...params) as {
    total_orders: number
    total_bottles_sold: number
    total_revenue: number
    paid_revenue: number
    cod_revenue: number
    online_revenue: number
  }
}

/**
 * Get sales data grouped by date for charts
 */
export function getSalesByDate(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' | 'year' = 'day') {
  let dateFormat: string
  let groupByClause: string
  
  switch (groupBy) {
    case 'day':
      dateFormat = "DATE(created_at)"
      groupByClause = "DATE(created_at)"
      break
    case 'week':
      dateFormat = "strftime('%Y-W%W', created_at)"
      groupByClause = "strftime('%Y-W%W', created_at)"
      break
    case 'month':
      dateFormat = "strftime('%Y-%m', created_at)"
      groupByClause = "strftime('%Y-%m', created_at)"
      break
    case 'year':
      dateFormat = "strftime('%Y', created_at)"
      groupByClause = "strftime('%Y', created_at)"
      break
  }
  
  const query = `
    SELECT 
      ${dateFormat} as date,
      COUNT(*) as orders_count,
      SUM(quantity) as bottles_sold,
      SUM(total_amount) as revenue
    FROM orders
    WHERE DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)
    GROUP BY ${groupByClause}
    ORDER BY date ASC
  `
  
  return db.prepare(query).all(startDate, endDate) as Array<{
    date: string
    orders_count: number
    bottles_sold: number
    revenue: number
  }>
}

/**
 * Get orders for CSV export
 */
export function getOrdersForExport(startDate?: string, endDate?: string) {
  let query = `
    SELECT 
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
      created_at
    FROM orders
    WHERE 1=1
  `
  
  const params: any[] = []
  
  if (startDate) {
    query += ' AND DATE(created_at) >= DATE(?)'
    params.push(startDate)
  }
  
  if (endDate) {
    query += ' AND DATE(created_at) <= DATE(?)'
    params.push(endDate)
  }
  
  query += ' ORDER BY created_at DESC'
  
  return db.prepare(query).all(...params) as Array<{
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
}

// Migration function to add new columns to existing database
export function migrateDatabase() {
  try {
    // Check if orders table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='orders'
    `).get();
    
    if (!tableExists) {
      console.log('Orders table does not exist, will be created by initDatabase');
      return;
    }
    
    // Get current table structure
    const columns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
    const columnNames = columns.map(col => col.name);
    
    let migrationsRun = false;
    
    // Add payment_status if missing
    if (!columnNames.includes('payment_status')) {
      console.log('🔄 Adding payment_status column...');
      db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';`);
      migrationsRun = true;
    }
    
    // Add payment_reference if missing
    if (!columnNames.includes('payment_reference')) {
      console.log('🔄 Adding payment_reference column...');
      db.exec(`ALTER TABLE orders ADD COLUMN payment_reference TEXT;`);
      migrationsRun = true;
    }
    
    // Add paystack_reference if missing
    if (!columnNames.includes('paystack_reference')) {
      console.log('🔄 Adding paystack_reference column...');
      db.exec(`ALTER TABLE orders ADD COLUMN paystack_reference TEXT;`);
      migrationsRun = true;
    }
    
    // Add updated_at if missing
    if (!columnNames.includes('updated_at')) {
      console.log('🔄 Adding updated_at column...');
      db.exec(`ALTER TABLE orders ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`);
      migrationsRun = true;
    }
    
    if (migrationsRun) {
      console.log('✅ Database migration completed - columns added successfully');
    } else {
      console.log('✅ Database migration completed - all columns already exist');
    }
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    if (error.code === 'SQLITE_ERROR') {
      if (error.message.includes('duplicate column')) {
        console.log('ℹ️  Columns already exist, skipping migration');
      } else {
        console.error('⚠️  Migration failed. To fix: Delete upwine.db and restart the server.');
        console.error('   Or run: rm upwine.db && npm run dev');
      }
    }
  }
}

// Initialize database on import
initDatabase();

// Run migration on import (after init to ensure table exists)
migrateDatabase();

export default db;

