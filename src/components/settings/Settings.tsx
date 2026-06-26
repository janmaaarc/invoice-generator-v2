import { Input, Button } from '../ui'
import { DEFAULT_SETTINGS } from '../../types'
import type { AppData } from '../../types'

interface SettingsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">{children}</p>
}

export function Settings({ data, onChange, onSave }: SettingsProps) {
  const s = data.settings
  function set<K extends keyof typeof s>(key: K, value: typeof s[K]) {
    onChange({ ...data, settings: { ...s, [key]: value } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Settings</h2>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-lg">

        <div>
          <SectionLabel>Your Info</SectionLabel>
          <div className="space-y-3">
            <Input label="Name" value={s.defaultFromName} onChange={e => set('defaultFromName', e.target.value)} placeholder="Your name or company" />
            <Input label="Email" type="email" value={s.defaultFromEmail} onChange={e => set('defaultFromEmail', e.target.value)} placeholder="you@example.com" />
            <Input label="Address" value={s.defaultFromAddress} onChange={e => set('defaultFromAddress', e.target.value)} placeholder="Street, City, Country" />
          </div>
        </div>

        <div>
          <SectionLabel>Invoice Numbers</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prefix" value={s.invoiceNumberPrefix} onChange={e => set('invoiceNumberPrefix', e.target.value)} placeholder="INV" />
            <Input label="Last Number" type="number" value={String(s.lastInvoiceNumber)} onChange={e => set('lastInvoiceNumber', Number(e.target.value))} />
          </div>
        </div>

        <div>
          <SectionLabel>Default Payment</SectionLabel>
          <div className="space-y-3">
            <Input label="Method" value={s.defaultPaymentMethod} onChange={e => set('defaultPaymentMethod', e.target.value)} placeholder="PayPal, Bank Transfer…" />
            <Input label="Details" value={s.defaultPaymentDetails} onChange={e => set('defaultPaymentDetails', e.target.value)} placeholder="Account or email" />
          </div>
        </div>

        <div>
          <SectionLabel>Logo</SectionLabel>
          <input
            type="file"
            accept="image/*"
            className="text-sm text-[var(--muted)]"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => set('logo', ev.target?.result as string)
              reader.readAsDataURL(file)
            }}
          />
          {s.logo && <img src={s.logo} alt="Logo preview" className="mt-3 h-10 object-contain" />}
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: 'var(--color-red, #ef4444)' }}
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) {
                onChange({ ...data, settings: { ...DEFAULT_SETTINGS } })
              }
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
