import { useState } from 'react'
import { Trash2, CreditCard } from 'lucide-react'
import type { AppData, SavedPaymentMethod } from '../../types'

interface PaymentMethodsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

export function PaymentMethods({ data, onChange, onSave }: PaymentMethodsProps) {
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')

  function add() {
    if (!name.trim()) return
    const method: SavedPaymentMethod = { id: crypto.randomUUID(), name: name.trim(), details: details.trim() }
    onChange({ ...data, paymentMethods: [...data.paymentMethods, method] })
    setName('')
    setDetails('')
    onSave()
  }

  function remove(id: string) {
    onChange({ ...data, paymentMethods: data.paymentMethods.filter(m => m.id !== id) })
    onSave()
  }

  return (
    <div className="flex flex-col h-full animate-section">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">Payment Methods</h2>
          {data.paymentMethods.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[var(--surface)] text-[var(--muted)] tabular-nums">
              {data.paymentMethods.length}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)]">Choose one per invoice</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-6 space-y-6">

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">New method</p>
            </div>
            <div className="px-4 pb-4 space-y-2.5">
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Name</label>
                <input
                  className={inputCls}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="PayPal, Bank Transfer, GCash…"
                  onKeyDown={e => e.key === 'Enter' && add()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Details</label>
                <input
                  className={inputCls}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Account number, email, or link"
                  onKeyDown={e => e.key === 'Enter' && add()}
                />
              </div>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3 flex justify-end">
              <button
                onClick={add}
                disabled={!name.trim()}
                className="px-4 py-1.5 text-sm font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 transition-opacity hover:opacity-80"
              >
                Add method
              </button>
            </div>
          </div>

          {data.paymentMethods.length > 0 ? (
            <div className="space-y-2">
              {data.paymentMethods.map(m => (
                <div
                  key={m.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--surface)] transition-all animate-row-in"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--bg)] transition-colors">
                    <CreditCard size={14} className="text-[var(--muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {m.details && <p className="text-xs text-[var(--muted)] truncate mt-0.5">{m.details}</p>}
                  </div>
                  <button
                    onClick={() => remove(m.id)}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-red-500/10 flex-shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-3">
                <CreditCard size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm text-[var(--muted)]">No payment methods yet</p>
              <p className="text-xs text-[var(--muted)] mt-1 opacity-60">Add methods to select them per invoice</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
