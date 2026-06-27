import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Shell } from './components/layout/Shell'
import { Sidebar, type Section } from './components/layout/Sidebar'
import { InvoiceList } from './components/invoice/InvoiceList'
import { InvoiceEditor } from './components/invoice/InvoiceEditor'
import { InvoicePreview } from './components/invoice/InvoicePreview'
import { Settings } from './components/settings/Settings'
import { checkAndGenerateDue } from './lib/recurring'
import { requestNotificationPermission, registerServiceWorker, showNotification, cacheRecurringSchedule } from './lib/notifications'
import { useTheme } from './hooks/useTheme'
import { loadAppData, saveAppData } from './storage'
import {
  createNewInvoice, generateEmailShareLink, generateWhatsAppShareLink,
  buildPdfFilename, calculateDueDate,
} from './types'
import type { AppData, InvoiceData, InvoiceStatus } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState<Section>('invoices')
  const [data, setData] = useState<AppData>(() => loadAppData())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'editor' | 'preview'>('editor')
  const [mobilePanel, setMobilePanel] = useState<'list' | 'detail'>('list')
  const [recurringPrefill, setRecurringPrefill] = useState<InvoiceData | undefined>(undefined)
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  const filteredInvoices = searchQuery.trim()
    ? data.invoices.filter(inv =>
        inv.toName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data.invoices

  const selectedInvoice = data.invoices.find(inv => inv.id === selectedId) ?? null

  function handleSelectInvoice(id: string) {
    setSelectedId(id)
    setSection('invoices')
    setMobilePanel('detail')
  }

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
    setMobilePanel('detail')
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  function handleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveAppData(data)
  }

  function handleChange(invoice: InvoiceData) {
    const nextData: AppData = {
      ...data,
      invoices: data.invoices.map(inv => inv.id === invoice.id ? invoice : inv),
    }
    setData(nextData)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveAppData(nextData), 800)
  }

  function handleDeleteInvoice(id: string) {
    const nextData: AppData = { ...data, invoices: data.invoices.filter(inv => inv.id !== id) }
    setData(nextData)
    saveAppData(nextData)
    if (selectedId === id) {
      setSelectedId(nextData.invoices[0]?.id ?? null)
      setMobilePanel('list')
    }
  }

  function handleStatusChange(status: InvoiceStatus) {
    if (!selectedInvoice) return
    handleChange({ ...selectedInvoice, status, updatedAt: new Date().toISOString() })
  }

  function handleMakeRecurring(id: string) {
    const invoice = data.invoices.find(inv => inv.id === id)
    if (!invoice) return
    setRecurringPrefill(invoice)
    setShowSettings(true)
  }

  function handleDuplicate(id: string) {
    const original = data.invoices.find(inv => inv.id === id)
    if (!original) return
    const nextNum = data.settings.lastInvoiceNumber + 1
    const now = new Date().toISOString()
    const duplicate: InvoiceData = {
      ...original,
      id: crypto.randomUUID(),
      invoiceNumber: `${data.settings.invoiceNumberPrefix}-${String(new Date().getFullYear())}-${String(nextNum).padStart(3, '0')}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      sentHistory: [],
      payments: [],
      paidDate: undefined,
    }
    const idx = data.invoices.findIndex(inv => inv.id === id)
    const nextInvoices = [...data.invoices.slice(0, idx + 1), duplicate, ...data.invoices.slice(idx + 1)]
    const nextData: AppData = {
      ...data,
      invoices: nextInvoices,
      settings: { ...data.settings, lastInvoiceNumber: nextNum },
    }
    setData(nextData)
    saveAppData(nextData)
    setSelectedId(duplicate.id)
    setMobilePanel('detail')
  }

  function handleShare(type: 'email' | 'whatsapp') {
    if (!selectedInvoice) return
    const link = type === 'email'
      ? generateEmailShareLink(selectedInvoice)
      : generateWhatsAppShareLink(selectedInvoice)
    window.open(link, '_blank')
    const now = new Date().toISOString()
    const entry: { date: string; method: 'email' | 'whatsapp' | 'pdf' } = { date: now, method: type }
    const updated = { ...selectedInvoice, sentHistory: [...(selectedInvoice.sentHistory || []), entry] }
    const nextData: AppData = { ...data, invoices: data.invoices.map(inv => inv.id === updated.id ? updated : inv) }
    setData(nextData)
    saveAppData(nextData)
  }

  async function handleDownloadPdf() {
    if (!selectedInvoice || !previewRef.current) return
    const html2pdf = (await import('html2pdf.js')).default
    const filename = buildPdfFilename(selectedInvoice, data.settings.pdfFilenameTemplate)
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
    const now = new Date().toISOString()
    const pdfEntry: { date: string; method: 'email' | 'whatsapp' | 'pdf' } = { date: now, method: 'pdf' }
    const updated = { ...selectedInvoice, sentHistory: [...(selectedInvoice.sentHistory || []), pdfEntry] }
    const nextData: AppData = { ...data, invoices: data.invoices.map(inv => inv.id === updated.id ? updated : inv) }
    setData(nextData)
    saveAppData(nextData)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if (!isInput && e.key.toLowerCase() === 'n') { e.preventDefault(); handleNewInvoice() }
    if (!isInput && e.key === '?') { e.preventDefault(); setShowShortcuts(v => !v) }
    if (e.key === 'Escape') { setShowShortcuts(false) }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setView(v => v === 'editor' ? 'preview' : 'editor') }
  }, [data])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    registerServiceWorker()
    requestNotificationPermission()
    const { data: next, generated } = checkAndGenerateDue(data)
    if (generated.length > 0) {
      setData(next)
      saveAppData(next)
      showNotification('Recurring invoices generated', generated.join(', ') + ' — new drafts created')
    }
    cacheRecurringSchedule(data.recurringInvoices.filter(r => r.enabled).map(r => ({ name: r.name, nextDate: r.nextDate })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function renderMain() {
    const sectionKey = section === 'invoices' ? `invoice-${selectedId}` : section
    const wrap = (node: ReactNode) => (
      <div key={sectionKey} className="animate-section flex flex-col h-full">{node}</div>
    )
    if (!selectedInvoice) {
      return wrap(
        <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--muted)]">
          <p className="text-sm">No invoice selected</p>
          <button
            onClick={handleNewInvoice}
            className="md:hidden px-4 py-2 text-sm font-medium bg-[var(--text)] text-[var(--bg)] rounded-lg hover:opacity-80 transition-opacity"
          >
            + New invoice
          </button>
          <p className="hidden md:block text-xs">Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one</p>
        </div>
      )
    }
    return wrap(
      <InvoiceEditor
        invoice={selectedInvoice}
        data={data}
        onChange={handleChange}
        onDownloadPdf={handleDownloadPdf}
        onShare={handleShare}
        onStatusChange={handleStatusChange}
        onDuplicate={() => selectedId && handleDuplicate(selectedId)}
        onBack={() => setMobilePanel('list')}
        view={view}
        onViewChange={setView}
      />
    )
  }

  return (
    <>
      {selectedInvoice && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
          <InvoicePreview ref={previewRef} invoice={selectedInvoice} settings={data.settings} />
        </div>
      )}
      <Shell
        mobilePanel={mobilePanel}
        onCloseSidebar={() => setMobilePanel('detail')}
        sidebar={
          <Sidebar
            onNewInvoice={handleNewInvoice}
            onSettingsOpen={() => setShowSettings(true)}
            theme={theme}
            onThemeToggle={toggle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          >
            <InvoiceList
              invoices={filteredInvoices}
              selectedId={selectedId}
              onSelect={handleSelectInvoice}
              onDelete={handleDeleteInvoice}
              onDuplicate={handleDuplicate}
              onMakeRecurring={handleMakeRecurring}
            />
          </Sidebar>
        }
        main={renderMain()}
      />
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 w-80 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">Keyboard shortcuts</p>
            <div className="space-y-2">
              {[
                ['N', 'New invoice'],
                ['?', 'Show shortcuts'],
                ['⌘ S', 'Save now'],
                ['⌘ P', 'Toggle preview'],
                ['Esc', 'Close panels'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">{label}</span>
                  <kbd className="px-2 py-0.5 text-[11px] font-mono bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text)]">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setShowSettings(false); setRecurringPrefill(undefined) } }}
        >
          <div className="w-full max-w-3xl h-[92dvh] sm:h-[80vh] sm:max-h-[700px] bg-[var(--bg)] border-0 sm:border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <Settings
              data={data}
              onChange={next => {
                let finalData = next
                if (
                  selectedId &&
                  next.settings.defaultDueDate !== data.settings.defaultDueDate
                ) {
                  finalData = {
                    ...next,
                    invoices: next.invoices.map(inv =>
                      inv.id === selectedId && inv.status === 'draft'
                        ? { ...inv, dueDate: calculateDueDate(next.settings.defaultDueDate, inv.invoiceDate), updatedAt: new Date().toISOString() }
                        : inv
                    ),
                  }
                }
                setData(finalData)
                saveAppData(finalData)
              }}
              onSave={handleSave}
              onClose={() => { setShowSettings(false); setRecurringPrefill(undefined) }}
              prefillInvoice={recurringPrefill}
            />
          </div>
        </div>
      )}
    </>
  )
}
