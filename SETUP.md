# Quick Setup Guide for Upwine.com

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, TypeScript, Tailwind CSS, and SQLite.

## Step 2: Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Step 3: First-Time Setup

1. **Database Initialization**: The SQLite database (`upwine.db`) will be automatically created on first run.

2. **Set Weekly Stock**: 
   - Go to `/admin` 
   - Click on "Stock Management" tab
   - Set your weekly stock (default: 100 bottles)
   - Click "Reset Stock"

3. **Configure WhatsApp (Optional)**:
   - Edit `lib/whatsapp.ts` to integrate your WhatsApp API
   - Add your admin phone number in the database settings table
   - Or set it via environment variables

## Step 4: Test the Application

1. **Homepage**: Visit `http://localhost:3000` - You should see the stock counter
2. **Order Flow**: 
   - Click "Order Your Bottles"
   - Select quantity
   - Choose pickup or delivery
   - Fill checkout form
   - Place order
3. **Admin Panel**: Visit `http://localhost:3000/admin` to see orders

## Step 5: Production Build

When ready to deploy:

```bash
npm run build
npm start
```

## Important Notes

- **Stock Reset**: Remember to reset stock every Monday morning via Admin Dashboard
- **Database**: The `upwine.db` file contains all your data - back it up regularly
- **WhatsApp**: Currently logs to console. Integrate with Twilio or WhatsApp Business API for production
- **Payment**: Online payment option is ready but needs payment gateway integration (Paystack, Flutterwave, etc.)

## Troubleshooting

**Database errors**: Delete `upwine.db` and restart - it will recreate automatically

**Port already in use**: Change port with `npm run dev -- -p 3001`

**Build errors**: Make sure Node.js version is 18+ and run `npm install` again

