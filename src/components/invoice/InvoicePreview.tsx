import { forwardRef } from 'react'
import { formatCurrency, getInvoiceSubtotal, CURRENCIES, hasBankDetails } from '../../types'
import type { InvoiceData, AppSettings, BankDetails } from '../../types'

function BankBlock({ method, details, labelColor = '#a1a1aa', valueColor = '#09090b' }: {
  method: string
  details: BankDetails
  labelColor?: string
  valueColor?: string
}) {
  const rows: [string, string][] = [
    ['Bank', details.bankName],
    ['Account Name', details.accountName],
    ['Account No.', details.accountNumber],
    ['SWIFT / BIC', details.swiftCode],
    ['Address', details.address],
  ].filter(([, v]) => v) as [string, string][]
  return (
    <>
      {method && <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px', color: valueColor }}>{method}</p>}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontSize: 10, color: labelColor, paddingRight: 16, paddingBottom: 3, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
              <td style={{ fontSize: 11, fontWeight: 500, color: valueColor, paddingBottom: 3, verticalAlign: 'top' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function TotalsBlock({ invoice, accentColor, totalSize = 24, totalColor, labelColor = '#a1a1aa', rowColor = '#71717a' }: {
  invoice: InvoiceData
  accentColor?: string
  totalSize?: number
  totalColor?: string
  labelColor?: string
  rowColor?: string
}) {
  const subtotal = getInvoiceSubtotal(invoice)
  const discount = subtotal * ((invoice.discountPercent || 0) / 100)
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * ((invoice.taxRate || 0) / 100)
  const total = afterDiscount + tax
  const hasBreakdown = !!(invoice.discountPercent || invoice.taxRate)
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 32, fontSize: 12, marginBottom: 4, color: rowColor }

  return (
    <div style={{ textAlign: 'right' }}>
      {hasBreakdown && (
        <div style={{ marginBottom: 12 }}>
          <div style={rowStyle}><span>Subtotal</span><span>{formatCurrency(subtotal, invoice.currency)}</span></div>
          {!!invoice.discountPercent && (
            <div style={rowStyle}><span>Discount ({invoice.discountPercent}%)</span><span>−{formatCurrency(discount, invoice.currency)}</span></div>
          )}
          {!!invoice.taxRate && (
            <div style={rowStyle}><span>Tax ({invoice.taxRate}%)</span><span>{formatCurrency(tax, invoice.currency)}</span></div>
          )}
        </div>
      )}
      <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: labelColor, margin: '0 0 3px' }}>Total Due</p>
      <p style={{ fontSize: totalSize, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: totalColor || accentColor || '#09090b' }}>
        {formatCurrency(total, invoice.currency)}
      </p>
    </div>
  )
}

// ─── MINIMAL ────────────────────────────────────────────────────────────────
// Direction: Pure whitespace and typography. No boxes, no fills.
// One thin rule to frame everything. Number as typographic hero.

function MinimalPreview({ invoice, settings }: {
  invoice: InvoiceData; settings: AppSettings; currency: { symbol: string }
}) {
  const accent = settings.accentColor || '#09090b'
  const hasPayment = !!(invoice.paymentMethod || invoice.paymentDetails || hasBankDetails(invoice.bankDetails))
  const showTwoCols = hasPayment && !!invoice.notes

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#09090b', background: '#fff', width: 794, minHeight: 1123 }}>
      <div style={{ padding: '72px 72px 64px' }}>

        {/* Top rule + INVOICE */}
        <div style={{ borderTop: `2px solid ${accent}`, paddingTop: 24, marginBottom: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {settings.logo && <img src={settings.logo} alt="" style={{ height: 32, marginBottom: 16, objectFit: 'contain' }} />}
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', margin: 0 }}>Invoice</p>
              <p style={{ fontSize: 42, fontWeight: 300, letterSpacing: '-0.04em', color: '#09090b', margin: '4px 0 0', lineHeight: 1 }}>{invoice.invoiceNumber}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <p style={{ color: '#a1a1aa', margin: 0, letterSpacing: '0.05em', fontSize: 9, textTransform: 'uppercase', fontWeight: 500 }}>Issued</p>
                <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{invoice.invoiceDate || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#a1a1aa', margin: 0, letterSpacing: '0.05em', fontSize: 9, textTransform: 'uppercase', fontWeight: 500 }}>Due</p>
                <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{invoice.dueDate || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 64 }}>
          {[
            { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
            { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
          ].map(({ label, name, email, address }) => (
            <div key={label}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a1a1aa', margin: '0 0 10px' }}>{label}</p>
              {name && <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{name}</p>}
              {email && <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e4e4e7' }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  paddingBottom: 10,
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#a1a1aa',
                  width: i === 0 ? 'auto' : i === 1 ? 56 : 88,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '12px 0', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, color: '#71717a' }}>{item.quantity}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, color: '#71717a' }}>{formatCurrency(item.rate, invoice.currency)}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 13, fontWeight: 500 }}>{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 64 }}>
          <TotalsBlock invoice={invoice} accentColor={accent} totalSize={28} />
        </div>

        {/* Payment + Notes */}
        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 32, display: 'grid', gridTemplateColumns: showTwoCols ? '1fr 1fr' : '1fr', gap: 40 }}>
          {hasPayment && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a1a1aa', margin: '0 0 10px' }}>Payment</p>
              {hasBankDetails(invoice.bankDetails) ? (
                <BankBlock method={invoice.paymentMethod} details={invoice.bankDetails!} />
              ) : (
                <>
                  {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
                  {invoice.paymentDetails && <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
                </>
              )}
            </div>
          )}
          {invoice.notes && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a1a1aa', margin: '0 0 10px' }}>Notes</p>
              <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{invoice.notes}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── CLASSIC ────────────────────────────────────────────────────────────────
// Direction: Established business. Full-bleed colored header. Bold structure.
// Alternating table rows. Total in accent box. Confident, authoritative.

function ClassicPreview({ invoice, settings }: {
  invoice: InvoiceData; settings: AppSettings; currency: { symbol: string }
}) {
  const accent = settings.accentColor || '#18181b'
  const hasPayment = !!(invoice.paymentMethod || invoice.paymentDetails || hasBankDetails(invoice.bankDetails))
  const showTwoCols = hasPayment && !!invoice.notes

  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#18181b', background: '#fff', width: 794, minHeight: 1123 }}>

      {/* Full-bleed header */}
      <div style={{ background: accent, padding: '44px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {settings.logo
              ? <img src={settings.logo} alt="" style={{ height: 44, marginBottom: 16, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              : <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>{invoice.fromName || 'Your Company'}</p>
            }
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, fontFamily: '"Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.02em' }}>INVOICE</p>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 2, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{invoice.invoiceNumber}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#fff' }}>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>Date</p>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>{invoice.invoiceDate || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>Due Date</p>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>{invoice.dueDate || '—'}</p>
            </div>
          </div>
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
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: accent, margin: '0 0 10px', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>{label}</p>
              {name && <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 3px', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>{name}</p>}
              {email && <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
          <thead>
            <tr style={{ background: accent }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '10px 14px',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#fff',
                  width: i === 0 ? 'auto' : i === 1 ? 56 : 88,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>{item.description}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 12, color: '#71717a', borderBottom: '1px solid #f0f0f0' }}>{item.quantity}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 12, color: '#71717a', borderBottom: '1px solid #f0f0f0' }}>{formatCurrency(item.rate, invoice.currency)}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '32px 0 48px' }}>
          <div style={{ background: accent, padding: '20px 28px', minWidth: 220 }}>
            <TotalsBlock
              invoice={invoice}
              totalSize={26}
              totalColor="#fff"
              labelColor="rgba(255,255,255,0.6)"
              rowColor="rgba(255,255,255,0.7)"
            />
          </div>
        </div>

        {/* Payment + Notes */}
        <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: 28, display: 'grid', gridTemplateColumns: showTwoCols ? '1fr 1fr' : '1fr', gap: 40, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
          {hasPayment && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: accent, margin: '0 0 10px' }}>Payment</p>
              {hasBankDetails(invoice.bankDetails) ? (
                <BankBlock method={invoice.paymentMethod} details={invoice.bankDetails!} />
              ) : (
                <>
                  {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
                  {invoice.paymentDetails && <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
                </>
              )}
            </div>
          )}
          {invoice.notes && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa', margin: '0 0 10px' }}>Notes</p>
              <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MODERN ─────────────────────────────────────────────────────────────────
// Direction: Editorial / startup. Asymmetric. Large display INVOICE.
// Tight grid. Geometric left strip. Clean sans. Date as floating chip.

function ModernPreview({ invoice, settings }: {
  invoice: InvoiceData; settings: AppSettings; currency: { symbol: string }
}) {
  const accent = settings.accentColor || '#09090b'
  const hasPayment = !!(invoice.paymentMethod || invoice.paymentDetails || hasBankDetails(invoice.bankDetails))
  const showTwoCols = hasPayment && !!invoice.notes

  return (
    <div style={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', color: '#09090b', background: '#fff', display: 'flex', width: 794, minHeight: 1123 }}>

      {/* Left accent bar */}
      <div style={{ width: 5, background: accent, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '60px 60px 60px 52px' }}>

        {/* Hero header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 60 }}>
          <div>
            {settings.logo && (
              <img src={settings.logo} alt="" style={{ height: 32, marginBottom: 20, objectFit: 'contain' }} />
            )}
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#a1a1aa', margin: '0 0 6px' }}>Invoice</p>
            <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: '#09090b', margin: 0, lineHeight: 1 }}>{invoice.invoiceNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', border: '1px solid #e4e4e7', padding: '14px 18px', borderRadius: 8 }}>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: '#a1a1aa', margin: '0 0 3px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Issued</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{invoice.invoiceDate || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 600, color: '#a1a1aa', margin: '0 0 3px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Due</p>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: accent }}>{invoice.dueDate || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* From / To — two columns, distinct treatment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 52 }}>
          {[
            { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
            { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
          ].map(({ label, name, email, address }, i) => (
            <div key={label} style={i === 1 ? { paddingLeft: 24, borderLeft: '1px solid #e4e4e7' } : {}}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: i === 0 ? '#c4c4c4' : accent, margin: '0 0 10px' }}>{label}</p>
              {name && <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{name}</p>}
              {email && <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '0 0 10px',
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#a1a1aa',
                  borderBottom: `2px solid ${accent}`,
                  width: i === 0 ? 'auto' : i === 1 ? 56 : 88,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map(item => (
              <tr key={item.id}>
                <td style={{ padding: '13px 0', fontSize: 13, borderBottom: '1px solid #f4f4f5' }}>{item.description}</td>
                <td style={{ padding: '13px 0', textAlign: 'right', fontSize: 12, color: '#71717a', borderBottom: '1px solid #f4f4f5' }}>{item.quantity}</td>
                <td style={{ padding: '13px 0', textAlign: 'right', fontSize: 12, color: '#71717a', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(item.rate, invoice.currency)}</td>
                <td style={{ padding: '13px 0', textAlign: 'right', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total — left accent border */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '32px 0 52px' }}>
          <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 20 }}>
            <TotalsBlock invoice={invoice} totalSize={30} accentColor={accent} />
          </div>
        </div>

        {/* Payment + Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: showTwoCols ? '1fr 1fr' : '1fr', gap: 32 }}>
          {hasPayment && (
            <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '16px 20px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: accent, margin: '0 0 10px' }}>Payment</p>
              {hasBankDetails(invoice.bankDetails) ? (
                <BankBlock method={invoice.paymentMethod} details={invoice.bankDetails!} />
              ) : (
                <>
                  {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
                  {invoice.paymentDetails && <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
                </>
              )}
            </div>
          )}
          {invoice.notes && (
            <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '16px 20px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa', margin: '0 0 10px' }}>Notes</p>
              <p style={{ fontSize: 12, color: '#71717a', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{invoice.notes}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

interface InvoicePreviewProps {
  invoice: InvoiceData
  settings: AppSettings
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
