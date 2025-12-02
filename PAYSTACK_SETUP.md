# Paystack Payment Integration Setup

## Overview

The Upwine platform now supports online payments via Paystack. When customers select "Online Payment", they are redirected to Paystack to complete payment, and receipts are automatically sent after successful payment.

## Setup Instructions

### 1. Get Paystack API Keys

1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy your **Secret Key** (starts with `sk_`)
4. Copy your **Public Key** (starts with `pk_`) - optional, for frontend if needed

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Your secret key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL (change in production)

# For production:
# PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
# NEXT_PUBLIC_APP_URL=https://upwine.com
```

### 3. Test Mode vs Live Mode

**Test Mode:**
- Use test cards from Paystack documentation
- No real money is charged
- Perfect for development

**Live Mode:**
- Real payments
- Switch to `sk_live_` key
- Update `NEXT_PUBLIC_APP_URL` to your production domain

## Payment Flow

### For Cash on Delivery (COD):
1. Customer fills checkout form
2. Selects "Cash on Delivery"
3. Places order
4. Order confirmed immediately
5. WhatsApp confirmation sent
6. Admin notified

### For Online Payment:
1. Customer fills checkout form
2. **Email is required** (for Paystack)
3. Selects "Online Payment"
4. Places order
5. Redirected to Paystack payment page
6. Completes payment
7. Redirected back to callback page
8. Payment verified automatically
9. Receipt sent via WhatsApp
10. Admin notified of successful payment

## Paystack Test Cards

Use these cards for testing:

**Successful Payment:**
- Card Number: `4084 0840 8408 4081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000` (or any 4 digits)

**Declined Payment:**
- Card Number: `5060 6666 6666 6666 6666`
- CVV: `123`
- Expiry: Any future date

## Webhook Setup (Optional but Recommended)

For production, set up Paystack webhooks:

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment/webhook`
3. Select events: `charge.success`, `charge.failed`

This ensures payments are verified even if customer closes browser.

## Receipt Generation

After successful payment:
- ✅ Receipt sent via WhatsApp automatically
- ✅ Receipt includes order details, payment info
- ✅ Admin notified of successful payment
- ✅ Order status updated to "confirmed"

## Troubleshooting

### Payment Not Redirecting
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify Paystack secret key is correct
- Check browser console for errors

### Payment Verification Fails
- Check Paystack dashboard for transaction status
- Verify webhook is configured (if using)
- Check server logs for errors

### Receipt Not Sending
- Verify WhatsApp integration is configured
- Check phone number format
- Review server logs

## Security Notes

- ✅ Never expose secret key in frontend code
- ✅ Always verify payments server-side
- ✅ Use HTTPS in production
- ✅ Validate payment amounts match order totals
- ✅ Store payment references for audit trail

## API Endpoints

### Initialize Payment
`POST /api/payment/initialize`
- Creates Paystack payment link
- Returns authorization URL
- Updates order with payment reference

### Verify Payment
`POST /api/payment/verify`
- Verifies payment with Paystack
- Updates order status
- Sends receipt
- Notifies admin

### Payment Callback
`GET /payment/callback?reference=xxx`
- Customer redirected here after payment
- Automatically verifies payment
- Shows success/failure page

## Database Changes

Orders table now includes:
- `payment_status` - pending/paid/failed
- `payment_reference` - internal reference
- `paystack_reference` - Paystack transaction reference

## Support

For Paystack issues:
- Documentation: https://paystack.com/docs
- Support: support@paystack.com
- Status: https://status.paystack.com

