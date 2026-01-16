# Paystack Live Keys Setup Guide

This guide covers setting up Paystack with live keys for production.

## ✅ Live Keys Configuration

### Secret Key (Server-side)
- **Key**: `sk_live_xxxxxxxxxxxxx` (Set in environment variables - DO NOT commit to Git)
- **Usage**: Used for server-side payment initialization and verification
- **Location**: Set in environment variables

### Public Key (Client-side - Not Currently Used)
- **Key**: `pk_live_xxxxxxxxxxxxx` (Set in environment variables if needed)
- **Note**: The current implementation uses server-side initialization only, so this key is not required. However, keep it for future use if you decide to implement client-side Paystack integration.

## 🔧 Environment Variables Setup

### Local Development (`.env.local`)
```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important**: Replace `sk_live_xxxxxxxxxxxxx` with your actual live secret key. Never commit this file to Git.

### Railway Production
1. Go to Railway Dashboard → Your Project → Variables
2. Update or add these variables:

| Variable Name | Value |
|--------------|-------|
| `PAYSTACK_SECRET_KEY` | Your live secret key (starts with `sk_live_`) |
| `NEXT_PUBLIC_APP_URL` | `https://upwine-production.up.railway.app` |

**Via Railway CLI:**
```bash
npx railway variables --set "PAYSTACK_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE"
npx railway variables --set "NEXT_PUBLIC_APP_URL=https://upwine-production.up.railway.app"
```

**⚠️ Important**: Replace `sk_live_YOUR_ACTUAL_KEY_HERE` with your actual live secret key.

## 🔗 Paystack URLs Configuration

### 1. Callback URL (Required)
**URL**: `https://upwine-production.up.railway.app/payment/callback`

**What it does**: Paystack redirects customers here after payment completion.

**Status**: ✅ Automatically configured in code (no manual setup needed)

The callback URL is set in `app/api/payment/initialize/route.ts`:
```typescript
const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`
```

### 2. Webhook URL (Recommended for Production)
**URL**: `https://upwine-production.up.railway.app/api/payment/webhook`

**What it does**: Paystack sends server-to-server notifications when payment events occur. This is more reliable than relying only on the callback.

**Setup Steps:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Scroll to **Webhooks** section
4. Click **Add Webhook URL**
5. Enter: `https://upwine-production.up.railway.app/api/payment/webhook`
6. Select events to listen for:
   - ✅ `charge.success` (Required)
   - ✅ `charge.failed` (Optional but recommended)
   - ✅ `transfer.success` (Optional, if you plan to send transfers)
7. Click **Save**

**Webhook Handler**: The webhook handler is implemented at `app/api/payment/webhook/route.ts` and will:
- Verify webhook signature for security
- Process successful payments
- Update order status
- Send receipts to customers
- Notify admin via WhatsApp

## 🔒 Security Features

### Webhook Signature Verification
The webhook handler automatically verifies that requests are coming from Paystack using HMAC SHA512 signature verification. This prevents unauthorized access.

### Payment Verification
All payments are verified with Paystack's API before updating order status, ensuring payment authenticity.

## 📋 Testing Checklist

After setting up live keys:

- [ ] Update `PAYSTACK_SECRET_KEY` in Railway to live key
- [ ] Set `NEXT_PUBLIC_APP_URL` in Railway
- [ ] Test a small payment (use real card or Paystack test mode if available)
- [ ] Verify callback redirect works after payment
- [ ] Set up webhook URL in Paystack dashboard
- [ ] Test webhook by making a test payment
- [ ] Check that order status updates correctly
- [ ] Verify receipt is sent to customer
- [ ] Verify admin notification is sent

## 🚨 Important Notes

1. **Never commit live keys to Git**: Always use environment variables
2. **Test with small amounts first**: Verify everything works before processing large orders
3. **Monitor webhook logs**: Check Railway logs for webhook processing errors
4. **Keep test keys separate**: Use test keys for development, live keys only in production
5. **Webhook is recommended**: While the callback works, webhooks provide more reliable payment confirmation

## 📞 Support

- **Paystack Documentation**: https://paystack.com/docs
- **Paystack Support**: support@paystack.com
- **Paystack Status**: https://status.paystack.com

## 🔄 Payment Flow

### Current Flow (Callback-based)
1. Customer places order → Selects online payment
2. System initializes Paystack payment
3. Customer redirected to Paystack payment page
4. Customer completes payment
5. Paystack redirects to `/payment/callback?reference=xxx`
6. Callback page verifies payment
7. Order status updated → Receipt sent

### Enhanced Flow (With Webhook)
1. Customer places order → Selects online payment
2. System initializes Paystack payment
3. Customer redirected to Paystack payment page
4. Customer completes payment
5. **Paystack sends webhook notification** (server-to-server)
6. **Webhook handler processes payment** (more reliable)
7. Paystack redirects to `/payment/callback?reference=xxx`
8. Callback page verifies payment (backup verification)
9. Order status updated → Receipt sent

The webhook provides redundancy and ensures payment is processed even if the customer closes their browser before the callback completes.
