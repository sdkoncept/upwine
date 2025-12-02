# Supabase Integration Option

## Should You Use Supabase?

### Current Setup (SQLite)
- ✅ Simple, file-based database
- ✅ No external dependencies
- ✅ Works great for small to medium scale
- ✅ Easy to backup (just copy the .db file)
- ❌ Limited concurrent connections
- ❌ Not ideal for serverless deployments (Vercel, etc.)
- ❌ No built-in authentication
- ❌ No real-time features

### With Supabase
- ✅ PostgreSQL database (production-ready)
- ✅ Built-in authentication (email, OAuth, etc.)
- ✅ Real-time subscriptions
- ✅ File storage for receipts/images
- ✅ Better for serverless deployments
- ✅ Scalable to millions of users
- ✅ Row-level security
- ❌ Requires external service
- ❌ Additional setup complexity
- ❌ Costs money at scale

## Recommendation

**For now (MVP/Starting):** 
- Stick with SQLite + current setup
- It works perfectly for your needs
- No additional costs
- Easy to manage

**Consider Supabase when:**
- You need customer accounts/login
- You want order history for customers
- You need real-time order updates
- You're scaling beyond 1000+ orders/week
- You want email authentication
- You need file storage for receipts/images

## Migration Path

If you decide to use Supabase later, here's how:

### 1. Setup Supabase
```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Project
- Go to supabase.com
- Create new project
- Get your API keys

### 3. Database Schema Migration
The current SQLite schema can be easily migrated to Supabase PostgreSQL:

```sql
-- Orders table
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock table
CREATE TABLE stock (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  total_bottles INTEGER NOT NULL DEFAULT 100,
  sold_bottles INTEGER NOT NULL DEFAULT 0,
  available_bottles INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Users table (for customer accounts)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Update Code
Replace `lib/db.ts` functions with Supabase client calls:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createOrder(orderData: OrderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

### 5. Add Authentication
Use Supabase Auth for customer accounts:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Sign up
await supabase.auth.signUp({
  email: 'customer@example.com',
  password: 'password'
})

// Sign in
await supabase.auth.signInWithPassword({
  email: 'customer@example.com',
  password: 'password'
})
```

## Current Implementation

The current system works perfectly without Supabase:
- ✅ Orders are stored in SQLite
- ✅ Payments work with Paystack
- ✅ Receipts are sent via WhatsApp
- ✅ Admin dashboard works
- ✅ No external database needed

**You can add Supabase later** when you need customer accounts. The migration is straightforward since the schema is already well-structured.

## Cost Comparison

**Current (SQLite):**
- Free forever
- Self-hosted
- No limits

**Supabase:**
- Free tier: 500MB database, 1GB file storage
- Pro: $25/month for 8GB database, 100GB storage
- Scales with usage

## Recommendation for Upwine

**Start with current setup** because:
1. You're just starting (100 bottles/week)
2. No customer accounts needed yet
3. Simple is better for MVP
4. Can always migrate later

**Add Supabase when:**
- Customers ask for order history
- You want to offer loyalty programs
- You need email marketing lists
- You're processing 1000+ orders/month

The current Paystack + SQLite setup will work perfectly for your needs right now!

