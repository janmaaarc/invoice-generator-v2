import type { InvoiceStatus } from '../../types'

const labels: Record<InvoiceStatus, string> = { draft: 'Draft', sent: 'Sent', paid: 'Paid' }

export function Badge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `var(--badge-${status}-bg)`, color: `var(--badge-${status}-text)` }}
    >
      {labels[status]}
    </span>
  )
}
