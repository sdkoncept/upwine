// Paystack payment integration

export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    amount: number
    reference: string
    status: string
    customer: {
      email: string
      name: string
    }
    paid_at: string
  }
}

/**
 * Initialize Paystack payment
 */
export async function initializePaystackPayment(params: {
  email: string
  amount: number // in kobo (multiply naira by 100)
  reference: string
  callback_url: string
  metadata?: Record<string, any>
}): Promise<PaystackInitializeResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  
  if (!secretKey) {
    throw new Error('Paystack secret key not configured')
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata || {},
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to initialize payment')
  }

  return response.json()
}

/**
 * Verify Paystack payment
 */
export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  
  if (!secretKey) {
    throw new Error('Paystack secret key not configured')
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to verify payment')
  }

  return response.json()
}

/**
 * Generate payment reference
 */
export function generatePaymentReference(orderNumber: string): string {
  return `UPW-${orderNumber}-${Date.now()}`
}

