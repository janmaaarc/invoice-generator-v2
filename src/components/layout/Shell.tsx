import { useRef, useEffect } from 'react'

interface ShellProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  mobilePanel: 'list' | 'detail'
}

export function Shell({ sidebar, main, mobilePanel }: ShellProps) {
  const prevPanel = useRef(mobilePanel)

  useEffect(() => {
    prevPanel.current = mobilePanel
  }, [mobilePanel])

  const panelChanged = prevPanel.current !== mobilePanel
  const sidebarAnim = panelChanged && mobilePanel === 'list' ? 'animate-slide-left' : ''
  const mainAnim = panelChanged && mobilePanel === 'detail' ? 'animate-slide-right' : ''

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <aside className={`
        w-full md:w-64 flex-shrink-0 border-r border-[var(--border)] flex-col overflow-hidden bg-[var(--surface)]
        ${mobilePanel === 'list' ? 'flex' : 'hidden'} md:flex ${sidebarAnim}
      `}>
        {sidebar}
      </aside>
      <main className={`
        flex-1 overflow-auto flex-col min-w-0
        ${mobilePanel === 'detail' ? 'flex' : 'hidden'} md:flex ${mainAnim}
      `}>
        {main}
      </main>
    </div>
  )
}
