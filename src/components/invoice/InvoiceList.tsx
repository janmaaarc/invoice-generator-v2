import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Trash2, Copy, RefreshCw } from 'lucide-react'
import { formatCurrency, getInvoiceTotal } from '../../types'
import type { InvoiceData } from '../../types'
import { Badge } from '../ui'

interface InvoiceListProps {
  invoices: InvoiceData[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMakeRecurring: (id: string) => void
}

function RowMenu({ id, onDelete, onDuplicate, onMakeRecurring }: { id: string; onDelete: (id: string) => void; onDuplicate: (id: string) => void; onMakeRecurring: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen(o => !o)
  }

  return (
    <div className="flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[var(--surface)]"
        aria-label="More options"
      >
        <MoreVertical size={13} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, right: pos.right }}
          className="z-50 bg-[var(--bg)] border border-[var(--border)] rounded-md shadow-[0_4px_12px_0_rgb(0,0,0,0.12)] py-1 min-w-32 animate-dropdown"
        >
          <button
            onClick={e => { e.stopPropagation(); onDuplicate(id); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <Copy size={12} /> Duplicate
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMakeRecurring(id); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <RefreshCw size={12} /> Recurring
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(id); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export function InvoiceList({ invoices, selectedId, onSelect, onDelete, onDuplicate, onMakeRecurring }: InvoiceListProps) {
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
        <div
          key={invoice.id}
          className={`group flex items-center rounded-lg transition-colors animate-row-in ${
            selectedId === invoice.id
              ? 'bg-[var(--bg)] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]'
              : 'hover:bg-[var(--bg)]'
          }`}
        >
          <button
            onClick={() => onSelect(invoice.id)}
            className="flex-1 min-w-0 text-left px-3 py-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-[var(--text)] truncate">
                {invoice.toName || <span className="text-[var(--muted)] font-normal">No client</span>}
              </span>
              <span className="text-sm font-semibold text-[var(--text)] flex-shrink-0 tabular-nums">
                {formatCurrency(getInvoiceTotal(invoice), invoice.currency)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-[var(--muted)] truncate flex-1">{invoice.invoiceNumber}</span>
              <Badge status={invoice.status} />
            </div>
          </button>
          <div className="pr-1.5">
            <RowMenu id={invoice.id} onDelete={onDelete} onDuplicate={onDuplicate} onMakeRecurring={onMakeRecurring} />
          </div>
        </div>
      ))}
    </div>
  )
}
