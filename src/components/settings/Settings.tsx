import { useRef, useState, useEffect } from 'react'
import { Upload, X, User, Hash, Palette, Database, Users, RefreshCw, Check, Plus, Trash2, CreditCard, Layers, ChevronRight, ChevronLeft } from 'lucide-react'
import { DEFAULT_SETTINGS, ACCENT_COLORS, DUE_DATE_PRESETS, formatCurrency, toLocalDate } from '../../types'
import type { AppData, InvoiceData, SavedClient, SavedLineItem } from '../../types'
import { exportDataAsJson, importDataFromJson } from '../../storage'
import { inputCls, Row, SectionTitle } from './shared'
import { PaymentsTab } from './PaymentsTab'
import { RecurringTab } from './RecurringTab'

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

export function Settings({ data, onChange, onSave, onClose, prefillInvoice }: SettingsProps) {
  const s = data.settings
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>(prefillInvoice ? 'recurring' : 'profile')
  const [mobileView, setMobileView] = useState<'menu' | 'content'>(prefillInvoice ? 'content' : 'menu')
  const [clientDraft, setClientDraft] = useState<SavedClient>({ id: crypto.randomUUID(), name: '', email: '', address: '' })
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

  function set<K extends keyof typeof s>(key: K, value: typeof s[K]) {
    onChange({ ...data, settings: { ...s, [key]: value } })
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
    a.download = `invoix-backup-${toLocalDate()}.json`
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
    .replace('{date}', toLocalDate())

  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <div className="flex flex-col h-full">
      {/* Header — desktop always shows "Settings", mobile shows back+title when in content */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          {/* Mobile back button when in content view */}
          {mobileView === 'content' && (
            <button
              onClick={() => setMobileView('menu')}
              className="md:hidden p-1 -ml-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 className="text-base font-semibold tracking-tight">
            <span className="hidden md:inline">Settings</span>
            <span className="md:hidden">{mobileView === 'menu' ? 'Settings' : activeTab.label}</span>
          </h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left nav */}
        <div className="hidden md:block w-44 flex-shrink-0 border-r border-[var(--border)] px-2 py-4 space-y-0.5">
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

        {/* Mobile menu list */}
        {mobileView === 'menu' && (
          <div className="md:hidden flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setMobileView('content') }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[var(--surface)] text-left active:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-[var(--muted)]" />
                    <span className="text-sm text-[var(--text)]">{t.label}</span>
                  </div>
                  <ChevronRight size={15} className="text-[var(--muted)]" />
                </button>
              )
            })}
          </div>
        )}

        {/* Right content — always shown on desktop, shown in content view on mobile */}
        <div className={`flex-1 overflow-hidden flex-col ${mobileView === 'content' ? 'flex' : 'hidden'} md:flex`}>
          <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl px-4 md:px-8 py-6">

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

                <Row label="QR code" hint="Show QR when payment details are a link">
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

            {/* stay mounted so drafts and the one-shot recurring prefill survive tab switches */}
            <div hidden={tab !== 'payments'}><PaymentsTab data={data} onChange={onChange} onSave={onSave} /></div>

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

            <div hidden={tab !== 'recurring'}><RecurringTab data={data} onChange={onChange} onSave={onSave} prefillInvoice={prefillInvoice} /></div>

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
