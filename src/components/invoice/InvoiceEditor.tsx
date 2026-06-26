import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Share2, Mail, MessageCircle, ChevronDown, ChevronLeft, ListPlus, Trash2, Users } from 'lucide-react'
import { Input, DatePicker } from '../ui'
import {
  CURRENCIES,
  formatCurrency, getInvoiceTotal, getInvoiceSubtotal, getInvoiceBalance,
} from '../../types'
import type { InvoiceData, AppData, InvoiceStatus, LineItem } from '../../types'
import { InvoicePreview } from './InvoicePreview'

interface InvoiceEditorProps {
  invoice: InvoiceData
  data: AppData
  onChange: (invoice: InvoiceData) => void
  onSave: () => void
  onDownloadPdf: () => void
  onShare: (type: 'email' | 'whatsapp') => void
  onStatusChange: (status: InvoiceStatus) => void
  onDuplicate: () => void
  onBack?: () => void
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

function AddPaymentForm({ onAdd }: { onAdd: (amount: number, note: string, date: string) => void }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <div className="flex gap-2 mt-2 items-end flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Amount</label>
        <input
          type="number" min={0} step={0.01}
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="px-2 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-28"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-32">
        <label className="text-xs text-[var(--muted)]">Note</label>
        <input
          type="text"
          placeholder="Bank transfer, etc."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="px-2 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-2 py-1.5 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-36"
        />
      </div>
      <button
        onClick={() => {
          const amt = parseFloat(amount)
          if (!amt || amt <= 0) return
          onAdd(amt, note, date)
          setAmount('')
          setNote('')
        }}
        className="px-3 py-1.5 text-sm bg-[var(--text)] text-[var(--bg)] rounded-md hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        + Add
      </button>
    </div>
  )
}

