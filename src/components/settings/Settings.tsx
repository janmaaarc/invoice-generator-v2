import { useRef, useState, useEffect } from 'react'
import { Upload, X, User, Hash, Palette, Database, Users, RefreshCw, Check, Plus, Trash2, CreditCard, Layers, ToggleLeft, ToggleRight } from 'lucide-react'
import { DEFAULT_SETTINGS, ACCENT_COLORS, DUE_DATE_PRESETS, formatCurrency, hasBankDetails } from '../../types'
import type { AppData, InvoiceData, SavedClient, SavedPaymentMethod, SavedLineItem, RecurringInvoice, RecurringFrequency, RecurringTemplate, BankDetails } from '../../types'
import { exportDataAsJson, importDataFromJson } from '../../storage'
import { initialNextDate } from '../../lib/recurring'

interface SettingsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
  onClose: () => void
  prefillInvoice?: InvoiceData
}

type Tab = 'profile' | 'invoice' | 'appearance' | 'clients' | 'payments' | 'templates' | 'recurring' | 'data'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'invoice', label: 'Invoice', icon: Hash },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'recurring', label: 'Recurring', icon: RefreshCw },
  { id: 'data', label: 'Data', icon: Database },
]

const inputCls = 'w-full px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0 flex-shrink-0 w-36">
        <p className="text-sm text-[var(--text)]">{label}</p>
        {hint && <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[var(--text)] mb-1">{children}</h3>
}

