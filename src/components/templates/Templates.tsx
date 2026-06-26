import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Button } from '../ui'
import type { AppData, SavedLineItem } from '../../types'

interface TemplatesProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

export function Templates({ data, onChange, onSave }: TemplatesProps) {
  const [desc, setDesc] = useState('')
  const [rate, setRate] = useState('')

  function addTemplate() {
    if (!desc.trim()) return
    const item: SavedLineItem = { id: crypto.randomUUID(), description: desc.trim(), rate: Number(rate) || 0 }
    onChange({ ...data, lineItemTemplates: [...data.lineItemTemplates, item] })
    setDesc('')
    setRate('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Templates</h2>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Line Item Templates</p>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Design consultation" />
              <Input label="Rate" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="100" />
            </div>
            <Button size="sm" variant="outline" onClick={addTemplate}>
              <Plus size={13} /> Add Template
            </Button>
          </div>
          {data.lineItemTemplates.length > 0 && (
            <div className="space-y-2 mt-4">
              {data.lineItemTemplates.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[var(--surface)] group">
                  <div>
                    <p className="text-sm">{t.description}</p>
                    <p className="text-xs text-[var(--muted)]">${t.rate.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => onChange({ ...data, lineItemTemplates: data.lineItemTemplates.filter(i => i.id !== t.id) })}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
