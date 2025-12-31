import { NextResponse } from 'next/server'
import { getInvoiceById, updateInvoiceStatus } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

function formatInvoiceMessage(invoice: any, invoiceUrl: string): string {
  const subtotal = invoice.quantity * invoice.price_per_bottle
  
  let message = `📄 *INVOICE FROM UPWYNE*\n\n`
  message += `Invoice #: ${invoice.invoice_number}\n`
  message += `Date: ${new Date(invoice.created_at).toLocaleDateString('en-NG', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}\n\n`
  
  message += `*Customer:* ${invoice.customer_name}\n`
  if (invoice.address) {
    message += `*Address:* ${invoice.address}\n`
  }
  message += `\n`
  
  message += `━━━━━━━━━━━━━━━━━━━━\n`
  message += `*ORDER DETAILS*\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n`
  message += `Fresh Palm Wine (1L) × ${invoice.quantity}\n`
  message += `Price per bottle: ₦${invoice.price_per_bottle.toLocaleString()}\n`
  message += `Subtotal: ₦${subtotal.toLocaleString()}\n`
  
  if (invoice.delivery_fee > 0) {
    message += `Delivery Fee: ₦${invoice.delivery_fee.toLocaleString()}\n`
  }
  
  if (invoice.discount > 0) {
    message += `Discount: -₦${invoice.discount.toLocaleString()}\n`
  }
  
  message += `━━━━━━━━━━━━━━━━━━━━\n`
  message += `*TOTAL: ₦${invoice.total_amount.toLocaleString()}*\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`
  
  if (invoice.due_date) {
    message += `📅 Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-NG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n\n`
  }
  
  if (invoice.notes) {
    message += `📝 Notes: ${invoice.notes}\n\n`
  }
  
  message += `🔗 View full invoice: ${invoiceUrl}\n\n`
  message += `Thank you for choosing Upwyne! 🌴🍷\n`
  message += `For questions, reply to this message.`
  
  return message
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoiceId = parseInt(id)
    const invoice = getInvoiceById(invoiceId)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get the app URL from environment or request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invoiceUrl = `${appUrl}/view-invoice/${invoice.invoice_number}`
    
    // Format and send the invoice via WhatsApp
    const message = formatInvoiceMessage(invoice, invoiceUrl)
    
    try {
      await sendWhatsAppMessage(invoice.phone, message)
      
      // Update invoice status to 'sent'
      updateInvoiceStatus(invoiceId, 'sent')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice sent successfully via WhatsApp' 
      })
    } catch (whatsappError) {
      console.error('WhatsApp send error:', whatsappError)
      
      // Still mark as sent if WhatsApp fails but return a warning
      updateInvoiceStatus(invoiceId, 'sent')
      
      return NextResponse.json({ 
        success: true, 
        warning: 'Invoice marked as sent, but WhatsApp notification may not have been delivered. Please share the invoice link manually.',
        invoice_url: invoiceUrl
      })
    }
  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
