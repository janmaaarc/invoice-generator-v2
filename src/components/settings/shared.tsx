import type { AppData } from '../../types'

export const inputCls = 'w-full px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--text)] transition-colors'

export function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0 flex-shrink-0 w-36">
        <p className="text-sm text-[var(--text)]">{label}</p>
        {hint && <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[var(--text)] mb-1">{children}</h3>
}

export interface TabProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}
