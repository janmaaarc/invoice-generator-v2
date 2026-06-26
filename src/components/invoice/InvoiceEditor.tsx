import { useState } from 'react'
import { Download, Share2, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import { Button, Input, Badge } from '../ui'
import {
  CURRENCIES, DUE_DATE_PRESETS, calculateDueDate,
  formatCurrency, getInvoiceTotal,
} from '../../types'
import type { InvoiceData, AppData, InvoiceStatus, LineItem } from '../../types'

interface InvoiceEditorProps {
  invoice: InvoiceData
  data: AppData
  onChange: (invoice: InvoiceData) => void
  onSave: () => void
  onDownloadPdf: () => void
  onShare: (type: 'email' | 'whatsapp') => void
  onStatusChange: (status: InvoiceStatus) => void
  view: 'editor' | 'preview'
  onViewChange: (v: 'editor' | 'preview') => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">
      {children}
    </p>
  )
}

export function InvoiceEditor({
  invoice, data, onChange, onSave, onDownloadPdf, onShare, onStatusChange, view, onViewChange,
}: InvoiceEditorProps) {
  const [shareOpen, setShareOpen] = useState(false)

  function set<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) {
    onChange({ ...invoice, [key]: value, updatedAt: new Date().toISOString() })
  }

  function setLineItem(id: string, field: keyof LineItem, value: string | number) {
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  function addLineItem() {
    onChange({
      ...invoice,
      lineItems: [...invoice.lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }],
      updatedAt: new Date().toISOString(),
    })
  }

  function removeLineItem(id: string) {
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.filter(item => item.id !== id),
      updatedAt: new Date().toISOString(),
    })
  }

  const total = getInvoiceTotal(invoice)
  const selectCls = 'px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]'
  const inputCls = 'px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]'

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted)]">{invoice.invoiceNumber}</span>
          <select
            value={invoice.status}
            onChange={e => onStatusChange(e.target.value as InvoiceStatus)}
            className="text-xs bg-transparent border-none outline-none text-[var(--muted)] cursor-pointer"
          >
            {(['draft', 'sent', 'paid'] as InvoiceStatus[]).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <Badge status={invoice.status} />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-[var(--surface)] rounded-md p-0.5">
          {(['editor', 'preview'] as const).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                view === v
                  ? 'bg-[var(--bg)] text-[var(--text)] font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onSave}>Save</Button>
          <Button variant="ghost" size="sm" onClick={onDownloadPdf}>
            <Download size={13} /> PDF
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShareOpen(o => !o)}>
              <Share2 size={13} /> Share <ChevronDown size={11} />
            </Button>
            {shareOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-md z-10 min-w-36 py-1">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                  onClick={() => { onShare('email'); setShareOpen(false) }}
                >
                  <Mail size={13} /> Email
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                  onClick={() => { onShare('whatsapp'); setShareOpen(false) }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      {view === 'preview' ? (
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
          <div>Preview coming in Task 6</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-2xl">

          {/* Dates + Currency */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Invoice Date"
              type="date"
              value={invoice.invoiceDate}
              onChange={e => set('invoiceDate', e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Due Date</label>
              <select
                value={invoice.dueDate}
                onChange={e => set('dueDate', calculateDueDate(e.target.value, invoice.invoiceDate))}
                className={selectCls}
              >
                {DUE_DATE_PRESETS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Currency</label>
              <select value={invoice.currency} onChange={e => set('currency', e.target.value)} className={selectCls}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* From */}
          <div>
            <SectionLabel>From</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={invoice.fromName} onChange={e => set('fromName', e.target.value)} placeholder="Your name or company" />
              <Input label="Email" type="email" value={invoice.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="you@example.com" />
              <div className="col-span-2">
                <Input label="Address" value={invoice.fromAddress} onChange={e => set('fromAddress', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <SectionLabel>Bill To</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Client Name</label>
                <input
                  className={inputCls}
                  value={invoice.toName}
                  onChange={e => {
                    const client = data.clients.find(c => c.name === e.target.value)
                    if (client) {
                      onChange({
                        ...invoice,
                        toName: client.name,
                        toEmail: client.email,
                        toAddress: client.address,
                        updatedAt: new Date().toISOString(),
                      })
                    } else {
                      set('toName', e.target.value)
                    }
                  }}
                  placeholder="Client or company"
                  list="saved-clients"
                />
                <datalist id="saved-clients">
                  {data.clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <Input label="Client Email" type="email" value={invoice.toEmail} onChange={e => set('toEmail', e.target.value)} placeholder="client@example.com" />
              <div className="col-span-2">
                <Input label="Client Address" value={invoice.toAddress} onChange={e => set('toAddress', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <SectionLabel>Line Items</SectionLabel>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_72px_96px_24px] gap-2 text-[10px] text-[var(--muted)] uppercase tracking-wide px-1">
                <span>Description</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span />
              </div>
              {invoice.lineItems.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_72px_96px_24px] gap-2 items-center">
                  <input
                    className={inputCls}
                    value={item.description}
                    onChange={e => setLineItem(item.id, 'description', e.target.value)}
                    placeholder="Service or product"
                    list="line-item-templates"
                  />
                  <datalist id="line-item-templates">
                    {data.lineItemTemplates.map(t => <option key={t.id} value={t.description} />)}
                  </datalist>
                  <input
                    type="number" min={0} step={1}
                    className={`${inputCls} text-right`}
                    value={item.quantity}
                    onChange={e => setLineItem(item.id, 'quantity', Number(e.target.value))}
                  />
                  <input
                    type="number" min={0} step={0.01}
                    className={`${inputCls} text-right`}
                    value={item.rate}
                    onChange={e => setLineItem(item.id, 'rate', Number(e.target.value))}
                  />
                  <button
                    onClick={() => removeLineItem(item.id)}
                    className="text-[var(--muted)] hover:text-[var(--text)] text-lg leading-none transition-colors"
                    aria-label="Remove"
                  >×</button>
                </div>
              ))}
              <button onClick={addLineItem} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-1">
                + Add item
              </button>
              <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                <div className="text-right">
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Total</p>
                  <p className="text-xl font-semibold">{formatCurrency(total, invoice.currency)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <SectionLabel>Payment</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Method" value={invoice.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} placeholder="PayPal, Bank Transfer…" />
              <Input label="Details" value={invoice.paymentDetails} onChange={e => set('paymentDetails', e.target.value)} placeholder="Account number, email…" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionLabel>Notes</SectionLabel>
            <textarea
              className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
              rows={3}
              value={invoice.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Payment terms, thank you note…"
            />
          </div>
        </div>
      )}
    </div>
  )
}
