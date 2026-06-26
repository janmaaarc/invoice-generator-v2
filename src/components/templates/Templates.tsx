import { useState } from 'react'
import { Trash2, Layers } from 'lucide-react'
import { formatCurrency } from '../../types'
import type { AppData, SavedLineItem } from '../../types'

interface TemplatesProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

export function Templates({ data, onChange, onSave }: TemplatesProps) {
  const [desc, setDesc] = useState('')
  const [rate, setRate] = useState('')

  function addTemplate() {
    if (!desc.trim()) return
    const item: SavedLineItem = { id: crypto.randomUUID(), description: desc.trim(), rate: Number(rate) || 0 }
    onChange({ ...data, lineItemTemplates: [...data.lineItemTemplates, item] })
    setDesc('')
    setRate('')
    onSave()
  }

  function removeTemplate(id: string) {
    onChange({ ...data, lineItemTemplates: data.lineItemTemplates.filter(i => i.id !== id) })
    onSave()
  }

  const currency = data.settings ? 'USD' : 'USD'

  return (
    <div className="flex flex-col h-full animate-section">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">Line Items</h2>
          {data.lineItemTemplates.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[var(--surface)] text-[var(--muted)] tabular-nums">
              {data.lineItemTemplates.length}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)]">Reusable services and products</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-6 space-y-6">

          {/* Add form */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">New template</p>
            </div>
            <div className="px-4 pb-4 space-y-2.5">
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Description</label>
                <input
                  className={inputCls}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Design consultation"
                  onKeyDown={e => e.key === 'Enter' && addTemplate()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Default rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className={`${inputCls} pl-7`}
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    placeholder="0.00"
                    onKeyDown={e => e.key === 'Enter' && addTemplate()}
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3 flex justify-end">
              <button
                onClick={addTemplate}
                disabled={!desc.trim()}
                className="px-4 py-1.5 text-sm font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 transition-opacity hover:opacity-80"
              >
                Add template
              </button>
            </div>
          </div>

          {/* Saved list */}
          {data.lineItemTemplates.length > 0 ? (
            <div className="space-y-2">
              {data.lineItemTemplates.map(t => (
                <div
                  key={t.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--surface)] transition-all animate-row-in"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--bg)] transition-colors">
                    <Layers size={14} className="text-[var(--muted)]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                  </div>

                  {/* Rate pill */}
                  {t.rate > 0 && (
                    <span className="text-xs font-mono tabular-nums text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)] flex-shrink-0 group-hover:bg-[var(--bg)] transition-colors">
                      {formatCurrency(t.rate, currency)}
                    </span>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => removeTemplate(t.id)}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-red-500/10 flex-shrink-0"
                    aria-label="Remove template"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-3">
                <Layers size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm text-[var(--muted)]">No templates yet</p>
              <p className="text-xs text-[var(--muted)] mt-1 opacity-60">Save services you invoice often for quick reuse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
