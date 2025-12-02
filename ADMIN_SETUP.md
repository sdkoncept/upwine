# Admin Authentication Setup

## Default Password

The admin page is now protected with authentication. 

**Default password:** `upwine2024`

## Change Password

To change the admin password, set the `ADMIN_PASSWORD` environment variable:

1. **Local Development** - Create `.env.local`:
   ```
   ADMIN_PASSWORD=your_secure_password_here
   ```

2. **Production (Railway)** - Add environment variable:
   ```
   ADMIN_PASSWORD=your_secure_password_here
   ```

## Access Admin

1. Go to `/admin/login`
2. Enter password
3. You'll be redirected to `/admin` dashboard

## Features

✅ **Authentication Required** - Admin page is now protected
✅ **Detailed Order View** - Click on any order number to see full details:
   - Customer information (name, phone, email)
   - Delivery information (address, location, delivery time)
   - Payment details (method, status, references)
   - Order summary (quantity, prices, totals)
   - COD amount (if Cash on Delivery)
   - Online payment details (if paid online)
   - Order status management

✅ **Logout** - Click logout button to end session

## Security Notes

- Password is stored in environment variable (not in code)
- Session expires after 24 hours
- HTTP-only cookies prevent XSS attacks
- Secure cookies in production (HTTPS only)

## Order Details Displayed

When viewing an order, you'll see:

1. **Order Information**
   - Order number
   - Order date/time

2. **Customer Information**
   - Full name
   - Phone number (clickable)
   - Email (if provided, clickable)

3. **Delivery Information**
   - Delivery type (Pickup/Delivery)
   - Full delivery address (for delivery orders)
   - Pickup location (for pickup orders)
   - Preferred delivery time (if specified)

4. **Payment Information**
   - Payment method (COD/Online)
   - Payment status
   - Paystack reference (for online payments)
   - Payment reference

5. **Order Summary**
   - Quantity ordered
   - Price per bottle (₦1,200)
   - Subtotal
   - Delivery fee (if applicable)
   - Total amount
   - COD amount (if Cash on Delivery)
   - Paid amount (if online payment successful)

6. **Order Status**
   - Current status
   - Status update buttons

