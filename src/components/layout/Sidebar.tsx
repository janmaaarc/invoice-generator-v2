import { Plus, Settings, Sun, Moon, Search, X, FileText, Users } from 'lucide-react'

export type Section = 'invoices' | 'clients'

interface SidebarProps {
  onNewInvoice: () => void
  onSettingsOpen: () => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  children: React.ReactNode
  searchQuery: string
  onSearchChange: (q: string) => void
  section: Section
  onSectionChange: (s: Section) => void
}

export function Sidebar({ onNewInvoice, onSettingsOpen, theme, onThemeToggle, children, searchQuery, onSearchChange, section, onSectionChange }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Invoix" className="w-[15px] h-[15px] dark:invert opacity-70" />
          <span className="text-[13px] tracking-[-0.02em]">
            <span className="font-medium text-[var(--text)]">Invo</span><span className="font-black text-[var(--text)]">ix</span>
          </span>
        </div>
        <button
          onClick={onThemeToggle}
          className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>

      {/* Nav tabs */}
      <div className="flex px-3 pb-3 gap-1">
        {([
          { id: 'invoices', label: 'Invoices', Icon: FileText },
          { id: 'clients', label: 'Clients', Icon: Users },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-1.5 text-xs rounded-md transition-colors ${
              section === id
                ? 'bg-[var(--bg)] text-[var(--text)] font-medium'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {section === 'invoices' && (
        <>
          {/* Search */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-1.5 focus-within:border-[var(--text)] transition-colors">
              <Search size={11} className="text-[var(--muted)] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-xs bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--muted)]"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* New Invoice */}
          <div className="px-4 pb-4">
            <button
              onClick={onNewInvoice}
              className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors text-xs"
            >
              <Plus size={12} />
              New invoice
            </button>
          </div>

          {/* Invoice list */}
          <div className="flex-1 overflow-y-auto px-2">
            {children}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[var(--border)] mt-auto">
        <button
          onClick={onSettingsOpen}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors text-sm"
        >
          <Settings size={13} />
          Settings
        </button>
      </div>
    </div>
  )
}
