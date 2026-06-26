import { useState } from 'react'
import { Trash2, RefreshCw, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import type { AppData, RecurringInvoice, RecurringFrequency, RecurringTemplate } from '../../types'
import { DUE_DATE_PRESETS } from '../../types'
import { computeNextDate, initialNextDate } from '../../lib/recurring'

interface RecurringProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

function emptyTemplate(data: AppData): RecurringTemplate {
  const s = data.settings
  return {
    fromName: s.defaultFromName,
    fromEmail: s.defaultFromEmail,
    fromAddress: s.defaultFromAddress,
    toName: '',
    toEmail: '',
    toAddress: '',
    lineItems: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }],
    paymentMethod: s.defaultPaymentMethod,
    paymentDetails: s.defaultPaymentDetails,
    notes: '',
    currency: 'USD',
    dueDatePreset: 'Upon receipt',
  }
}

function RecurringForm({ data, onAdd, onCancel }: {
  data: AppData
  onAdd: (r: RecurringInvoice) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [template, setTemplate] = useState<RecurringTemplate>(() => emptyTemplate(data))

  function setT<K extends keyof RecurringTemplate>(key: K, value: RecurringTemplate[K]) {
    setTemplate(t => ({ ...t, [key]: value }))
  }

  function updateLineItem(idx: number, field: 'description' | 'quantity' | 'rate', value: string | number) {
    setTemplate(t => ({
      ...t,
      lineItems: t.lineItems.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }))
  }

  function addLineItem() {
    setTemplate(t => ({
      ...t,
      lineItems: [...t.lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }]
    }))
  }

  function removeLineItem(idx: number) {
    setTemplate(t => ({ ...t, lineItems: t.lineItems.filter((_, i) => i !== idx) }))
  }

  function submit() {
    if (!name.trim() || !template.toName.trim()) return
    const now = new Date().toISOString()
    const r: RecurringInvoice = {
      id: crypto.randomUUID(),
      name: name.trim(),
      frequency,
      dayOfMonth,
      nextDate: initialNextDate(frequency, dayOfMonth),
      enabled: true,
      template,
      createdAt: now,
    }
    onAdd(r)
  }

  const showDay = ['monthly', 'quarterly', 'yearly'].includes(frequency)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">New recurring invoice</p>
      </div>
      <div className="px-4 pb-4 space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1">Name</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Monthly retainer" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1">Frequency</label>
            <select className={inputCls} value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)}>
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        {showDay && (
          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1">Day of month</label>
            <input type="number" min={1} max={28} className={inputCls} value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))} />
            <p className="text-[10px] text-[var(--muted)] mt-1">Max 28 to avoid month-end issues</p>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[var(--muted)] block mb-1">Payment terms</label>
          <select className={inputCls} value={template.dueDatePreset} onChange={e => setT('dueDatePreset', e.target.value)}>
            {DUE_DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">Bill to</p>
          <div className="grid grid-cols-1 gap-2">
            <input className={inputCls} value={template.toName} onChange={e => setT('toName', e.target.value)} placeholder="Client name *" />
            <input className={inputCls} value={template.toEmail} onChange={e => setT('toEmail', e.target.value)} placeholder="Client email" />
            <input className={inputCls} value={template.toAddress} onChange={e => setT('toAddress', e.target.value)} placeholder="Client address" />
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">Line items</p>
          <div className="space-y-2">
            {template.lineItems.map((item, idx) => (
              <div key={item.id} className="flex gap-2 items-center">
                <input
                  className={`${inputCls} flex-1`}
                  value={item.description}
                  onChange={e => updateLineItem(idx, 'description', e.target.value)}
                  placeholder="Description"
                />
                <input
                  type="number"
                  min={0}
                  className={`${inputCls} w-20`}
                  value={item.rate || ''}
                  onChange={e => updateLineItem(idx, 'rate', Number(e.target.value))}
                  placeholder="Rate"
                />
                {template.lineItems.length > 1 && (
                  <button onClick={() => removeLineItem(idx)} className="text-[var(--muted)] hover:text-red-500 transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addLineItem} className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors mt-1">
              <Plus size={12} /> Add item
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-3 grid grid-cols-2 gap-2">
          <input className={inputCls} value={template.paymentMethod} onChange={e => setT('paymentMethod', e.target.value)} placeholder="Payment method" />
          <input className={inputCls} value={template.paymentDetails} onChange={e => setT('paymentDetails', e.target.value)} placeholder="Payment details" />
        </div>

      </div>
      <div className="border-t border-[var(--border)] px-4 py-3 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Cancel</button>
        <button
          onClick={submit}
          disabled={!name.trim() || !template.toName.trim()}
          className="px-4 py-1.5 text-sm font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 transition-opacity hover:opacity-80"
        >
          Save recurring
        </button>
      </div>
    </div>
  )
}

function RecurringCard({ r, onToggle, onDelete }: {
  r: RecurringInvoice
  onToggle: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const freq = FREQUENCIES.find(f => f.value === r.frequency)?.label ?? r.frequency

  return (
    <div className={`rounded-xl border transition-all animate-row-in ${r.enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-60'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          <RefreshCw size={14} className="text-[var(--muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{r.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[var(--muted)]">{freq}</span>
            <span className="text-[var(--border)] text-xs">·</span>
            <span className="text-xs text-[var(--muted)]">Next: {r.nextDate}</span>
            {r.template.toName && <>
              <span className="text-[var(--border)] text-xs">·</span>
              <span className="text-xs text-[var(--muted)] truncate">{r.template.toName}</span>
            </>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button onClick={onToggle} className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors" title={r.enabled ? 'Disable' : 'Enable'}>
            {r.enabled ? <ToggleRight size={16} className="text-[var(--text)]" /> : <ToggleLeft size={16} />}
          </button>
          <button onClick={onDelete} className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-1.5 animate-dropdown">
          {r.template.lineItems.map(item => (
            <div key={item.id} className="flex justify-between text-xs">
              <span className="text-[var(--text)]">{item.description || '—'}</span>
              <span className="text-[var(--muted)] tabular-nums">${item.rate.toFixed(2)} × {item.quantity}</span>
            </div>
          ))}
          {r.template.paymentMethod && (
            <p className="text-xs text-[var(--muted)] pt-1">Payment: {r.template.paymentMethod}</p>
          )}
          {r.lastGeneratedAt && (
            <p className="text-[10px] text-[var(--muted)] pt-1">Last generated: {r.lastGeneratedAt.split('T')[0]}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function Recurring({ data, onChange, onSave }: RecurringProps) {
  const [showForm, setShowForm] = useState(false)

  function addRecurring(r: RecurringInvoice) {
    onChange({ ...data, recurringInvoices: [...data.recurringInvoices, r] })
    onSave()
    setShowForm(false)
  }

  function toggleRecurring(id: string) {
    onChange({
      ...data,
      recurringInvoices: data.recurringInvoices.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    })
    onSave()
  }

  function deleteRecurring(id: string) {
    onChange({ ...data, recurringInvoices: data.recurringInvoices.filter(r => r.id !== id) })
    onSave()
  }

  const active = data.recurringInvoices.filter(r => r.enabled).length

  return (
    <div className="flex flex-col h-full animate-section">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">Recurring</h2>
          {data.recurringInvoices.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[var(--surface)] text-[var(--muted)] tabular-nums">
              {active}/{data.recurringInvoices.length} active
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-md hover:opacity-80 transition-opacity"
          >
            <Plus size={12} /> New
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-6 space-y-4">

          {showForm && (
            <RecurringForm data={data} onAdd={addRecurring} onCancel={() => setShowForm(false)} />
          )}

          {data.recurringInvoices.length > 0 ? (
            <div className="space-y-2">
              {data.recurringInvoices.map(r => (
                <RecurringCard
                  key={r.id}
                  r={r}
                  onToggle={() => toggleRecurring(r.id)}
                  onDelete={() => deleteRecurring(r.id)}
                />
              ))}
            </div>
          ) : !showForm ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-3">
                <RefreshCw size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm text-[var(--muted)]">No recurring invoices</p>
              <p className="text-xs text-[var(--muted)] mt-1 opacity-60">Auto-generate invoices on a schedule</p>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}