export function InvoiceEditor({
  invoice, data, onChange, onSave, onDownloadPdf, onShare, onStatusChange,
  onBack, view, onViewChange,
}: InvoiceEditorProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)
  const mountedRef = useRef(true)
  const [previewScale, setPreviewScale] = useState(0.75)

  useEffect(() => () => { mountedRef.current = false }, [])

  const previewContainerRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      if (!mountedRef.current) return
      const available = entry.contentRect.width - 32
      setPreviewScale(Math.min(0.75, available / 794))
    })
    obs.observe(el)
    observerRef.current = obs
  }, [])

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
  const subtotal = getInvoiceSubtotal(invoice)
  const selectCls = 'px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]'
  const inputCls = 'px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]'

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3 px-3 md:px-6 py-2.5 md:py-3 border-b border-[var(--border)]">
        {/* Left: back + invoice identity */}
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          {onBack && (
            <button onClick={onBack} className="md:hidden flex-shrink-0 p-1 -ml-1 text-[var(--muted)] hover:text-[var(--text)]">
              <ChevronLeft size={18} />
            </button>
          )}
          <input
            value={invoice.invoiceNumber}
            onChange={e => set('invoiceNumber', e.target.value)}
            className="text-xs font-mono text-[var(--muted)] bg-transparent border-none outline-none shrink-0 min-w-0 w-auto hover:text-[var(--text)] focus:text-[var(--text)] transition-colors"
            style={{ width: `${Math.max(invoice.invoiceNumber.length, 8)}ch` }}
          />
          <div className="relative shrink-0 flex items-center">
            <select
              value={invoice.status}
              onChange={e => onStatusChange(e.target.value as InvoiceStatus)}
              className="appearance-none text-xs font-medium pl-2 pr-5 py-0.5 rounded cursor-pointer focus:outline-none border-none leading-none"
              style={{
                color: `var(--badge-${invoice.status}-text)`,
                backgroundColor: `var(--badge-${invoice.status}-bg)`,
              }}
            >
              {(['draft', 'sent', 'paid'] as InvoiceStatus[]).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: `var(--badge-${invoice.status}-text)` }} />
          </div>
        </div>

        {/* Center: view toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-0.5 bg-[var(--surface)] rounded-md p-0.5">
            {(['editor', 'preview'] as const).map(v => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                  view === v
                    ? 'bg-[var(--bg)] text-[var(--text)] font-medium shadow-[0_1px_2px_0_rgb(0,0,0,0.05)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 justify-end">
          <button onClick={onSave} title="Save" className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
          <button onClick={onDownloadPdf} title="Download PDF" className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
            <Download size={13} />
          </button>
          <div className="relative">
            <button onClick={() => setShareOpen(o => !o)} title="Share" className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
              <Share2 size={13} />
            </button>
            {shareOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-md z-10 animate-dropdown min-w-36 py-1 shadow-[0_4px_12px_0_rgb(0,0,0,0.08)]">
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
        <div ref={previewContainerRef} className="flex-1 overflow-auto bg-[var(--surface)] py-8">
          <div style={{ width: Math.round(794 * previewScale), minHeight: Math.round(1123 * previewScale), margin: '0 auto' }}>
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
              <InvoicePreview invoice={invoice} settings={data.settings} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto"><div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-8">

          {/* Dates + Currency */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DatePicker
              label="Invoice Date"
              value={invoice.invoiceDate}
              onChange={v => set('invoiceDate', v)}
            />
            <DatePicker
              label="Due Date"
              value={invoice.dueDate === 'Upon receipt' ? '' : invoice.dueDate}
              onChange={v => set('dueDate', v)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)]">Currency</label>
              <select value={invoice.currency} onChange={e => set('currency', e.target.value)} className={selectCls}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* From */}
          <div>
            <SectionLabel>From</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Name" value={invoice.fromName} onChange={e => set('fromName', e.target.value)} placeholder="Your name or company" />
              <Input label="Email" type="email" value={invoice.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="you@example.com" />
              <div className="md:col-span-2">
                <Input label="Address" value={invoice.fromAddress} onChange={e => set('fromAddress', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Bill To</p>
              {data.clients.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setClientPickerOpen(o => !o)}
                    className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                  >
                    <Users size={12} /> Pick client
                  </button>
                  {clientPickerOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-md z-10 animate-dropdown min-w-48 py-1 shadow-[0_4px_12px_0_rgb(0,0,0,0.08)]">
                      {data.clients.map(c => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                          onClick={() => {
                            onChange({ ...invoice, toName: c.name, toEmail: c.email, toAddress: c.address, updatedAt: new Date().toISOString() })
                            setClientPickerOpen(false)
                          }}
                        >
                          <p className="font-medium">{c.name}</p>
                          {c.email && <p className="text-xs text-[var(--muted)]">{c.email}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Client Name</label>
                <input
                  className={inputCls}
                  value={invoice.toName}
                  onChange={e => set('toName', e.target.value)}
                  placeholder="Client or company"
                />
              </div>
              <Input label="Client Email" type="email" value={invoice.toEmail} onChange={e => set('toEmail', e.target.value)} placeholder="client@example.com" />
              <div className="md:col-span-2">
                <Input label="Client Address" value={invoice.toAddress} onChange={e => set('toAddress', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Line Items</p>
              {data.lineItemTemplates.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setTemplatePickerOpen(o => !o)}
                    className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                  >
                    <ListPlus size={12} /> Add from templates
                  </button>
                  {templatePickerOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-md z-10 animate-dropdown min-w-52 py-1 shadow-[0_4px_12px_0_rgb(0,0,0,0.08)]">
                      {data.lineItemTemplates.map(t => (
                        <button
                          key={t.id}
                          className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                          onClick={() => {
                            const blankIdx = invoice.lineItems.findIndex(i => !i.description.trim())
                            let nextItems: LineItem[]
                            if (blankIdx !== -1) {
                              nextItems = invoice.lineItems.map((i, idx) =>
                                idx === blankIdx ? { ...i, description: t.description, rate: t.rate } : i
                              )
                            } else {
                              nextItems = [...invoice.lineItems, { id: crypto.randomUUID(), description: t.description, quantity: 1, rate: t.rate }]
                            }
                            onChange({ ...invoice, lineItems: nextItems, updatedAt: new Date().toISOString() })
                            setTemplatePickerOpen(false)
                          }}
                        >
                          <p className="font-medium">{t.description}</p>
                          {t.rate > 0 && <p className="text-xs text-[var(--muted)]">${t.rate.toFixed(2)} / unit</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--muted)] px-1">
                <span className="flex-1">Description</span>
                <span className="w-20 text-right">Qty</span>
                <span className="w-24 text-right">Rate</span>
                <span className="w-5" />
              </div>
              <datalist id="line-item-templates">
                {data.lineItemTemplates.map(t => <option key={t.id} value={t.description} />)}
              </datalist>
              {invoice.lineItems.map(item => (
                <div key={item.id} className="group flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    className={`${inputCls} flex-1 min-w-0 w-full sm:w-auto`}
                    value={item.description}
                    onChange={e => setLineItem(item.id, 'description', e.target.value)}
                    placeholder="Service or product"
                    list="line-item-templates"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number" min={0} step={1}
                      className={`${inputCls} flex-1 sm:w-20 text-right tabular-nums`}
                      value={item.quantity || ''}
                      placeholder="Qty"
                      onChange={e => setLineItem(item.id, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    <input
                      type="number" min={0} step={0.01}
                      className={`${inputCls} flex-1 sm:w-24 text-right tabular-nums`}
                      value={item.rate || ''}
                      placeholder="Rate"
                      onChange={e => setLineItem(item.id, 'rate', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    <button
                      onClick={() => removeLineItem(item.id)}
                      className="flex-shrink-0 flex items-center justify-center p-2 -m-1 text-[var(--muted)] hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addLineItem} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-1 mt-1">
                + Add item
              </button>

              {/* Totals area */}
              <div className="pt-4 border-t border-[var(--border)] mt-2 space-y-3">
                <div className="flex items-center gap-4 justify-end flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)] whitespace-nowrap">Discount %</label>
                    <input
                      type="number" min={0} max={100} step={0.1}
                      className={`${inputCls} w-20 text-right tabular-nums`}
                      value={invoice.discountPercent || ''}
                      placeholder="0"
                      onChange={e => set('discountPercent', e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)] whitespace-nowrap">Tax %</label>
                    <input
                      type="number" min={0} max={100} step={0.1}
                      className={`${inputCls} w-20 text-right tabular-nums`}
                      value={invoice.taxRate || ''}
                      placeholder="0"
                      onChange={e => set('taxRate', e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xs text-[var(--muted)]">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</span>
                  <div className="text-right space-y-0.5">
                    {(invoice.discountPercent || invoice.taxRate) ? (
                      <>
                        <div className="flex justify-between gap-8 text-xs text-[var(--muted)]">
                          <span>Subtotal</span>
                          <span className="tabular-nums">{formatCurrency(subtotal, invoice.currency)}</span>
                        </div>
                        {(invoice.discountPercent || 0) > 0 && (
                          <div className="flex justify-between gap-8 text-xs text-[var(--muted)]">
                            <span>Discount ({invoice.discountPercent}%)</span>
                            <span className="tabular-nums text-green-500">-{formatCurrency(subtotal * (invoice.discountPercent || 0) / 100, invoice.currency)}</span>
                          </div>
                        )}
                        {(invoice.taxRate || 0) > 0 && (
                          <div className="flex justify-between gap-8 text-xs text-[var(--muted)]">
                            <span>Tax ({invoice.taxRate}%)</span>
                            <span className="tabular-nums">{formatCurrency((subtotal - subtotal * (invoice.discountPercent || 0) / 100) * (invoice.taxRate || 0) / 100, invoice.currency)}</span>
                          </div>
                        )}
                      </>
                    ) : null}
                    <div>
                      <p className="text-[11px] text-[var(--muted)] mb-0.5">Total due</p>
                      <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(total, invoice.currency)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <SectionLabel>Payment</SectionLabel>
            {(data.paymentMethods || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(data.paymentMethods || []).map(m => (
                  <button
                    key={m.id}
                    onClick={() => onChange({ ...invoice, paymentMethod: m.name, paymentDetails: m.details, bankDetails: undefined, updatedAt: new Date().toISOString() })}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      invoice.paymentMethod === m.name
                        ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Payments — collapsed by default, expands when toggled or payments exist */}
          {(paymentsOpen || (invoice.payments || []).length > 0) ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setPaymentsOpen(false)}
                  className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  Payments ↑
                </button>
                {(invoice.payments || []).length > 0 && (
                  <span className="text-xs text-[var(--muted)]">
                    Balance: {formatCurrency(getInvoiceBalance(invoice), invoice.currency)}
                  </span>
                )}
              </div>
              {(invoice.payments || []).map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] text-sm">
                  <div>
                    <span className="text-[var(--text)]">{formatCurrency(p.amount, invoice.currency)}</span>
                    {p.note && <span className="text-xs text-[var(--muted)] ml-2">{p.note}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">{p.date}</span>
                    <button
                      onClick={() => onChange({ ...invoice, payments: (invoice.payments || []).filter(x => x.id !== p.id), updatedAt: new Date().toISOString() })}
                      className="text-[var(--muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <AddPaymentForm
                onAdd={(amount, note, date) => {
                  const payment = { id: crypto.randomUUID(), date, amount, note }
                  onChange({ ...invoice, payments: [...(invoice.payments || []), payment], updatedAt: new Date().toISOString() })
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setPaymentsOpen(true)}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              + Record partial payment
            </button>
          )}

        </div></div>
      )}
    </div>
  )
}
