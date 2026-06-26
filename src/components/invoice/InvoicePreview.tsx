import { forwardRef } from 'react'
import { formatCurrency, getInvoiceSubtotal, CURRENCIES } from '../../types'
import type { InvoiceData, AppSettings, BankDetails } from '../../types'

function BankBlock({ method, details }: { method: string; details: BankDetails }) {
  const rows: [string, string][] = [
    ['Bank', details.bankName],
    ['Account Name', details.accountName],
    ['Account No.', details.accountNumber],
    ['SWIFT / BIC', details.swiftCode],
    ['Address', details.address],
  ].filter(([, v]) => v) as [string, string][]
  return (
    <>
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#09090b' }}>{method || 'Bank Transfer'}</p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontSize: 10, color: '#a1a1aa', paddingRight: 14, paddingBottom: 3, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
              <td style={{ fontSize: 11, fontWeight: 500, color: '#09090b', paddingBottom: 3, verticalAlign: 'top' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function TotalsBlock({ invoice, currency, accentColor, totalSize = 24, totalLabel = 'Total', totalBoxStyle }: {
  invoice: InvoiceData
  currency: { symbol: string }
  accentColor?: string
  totalSize?: number
  totalLabel?: string
  totalBoxStyle?: React.CSSProperties
}) {
  const subtotal = getInvoiceSubtotal(invoice)
  const discount = subtotal * ((invoice.discountPercent || 0) / 100)
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * ((invoice.taxRate || 0) / 100)
  const total = afterDiscount + tax
  const hasBreakdown = !!(invoice.discountPercent || invoice.taxRate)
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }

  return (
    <div style={{ textAlign: 'right' }}>
      {hasBreakdown && (
        <div style={{ marginBottom: 8 }}>
          <div style={rowStyle}>
            <span style={{ color: '#71717a', marginRight: 32 }}>Subtotal</span>
            <span>{currency.symbol}{subtotal.toFixed(2)}</span>
          </div>
          {!!invoice.discountPercent && (
            <div style={rowStyle}>
              <span style={{ color: '#71717a', marginRight: 32 }}>Discount ({invoice.discountPercent}%)</span>
              <span style={{ color: '#71717a' }}>−{currency.symbol}{discount.toFixed(2)}</span>
            </div>
          )}
          {!!invoice.taxRate && (
            <div style={rowStyle}>
              <span style={{ color: '#71717a', marginRight: 32 }}>Tax ({invoice.taxRate}%)</span>
              <span>{currency.symbol}{tax.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      <div style={totalBoxStyle}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: totalBoxStyle ? 'rgba(255,255,255,0.7)' : '#a1a1aa', margin: '0 0 4px' }}>{totalLabel}</p>
        <p style={{ fontSize: totalSize, fontWeight: 700, margin: 0, color: totalBoxStyle ? '#fff' : (accentColor || '#09090b') }}>{formatCurrency(total, invoice.currency)}</p>
      </div>
    </div>
  )
}

interface InvoicePreviewProps {
  invoice: InvoiceData
  settings: AppSettings
}

function MinimalPreview({ invoice, settings, currency }: {
  invoice: InvoiceData
  settings: AppSettings
  currency: { symbol: string }
}) {
  const accent = settings.accentColor || '#171717'
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#09090b', background: '#ffffff' }}
      className="w-[794px] min-h-[1123px] p-16 mx-auto">

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
        {[
          { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
          { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
        ].map(({ label, name, email, address }) => (
          <div key={label}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, margin: '0 0 8px' }}>{label}</p>
            {name && <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{name}</p>}
            {email && <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
            {address && <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{address}</p>}
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${accent}` }}>
            {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
              <th key={h} style={{
                textAlign: i === 0 ? 'left' : 'right',
                paddingBottom: 8,
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: accent,
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 48 }}>
        <TotalsBlock invoice={invoice} currency={currency} accentColor={accent} />
      </div>

      {(invoice.paymentMethod || invoice.paymentDetails || invoice.bankDetails) && (
        <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 24, marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, margin: '0 0 10px' }}>Payment</p>
          {invoice.bankDetails ? (
            <BankBlock method={invoice.paymentMethod} details={invoice.bankDetails} />
          ) : (
            <>
              {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
              {invoice.paymentDetails && <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
            </>
          )}
        </div>
      )}

      {invoice.notes && (
        <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, margin: '0 0 8px' }}>Notes</p>
          <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}

function ClassicPreview({ invoice, settings, currency }: {
  invoice: InvoiceData
  settings: AppSettings
  currency: { symbol: string }
}) {
  const accent = settings.accentColor || '#171717'
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#09090b', background: '#ffffff' }}
      className="w-[794px] min-h-[1123px] mx-auto">

      {/* Colored header bar */}
      <div style={{ background: accent, padding: '40px 64px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {settings.logo
            ? <img src={settings.logo} alt="Logo" style={{ height: 40, marginBottom: 16, objectFit: 'contain' }} />
            : null}
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>INVOICE</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</p>
        </div>
        <div style={{ textAlign: 'right', color: '#fff' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>Date</p>
          <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 12px' }}>{invoice.invoiceDate}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>Due</p>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{invoice.dueDate}</p>
        </div>
      </div>

      <div style={{ padding: '48px 64px' }}>
        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
          {[
            { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
            { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
          ].map(({ label, name, email, address }) => (
            <div key={label}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a1a1aa', margin: '0 0 8px' }}>{label}</p>
              {name && <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{name}</p>}
              {email && <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f4f4f5' }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '10px 12px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#71717a',
                  width: i === 0 ? 'auto' : i === 1 ? 60 : 90,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 12px' }}>{item.description}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#71717a' }}>{item.quantity}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#71717a' }}>{currency.symbol}{item.rate.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>{currency.symbol}{(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 48 }}>
          <TotalsBlock
            invoice={invoice}
            currency={currency}
            totalLabel="Total Due"
            totalBoxStyle={{ background: accent, padding: '16px 24px', minWidth: 200, borderRadius: 4 }}
          />
        </div>

        {(invoice.paymentMethod || invoice.paymentDetails || invoice.bankDetails) && (
          <div style={{ borderTop: '2px solid #f4f4f5', paddingTop: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 10px' }}>Payment</p>
            {invoice.bankDetails ? (
              <BankBlock method={invoice.paymentMethod} details={invoice.bankDetails} />
            ) : (
              <>
                {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
                {invoice.paymentDetails && <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
              </>
            )}
          </div>
        )}

        {invoice.notes && (
          <div style={{ borderTop: '2px solid #f4f4f5', paddingTop: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>Notes</p>
            <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ModernPreview({ invoice, settings, currency }: {
  invoice: InvoiceData
  settings: AppSettings
  currency: { symbol: string }
}) {
  const accent = settings.accentColor || '#171717'
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#09090b', background: '#ffffff', display: 'flex' }}
      className="w-[794px] min-h-[1123px] mx-auto">

      {/* Left accent strip */}
      <div style={{ width: 6, background: accent, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '56px 56px 56px 50px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 56 }}>
          <div>
            {settings.logo && <img src={settings.logo} alt="Logo" style={{ height: 36, marginBottom: 20, objectFit: 'contain' }} />}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: accent, margin: 0 }}>INVOICE</h1>
              <span style={{ fontSize: 13, color: '#a1a1aa', fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', background: '#f4f4f5', borderRadius: 8, padding: '12px 16px' }}>
              <p style={{ fontSize: 10, color: '#a1a1aa', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issued</p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px' }}>{invoice.invoiceDate}</p>
              <p style={{ fontSize: 10, color: '#a1a1aa', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due</p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: accent }}>{invoice.dueDate}</p>
            </div>
          </div>
        </div>

        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48 }}>
          {[
            { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
            { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
          ].map(({ label, name, email, address }) => (
            <div key={label}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: accent, margin: '0 0 10px' }}>{label}</p>
              {name && <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>{name}</p>}
              {email && <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, fontSize: 13 }}>
          <thead>
            <tr>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '8px 0 8px',
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#a1a1aa',
                  borderBottom: `1px solid #e4e4e7`,
                  width: i === 0 ? 'auto' : i === 1 ? 60 : 90,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '12px 0' }}>{item.description}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', color: '#71717a' }}>{item.quantity}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', color: '#71717a' }}>{currency.symbol}{item.rate.toFixed(2)}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>{currency.symbol}{(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '32px 0 48px' }}>
          <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 16 }}>
            <TotalsBlock invoice={invoice} currency={currency} totalSize={28} accentColor="#09090b" />
          </div>
        </div>

        {(invoice.paymentMethod || invoice.paymentDetails || invoice.bankDetails) && (
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: accent, margin: '0 0 10px' }}>Payment</p>
            {invoice.bankDetails ? (
              <BankBlock method={invoice.paymentMethod} details={invoice.bankDetails} />
            ) : (
              <>
                {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
                {invoice.paymentDetails && <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
              </>
            )}
          </div>
        )}

        {invoice.notes && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 20 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a1a1aa', margin: '0 0 8px' }}>Notes</p>
            <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, settings }, ref) => {
    const currency = CURRENCIES.find(c => c.code === invoice.currency) ?? CURRENCIES[0]
    const props = { invoice, settings, currency }

    return (
      <div ref={ref}>
        {settings.template === 'classic' && <ClassicPreview {...props} />}
        {settings.template === 'modern' && <ModernPreview {...props} />}
        {(settings.template === 'minimal' || !settings.template) && <MinimalPreview {...props} />}
      </div>
    )
  }
)
InvoicePreview.displayName = 'InvoicePreview'
