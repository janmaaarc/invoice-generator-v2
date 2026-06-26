import { Plus, Settings, Sun, Moon } from 'lucide-react'
import { Button } from '../ui'

export type Section = 'invoices'

interface SidebarProps {
  onNewInvoice: () => void
  onSettingsOpen: () => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  children: React.ReactNode
}

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? 'bg-[var(--bg)] text-[var(--text)] font-medium'
          : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

export function Sidebar({ onNewInvoice, onSettingsOpen, theme, onThemeToggle, children }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
        <span className="text-sm font-semibold tracking-tight">Invoix</span>
        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className="px-3 pt-3 pb-2">
        <Button className="w-full justify-start" onClick={onNewInvoice}>
          <Plus size={14} />
          New Invoice
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {children}
      </div>

      <div className="border-t border-[var(--border)] px-3 py-3">
        <NavItem icon={Settings} label="Settings" active={false} onClick={onSettingsOpen} />
      </div>
    </div>
  )
}
