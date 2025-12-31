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

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  address?: string;
  quantity: number;
  price_per_bottle: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

interface DiscountCode {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // Percentage (0-100) or fixed amount in naira
  min_order_amount?: number; // Minimum order amount to use this code
  max_uses?: number; // Maximum number of times this code can be used
  used_count: number; // How many times it's been used
  expires_at?: string; // ISO date string
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Database {
  orders: Order[];
  stock: Stock[];
  invoices: Invoice[];
  discount_codes: DiscountCode[];
  settings: Record<string, string>;
  nextOrderId: number;
  nextInvoiceId: number;
  nextDiscountCodeId: number;
}

function getDefaultDatabase(): Database {
  return {
    orders: [],
    stock: [],
    invoices: [],
    discount_codes: [],
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
    nextInvoiceId: 1,
    nextDiscountCodeId: 1,
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

// ============ INVOICE FUNCTIONS ============

export function createInvoice(invoiceData: {
  customer_name: string;
  phone: string;
  email?: string;
  address?: string;
  quantity: number;
  price_per_bottle?: number;
  delivery_fee?: number;
  discount?: number;
  notes?: string;
  due_date?: string;
}) {
  const db = loadDatabase();
  
  // Ensure invoices array exists
  if (!db.invoices) {
    db.invoices = [];
  }
  if (!db.nextInvoiceId) {
    db.nextInvoiceId = 1;
  }
  
  const pricePerBottle = invoiceData.price_per_bottle || parseInt(getSetting('price_per_bottle') || '2000');
  const deliveryFee = invoiceData.delivery_fee || 0;
  const discount = invoiceData.discount || 0;
  const subtotal = invoiceData.quantity * pricePerBottle;
  const totalAmount = subtotal + deliveryFee - discount;

  const invoiceNumber = `INV${Date.now().toString().slice(-8)}`;
  const now = new Date().toISOString();

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
    discount: discount,
    total_amount: totalAmount,
    notes: invoiceData.notes,
    status: 'draft',
    due_date: invoiceData.due_date,
    created_at: now,
    updated_at: now,
  };

  db.invoices.push(newInvoice);
  saveDatabase(db);
  
  return newInvoice;
}

export function getInvoices(status?: string) {
  const db = loadDatabase();
  let invoices = db.invoices || [];
  
  if (status) {
    invoices = invoices.filter(i => i.status === status);
  }
  
  return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getInvoice(invoiceNumber: string) {
  const db = loadDatabase();
  return (db.invoices || []).find(i => i.invoice_number === invoiceNumber) || null;
}

export function getInvoiceById(id: number) {
  const db = loadDatabase();
  return (db.invoices || []).find(i => i.id === id) || null;
}

export function updateInvoiceStatus(invoiceId: number, status: 'draft' | 'sent' | 'paid' | 'cancelled') {
  const db = loadDatabase();
  const invoice = (db.invoices || []).find(i => i.id === invoiceId);
  
  if (invoice) {
    invoice.status = status;
    invoice.updated_at = new Date().toISOString();
    saveDatabase(db);
    return invoice;
  }
  return null;
}

export function updateInvoice(invoiceId: number, updates: Partial<Invoice>) {
  const db = loadDatabase();
  const invoice = (db.invoices || []).find(i => i.id === invoiceId);
  
  if (invoice) {
    Object.assign(invoice, updates, { updated_at: new Date().toISOString() });
    
    // Recalculate total if quantity, price, delivery fee, or discount changed
    if (updates.quantity !== undefined || updates.price_per_bottle !== undefined || 
        updates.delivery_fee !== undefined || updates.discount !== undefined) {
      const subtotal = invoice.quantity * invoice.price_per_bottle;
      invoice.total_amount = subtotal + invoice.delivery_fee - invoice.discount;
    }
    
    saveDatabase(db);
    return invoice;
  }
  return null;
}

export function deleteInvoice(invoiceId: number) {
  const db = loadDatabase();
  const index = (db.invoices || []).findIndex(i => i.id === invoiceId);
  
  if (index !== -1) {
    db.invoices.splice(index, 1);
    saveDatabase(db);
    return true;
  }
  return false;
}

// ============ DISCOUNT CODE FUNCTIONS ============

export function createDiscountCode(codeData: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number;
  max_uses?: number;
  expires_at?: string;
  description?: string;
}) {
  const db = loadDatabase();
  
  // Ensure discount_codes array exists
  if (!db.discount_codes) {
    db.discount_codes = [];
  }
  if (!db.nextDiscountCodeId) {
    db.nextDiscountCodeId = 1;
  }
  
  // Check if code already exists
  const existingCode = (db.discount_codes || []).find(
    dc => dc.code.toUpperCase() === codeData.code.toUpperCase()
  );
  
  if (existingCode) {
    throw new Error('Discount code already exists');
  }
  
  const now = new Date().toISOString();
  
  const newCode: DiscountCode = {
    id: db.nextDiscountCodeId++,
    code: codeData.code.toUpperCase(),
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
  };
  
  db.discount_codes.push(newCode);
  saveDatabase(db);
  
  return newCode;
}

export function getDiscountCodes(activeOnly: boolean = false) {
  const db = loadDatabase();
  let codes = db.discount_codes || [];
  
  if (activeOnly) {
    const now = new Date();
    codes = codes.filter(code => {
      if (!code.is_active) return false;
      if (code.expires_at && new Date(code.expires_at) < now) return false;
      if (code.max_uses && code.used_count >= code.max_uses) return false;
      return true;
    });
  }
  
  return codes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getDiscountCode(code: string) {
  const db = loadDatabase();
  return (db.discount_codes || []).find(
    dc => dc.code.toUpperCase() === code.toUpperCase()
  ) || null;
}

export function validateDiscountCode(code: string, orderAmount: number): { valid: boolean; discount: number; error?: string } {
  const discountCode = getDiscountCode(code);
  
  if (!discountCode) {
    return { valid: false, discount: 0, error: 'Invalid discount code' };
  }
  
  if (!discountCode.is_active) {
    return { valid: false, discount: 0, error: 'This discount code is not active' };
  }
  
  // Check expiration
  if (discountCode.expires_at) {
    const now = new Date();
    const expiresAt = new Date(discountCode.expires_at);
    if (expiresAt < now) {
      return { valid: false, discount: 0, error: 'This discount code has expired' };
    }
  }
  
  // Check max uses
  if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
    return { valid: false, discount: 0, error: 'This discount code has reached its usage limit' };
  }
  
  // Check minimum order amount
  if (discountCode.min_order_amount && orderAmount < discountCode.min_order_amount) {
    return { 
      valid: false, 
      discount: 0, 
      error: `Minimum order amount of ₦${discountCode.min_order_amount.toLocaleString()} required` 
    };
  }
  
  // Calculate discount
  let discount = 0;
  if (discountCode.type === 'percentage') {
    discount = Math.round(orderAmount * (discountCode.value / 100));
  } else {
    discount = discountCode.value;
    // Don't allow discount to exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }
  
  return { valid: true, discount };
}

export function useDiscountCode(code: string) {
  const db = loadDatabase();
  const discountCode = (db.discount_codes || []).find(
    dc => dc.code.toUpperCase() === code.toUpperCase()
  );
  
  if (discountCode) {
    discountCode.used_count++;
    discountCode.updated_at = new Date().toISOString();
    saveDatabase(db);
    return discountCode;
  }
  return null;
}

export function getDiscountCodeById(id: number) {
  const db = loadDatabase();
  return (db.discount_codes || []).find(dc => dc.id === id) || null;
}

export function updateDiscountCode(id: number, updates: Partial<DiscountCode>) {
  const db = loadDatabase();
  const code = (db.discount_codes || []).find(dc => dc.id === id);
  
  if (code) {
    Object.assign(code, updates, { updated_at: new Date().toISOString() });
    // Ensure code is uppercase
    if (updates.code) {
      code.code = updates.code.toUpperCase();
    }
    saveDatabase(db);
    return code;
  }
  return null;
}

export function deleteDiscountCode(id: number) {
  const db = loadDatabase();
  const index = (db.discount_codes || []).findIndex(dc => dc.id === id);
  
  if (index !== -1) {
    db.discount_codes.splice(index, 1);
    saveDatabase(db);
    return true;
  }
  return false;
}

// Initialize database on import
initDatabase();

export default {};
