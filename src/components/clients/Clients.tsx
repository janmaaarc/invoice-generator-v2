import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Button } from '../ui'
import type { AppData, SavedClient } from '../../types'

interface ClientsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const emptyClient = (): SavedClient => ({ id: crypto.randomUUID(), name: '', email: '', address: '' })

export function Clients({ data, onChange, onSave }: ClientsProps) {
  const [draft, setDraft] = useState<SavedClient>(emptyClient())

  function addClient() {
    if (!draft.name.trim()) return
    onChange({ ...data, clients: [...data.clients, draft] })
    setDraft(emptyClient())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Clients</h2>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Add Client</p>
          <Input label="Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Client name" />
          <Input label="Email" type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} placeholder="client@example.com" />
          <Input label="Address" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} placeholder="Street, City, Country" />
          <Button size="sm" variant="outline" onClick={addClient}>
            <Plus size={13} /> Add Client
          </Button>
        </div>

        {data.clients.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Saved Clients</p>
            <div className="space-y-2">
              {data.clients.map(client => (
                <div key={client.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[var(--surface)] group">
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
                    {client.email && <p className="text-xs text-[var(--muted)]">{client.email}</p>}
                  </div>
                  <button
                    onClick={() => onChange({ ...data, clients: data.clients.filter(c => c.id !== client.id) })}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
