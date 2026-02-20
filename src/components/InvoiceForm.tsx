import { useState } from 'react';
import { CURRENCIES, DUE_DATE_PRESETS, calculateDueDate } from '../types';
import type { InvoiceData, LineItem, SavedClient } from '../types';

interface InvoiceFormProps {
  invoice: InvoiceData;
  onChange: (invoice: InvoiceData) => void;
  clients?: SavedClient[];
}

export function InvoiceForm({ invoice, onChange, clients = [] }: InvoiceFormProps) {
  const updateField = <K extends keyof InvoiceData>(
    field: K,
    value: InvoiceData[K]
  ) => {
    onChange({ ...invoice, [field]: value });
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  };

  const addLineItem = () => {
    onChange({
      ...invoice,
      lineItems: [
        ...invoice.lineItems,
        { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 },
      ],
    });
  };

  const removeLineItem = (id: string) => {
    if (invoice.lineItems.length <= 1) return;
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.filter((item) => item.id !== id),
    });
  };

  const duplicateLineItem = (id: string) => {
    const index = invoice.lineItems.findIndex((item) => item.id === id);
    if (index === -1) return;
    const item = invoice.lineItems[index];
    const newItem = { ...item, id: crypto.randomUUID() };
    const newItems = [...invoice.lineItems];
    newItems.splice(index + 1, 0, newItem);
    onChange({ ...invoice, lineItems: newItems });
  };

  const moveLineItem = (id: string, direction: 'up' | 'down') => {
    const index = invoice.lineItems.findIndex((item) => item.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === invoice.lineItems.length - 1) return;

    const newItems = [...invoice.lineItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange({ ...invoice, lineItems: newItems });
  };

  const currency = CURRENCIES.find((c) => c.code === invoice.currency) || CURRENCIES[0];
  const subtotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  const formatCurrency = (amount: number) =>
    `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  const getRateValue = (itemId: string, rate: number) =>
    itemId in editingRates ? editingRates[itemId] : (rate === 0 ? '' : rate);

  const handleRateFocus = (itemId: string, rate: number) => {
    setEditingRates(prev => ({ ...prev, [itemId]: rate === 0 ? '' : String(rate) }));
  };

  const handleRateChange = (itemId: string, rawValue: string) => {
    const val = rawValue.replace(/[^0-9.]/g, '');
    setEditingRates(prev => ({ ...prev, [itemId]: val }));
    const parsed = parseFloat(val);
    updateLineItem(itemId, { rate: !isNaN(parsed) ? parsed : 0 });
  };

  const handleRateBlur = (itemId: string) => {
    setEditingRates(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const getPaymentPlaceholder = (method: string): string => {
    const lower = method.toLowerCase().trim();
    if (lower.includes('paypal')) return 'paypal.me/username';
    if (lower.includes('wise')) return 'wise.com/pay/...';
    if (lower.includes('venmo')) return 'venmo.com/username';
    if (lower.includes('cash app') || lower.includes('cashapp')) return '$cashtag';
    if (lower.includes('bank') || lower.includes('wire')) return 'IBAN or account number';
    return 'Account, email, or payment link';
  };

  const isPaymentLinkMethod = (method: string): boolean => {
    const lower = method.toLowerCase().trim();
    return ['paypal', 'wise', 'venmo', 'cash app', 'cashapp'].some(m => lower.includes(m));
  };

  const inputClass =
    'w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all duration-200';
  const labelClass = 'block text-sm text-neutral-500 dark:text-neutral-400 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Invoice Details */}
      <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Invoice Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Invoice Number</label>
            <input
              type="text"
              className={inputClass}
              placeholder="INV-2024-001"
              value={invoice.invoiceNumber}
              onChange={(e) => updateField('invoiceNumber', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select
              className={inputClass}
              value={invoice.currency}
              onChange={(e) => updateField('currency', e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Invoice Date</label>
            <input
              type="date"
              className={inputClass}
              value={invoice.invoiceDate}
              onChange={(e) => updateField('invoiceDate', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <div className="flex gap-2">
              <select
                className={`${inputClass} flex-1`}
                value={DUE_DATE_PRESETS.some(p => p.value === invoice.dueDate || calculateDueDate(p.value, invoice.invoiceDate) === invoice.dueDate) ?
                  DUE_DATE_PRESETS.find(p => p.value === invoice.dueDate || calculateDueDate(p.value, invoice.invoiceDate) === invoice.dueDate)?.value || 'custom' : 'custom'}
                onChange={(e) => {
                  const preset = e.target.value;
                  if (preset === 'custom') {
                    updateField('dueDate', invoice.invoiceDate);
                  } else {
                    updateField('dueDate', calculateDueDate(preset, invoice.invoiceDate));
                  }
                }}
              >
                {DUE_DATE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              {invoice.dueDate !== 'Upon receipt' && (
                <input
                  type="date"
                  className={inputClass}
                  style={{ width: '140px' }}
                  value={invoice.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* From */}
      <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">From</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Your name"
              value={invoice.fromName}
              onChange={(e) => updateField('fromName', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              value={invoice.fromEmail}
              onChange={(e) => updateField('fromEmail', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Your address"
              value={invoice.fromAddress}
              onChange={(e) => updateField('fromAddress', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Bill To */}
      <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Bill To</h3>
          {clients.length > 0 && (
            <select
              className="text-xs px-2 py-1 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded text-neutral-600 dark:text-neutral-400"
              value=""
              onChange={(e) => {
                const client = clients.find((c) => c.id === e.target.value);
                if (client) {
                  onChange({
                    ...invoice,
                    toName: client.name,
                    toEmail: client.email,
                    toAddress: client.address,
                  });
                }
              }}
            >
              <option value="">Select saved client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Client name"
              value={invoice.toName}
              onChange={(e) => updateField('toName', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Client Email</label>
            <input
              type="email"
              className={inputClass}
              placeholder="client@company.com"
              value={invoice.toEmail}
              onChange={(e) => updateField('toEmail', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Client Address</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Client address"
              value={invoice.toAddress}
              onChange={(e) => updateField('toAddress', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Line Items */}
      <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Items</h3>

        {/* Header - desktop */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 mb-2 px-1">
          <div className="col-span-5 text-xs text-neutral-400">Description</div>
          <div className="col-span-2 text-xs text-neutral-400">Qty</div>
          <div className="col-span-2 text-xs text-neutral-400">Rate</div>
          <div className="col-span-1 text-xs text-neutral-400 text-right">Amount</div>
          <div className="col-span-2"></div>
        </div>

        <div className="space-y-2">
          {invoice.lineItems.map((item) => (
            <div
              key={item.id}
              className="group p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
            >
              {/* Mobile */}
              <div className="sm:hidden space-y-3">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">Qty</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inputClass}
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        updateLineItem(item.id, { quantity: val === '' ? 0 : parseInt(val, 10) });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                          updateLineItem(item.id, { quantity: 1 });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">Rate</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputClass}
                      value={getRateValue(item.id, item.rate)}
                      onFocus={() => handleRateFocus(item.id, item.rate)}
                      onChange={(e) => handleRateChange(item.id, e.target.value)}
                      onBlur={() => handleRateBlur(item.id)}
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block">Amount</label>
                      <div className="py-2 text-sm font-medium text-neutral-900 dark:text-white">
                        {formatCurrency(item.quantity * item.rate)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateLineItem(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        title="Duplicate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        disabled={invoice.lineItems.length <= 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      updateLineItem(item.id, { quantity: val === '' ? 0 : parseInt(val, 10) });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                        updateLineItem(item.id, { quantity: 1 });
                      }
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    className={inputClass}
                    value={getRateValue(item.id, item.rate)}
                    onFocus={() => handleRateFocus(item.id, item.rate)}
                    onChange={(e) => handleRateChange(item.id, e.target.value)}
                    onBlur={() => handleRateBlur(item.id)}
                  />
                </div>
                <div className="col-span-1 text-right text-sm font-medium text-neutral-900 dark:text-white">
                  {formatCurrency(item.quantity * item.rate)}
                </div>
                <div className="col-span-2 flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    type="button"
                    onClick={() => moveLineItem(item.id, 'up')}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30"
                    disabled={invoice.lineItems.indexOf(item) === 0}
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLineItem(item.id, 'down')}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30"
                    disabled={invoice.lineItems.indexOf(item) === invoice.lineItems.length - 1}
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateLineItem(item.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    title="Duplicate"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="p-1 text-neutral-400 hover:text-red-500 disabled:opacity-30"
                    disabled={invoice.lineItems.length <= 1}
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="mt-3 w-full sm:w-auto px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
        >
          + Add item
        </button>

        {/* Subtotal */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Total</span>
          <span className="text-lg font-medium text-neutral-900 dark:text-white">{formatCurrency(subtotal)}</span>
        </div>
      </section>

      {/* Payment */}
      <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Payment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Method</label>
            <input
              type="text"
              className={inputClass}
              placeholder="PayPal, Bank Transfer..."
              value={invoice.paymentMethod}
              onChange={(e) => updateField('paymentMethod', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Details</label>
            <input
              type="text"
              className={inputClass}
              placeholder={getPaymentPlaceholder(invoice.paymentMethod)}
              value={invoice.paymentDetails}
              onChange={(e) => updateField('paymentDetails', e.target.value)}
            />
            {isPaymentLinkMethod(invoice.paymentMethod) && (
              <p className="text-xs text-neutral-400 mt-1">
                Paste a payment link to auto-generate a QR code
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Notes</h3>
          <span className="text-xs text-neutral-400">Optional</span>
        </div>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="Additional notes or terms..."
          value={invoice.notes}
          onChange={(e) => updateField('notes', e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'Thank you for your business!',
            'Payment due within 30 days',
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => updateField('notes', invoice.notes ? `${invoice.notes}\n${suggestion}` : suggestion)}
              className="text-xs px-2.5 py-1 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded-md hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