export function Settings({ data, onChange, onSave, onClose, prefillInvoice }: SettingsProps) {
  const s = data.settings
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>(prefillInvoice ? 'recurring' : 'profile')
  const [clientDraft, setClientDraft] = useState<SavedClient>({ id: crypto.randomUUID(), name: '', email: '', address: '' })
  const [paymentDraft, setPaymentDraft] = useState<SavedPaymentMethod>({ id: crypto.randomUUID(), name: '', details: '' })
  const [templateDraft, setTemplateDraft] = useState<SavedLineItem>({ id: crypto.randomUUID(), description: '', rate: 0 })

  useEffect(() => {
    if (prefillInvoice) setTab('recurring')
  }, [prefillInvoice])

  function addClient() {
    if (!clientDraft.name.trim()) return
    onChange({ ...data, clients: [...data.clients, clientDraft] })
    onSave()
    setClientDraft({ id: crypto.randomUUID(), name: '', email: '', address: '' })
  }

  function removeClient(id: string) {
    onChange({ ...data, clients: data.clients.filter(c => c.id !== id) })
    onSave()
  }

  function addPayment() {
    if (!paymentDraft.name.trim()) return
    onChange({ ...data, paymentMethods: [...data.paymentMethods, paymentDraft] })
    onSave()
    setPaymentDraft({ id: crypto.randomUUID(), name: '', details: '' })
  }

  function removePayment(id: string) {
    onChange({ ...data, paymentMethods: data.paymentMethods.filter(m => m.id !== id) })
    onSave()
  }

  function addTemplate() {
    if (!templateDraft.description.trim()) return
    onChange({ ...data, lineItemTemplates: [...data.lineItemTemplates, templateDraft] })
    onSave()
    setTemplateDraft({ id: crypto.randomUUID(), description: '', rate: 0 })
  }

  function removeTemplate(id: string) {
    onChange({ ...data, lineItemTemplates: data.lineItemTemplates.filter(t => t.id !== id) })
    onSave()
  }
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  function emptyRecurringTemplate(): RecurringTemplate {
    return {
      fromName: s.defaultFromName, fromEmail: s.defaultFromEmail, fromAddress: s.defaultFromAddress,
      toName: '', toEmail: '', toAddress: '',
      lineItems: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }],
      paymentMethod: s.defaultPaymentMethod, paymentDetails: s.defaultPaymentDetails,
      notes: '', currency: 'USD', dueDatePreset: s.defaultDueDate || 'Upon receipt',
    }
  }

  const [showRecurringForm, setShowRecurringForm] = useState(!!prefillInvoice)
  const [recurringName, setRecurringName] = useState(prefillInvoice?.toName ? `${prefillInvoice.toName} recurring` : '')
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('monthly')
  const [recurringDay, setRecurringDay] = useState(1)
  const [recurringTemplate, setRecurringTemplate] = useState<RecurringTemplate>(() =>
    prefillInvoice ? {
      fromName: prefillInvoice.fromName, fromEmail: prefillInvoice.fromEmail, fromAddress: prefillInvoice.fromAddress,
      toName: prefillInvoice.toName, toEmail: prefillInvoice.toEmail, toAddress: prefillInvoice.toAddress,
      lineItems: prefillInvoice.lineItems.map(i => ({ ...i, id: crypto.randomUUID() })),
      paymentMethod: prefillInvoice.paymentMethod, paymentDetails: prefillInvoice.paymentDetails,
      notes: prefillInvoice.notes, currency: prefillInvoice.currency,
      dueDatePreset: s.defaultDueDate || 'Upon receipt',
      taxRate: prefillInvoice.taxRate, discountPercent: prefillInvoice.discountPercent,
    } : emptyRecurringTemplate()
  )

  useEffect(() => {
    if (prefillInvoice) {
      setShowRecurringForm(true)
      setRecurringName(prefillInvoice.toName ? `${prefillInvoice.toName} recurring` : '')
      setRecurringFreq('monthly')
      setRecurringDay(1)
      const defaultDueDate = data.settings.defaultDueDate || 'Upon receipt'
      setRecurringTemplate({
        fromName: prefillInvoice.fromName, fromEmail: prefillInvoice.fromEmail, fromAddress: prefillInvoice.fromAddress,
        toName: prefillInvoice.toName, toEmail: prefillInvoice.toEmail, toAddress: prefillInvoice.toAddress,
        lineItems: prefillInvoice.lineItems.map(i => ({ ...i, id: crypto.randomUUID() })),
        paymentMethod: prefillInvoice.paymentMethod, paymentDetails: prefillInvoice.paymentDetails,
        notes: prefillInvoice.notes, currency: prefillInvoice.currency,
        dueDatePreset: defaultDueDate,
        taxRate: prefillInvoice.taxRate, discountPercent: prefillInvoice.discountPercent,
      })
    }
  }, [prefillInvoice, data.settings.defaultDueDate])

  function setRT<K extends keyof RecurringTemplate>(key: K, value: RecurringTemplate[K]) {
    setRecurringTemplate(t => ({ ...t, [key]: value }))
  }

  function updateLineItem(idx: number, field: 'description' | 'quantity' | 'rate', value: string | number) {
    setRecurringTemplate(t => ({ ...t, lineItems: t.lineItems.map((item, i) => i === idx ? { ...item, [field]: value } : item) }))
  }

  function saveRecurring() {
    if (!recurringName.trim() || !recurringTemplate.toName.trim()) return
    const r: RecurringInvoice = {
      id: crypto.randomUUID(), name: recurringName.trim(), frequency: recurringFreq,
      dayOfMonth: recurringDay, nextDate: initialNextDate(recurringFreq, recurringDay),
      enabled: true, template: recurringTemplate, createdAt: new Date().toISOString(),
    }
    onChange({ ...data, recurringInvoices: [...data.recurringInvoices, r] })
    onSave()
    setShowRecurringForm(false)
    setRecurringName('')
    setRecurringFreq('monthly')
    setRecurringDay(1)
    setRecurringTemplate(emptyRecurringTemplate())
  }

  function toggleRecurring(id: string) {
    onChange({ ...data, recurringInvoices: data.recurringInvoices.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) })
    onSave()
  }

  function deleteRecurring(id: string) {
    onChange({ ...data, recurringInvoices: data.recurringInvoices.filter(r => r.id !== id) })
    onSave()
  }

  function set<K extends keyof typeof s>(key: K, value: typeof s[K]) {
    onChange({ ...data, settings: { ...s, [key]: value } })
  }

  function setBankDetail(field: keyof BankDetails, value: string) {
    const updated: BankDetails = { bankName: '', accountName: '', accountNumber: '', swiftCode: '', address: '', ...s.defaultBankDetails, [field]: value }
    onChange({ ...data, settings: { ...s, defaultBankDetails: updated } })
  }

  function clearBankDetails() {
    onChange({ ...data, settings: { ...s, defaultBankDetails: undefined } })
    onSave()
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WebP, etc.)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be smaller than 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => set('logo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleExport() {
    const json = exportDataAsJson(data)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoiceberg-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = importDataFromJson(ev.target?.result as string)
      if (result) {
        onChange(result)
        setImportMsg({ ok: true, text: `Imported ${result.invoices.length} invoices` })
      } else {
        setImportMsg({ ok: false, text: 'Invalid file' })
      }
      setTimeout(() => setImportMsg(null), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const pdfPreview = (s.pdfFilenameTemplate || '{number}-{client}')
    .replace('{number}', 'INV-2026-001')
    .replace('{client}', 'Acme Corp')
    .replace('{date}', new Date().toISOString().split('T')[0])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-base font-semibold tracking-tight">Settings</h2>
        <button onClick={onClose} className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <div className="w-44 flex-shrink-0 border-r border-[var(--border)] px-2 py-4 space-y-0.5">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  tab === t.id
                    ? 'bg-[var(--bg)] text-[var(--text)] font-medium'
                    : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl px-8 py-6">

            {tab === 'profile' && (
              <>
                <SectionTitle>Profile</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Fills in automatically on every new invoice.</p>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

                <Row label="Logo">
                  {s.logo ? (
                    <div className="flex items-center gap-3">
                      <div className="h-9 px-3 flex items-center bg-white rounded-lg border border-[var(--border)]">
                        <img src={s.logo} alt="Logo" className="h-6 w-auto object-contain" />
                      </div>
                      <button onClick={() => fileRef.current?.click()} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors">Replace</button>
                      <button onClick={() => set('logo', '')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors">
                        <X size={11} /> Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs border border-dashed border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors"
                    >
                      <Upload size={12} /> Upload logo
                    </button>
                  )}
                </Row>

                <Row label="Name">
                  <input className={`${inputCls} max-w-56`} value={s.defaultFromName} onChange={e => set('defaultFromName', e.target.value)} placeholder="Your name or company" onBlur={onSave} />
                </Row>

                <Row label="Email">
                  <input type="email" className={`${inputCls} max-w-56`} value={s.defaultFromEmail} onChange={e => set('defaultFromEmail', e.target.value)} placeholder="you@example.com" onBlur={onSave} />
                </Row>

                <Row label="Address">
                  <input className={`${inputCls} max-w-56`} value={s.defaultFromAddress} onChange={e => set('defaultFromAddress', e.target.value)} placeholder="Street, City, Country" onBlur={onSave} />
                </Row>
              </>
            )}

            {tab === 'invoice' && (
              <>
                <SectionTitle>Invoice</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Defaults applied to every new invoice.</p>

                <Row label="Number prefix">
                  <input className={`${inputCls} max-w-32`} value={s.invoiceNumberPrefix} onChange={e => set('invoiceNumberPrefix', e.target.value)} placeholder="INV" onBlur={onSave} />
                </Row>

                <Row label="Last number" hint="Next will be this + 1">
                  <input type="number" className={`${inputCls} max-w-32`} value={String(s.lastInvoiceNumber)} onChange={e => set('lastInvoiceNumber', Number(e.target.value))} onBlur={onSave} />
                </Row>

                <Row label="Next invoice">
                  <span className="text-sm font-mono text-[var(--muted)]">
                    {s.invoiceNumberPrefix}-{new Date().getFullYear()}-{String(s.lastInvoiceNumber + 1).padStart(3, '0')}
                  </span>
                </Row>

                <Row label="Default due date">
                  <select
                    className={`${inputCls} max-w-40`}
                    value={s.defaultDueDate}
                    onChange={e => set('defaultDueDate', e.target.value)}
                    onBlur={onSave}
                  >
                    {DUE_DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Row>

                <Row label="Payment method">
                  <input className={`${inputCls} max-w-56`} value={s.defaultPaymentMethod} onChange={e => set('defaultPaymentMethod', e.target.value)} placeholder="PayPal, GCash, Bank Transfer…" onBlur={onSave} />
                </Row>

                <Row label="Payment details">
                  <input className={`${inputCls} max-w-56`} value={s.defaultPaymentDetails} onChange={e => set('defaultPaymentDetails', e.target.value)} placeholder="Account number, link…" onBlur={onSave} />
                </Row>

                <Row label="QR code" hint="Show QR on invoice">
                  <button
                    onClick={() => set('showQrCode', !s.showQrCode)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${s.showQrCode ? 'bg-[var(--text)]' : 'bg-[var(--border)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${s.showQrCode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </Row>

                <div className="mt-6">
                  <p className="text-sm font-medium text-[var(--text)] mb-1">PDF filename</p>
                  <p className="text-xs text-[var(--muted)] mb-3">Template for downloaded PDF filenames.</p>
                  <input
                    className={inputCls}
                    value={s.pdfFilenameTemplate || ''}
                    onChange={e => set('pdfFilenameTemplate', e.target.value)}
                    placeholder="{number}-{client}"
                    onBlur={onSave}
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-[var(--muted)]">Insert:</span>
                    {['{number}', '{client}', '{date}'].map(v => (
                      <button
                        key={v}
                        onClick={() => set('pdfFilenameTemplate', (s.pdfFilenameTemplate || '{number}-{client}') + v)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {(s.pdfFilenameTemplate || '') && (
                    <p className="text-[10px] text-[var(--muted)] font-mono mt-2">→ {pdfPreview}.pdf</p>
                  )}
                </div>
              </>
            )}

            {tab === 'appearance' && (
              <>
                <SectionTitle>Appearance</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Invoice layout and color.</p>

                <Row label="Invoice template">
                  <div className="flex gap-2">
                    {(['minimal', 'classic', 'modern'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => set('template', t)}
                        className={`px-3 py-1.5 text-xs rounded-md border capitalize transition-colors ${
                          s.template === t
                            ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                            : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Row>

                <Row label="Accent color">
                  <div className="flex gap-2 flex-wrap justify-end">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => set('accentColor', c.value)}
                        title={c.name}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.value,
                          outline: s.accentColor === c.value ? `2px solid ${c.value}` : '2px solid transparent',
                          outlineOffset: '2px',
                        }}
                      >
                        {s.accentColor === c.value && <Check size={12} color="white" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </Row>
              </>
            )}

            {tab === 'clients' && (
              <>
                <SectionTitle>Clients</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Saved for quick selection when creating invoices.</p>

                <Row label="Name">
                  <input className={`${inputCls} max-w-56`} value={clientDraft.name} onChange={e => setClientDraft(d => ({ ...d, name: e.target.value }))} placeholder="Acme Corp" onKeyDown={e => e.key === 'Enter' && addClient()} />
                </Row>
                <Row label="Email">
                  <input type="email" className={`${inputCls} max-w-56`} value={clientDraft.email} onChange={e => setClientDraft(d => ({ ...d, email: e.target.value }))} placeholder="billing@example.com" onKeyDown={e => e.key === 'Enter' && addClient()} />
                </Row>
                <Row label="Address">
                  <input className={`${inputCls} max-w-56`} value={clientDraft.address} onChange={e => setClientDraft(d => ({ ...d, address: e.target.value }))} placeholder="Street, City, Country" onKeyDown={e => e.key === 'Enter' && addClient()} />
                </Row>

                <div className="flex justify-end pt-2 pb-6 border-b border-[var(--border)]">
                  <button
                    onClick={addClient}
                    disabled={!clientDraft.name.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 hover:opacity-80 transition-opacity"
                  >
                    <Plus size={12} /> Add client
                  </button>
                </div>

                {data.clients.length > 0 ? (
                  <div className="mt-4 space-y-0">
                    {data.clients.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--text)]">{c.name}</p>
                          {(c.email || c.address) && (
                            <p className="text-xs text-[var(--muted)] truncate mt-0.5">{[c.email, c.address].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                        <button onClick={() => removeClient(c.id)} className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0 ml-4">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)] text-center py-8 opacity-60">No clients saved yet</p>
                )}
              </>
            )}

            {tab === 'payments' && (
              <>
                <SectionTitle>Payments</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Save payment methods to pick per invoice.</p>

                <Row label="Method name">
                  <input className={`${inputCls} max-w-56`} value={paymentDraft.name} onChange={e => setPaymentDraft(d => ({ ...d, name: e.target.value }))} placeholder="PayPal, GCash, Bank..." onKeyDown={e => e.key === 'Enter' && addPayment()} />
                </Row>
                <Row label="Details">
                  <input className={`${inputCls} max-w-56`} value={paymentDraft.details} onChange={e => setPaymentDraft(d => ({ ...d, details: e.target.value }))} placeholder="Account number, email..." onKeyDown={e => e.key === 'Enter' && addPayment()} />
                </Row>

                <div className="flex justify-end pt-2 pb-6 border-b border-[var(--border)]">
                  <button onClick={addPayment} disabled={!paymentDraft.name.trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 hover:opacity-80 transition-opacity">
                    <Plus size={12} /> Add method
                  </button>
                </div>

                {data.paymentMethods.length > 0 ? (
                  <div className="mt-4 space-y-0">
                    {data.paymentMethods.map(m => (
                      <div key={m.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--text)]">{m.name}</p>
                          {m.details && <p className="text-xs text-[var(--muted)] truncate mt-0.5">{m.details}</p>}
                        </div>
                        <button onClick={() => removePayment(m.id)} className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0 ml-4">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)] text-center py-8 opacity-60">No payment methods saved yet</p>
                )}

                <div className="mt-8 pt-6 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">Bank / SWIFT Transfer</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">Appears on invoices as structured bank details.</p>
                    </div>
                    {hasBankDetails(s.defaultBankDetails) && (
                      <button onClick={clearBankDetails} className="text-[11px] text-[var(--muted)] hover:text-red-500 transition-colors">Clear</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-[var(--muted)] mb-1">Bank name</p>
                      <input className={inputCls} value={s.defaultBankDetails?.bankName ?? ''} onChange={e => setBankDetail('bankName', e.target.value)} placeholder="e.g. Chase Bank" onBlur={onSave} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--muted)] mb-1">Account name</p>
                      <input className={inputCls} value={s.defaultBankDetails?.accountName ?? ''} onChange={e => setBankDetail('accountName', e.target.value)} placeholder="e.g. John Doe" onBlur={onSave} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--muted)] mb-1">Account number</p>
                      <input className={inputCls} value={s.defaultBankDetails?.accountNumber ?? ''} onChange={e => setBankDetail('accountNumber', e.target.value)} placeholder="e.g. 1234567890" onBlur={onSave} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--muted)] mb-1">SWIFT / BIC</p>
                      <input className={inputCls} value={s.defaultBankDetails?.swiftCode ?? ''} onChange={e => setBankDetail('swiftCode', e.target.value)} placeholder="e.g. CHASUS33" onBlur={onSave} />
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] text-[var(--muted)] mb-1">Address</p>
                      <input className={inputCls} value={s.defaultBankDetails?.address ?? ''} onChange={e => setBankDetail('address', e.target.value)} placeholder="e.g. 123 Main St, New York, NY 10001" onBlur={onSave} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'templates' && (
              <>
                <SectionTitle>Templates</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Reusable line items for services you invoice often.</p>

                <Row label="Description">
                  <input className={`${inputCls} max-w-56`} value={templateDraft.description} onChange={e => setTemplateDraft(d => ({ ...d, description: e.target.value }))} placeholder="Design consultation" onKeyDown={e => e.key === 'Enter' && addTemplate()} />
                </Row>
                <Row label="Default rate">
                  <input type="number" min={0} step={0.01} className={`${inputCls} max-w-32`} value={templateDraft.rate || ''} onChange={e => setTemplateDraft(d => ({ ...d, rate: Number(e.target.value) }))} placeholder="0.00" onKeyDown={e => e.key === 'Enter' && addTemplate()} />
                </Row>

                <div className="flex justify-end pt-2 pb-6 border-b border-[var(--border)]">
                  <button onClick={addTemplate} disabled={!templateDraft.description.trim()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 hover:opacity-80 transition-opacity">
                    <Plus size={12} /> Add template
                  </button>
                </div>

                {data.lineItemTemplates.length > 0 ? (
                  <div className="mt-4 space-y-0">
                    {data.lineItemTemplates.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--text)]">{t.description}</p>
                          {t.rate > 0 && <p className="text-xs text-[var(--muted)] mt-0.5 font-mono">{formatCurrency(t.rate, 'USD')}</p>}
                        </div>
                        <button onClick={() => removeTemplate(t.id)} className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0 ml-4">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)] text-center py-8 opacity-60">No templates saved yet</p>
                )}
              </>
            )}

            {tab === 'recurring' && (
              <>
                <SectionTitle>Recurring</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">Auto-generate invoices on a schedule.</p>

                {!showRecurringForm ? (
                  <div className="flex justify-end mb-4">
                    <button onClick={() => setShowRecurringForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-md hover:opacity-80 transition-opacity">
                      <Plus size={12} /> New schedule
                    </button>
                  </div>
                ) : (
                  <div className="mb-6 pb-6 border-b border-[var(--border)]">
                    <Row label="Name">
                      <input className={`${inputCls} max-w-56`} value={recurringName} onChange={e => setRecurringName(e.target.value)} placeholder="Monthly retainer" />
                    </Row>
                    <Row label="Frequency">
                      <select className={`${inputCls} max-w-40`} value={recurringFreq} onChange={e => setRecurringFreq(e.target.value as RecurringFrequency)}>
                        {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </Row>
                    {['monthly', 'quarterly', 'yearly'].includes(recurringFreq) && (
                      <Row label="Day of month" hint="Max 28">
                        <input type="number" min={1} max={28} className={`${inputCls} max-w-20`} value={recurringDay} onChange={e => setRecurringDay(Number(e.target.value))} />
                      </Row>
                    )}
                    <Row label="Payment terms">
                      <select className={`${inputCls} max-w-40`} value={recurringTemplate.dueDatePreset} onChange={e => setRT('dueDatePreset', e.target.value)}>
                        {DUE_DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </Row>

                    <p className="text-xs font-medium text-[var(--text)] mt-4 mb-2">Bill to</p>
                    <Row label="Client name">
                      <input className={`${inputCls} max-w-56`} value={recurringTemplate.toName} onChange={e => setRT('toName', e.target.value)} placeholder="Acme Corp *" />
                    </Row>
                    <Row label="Client email">
                      <input type="email" className={`${inputCls} max-w-56`} value={recurringTemplate.toEmail} onChange={e => setRT('toEmail', e.target.value)} placeholder="billing@example.com" />
                    </Row>
                    <Row label="Client address">
                      <input className={`${inputCls} max-w-56`} value={recurringTemplate.toAddress} onChange={e => setRT('toAddress', e.target.value)} placeholder="Street, City, Country" />
                    </Row>

                    <p className="text-xs font-medium text-[var(--text)] mt-4 mb-2">Line items</p>
                    {(() => {
                      const liCls = 'px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'
                      return recurringTemplate.lineItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                        <input className={`${liCls} flex-1 min-w-0`} value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" />
                        <input type="number" min={0} className={`${liCls} w-24 flex-shrink-0`} value={item.rate || ''} onChange={e => updateLineItem(idx, 'rate', Number(e.target.value))} placeholder="Rate" />
                        {recurringTemplate.lineItems.length > 1 && (
                          <button onClick={() => setRecurringTemplate(t => ({ ...t, lineItems: t.lineItems.filter((_, i) => i !== idx) }))} className="p-1.5 text-[var(--muted)] hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))
                    })()}
                    <button onClick={() => setRecurringTemplate(t => ({ ...t, lineItems: [...t.lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }] }))} className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors mt-2">
                      <Plus size={12} /> Add item
                    </button>

                    <p className="text-xs font-medium text-[var(--text)] mt-4 mb-2">Payment</p>
                    <Row label="Method">
                      <input className={`${inputCls} max-w-56`} value={recurringTemplate.paymentMethod} onChange={e => setRT('paymentMethod', e.target.value)} placeholder="PayPal, GCash..." />
                    </Row>
                    <Row label="Details">
                      <input className={`${inputCls} max-w-56`} value={recurringTemplate.paymentDetails} onChange={e => setRT('paymentDetails', e.target.value)} placeholder="Account / link" />
                    </Row>

                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => { setShowRecurringForm(false); setRecurringName(''); setRecurringFreq('monthly'); setRecurringDay(1); setRecurringTemplate(emptyRecurringTemplate()) }} className="px-4 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Cancel</button>
                      <button onClick={saveRecurring} disabled={!recurringName.trim() || !recurringTemplate.toName.trim()} className="px-4 py-1.5 text-sm font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 hover:opacity-80 transition-opacity">Save</button>
                    </div>
                  </div>
                )}

                {data.recurringInvoices.length > 0 ? (
                  <div className="space-y-0">
                    {data.recurringInvoices.map(r => (
                      <div key={r.id} className={`flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0 ${!r.enabled ? 'opacity-50' : ''}`}>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--text)]">{r.name}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{FREQUENCIES.find(f => f.value === r.frequency)?.label} · Next: {r.nextDate}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                          <button onClick={() => toggleRecurring(r.id)} className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors" title={r.enabled ? 'Disable' : 'Enable'}>
                            {r.enabled ? <ToggleRight size={16} className="text-[var(--text)]" /> : <ToggleLeft size={16} />}
                          </button>
                          <button onClick={() => deleteRecurring(r.id)} className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !showRecurringForm ? (
                  <p className="text-xs text-[var(--muted)] text-center py-8 opacity-60">No recurring schedules yet</p>
                ) : null}
              </>
            )}

            {tab === 'data' && (
              <>
                <SectionTitle>Data</SectionTitle>
                <p className="text-xs text-[var(--muted)] mb-6">All data stored locally in your browser.</p>

                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

                <Row label="Export" hint="Download all invoices and settings as JSON">
                  <button
                    onClick={handleExport}
                    className="px-4 py-1.5 text-sm border border-[var(--border)] rounded-md text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                  >
                    Export backup
                  </button>
                </Row>

                <Row label="Import" hint="Restore from a backup file">
                  <div className="flex items-center gap-3">
                    {importMsg && (
                      <span className={`text-xs ${importMsg.ok ? 'text-green-500' : 'text-red-500'}`}>
                        {importMsg.text}
                      </span>
                    )}
                    <button
                      onClick={() => importRef.current?.click()}
                      className="px-4 py-1.5 text-sm border border-[var(--border)] rounded-md text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                    >
                      Import file
                    </button>
                  </div>
                </Row>

                <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">Reset settings</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">Clears all settings. Invoices not affected.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Reset all settings to defaults?')) {
                          onChange({ ...data, settings: { ...DEFAULT_SETTINGS } })
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-500/30 rounded-md hover:bg-red-500 hover:text-white transition-all flex-shrink-0 ml-4"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
