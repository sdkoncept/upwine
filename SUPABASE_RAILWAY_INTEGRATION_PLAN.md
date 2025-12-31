# Upwyne: Cursor + GitHub + Railway + Supabase Integration Plan

This guide captures a recommended way to run the Upwyne platform with **persistent storage** and a clean deployment workflow:

- **Cursor**: development environment (code changes).
- **GitHub**: version control + PR workflow.
- **Railway**: deployment (build + run the Next.js app).
- **Supabase (Postgres)**: durable data storage (orders, stock, invoices, discount codes, settings).

> Why this matters: the current app persists data to a local file (`upwine-data.json`). Many hosts don’t guarantee persistent filesystem storage. Moving to Postgres removes that risk and simplifies backups.

---

## Recommended workflow (high level)

### Cursor ↔ GitHub (dev workflow)
- Work in Cursor on a feature branch.
- Open a PR to `main`.
- (Optional) Add GitHub Actions to run `npm run lint` + `npm run build` on PRs.

### GitHub ↔ Railway (deployment)
- In Railway: “Deploy from GitHub repo”
- Deploy branch: `main` (auto-deploy on merge).
- Railway runs:
  - `npm install`
  - `npm run build`
  - `npm run start`

### Railway ↔ Supabase (data)
- Create a Supabase project (gives you Postgres).
- Add Railway env var:
  - **`DATABASE_URL`** = Supabase Postgres connection string (prefer Supabase “pooled/transaction” URL for app servers).
- Update app code to use Postgres instead of `upwine-data.json`.

---

## Postgres schema (Supabase SQL Editor)

Run the SQL below in the **Supabase SQL Editor**.

```sql
-- Keep everything in public schema for simplicity
-- (You can move to a dedicated schema later)

-- 1) Settings (key/value)
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 2) Weekly stock (Monday-based week_start_date)
create table if not exists public.stock_weeks (
  week_start_date date primary key,
  total_bottles int not null check (total_bottles >= 0),
  sold_bottles int not null default 0 check (sold_bottles >= 0),
  available_bottles int not null check (available_bottles >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists stock_weeks_updated_at_idx on public.stock_weeks (updated_at desc);

-- 3) Orders
create table if not exists public.orders (
  id bigint generated always as identity primary key,

  order_number text not null unique,          -- e.g. UPW12345678
  customer_name text not null,
  phone text not null,
  email text null,

  delivery_type text not null check (delivery_type in ('pickup','delivery')),
  address text null,                          -- combined string as used today
  delivery_fee int not null default 0 check (delivery_fee >= 0),

  quantity int not null check (quantity > 0),
  total_amount int not null check (total_amount >= 0),

  payment_method text not null check (payment_method in ('cod','online')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),

  payment_reference text null,
  paystack_reference text null unique,        -- reference returned from Paystack init

  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','delivered','cancelled')),

  delivery_time text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

-- 4) Invoices (manual invoices)
create table if not exists public.invoices (
  id bigint generated always as identity primary key,

  invoice_number text not null unique,        -- e.g. INV12345678
  customer_name text not null,
  phone text not null,
  email text null,
  address text null,

  quantity int not null check (quantity > 0),
  price_per_bottle int not null check (price_per_bottle >= 0),
  delivery_fee int not null default 0 check (delivery_fee >= 0),
  discount int not null default 0 check (discount >= 0),
  total_amount int not null check (total_amount >= 0),

  notes text null,
  due_date date null,

  status text not null default 'draft'
    check (status in ('draft','sent','paid','cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_created_at_idx on public.invoices (created_at desc);
create index if not exists invoices_status_idx on public.invoices (status);

-- 5) Discount codes
create table if not exists public.discount_codes (
  id bigint generated always as identity primary key,

  code text not null unique,                  -- uppercase
  type text not null check (type in ('percentage','fixed')),
  value numeric not null check (value > 0),

  min_order_amount numeric null check (min_order_amount is null or min_order_amount >= 0),
  max_uses int null check (max_uses is null or max_uses >= 0),
  used_count int not null default 0 check (used_count >= 0),

  expires_at timestamptz null,
  is_active boolean not null default true,
  description text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discount_codes_active_idx on public.discount_codes (is_active);
create index if not exists discount_codes_expires_at_idx on public.discount_codes (expires_at);

-- 6) Discount code usage tracking (optional)
create table if not exists public.discount_code_uses (
  id bigint generated always as identity primary key,
  discount_code_id bigint not null references public.discount_codes(id) on delete cascade,
  order_id bigint null references public.orders(id) on delete set null,
  used_at timestamptz not null default now()
);

create index if not exists discount_code_uses_code_id_idx on public.discount_code_uses (discount_code_id, used_at desc);
create index if not exists discount_code_uses_order_id_idx on public.discount_code_uses (order_id);
```

---

## Migration plan (safe + low risk for “just starting”)

### Phase 0 — Prep (no downtime)
- Create Supabase project.
- Run the SQL schema above.
- In Railway, add:
  - **`DATABASE_URL`** = Supabase Postgres connection string.

### Phase 1 — Code change: DB becomes pluggable (JSON → Postgres)
- Update `lib/db.ts` so:
  - If `DATABASE_URL` is present: use Postgres.
  - Otherwise: fall back to `upwine-data.json` (current behavior).
- Keep existing API routes the same so the UI doesn’t change.

**Recommendation:** use server-side Postgres queries (no Supabase JS client in the browser yet) to avoid RLS complexity at the beginning.

### Phase 2 — One-time import from `upwine-data.json` (optional)
If you already have real orders in the JSON file, write a script like:
- `scripts/migrate-json-to-postgres.ts`

Script responsibilities:
- Read `upwine-data.json`
- Insert into: `settings`, `stock_weeks`, `orders`, `invoices`, `discount_codes`
- (Optional) insert into `discount_code_uses` if you have that detail

### Phase 3 — Cutover + verification
- Deploy to Railway with `DATABASE_URL` set.
- Test:
  - COD order creation
  - stock decrement
  - admin dashboard reads/writes correctly
  - tracking + lookup pages still work
  - online payment (Paystack initialize/verify updates order to paid + confirmed)

### Phase 4 — Backups
Once you’re on Supabase Postgres:
- You’re no longer dependent on filesystem persistence for orders.
- Backups/exports become simpler (Supabase tooling + Postgres dumps/exports).

---

## Notes on matching the current Upwyne app behavior
- `address` stays a single string because checkout currently concatenates destination + details.
- Status values are modeled to match the current UI/API:
  - Order `status`: `pending | confirmed | completed | delivered | cancelled`
  - `payment_status`: `pending | paid | failed | refunded`
- Discount codes include `used_count`, and an optional `discount_code_uses` table is provided so you can track usage per order if you want.

