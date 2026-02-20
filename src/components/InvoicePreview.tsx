import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CURRENCIES } from '../types';
import type { InvoiceData } from '../types';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  logo?: string;
  accentColor?: string;
  showQrCode?: boolean;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  function InvoicePreview({ invoice, logo, accentColor = '#171717', showQrCode = false }, ref) {
    const currency = CURRENCIES.find((c) => c.code === invoice.currency) || CURRENCIES[0];
    const formatCurrency = (amount: number) =>
      `${currency.code} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === 'Upon receipt') return dateStr;
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };

    const statusColors = {
      draft: { bg: '#f5f5f5', text: '#737373' },
      sent: { bg: '#dbeafe', text: '#1d4ed8' },
      paid: { bg: '#dcfce7', text: '#15803d' },
    };

    const status = statusColors[invoice.status] || statusColors.draft;

    const isPaymentUrl = (str: string): boolean => {
      if (!str) return false;
      const trimmed = str.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
      return /^(paypal\.me|wise\.com|venmo\.com|cash\.app)\//i.test(trimmed);
    };

    const getFullUrl = (str: string): string => {
      const trimmed = str.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      return `https://${trimmed}`;
    };

    const paymentUrl = invoice.paymentDetails && isPaymentUrl(invoice.paymentDetails)
      ? getFullUrl(invoice.paymentDetails)
      : null;
    const shouldShowQr = (showQrCode || paymentUrl) && invoice.paymentDetails;

    return (
      <div
        ref={ref}
        id="invoice-preview"
        className="bg-white p-10 max-w-[800px] mx-auto"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.6,
          color: '#171717',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-10 pb-6" style={{ borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: accentColor }}>
          <div className="flex items-center gap-4">
            {logo && (
              <img
                src={logo}
                alt="Logo"
                style={{ maxWidth: 80, maxHeight: 80, objectFit: 'contain' }}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: accentColor }}>INVOICE</h1>
              <div
                className="text-xs font-medium px-2 py-0.5 rounded mt-1 inline-block uppercase"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                {invoice.status}
              </div>
            </div>
          </div>
          <div className="text-right text-sm" style={{ color: '#525252' }}>
            <div className="text-base font-semibold" style={{ color: '#171717' }}>
              {invoice.invoiceNumber}
            </div>
            <div className="mt-1">Date: {formatDate(invoice.invoiceDate)}</div>
            <div>Due: {invoice.dueDate}</div>
            {invoice.status === 'paid' && invoice.paidDate && (
              <div className="mt-1 font-medium" style={{ color: '#15803d' }}>
                Paid: {formatDate(invoice.paidDate)}
              </div>
            )}
          </div>
        </div>

        {/* Parties */}
        <div className="flex justify-between mb-10">
          <div style={{ width: '45%' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#737373' }}>
              From
            </div>
            <div className="text-base font-semibold" style={{ color: '#171717' }}>{invoice.fromName || '—'}</div>
            <div className="text-sm" style={{ color: '#525252' }}>
              {invoice.fromAddress && <div>{invoice.fromAddress}</div>}
              {invoice.fromEmail && <div>{invoice.fromEmail}</div>}
            </div>
          </div>
          <div style={{ width: '45%' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#737373' }}>
              Bill To
            </div>
            <div className="text-base font-semibold" style={{ color: '#171717' }}>{invoice.toName || '—'}</div>
            <div className="text-sm" style={{ color: '#525252' }}>
              {invoice.toAddress && <div>{invoice.toAddress}</div>}
              {invoice.toEmail && <div>{invoice.toEmail}</div>}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e5e5e5' }}>
                Description
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e5e5e5', width: 60 }}>
                Qty
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e5e5e5', width: 100 }}>
                Rate
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e5e5e5', width: 120 }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                  {item.description || '—'}
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                  {formatCurrency(item.rate)}
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 14, textAlign: 'right', fontWeight: 500 }}>
                  {formatCurrency(item.quantity * item.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <div style={{ width: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
              <span style={{ color: '#525252' }}>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 8, borderTop: `2px solid ${accentColor}`, fontSize: 18, fontWeight: 700 }}>
              <span>Total Due</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {(invoice.paymentMethod || invoice.paymentDetails) && (
          <div style={{ backgroundColor: '#fafafa', padding: 24, borderRadius: 8, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#171717' }}>Payment Method</div>
              <div style={{ fontSize: 14, color: '#525252' }}>
                {invoice.paymentMethod && (
                  <div style={{ fontWeight: 500, color: '#171717' }}>{invoice.paymentMethod}</div>
                )}
                {invoice.paymentDetails && (
                  paymentUrl ? (
                    <div>
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: accentColor, textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {invoice.paymentDetails}
                      </a>
                    </div>
                  ) : (
                    <div>{invoice.paymentDetails}</div>
                  )
                )}
              </div>
            </div>
            {invoice.paymentQrImage ? (
              <div style={{ marginLeft: 24, flexShrink: 0 }}>
                <img
                  src={invoice.paymentQrImage}
                  alt="Payment QR"
                  style={{ width: 80, height: 80, objectFit: 'contain' }}
                />
              </div>
            ) : shouldShowQr ? (
              <div style={{ marginLeft: 24, flexShrink: 0 }}>
                <QRCodeSVG
                  value={paymentUrl || invoice.paymentDetails}
                  size={80}
                  level="M"
                  bgColor="#fafafa"
                  fgColor="#171717"
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ fontSize: 13, color: '#737373', fontStyle: 'italic', borderTop: '1px solid #e5e5e5', paddingTop: 20, whiteSpace: 'pre-line' }}>
            {invoice.notes}
          </div>
        )}
      </div>
    );
  }
);
