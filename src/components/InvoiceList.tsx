import type { InvoiceData } from '../types';
import { formatCurrency, getInvoiceTotal } from '../types';

interface InvoiceListProps {
  invoices: InvoiceData[];
  currentInvoiceId?: string;
  onSelect: (invoice: InvoiceData) => void;
  onDelete: (invoiceId: string) => void;
  onDuplicate: (invoice: InvoiceData) => void;
  onStatusChange: (invoiceId: string, status: InvoiceData['status']) => void;
}

const STATUS_STYLES = {
  draft: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  sent: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  paid: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
};

export function InvoiceList({
  invoices,
  currentInvoiceId,
  onSelect,
  onDelete,
  onDuplicate,
  onStatusChange,
}: InvoiceListProps) {
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No invoices yet</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {sortedInvoices.map((invoice) => {
        const isSelected = invoice.id === currentInvoiceId;
        const total = getInvoiceTotal(invoice);

        return (
          <div
            key={invoice.id}
            className={`p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-neutral-100 dark:bg-neutral-800'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
            onClick={() => onSelect(invoice)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {invoice.invoiceNumber}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {invoice.toName || 'No client'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-neutral-400">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {formatCurrency(total, invoice.currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <select
                  value={invoice.status}
                  onChange={(e) => onStatusChange(invoice.id, e.target.value as InvoiceData['status'])}
                  className="text-xs px-2 py-1 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded text-neutral-600 dark:text-neutral-400 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
                <button
                  onClick={() => onDuplicate(invoice)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this invoice?')) {
                      onDelete(invoice.id);
                    }
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
