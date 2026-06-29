import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Share2, Mail, MessageCircle, ChevronDown, ChevronLeft, ListPlus, Trash2, Users } from 'lucide-react'
import { Input, DatePicker } from '../ui'
import {
  CURRENCIES,
  formatCurrency, getInvoiceTotal, getInvoiceSubtotal, getInvoiceBalance,
} from '../../types'
import type { InvoiceData, AppData, InvoiceStatus, LineItem } from '../../types'
import { hasBankDetails } from '../../types'
import { InvoicePreview } from './InvoicePreview'

interface InvoiceEditorProps {
  invoice: InvoiceData
  data: AppData
  onChange: (invoice: InvoiceData) => void
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
    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-4 flex items-center gap-2 before:content-[''] before:block before:w-3 before:h-px before:bg-[var(--muted)] before:opacity-50">
      {children}
    </p>
  )
}

interface ClientSuggestion { name: string; email: string; address: string }

function ClientNameField({ value, onChange, onSelect, suggestions, inputCls }: {
  value: string
  onChange: (name: string) => void
  onSelect: (client: ClientSuggestion) => void
  suggestions: ClientSuggestion[]
  inputCls: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? suggestions.filter(s => s.name.toLowerCase().includes(value.toLowerCase()))
    : []

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Client Name</label>
      <input
        className={inputCls}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Client or company"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-[0_4px_16px_0_rgb(0,0,0,0.12)] py-1 animate-dropdown">
          {filtered.map(s => (
            <button
              key={s.name}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 hover:bg-[var(--surface)] transition-colors"
            >
              <p className="text-sm text-[var(--text)]">{s.name}</p>
              {s.email && <p className="text-[11px] text-[var(--muted)] mt-0.5">{s.email}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
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
  invoice, data, onChange, onDownloadPdf, onShare, onStatusChange,
  onBack, view, onViewChange,
}: InvoiceEditorProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)
  const mountedRef = useRef(true)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const [previewScale, setPreviewScale] = useState(0.75)

  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = 'auto'
      notesRef.current.style.height = notesRef.current.scrollHeight + 'px'
    }
  }, [invoice.notes])

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
  const selectCls = 'px-0 py-1.5 text-sm bg-transparent border-0 border-b border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)] transition-colors'
  const inputCls = 'px-0 py-1.5 text-sm bg-transparent border-0 border-b border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--text)] transition-colors w-full'

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3 px-3 md:px-6 py-2.5 md:py-3 border-b border-[var(--border)]">
        {/* Left: back + invoice identity */}
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 overflow-hidden">
          {onBack && (
            <button onClick={onBack} className="md:hidden flex-shrink-0 p-1 -ml-1 text-[var(--muted)] hover:text-[var(--text)]">
              <ChevronLeft size={18} />
            </button>
          )}
          <input
            value={invoice.invoiceNumber}
            onChange={e => set('invoiceNumber', e.target.value)}
            className="hidden sm:block text-xs font-mono text-[var(--muted)] bg-transparent border-none outline-none shrink min-w-0 w-auto hover:text-[var(--text)] focus:text-[var(--text)] transition-colors"
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
        <div className="flex-1 overflow-y-auto"><div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">

          {/* Dates + Currency */}
          <div className="bg-[var(--surface)] rounded-xl p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Currency</label>
                <div className="relative">
                  <select value={invoice.currency} onChange={e => set('currency', e.target.value)} className={`${selectCls} appearance-none w-full pr-6`} style={{ WebkitAppearance: 'none' }}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]" />
                </div>
              </div>
            </div>
          </div>

          {/* From */}
          <div className="bg-[var(--surface)] rounded-xl p-5">
            <SectionLabel>From</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Name" value={invoice.fromName} onChange={e => set('fromName', e.target.value)} placeholder="Your name or company" />
              <Input label="Email" type="email" value={invoice.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="you@example.com" />
              <div className="md:col-span-2">
                <Input label="Address" value={invoice.fromAddress} onChange={e => set('fromAddress', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-[var(--surface)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2 before:content-[''] before:block before:w-3 before:h-px before:bg-[var(--muted)] before:opacity-50">Bill To</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClientNameField
                value={invoice.toName}
                onChange={name => set('toName', name)}
                onSelect={client => onChange({ ...invoice, toName: client.name, toEmail: client.email, toAddress: client.address, updatedAt: new Date().toISOString() })}
                suggestions={Array.from(
                  new Map(
                    data.invoices
                      .filter(inv => inv.id !== invoice.id && inv.toName.trim())
                      .map(inv => [inv.toName.toLowerCase(), { name: inv.toName, email: inv.toEmail, address: inv.toAddress }])
                  ).values()
                )}
                inputCls={inputCls}
              />
              <Input label="Client Email" type="email" value={invoice.toEmail} onChange={e => set('toEmail', e.target.value)} placeholder="client@example.com" />
              <div className="md:col-span-2">
                <Input label="Client Address" value={invoice.toAddress} onChange={e => set('toAddress', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[var(--surface)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2 before:content-[''] before:block before:w-3 before:h-px before:bg-[var(--muted)] before:opacity-50">Line Items</p>
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
            <div className="space-y-1">
              <div className="hidden sm:grid grid-cols-[1fr_72px_88px_24px] gap-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] pb-2 border-b border-[var(--border)]">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span />
              </div>
              <datalist id="line-item-templates">
                {data.lineItemTemplates.map(t => <option key={t.id} value={t.description} />)}
              </datalist>
              {invoice.lineItems.map(item => (
                <div key={item.id} className="group flex flex-wrap sm:flex-nowrap sm:grid sm:grid-cols-[1fr_72px_88px_24px] items-center gap-3 py-1.5 -mx-1 px-1 rounded-lg hover:bg-[var(--bg)] transition-colors">
                  <input
                    className="text-sm bg-transparent border-none outline-none text-[var(--text)] placeholder:text-[var(--muted)] w-full min-w-0"
                    value={item.description}
                    onChange={e => setLineItem(item.id, 'description', e.target.value)}
                    placeholder="Service or product"
                    list="line-item-templates"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto sm:contents">
                    <input
                      type="number" min={0} step={1}
                      className="text-sm bg-transparent border-none outline-none text-[var(--text)] placeholder:text-[var(--muted)] tabular-nums flex-1 min-w-0 sm:text-right"
                      value={item.quantity || ''}
                      placeholder="1"
                      onChange={e => setLineItem(item.id, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    <input
                      type="number" min={0} step={0.01}
                      className="text-sm bg-transparent border-none outline-none text-[var(--text)] placeholder:text-[var(--muted)] tabular-nums flex-1 min-w-0 sm:text-right"
                      value={item.rate || ''}
                      placeholder="0.00"
                      onChange={e => setLineItem(item.id, 'rate', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    <button
                      onClick={() => removeLineItem(item.id)}
                      className="flex-shrink-0 flex items-center justify-center w-6 text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addLineItem} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors mt-2 px-1">
                + Add item
              </button>
            </div>

            {/* Totals panel */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Disc %</label>
                    <input
                      type="number" min={0} max={100} step={0.1}
                      className="w-14 text-sm bg-transparent border-b border-[var(--border)] text-right tabular-nums text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--text)] transition-colors py-0.5"
                      value={invoice.discountPercent || ''}
                      placeholder="0"
                      onChange={e => set('discountPercent', e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Tax %</label>
                    <input
                      type="number" min={0} max={100} step={0.1}
                      className="w-14 text-sm bg-transparent border-b border-[var(--border)] text-right tabular-nums text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--text)] transition-colors py-0.5"
                      value={invoice.taxRate || ''}
                      placeholder="0"
                      onChange={e => set('taxRate', e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
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
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-0.5">Total due</p>
                    <p className="text-3xl font-bold tabular-nums tracking-tight">{formatCurrency(total, invoice.currency)}</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-3">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-[var(--surface)] rounded-xl p-5">
            <SectionLabel>Payment</SectionLabel>
            {(data.paymentMethods || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {(data.paymentMethods || []).map(m => (
                  <button
                    key={m.id}
                    onClick={() => onChange({
                      ...invoice,
                      paymentMethod: m.name,
                      paymentDetails: m.type === 'bank' ? '' : m.details,
                      bankDetails: m.type === 'bank' ? m.bankDetails : undefined,
                      updatedAt: new Date().toISOString()
                    })}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      invoice.paymentMethod === m.name
                        ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)]'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Method" value={invoice.paymentMethod} onChange={e => onChange({ ...invoice, paymentMethod: e.target.value, bankDetails: undefined, updatedAt: new Date().toISOString() })} placeholder="PayPal, Bank Transfer…" />
              {!hasBankDetails(invoice.bankDetails) && (
                <Input label="Details" value={invoice.paymentDetails} onChange={e => set('paymentDetails', e.target.value)} placeholder="Account number, email…" />
              )}
            </div>
            {hasBankDetails(invoice.bankDetails) && (() => {
              const bd = invoice.bankDetails!
              return (
              <>
              <div className="mt-4 rounded-lg bg-[var(--bg)] divide-y divide-[var(--border)] overflow-hidden">
                {([
                  ['Bank', bd.bankName],
                  ['Account name', bd.accountName],
                  ['Account no.', bd.accountNumber],
                  ['SWIFT / BIC', bd.swiftCode],
                  ['Address', bd.address],
                ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex items-center px-4 py-2.5 gap-4">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] w-24 flex-shrink-0">{label}</span>
                    <span className="text-xs text-[var(--text)] truncate">{value}</span>
                  </div>
                ))}
              </div>
              </>
              )
            })()}
          </div>

          {/* Notes */}
          <div className="bg-[var(--surface)] rounded-xl p-5">
            <SectionLabel>Notes</SectionLabel>
            <textarea
              ref={notesRef}
              className="w-full text-sm bg-transparent border-b border-transparent outline-none text-[var(--text)] placeholder:text-[var(--muted)] resize-none leading-relaxed hover:border-[var(--border)] focus:border-[var(--text)] transition-colors overflow-hidden"
              rows={1}
              value={invoice.notes}
              onChange={e => set('notes', e.target.value)}
              onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
              placeholder="Payment terms, thank you note…"
            />
          </div>

          {/* Payments — collapsed by default, expands when toggled or payments exist */}
          {(paymentsOpen || (invoice.payments || []).length > 0) ? (
            <div className="bg-[var(--surface)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setPaymentsOpen(false)}
                  className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-2 before:content-[''] before:block before:w-3 before:h-px before:bg-[var(--muted)] before:opacity-50"
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
