import { forwardRef } from 'react'
import { formatCurrency, getInvoiceTotal, CURRENCIES } from '../../types'
import type { InvoiceData, AppSettings } from '../../types'

interface InvoicePreviewProps {
  invoice: InvoiceData
  settings: AppSettings
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, settings }, ref) => {
    const total = getInvoiceTotal(invoice)
    const currency = CURRENCIES.find(c => c.code === invoice.currency) ?? CURRENCIES[0]

    return (
      <div
        ref={ref}
        style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#09090b', background: '#ffffff' }}
        className="w-[794px] min-h-[1123px] p-16 mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-10 mb-3 object-contain" />}
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>INVOICE</h1>
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            <p style={{ color: '#71717a', margin: 0 }}>Date</p>
            <p style={{ fontWeight: 500, margin: '2px 0 8px' }}>{invoice.invoiceDate}</p>
            <p style={{ color: '#71717a', margin: 0 }}>Due</p>
            <p style={{ fontWeight: 500, margin: '2px 0 0' }}>{invoice.dueDate}</p>
          </div>
        </div>

        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
          {[
            { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
            { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
          ].map(({ label, name, email, address }) => (
            <div key={label}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>{label}</p>
              {name && <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{name}</p>}
              {email && <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e4e4e7' }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  paddingBottom: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#a1a1aa',
                  width: i === 0 ? 'auto' : i === 1 ? 60 : 90,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '10px 0' }}>{item.description}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: '#71717a' }}>{item.quantity}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: '#71717a' }}>{currency.symbol}{item.rate.toFixed(2)}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500 }}>{currency.symbol}{(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 48 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 4px' }}>Total</p>
            <p style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{formatCurrency(total, invoice.currency)}</p>
          </div>
        </div>

        {/* Payment */}
        {(invoice.paymentMethod || invoice.paymentDetails) && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>Payment</p>
            {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
            {invoice.paymentDetails && <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>Notes</p>
            <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    )
  }
)
InvoicePreview.displayName = 'InvoicePreview'
