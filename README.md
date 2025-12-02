# Upwine.com - Fresh Natural Palm Wine Ordering Platform

A complete e-commerce platform for selling fresh natural palm wine from your farm in Benin City.

## Features

- **Real-time Stock Management**: Track weekly stock (100 bottles/week) with automatic updates
- **Order Management**: Complete order processing with pickup and delivery options
- **Payment Options**: Support for online payment and cash on delivery
- **WhatsApp Notifications**: Automatic order confirmations via WhatsApp
- **Admin Dashboard**: Manage orders, track sales, and reset weekly stock
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **SQLite** - Lightweight database (better-sqlite3)
- **WhatsApp API** - Order notifications (configurable)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
Create a `.env.local` file in the root directory:
```env
# WhatsApp API Configuration (optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
ADMIN_PHONE=234xxxxxxxxxx
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database

The application uses SQLite database (`upwine.db`) which is automatically created on first run. The database includes:

- **stock** table: Tracks weekly stock availability
- **orders** table: Stores all customer orders
- **settings** table: Stores application settings

## Usage

### Weekly Operations

1. **Every Monday Morning**: Reset weekly stock to 100 bottles via Admin Dashboard
2. **Daily**: Check new orders in Admin Dashboard
3. **Process Orders**: Mark orders as completed/delivered as you fulfill them
4. **Friday**: Close weekly sales if stock remains

### Admin Dashboard

Access the admin panel at `/admin`:

- **Orders Tab**: View all orders, filter by status, update order status
- **Stock Tab**: View current stock, reset weekly stock

### Order Flow

1. Customer visits homepage and sees available stock
2. Customer clicks "Order" and selects quantity
3. Customer chooses pickup or delivery
4. Customer fills checkout form
5. Order is created and WhatsApp notifications sent
6. Admin receives notification and processes order
7. Customer receives confirmation

## Configuration

### Default Settings

- Price per bottle: ₦1,200
- Weekly stock: 100 bottles
- Pickup address: 24 Tony Anenih Avenue, G.R.A, Benin City
- Delivery fee: ₦800 - ₦1,200 (based on area)

These can be modified in the database `settings` table or via admin panel.

### WhatsApp Integration

To enable WhatsApp notifications:

1. Sign up for Twilio WhatsApp API or another WhatsApp Business API service
2. Add credentials to `.env.local`
3. Update `lib/whatsapp.ts` with your API implementation
4. Set `admin_phone` in settings for admin notifications

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deployment Options

- **Vercel**: Perfect for Next.js apps (recommended)
- **Netlify**: Easy deployment with continuous integration
- **Self-hosted**: Run on your own server with Node.js

### Environment Variables for Production

Make sure to set:
- `NODE_ENV=production`
- WhatsApp API credentials (if using)
- Database backup strategy

## Project Structure

```
upwine.com/
├── app/
│   ├── api/          # API routes
│   ├── admin/        # Admin dashboard
│   ├── about/        # About page
│   ├── checkout/     # Checkout page
│   ├── contact/      # Contact page
│   ├── order/        # Order page
│   └── order-confirmation/  # Order confirmation
├── lib/
│   ├── db.ts         # Database functions
│   └── whatsapp.ts   # WhatsApp utilities
└── public/           # Static assets
```

## Support

For issues or questions, contact:
- Email: info@upwine.com
- Phone: [Your phone number]
- WhatsApp: [Your WhatsApp link]

## License

Private - All rights reserved

