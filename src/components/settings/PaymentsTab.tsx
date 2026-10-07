import { useState } from 'react'
import { Check, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { hasBankDetails, bankDetailRows, EMPTY_BANK_DETAILS } from '../../types'
import type { SavedPaymentMethod, BankDetails } from '../../types'
import { inputCls, SectionTitle, type TabProps } from './shared'

const isBankType = (key: string): boolean => key === 'bank' || key === 'swift' || key === 'wise' || key === 'payoneer'

export function PaymentsTab({ data, onChange, onSave }: TabProps) {
  const [paymentDraft, setPaymentDraft] = useState<SavedPaymentMethod>({ id: crypto.randomUUID(), name: '', details: '', type: 'simple' })
  const [selectedPayType, setSelectedPayType] = useState<string>('paypal')
  const [draftBankDetails, setDraftBankDetails] = useState<BankDetails>({ ...EMPTY_BANK_DETAILS })
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)

  function savePayment() {
    const isBank = isBankType(selectedPayType)
    if (!paymentDraft.name.trim()) return
    if (isBank && !hasBankDetails(draftBankDetails)) return
    // keep the id when editing so the method stays the same record
    const id = editingPaymentId ?? crypto.randomUUID()
    const method: SavedPaymentMethod = isBank
      ? { id, name: paymentDraft.name, details: '', type: 'bank', bankDetails: { ...draftBankDetails } }
      : { id, name: paymentDraft.name, details: paymentDraft.details, type: 'simple' }
    onChange({
      ...data,
      paymentMethods: editingPaymentId
        ? data.paymentMethods.map(m => m.id === editingPaymentId ? method : m)
        : [...data.paymentMethods, method],
    })
    onSave()
    resetPaymentDraft()
  }

  function resetPaymentDraft() {
    setPaymentDraft({ id: crypto.randomUUID(), name: '', details: '', type: 'simple' })
    setDraftBankDetails({ ...EMPTY_BANK_DETAILS })
    setEditingPaymentId(null)
  }

  function startEditPayment(m: SavedPaymentMethod) {
    setEditingPaymentId(m.id)
    setSelectedPayType(m.type === 'bank' ? 'bank' : 'custom')
    setPaymentDraft({ id: m.id, name: m.name, details: m.details, type: m.type ?? 'simple' })
    // merge over the empty shape so methods saved before newer fields keep controlled inputs
    setDraftBankDetails({ ...EMPTY_BANK_DETAILS, ...(m.bankDetails ?? {}) })
    setExpandedPaymentId(null)
  }

  function removePayment(id: string) {
    onChange({ ...data, paymentMethods: data.paymentMethods.filter(m => m.id !== id) })
    onSave()
    if (editingPaymentId === id) resetPaymentDraft()
  }

  const TYPES = [
    { key: 'paypal',  label: 'PayPal',         isBank: false, nameFill: 'PayPal',         placeholder: 'PayPal email or link' },
    { key: 'gcash',   label: 'GCash',           isBank: false, nameFill: 'GCash',           placeholder: '+63 9XX XXX XXXX' },
    { key: 'maya',    label: 'Maya',             isBank: false, nameFill: 'Maya',             placeholder: '+63 9XX XXX XXXX' },
    { key: 'bank',    label: 'Bank Transfer',   isBank: true,  nameFill: 'Bank Transfer',   placeholder: '' },
    { key: 'swift',   label: 'SWIFT',           isBank: true,  nameFill: 'SWIFT',           placeholder: '' },
    { key: 'wise',    label: 'Wise',            isBank: true,  nameFill: 'Wise',            placeholder: '' },
    { key: 'wiselink', label: 'Wise Link',      isBank: false, nameFill: 'Wise Link',       placeholder: 'https://wise.com/pay/me/...' },
    { key: 'payoneer', label: 'Payoneer EUR',   isBank: true,  nameFill: 'Payoneer EUR',    placeholder: '' },
    { key: 'custom',  label: '+ Custom',        isBank: false, nameFill: '',                placeholder: 'Account, link, or details' },
  ] as const

  // Wise USD accounts always route through this bank, so prefill the constant parts
  const WISE_PREFILL: Partial<BankDetails> = {
    bankName: 'Wise US Inc',
    address: '108 W 13th St, Wilmington, DE, 19801, United States',
    accountType: 'Checking',
    swiftCode: 'TRWIUS35XXX',
  }
  // Payoneer EUR receiving accounts are held at Banking Circle, so prefill the constant parts
  const PAYONEER_PREFILL: Partial<BankDetails> = {
    bankName: 'Banking Circle S.A.',
    address: '2 Boulevard de la Foire, L-1528 Luxembourg',
    swiftCode: 'BCIRLULL',
  }
  const activeType = TYPES.find(t => t.key === selectedPayType) ?? TYPES[0]
  const isBank = activeType.isBank

  return (
    <>
      <SectionTitle>Payments</SectionTitle>
      <p className="text-xs text-[var(--muted)] mb-5">Add payment methods to quick-pick per invoice.</p>

      {/* Type selector chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => {
              setSelectedPayType(t.key)
              setPaymentDraft(d => ({ ...d, name: editingPaymentId ? d.name : t.nameFill, details: editingPaymentId ? d.details : '' }))
              setDraftBankDetails(d => editingPaymentId ? d : { ...EMPTY_BANK_DETAILS, ...(t.key === 'wise' ? WISE_PREFILL : t.key === 'payoneer' ? PAYONEER_PREFILL : {}) })
            }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              selectedPayType === t.key
                ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                : 'text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Label</p>
          <input
            className={inputCls}
            value={paymentDraft.name}
            onChange={e => setPaymentDraft(d => ({ ...d, name: e.target.value }))}
            placeholder={activeType.nameFill || 'e.g. My GCash'}
          />
        </div>

        {isBank ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Bank name</p>
                <input className={inputCls} value={draftBankDetails.bankName} onChange={e => setDraftBankDetails(d => ({ ...d, bankName: e.target.value }))} placeholder="e.g. Chase Bank" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Account name</p>
                <input className={inputCls} value={draftBankDetails.accountName} onChange={e => setDraftBankDetails(d => ({ ...d, accountName: e.target.value }))} placeholder="e.g. John Doe" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Account number</p>
                <input className={inputCls} value={draftBankDetails.accountNumber} onChange={e => setDraftBankDetails(d => ({ ...d, accountNumber: e.target.value }))} placeholder="e.g. 1234567890" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">IBAN</p>
                <input className={inputCls} value={draftBankDetails.iban ?? ''} onChange={e => setDraftBankDetails(d => ({ ...d, iban: e.target.value }))} placeholder="e.g. LU00 0000 0000 0000 0000" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Account type</p>
                <input className={inputCls} value={draftBankDetails.accountType ?? ''} onChange={e => setDraftBankDetails(d => ({ ...d, accountType: e.target.value }))} placeholder="e.g. Checking" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Routing number</p>
                <input className={inputCls} value={draftBankDetails.routingNumber ?? ''} onChange={e => setDraftBankDetails(d => ({ ...d, routingNumber: e.target.value }))} placeholder="e.g. 101019628" />
                <p className="text-[10px] text-[var(--muted)] mt-1">For wire and ACH, when sending from the US</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">SWIFT / BIC</p>
                <input className={inputCls} value={draftBankDetails.swiftCode} onChange={e => setDraftBankDetails(d => ({ ...d, swiftCode: e.target.value }))} placeholder="e.g. TRWIUS35XXX" />
                <p className="text-[10px] text-[var(--muted)] mt-1">When sending from outside the US</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Bank address</p>
              <input className={inputCls} value={draftBankDetails.address} onChange={e => setDraftBankDetails(d => ({ ...d, address: e.target.value }))} placeholder="e.g. 108 W 13th St, Wilmington, DE, 19801, United States" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Your address</p>
              <input className={inputCls} value={draftBankDetails.holderAddress ?? ''} onChange={e => setDraftBankDetails(d => ({ ...d, holderAddress: e.target.value }))} placeholder="e.g. 123 Main St, Cebu City, 6000, Philippines" />
            </div>
          </>
        ) : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Details</p>
            <input
              className={inputCls}
              value={paymentDraft.details}
              onChange={e => setPaymentDraft(d => ({ ...d, details: e.target.value }))}
              placeholder={activeType.placeholder}
              onKeyDown={e => e.key === 'Enter' && savePayment()}
            />
          </div>
        )}

        <div className="flex justify-end items-center gap-2 pt-1">
          {editingPaymentId && (
            <button onClick={resetPaymentDraft} className="px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={savePayment}
            disabled={!paymentDraft.name.trim() || (isBank && !hasBankDetails(draftBankDetails))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-md disabled:opacity-30 hover:opacity-80 transition-opacity"
          >
            {editingPaymentId ? <><Check size={12} /> Update method</> : <><Plus size={12} /> Save method</>}
          </button>
        </div>
      </div>

      {/* Saved list */}
      {data.paymentMethods.length > 0 ? (
        <div className="space-y-1">
          {data.paymentMethods.map(m => {
            const isExpanded = expandedPaymentId === m.id
            const bd = m.type === 'bank' ? m.bankDetails : null
            return (
            <div key={m.id} className="rounded-md bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
              <div
                className="group flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[var(--bg)] transition-colors"
                onClick={() => setExpandedPaymentId(isExpanded ? null : m.id)}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className={`flex-shrink-0 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    m.type === 'bank'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-[var(--border)] text-[var(--muted)]'
                  }`}>
                    {m.type === 'bank' ? 'Bank' : 'Pay'}
                  </span>
                  <span className="text-sm font-medium text-[var(--text)] flex-shrink-0">{m.name}</span>
                  {!isExpanded && m.details && <span className="text-xs text-[var(--muted)] truncate">{m.details}</span>}
                  {!isExpanded && bd && hasBankDetails(bd) && (
                    <span className="text-xs text-[var(--muted)] truncate">{bd.bankName}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <button onClick={e => { e.stopPropagation(); startEditPayment(m) }} aria-label={`Edit ${m.name}`} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--text)] rounded transition-all">
                    <Pencil size={12} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); removePayment(m.id) }} aria-label={`Delete ${m.name}`} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-red-500 rounded transition-all">
                    <Trash2 size={12} />
                  </button>
                  <ChevronRight size={12} className={`text-[var(--muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-[var(--border)] pt-2.5 space-y-1.5">
                  {bd && hasBankDetails(bd) ? (
                    <>
                      {bankDetailRows(bd).map(([label, value]) => (
                        <div key={label} className="flex gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] w-28 flex-shrink-0 pt-0.5 leading-tight">{label}</span>
                          <span className="text-xs text-[var(--text)]">{value}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-[var(--muted)]">{m.details || '—'}</p>
                  )}
                </div>
              )}
            </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-14 rounded-md border border-dashed border-[var(--border)]">
          <p className="text-[11px] text-[var(--muted)] opacity-50">No methods saved yet</p>
        </div>
      )}
    </>
  )
}
