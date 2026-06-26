interface ShellProps {
  sidebar: React.ReactNode
  main: React.ReactNode
}

export function Shell({ sidebar, main }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <aside className="w-64 flex-shrink-0 border-r border-[var(--border)] flex flex-col overflow-hidden">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-auto">
        {main}
      </main>
    </div>
  )
}
