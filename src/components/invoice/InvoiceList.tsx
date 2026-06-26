import { formatCurrency, getInvoiceTotal } from '../../types'
import type { InvoiceData } from '../../types'
import { Badge } from '../ui'

interface InvoiceListProps {
  invoices: InvoiceData[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function InvoiceList({ invoices, selectedId, onSelect }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-[var(--muted)]">
        No invoices yet.
        <br />
        Press{' '}
        <kbd className="px-1 py-0.5 text-[10px] border border-[var(--border)] rounded">N</kbd>
        {' '}to create one.
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {invoices.map(invoice => (
        <button
          key={invoice.id}
          onClick={() => onSelect(invoice.id)}
          className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
            selectedId === invoice.id ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-xs font-mono text-[var(--muted)] truncate">{invoice.invoiceNumber}</span>
            <Badge status={invoice.status} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-[var(--text)] truncate">
              {invoice.toName || <span className="text-[var(--muted)] italic">No client</span>}
            </span>
            <span className="text-sm font-medium text-[var(--text)] flex-shrink-0">
              {formatCurrency(getInvoiceTotal(invoice), invoice.currency)}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
