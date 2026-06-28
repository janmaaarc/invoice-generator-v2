import { Users, Plus, ChevronLeft } from 'lucide-react'
import type { AppData, SavedClient } from '../../types'
import { getInvoiceTotal, getInvoiceBalance, formatCurrency } from '../../types'

interface Props {
  data: AppData
  onNewInvoice: (client: SavedClient) => void
  onOpenSidebar: () => void
}

export function ClientsView({ data, onNewInvoice, onOpenSidebar }: Props) {
  const { clients, invoices } = data

  function statsFor(client: SavedClient) {
    const mine = invoices.filter(inv =>
      inv.toName.toLowerCase() === client.name.toLowerCase() ||
      (client.email && inv.toEmail?.toLowerCase() === client.email.toLowerCase())
    )
    const latest = [...mine].sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))[0]
    const currency = latest?.currency || 'USD'
    const total = mine.reduce((s, inv) => s + getInvoiceTotal(inv), 0)
    const outstanding = mine
      .filter(inv => inv.status === 'draft' || inv.status === 'sent')
      .reduce((s, inv) => s + getInvoiceBalance(inv), 0)
    return { count: mine.length, currency, total, outstanding, lastDate: latest?.invoiceDate }
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
        <button onClick={onOpenSidebar} className="md:hidden absolute top-4 left-4 p-1 text-[var(--muted)] hover:text-[var(--text)]">
          <ChevronLeft size={18} />
        </button>
        <Users size={24} className="opacity-30" />
        <p className="text-sm">No clients yet</p>
        <p className="text-xs opacity-60">Add clients in Settings</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={onOpenSidebar} className="md:hidden p-1 -ml-1 text-[var(--muted)] hover:text-[var(--text)]">
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-base font-semibold tracking-tight">Clients</h1>
          </div>
          <span className="text-xs text-[var(--muted)]">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="space-y-2">
          {clients.map(client => {
            const stats = statsFor(client)
            return (
              <div key={client.id} className="bg-[var(--surface)] rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text)]">{client.name}</p>
                  {client.email && <p className="text-xs text-[var(--muted)] mt-0.5">{client.email}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">{stats.count}</span> invoice{stats.count !== 1 ? 's' : ''}
                    </span>
                    {stats.count > 0 && (
                      <span className="text-xs text-[var(--muted)]">
                        <span className="font-medium text-[var(--text)]">{formatCurrency(stats.total, stats.currency)}</span> billed
                      </span>
                    )}
                    {stats.outstanding > 0 && (
                      <span className="text-xs font-medium text-amber-500">
                        {formatCurrency(stats.outstanding, stats.currency)} outstanding
                      </span>
                    )}
                    {stats.lastDate && (
                      <span className="text-xs text-[var(--muted)]">Last: {stats.lastDate}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onNewInvoice(client)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-colors flex-shrink-0"
                >
                  <Plus size={12} />
                  Invoice
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
