interface ShellProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  mobilePanel: 'list' | 'detail'
  onCloseSidebar?: () => void
}

export function Shell({ sidebar, main, mobilePanel, onCloseSidebar }: ShellProps) {
  const sidebarOpen = mobilePanel === 'list'

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-[var(--border)] flex-col overflow-hidden bg-[var(--surface)]">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <aside className={`
        md:hidden fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs
        flex flex-col overflow-hidden bg-[var(--surface)] border-r border-[var(--border)]
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebar}
      </aside>

      {/* Main content — always rendered on mobile */}
      <main
        className="flex-1 overflow-auto flex flex-col min-w-0 relative"
        onClick={sidebarOpen ? onCloseSidebar : undefined}
      >
        {/* Backdrop overlay when drawer open */}
        {sidebarOpen && (
          <div className="md:hidden absolute inset-0 z-30 bg-black/40" />
        )}
        {main}
      </main>
    </div>
  )
}
