import { useRef } from 'react'
import { Upload, X, Hash, FileText, AlertTriangle } from 'lucide-react'
import { DEFAULT_SETTINGS } from '../../types'
import type { AppData } from '../../types'

interface SettingsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

function SettingCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[var(--muted)]">{icon}</span>
        <p className="text-xs font-semibold tracking-wide text-[var(--text)]">{title}</p>
      </div>
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  )
}

export function Settings({ data, onChange, onSave }: SettingsProps) {
  const s = data.settings
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof typeof s>(key: K, value: typeof s[K]) {
    const next = { ...data, settings: { ...s, [key]: value } }
    onChange(next)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WebP, etc.)')
      return
    }
    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      alert('Logo must be smaller than 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => set('logo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const pdfPreview = (s.pdfFilenameTemplate || '{number}-{client}')
    .replace('{number}', 'INV-2026-001')
    .replace('{client}', 'Acme Corp')
    .replace('{date}', '2026-06-26')

  return (
    <div className="flex flex-col h-full animate-section">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Settings</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Changes save automatically</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-6 space-y-4">

          {/* Your Info + Logo */}
          <SettingCard icon={<FileText size={14} />} title="Your Info">
            <div className="space-y-2.5">
              {/* Logo */}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Logo</label>
                {s.logo ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 px-3 flex items-center bg-white rounded-lg border border-[var(--border)]">
                      <img src={s.logo} alt="Logo" className="h-7 w-auto object-contain" />
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors">Replace</button>
                    <button onClick={() => set('logo', '')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors"><X size={11} /> Remove</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors w-full"
                  >
                    <Upload size={13} />
                    <span className="text-xs">Upload logo</span>
                    <span className="text-[10px] opacity-50 ml-auto">PNG, JPG, SVG</span>
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Name</label>
                <input className={inputCls} value={s.defaultFromName} onChange={e => set('defaultFromName', e.target.value)} placeholder="Your name or company" onBlur={onSave} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Email</label>
                <input type="email" className={inputCls} value={s.defaultFromEmail} onChange={e => set('defaultFromEmail', e.target.value)} placeholder="you@example.com" onBlur={onSave} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Address</label>
                <input className={inputCls} value={s.defaultFromAddress} onChange={e => set('defaultFromAddress', e.target.value)} placeholder="Street, City, Country" onBlur={onSave} />
              </div>
            </div>
          </SettingCard>

          {/* Invoice Numbers */}
          <SettingCard icon={<Hash size={14} />} title="Invoice Numbers">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Prefix</label>
                <input className={inputCls} value={s.invoiceNumberPrefix} onChange={e => set('invoiceNumberPrefix', e.target.value)} placeholder="INV" onBlur={onSave} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Last number</label>
                <input type="number" className={inputCls} value={String(s.lastInvoiceNumber)} onChange={e => set('lastInvoiceNumber', Number(e.target.value))} onBlur={onSave} />
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2.5">
              Next invoice: <span className="font-mono text-[var(--text)]">{s.invoiceNumberPrefix}-{new Date().getFullYear()}-{String(s.lastInvoiceNumber + 1).padStart(3, '0')}</span>
            </p>
          </SettingCard>

          {/* PDF Filename */}
          <SettingCard icon={<FileText size={14} />} title="PDF Filename">
            <div>
              <label className="text-xs font-medium text-[var(--muted)] block mb-1">Template</label>
              <input
                className={inputCls}
                value={s.pdfFilenameTemplate || ''}
                onChange={e => set('pdfFilenameTemplate', e.target.value)}
                placeholder="{number}-{client}"
                onBlur={onSave}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="text-[10px] text-[var(--muted)]">Variables:</span>
              {['{number}', '{client}', '{date}'].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    const cur = s.pdfFilenameTemplate || '{number}-{client}'
                    set('pdfFilenameTemplate', cur + v)
                  }}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
            {(s.pdfFilenameTemplate || '') && (
              <p className="text-[10px] text-[var(--muted)] font-mono mt-2 truncate">
                → {pdfPreview}.pdf
              </p>
            )}
          </SettingCard>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-red-500/10">
              <AlertTriangle size={14} className="text-red-500" />
              <p className="text-xs font-semibold tracking-wide text-red-500">Danger Zone</p>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Reset to defaults</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">Clears all settings. Invoices are not affected.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Reset all settings to defaults?')) {
                    onChange({ ...data, settings: { ...DEFAULT_SETTINGS } })
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-500/30 rounded-md hover:bg-red-500 hover:text-white transition-all flex-shrink-0 ml-4"
              >
                Reset
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
