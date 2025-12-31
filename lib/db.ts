import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'upwine-data.json');

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  address?: string;
  quantity: number;
  delivery_type: string;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_reference?: string;
  paystack_reference?: string;
  status: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
}

interface Stock {
  week_start_date: string;
  total_bottles: number;
  sold_bottles: number;
  available_bottles: number;
}

interface Database {
  orders: Order[];
  stock: Stock[];
  settings: Record<string, string>;
  nextOrderId: number;
}

function getDefaultDatabase(): Database {
  return {
    orders: [],
    stock: [],
    settings: {
      price_per_bottle: '2000',
      weekly_stock: '100',
      pickup_address: '24 Tony Anenih Avenue, G.R.A, Benin City',
      delivery_fee_min: '800',
      delivery_fee_max: '2200',
      admin_phone: '',
      admin_email: '',
    },
    nextOrderId: 1,
  };
}

function loadDatabase(): Database {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
  return getDefaultDatabase();
}

function saveDatabase(db: Database): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Initialize database
export function initDatabase() {
  const db = loadDatabase();
  
  // Ensure current week stock exists
  const currentWeek = getWeekStartDate();
  const weekStock = db.stock.find(s => s.week_start_date === currentWeek);
  
  if (!weekStock) {
    db.stock.push({
      week_start_date: currentWeek,
      total_bottles: 100,
      sold_bottles: 0,
      available_bottles: 100,
    });
    saveDatabase(db);
  }
}

export function getCurrentStock() {
  const db = loadDatabase();
  const currentWeek = getWeekStartDate();
  let stock = db.stock.find(s => s.week_start_date === currentWeek);
  
  if (!stock) {
    stock = {
      week_start_date: currentWeek,
      total_bottles: 100,
      sold_bottles: 0,
      available_bottles: 100,
    };
    db.stock.push(stock);
    saveDatabase(db);
  }
  
  return {
    available_bottles: stock.available_bottles,
    total_bottles: stock.total_bottles,
    sold_bottles: stock.sold_bottles,
  };
}

export function createOrder(orderData: {
  customer_name: string;
  phone: string;
  email?: string;
  address?: string | null;
  quantity: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_fee: number;
  payment_method: string;
  delivery_time?: string;
}) {
  const db = loadDatabase();
  const stock = getCurrentStock();
  
  if (orderData.quantity > stock.available_bottles) {
    throw new Error('Insufficient stock');
  }

  const pricePerBottle = parseInt(getSetting('price_per_bottle') || '2000');
  const totalAmount = (orderData.quantity * pricePerBottle) + orderData.delivery_fee;

  const orderNumber = `UPW${Date.now().toString().slice(-8)}`;
  const now = new Date().toISOString();

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
  };

  db.orders.push(newOrder);

  // Update stock
  const currentWeek = getWeekStartDate();
  const weekStock = db.stock.find(s => s.week_start_date === currentWeek);
  if (weekStock) {
    weekStock.sold_bottles += orderData.quantity;
    weekStock.available_bottles -= orderData.quantity;
  }

  saveDatabase(db);
  return { orderNumber, totalAmount };
}

export function getOrders(status?: string) {
  const db = loadDatabase();
  let orders = db.orders;
  
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  
  return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateOrderStatus(orderId: number, status: string) {
  const db = loadDatabase();
  const order = db.orders.find(o => o.id === orderId);
  
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
    saveDatabase(db);
  }
}

export function getSetting(key: string): string | null {
  const db = loadDatabase();
  return db.settings[key] || null;
}

export function updateSetting(key: string, value: string) {
  const db = loadDatabase();
  db.settings[key] = value;
  saveDatabase(db);
}

export function resetWeeklyStock(bottles: number = 100) {
  const db = loadDatabase();
  const currentWeek = getWeekStartDate();
  
  const existingIndex = db.stock.findIndex(s => s.week_start_date === currentWeek);
  const newStock: Stock = {
    week_start_date: currentWeek,
    total_bottles: bottles,
    sold_bottles: 0,
    available_bottles: bottles,
  };
  
  if (existingIndex >= 0) {
    db.stock[existingIndex] = newStock;
  } else {
    db.stock.push(newStock);
  }
  
  saveDatabase(db);
}

export function getOrder(orderNumber: string) {
  const db = loadDatabase();
  return db.orders.find(o => o.order_number === orderNumber) || null;
}

export function updateOrderPayment(orderNumber: string, paymentStatus: string, paystackReference?: string) {
  const db = loadDatabase();
  const order = db.orders.find(o => o.order_number === orderNumber);
  
  if (order) {
    order.payment_status = paymentStatus;
    if (paystackReference) {
      order.paystack_reference = paystackReference;
    }
    order.updated_at = new Date().toISOString();
    
    if (paymentStatus === 'paid') {
      order.status = 'confirmed';
    }
    
    saveDatabase(db);
  }
}

export function getOrderByPaystackReference(reference: string) {
  const db = loadDatabase();
  return db.orders.find(o => o.paystack_reference === reference) || null;
}

export function getSalesStats(startDate?: string, endDate?: string) {
  const db = loadDatabase();
  let orders = db.orders;
  
  if (startDate) {
    orders = orders.filter(o => o.created_at.split('T')[0] >= startDate);
  }
  
  if (endDate) {
    orders = orders.filter(o => o.created_at.split('T')[0] <= endDate);
  }
  
  return {
    total_orders: orders.length,
    total_bottles_sold: orders.reduce((sum, o) => sum + o.quantity, 0),
    total_revenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
    paid_revenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
    cod_revenue: orders.filter(o => o.payment_method === 'cod').reduce((sum, o) => sum + o.total_amount, 0),
    online_revenue: orders.filter(o => o.payment_method === 'online' && o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
  };
}

export function getSalesByDate(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' | 'year' = 'day') {
  const db = loadDatabase();
  const orders = db.orders.filter(o => {
    const orderDate = o.created_at.split('T')[0];
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  const grouped: Record<string, { orders_count: number; bottles_sold: number; revenue: number }> = {};
  
  orders.forEach(order => {
    let key: string;
    const date = new Date(order.created_at);
    
    switch (groupBy) {
      case 'day':
        key = order.created_at.split('T')[0];
        break;
      case 'week':
        const weekNumber = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
    }
    
    if (!grouped[key]) {
      grouped[key] = { orders_count: 0, bottles_sold: 0, revenue: 0 };
    }
    
    grouped[key].orders_count++;
    grouped[key].bottles_sold += order.quantity;
    grouped[key].revenue += order.total_amount;
  });
  
  return Object.entries(grouped)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getOrdersForExport(startDate?: string, endDate?: string) {
  const db = loadDatabase();
  let orders = db.orders;
  
  if (startDate) {
    orders = orders.filter(o => o.created_at.split('T')[0] >= startDate);
  }
  
  if (endDate) {
    orders = orders.filter(o => o.created_at.split('T')[0] <= endDate);
  }
  
  return orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(o => ({
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
    }));
}

// Migration function (no-op for JSON storage)
export function migrateDatabase() {
  // JSON storage doesn't need migrations
  console.log('JSON database - no migration needed');
}

// Initialize database on import
initDatabase();

export default {};
