import { useState, useEffect, useCallback, useRef } from 'react'
import { Shell } from './components/layout/Shell'
import { Sidebar, type Section } from './components/layout/Sidebar'
import { InvoiceList } from './components/invoice/InvoiceList'
import { InvoiceEditor } from './components/invoice/InvoiceEditor'
import { InvoicePreview } from './components/invoice/InvoicePreview'
import { useTheme } from './hooks/useTheme'
import { loadAppData, saveAppData } from './storage'
import { createNewInvoice, generateEmailShareLink, generateWhatsAppShareLink, sanitizeFilename } from './types'
import type { AppData, InvoiceData, InvoiceStatus } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState<Section>('invoices')
  const [data, setData] = useState<AppData>(() => loadAppData())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'editor' | 'preview'>('editor')
  const previewRef = useRef<HTMLDivElement>(null)

  const selectedInvoice = data.invoices.find(inv => inv.id === selectedId) ?? null

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

  function handleChange(invoice: InvoiceData) {
    const nextData: AppData = {
      ...data,
      invoices: data.invoices.map(inv => inv.id === invoice.id ? invoice : inv),
    }
    setData(nextData)
  }

  function handleStatusChange(status: InvoiceStatus) {
    if (!selectedInvoice) return
    handleChange({ ...selectedInvoice, status, updatedAt: new Date().toISOString() })
  }

  function handleShare(type: 'email' | 'whatsapp') {
    if (!selectedInvoice) return
    const link = type === 'email'
      ? generateEmailShareLink(selectedInvoice)
      : generateWhatsAppShareLink(selectedInvoice)
    window.open(link, '_blank')
  }

  async function handleDownloadPdf() {
    if (!selectedInvoice || !previewRef.current) return
    const html2pdf = (await import('html2pdf.js')).default
    const filename = sanitizeFilename(`${selectedInvoice.invoiceNumber}-${selectedInvoice.toName || 'invoice'}`)
    await html2pdf()
      .set({
        margin: 0,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
      })
      .from(previewRef.current)
      .save()
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if (!isInput && e.key.toLowerCase() === 'n') { e.preventDefault(); handleNewInvoice() }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setView(v => v === 'editor' ? 'preview' : 'editor') }
  }, [data])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      {selectedInvoice && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
          <InvoicePreview ref={previewRef} invoice={selectedInvoice} settings={data.settings} />
        </div>
      )}
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
        !selectedInvoice || section !== 'invoices'
          ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
              <p className="text-sm">No invoice selected</p>
              <p className="text-xs">
                Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one
              </p>
            </div>
          )
          : (
            <InvoiceEditor
              invoice={selectedInvoice}
              data={data}
              onChange={handleChange}
              onSave={handleSave}
              onDownloadPdf={handleDownloadPdf}
              onShare={handleShare}
              onStatusChange={handleStatusChange}
              view={view}
              onViewChange={setView}
            />
          )
      }
    />
    </>
  )
}
