import { useState, useEffect, useCallback } from 'react'
import { Shell } from './components/layout/Shell'
import { Sidebar, type Section } from './components/layout/Sidebar'
import { InvoiceList } from './components/invoice/InvoiceList'
import { useTheme } from './hooks/useTheme'
import { loadAppData, saveAppData } from './storage'
import { createNewInvoice } from './types'
import type { AppData } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState<Section>('invoices')
  const [data, setData] = useState<AppData>(() => loadAppData())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleNewInvoice() {
    const invoice = createNewInvoice(data.settings)
    const nextData: AppData = {
      ...data,
      invoices: [invoice, ...data.invoices],
      settings: { ...data.settings, lastInvoiceNumber: data.settings.lastInvoiceNumber + 1 },
    }
    setData(nextData)
    saveAppData(nextData)
    setSelectedId(invoice.id)
    setSection('invoices')
  }

  function handleSave() {
    saveAppData(data)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if (!isInput && e.key === 'n') { e.preventDefault(); handleNewInvoice() }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
  }, [data])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Shell
      sidebar={
        <Sidebar
          section={section}
          onSectionChange={setSection}
          onNewInvoice={handleNewInvoice}
          theme={theme}
          onThemeToggle={toggle}
        >
          <InvoiceList
            invoices={data.invoices}
            selectedId={selectedId}
            onSelect={id => { setSelectedId(id); setSection('invoices') }}
          />
        </Sidebar>
      }
      main={
        <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
          <p className="text-sm">No invoice selected</p>
          <p className="text-xs">
            Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one
          </p>
        </div>
      }
    />
  )
}
