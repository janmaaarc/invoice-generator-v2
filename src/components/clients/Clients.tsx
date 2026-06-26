import { useState } from 'react'
import { Trash2, User } from 'lucide-react'
import type { AppData, SavedClient } from '../../types'

interface ClientsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const emptyClient = (): SavedClient => ({ id: crypto.randomUUID(), name: '', email: '', address: '' })

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

export function Clients({ data, onChange, onSave }: ClientsProps) {
  const [draft, setDraft] = useState<SavedClient>(emptyClient())

  function addClient() {
    if (!draft.name.trim()) return
    onChange({ ...data, clients: [...data.clients, draft] })
    setDraft(emptyClient())
    onSave()
  }

  function removeClient(id: string) {
    onChange({ ...data, clients: data.clients.filter(c => c.id !== id) })
    onSave()
  }

  return (
    <div className="flex flex-col h-full animate-section">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">Clients</h2>
          {data.clients.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[var(--surface)] text-[var(--muted)] tabular-nums">
              {data.clients.length}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)]">Saved for quick selection in invoices</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-6 space-y-6">

          {/* Add form */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">New client</p>
            </div>
            <div className="px-4 pb-4 space-y-2.5">
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Name</label>
                <input
                  className={inputCls}
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="Acme Corp"
                  onKeyDown={e => e.key === 'Enter' && addClient()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Email</label>
                <input
                  type="email"
                  className={inputCls}
                  value={draft.email}
                  onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                  placeholder="billing@example.com"
                  onKeyDown={e => e.key === 'Enter' && addClient()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Address</label>
                <input
                  className={inputCls}
                  value={draft.address}
                  onChange={e => setDraft(d => ({ ...d, address: e.target.value }))}
                  placeholder="Street, City, Country"
                  onKeyDown={e => e.key === 'Enter' && addClient()}
                />
              </div>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3 flex justify-end">
              <button
                onClick={addClient}
                disabled={!draft.name.trim()}
                className="px-4 py-1.5 text-sm font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 transition-opacity hover:opacity-80"
              >
                Add client
              </button>
            </div>
          </div>

          {/* Saved list */}
          {data.clients.length > 0 ? (
            <div className="space-y-2">
              {data.clients.map(client => (
                <div
                  key={client.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--surface)] transition-all animate-row-in"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
                    {initials(client.name) || <User size={14} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {client.email && <span className="text-xs text-[var(--muted)] truncate">{client.email}</span>}
                      {client.email && client.address && <span className="text-[var(--border)] text-xs">·</span>}
                      {client.address && <span className="text-xs text-[var(--muted)] truncate">{client.address}</span>}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeClient(client.id)}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-red-500/10 flex-shrink-0"
                    aria-label="Remove client"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center mb-3">
                <User size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm text-[var(--muted)]">No clients yet</p>
              <p className="text-xs text-[var(--muted)] mt-1 opacity-60">Add a client above to reuse in invoices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
