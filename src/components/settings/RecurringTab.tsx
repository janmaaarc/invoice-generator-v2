import { useState, useEffect } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { DUE_DATE_PRESETS, hasBankDetails, bankDetailRows } from '../../types'
import type { InvoiceData, RecurringInvoice, RecurringFrequency, RecurringTemplate } from '../../types'
import { initialNextDate } from '../../lib/recurring'
import { inputCls, Row, SectionTitle, type TabProps } from './shared'

export function RecurringTab({ data, onChange, onSave, prefillInvoice }: TabProps & { prefillInvoice?: InvoiceData }) {
  const s = data.settings

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
      paymentMethod: s.defaultPaymentMethod, paymentDetails: s.defaultPaymentDetails, bankDetails: s.defaultBankDetails,
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
      paymentMethod: prefillInvoice.paymentMethod, paymentMethodId: prefillInvoice.paymentMethodId, paymentDetails: prefillInvoice.paymentDetails, bankDetails: prefillInvoice.bankDetails,
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
        paymentMethod: prefillInvoice.paymentMethod, paymentMethodId: prefillInvoice.paymentMethodId, paymentDetails: prefillInvoice.paymentDetails, bankDetails: prefillInvoice.bankDetails,
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

  return (
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
          {data.paymentMethods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {data.paymentMethods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setRecurringTemplate(t => ({
                    ...t,
                    paymentMethod: m.name,
                    paymentMethodId: m.id,
                    paymentDetails: m.type === 'bank' ? '' : m.details,
                    bankDetails: m.type === 'bank' ? m.bankDetails : undefined,
                  }))}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    (recurringTemplate.paymentMethodId ? recurringTemplate.paymentMethodId === m.id : recurringTemplate.paymentMethod === m.name)
                      ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          <Row label="Method">
            <input className={`${inputCls} max-w-56`} value={recurringTemplate.paymentMethod} onChange={e => setRecurringTemplate(t => ({ ...t, paymentMethod: e.target.value, paymentMethodId: undefined, bankDetails: undefined }))} placeholder="PayPal, GCash..." />
          </Row>
          {hasBankDetails(recurringTemplate.bankDetails) ? (
            <div className="mt-2 rounded-md bg-[var(--surface)] border border-[var(--border)] px-3 py-2.5 space-y-1.5">
              {bankDetailRows(recurringTemplate.bankDetails).map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] w-28 flex-shrink-0 pt-0.5 leading-tight">{label}</span>
                  <span className="text-xs text-[var(--text)]">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <Row label="Details">
              <input className={`${inputCls} max-w-56`} value={recurringTemplate.paymentDetails} onChange={e => setRT('paymentDetails', e.target.value)} placeholder="Account / link" />
            </Row>
          )}

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
  )
}
