import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Shell } from './components/layout/Shell'
import { Sidebar, type Section } from './components/layout/Sidebar'
import { InvoiceList } from './components/invoice/InvoiceList'
import { InvoiceEditor } from './components/invoice/InvoiceEditor'
import { InvoicePreview } from './components/invoice/InvoicePreview'
import { Settings } from './components/settings/Settings'
import { Clients } from './components/clients/Clients'
import { Templates } from './components/templates/Templates'
import { PaymentMethods } from './components/payments/PaymentMethods'
import { Recurring } from './components/recurring/Recurring'
import { checkAndGenerateDue } from './lib/recurring'
import { requestNotificationPermission, registerServiceWorker, showNotification, cacheRecurringSchedule } from './lib/notifications'
import { useTheme } from './hooks/useTheme'
import { loadAppData, saveAppData } from './storage'
import {
  createNewInvoice, generateEmailShareLink, generateWhatsAppShareLink,
  buildPdfFilename,
} from './types'
import type { AppData, InvoiceData, InvoiceStatus } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState<Section>('invoices')
  const [data, setData] = useState<AppData>(() => loadAppData())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'editor' | 'preview'>('editor')
  const [mobilePanel, setMobilePanel] = useState<'list' | 'detail'>('list')
  const previewRef = useRef<HTMLDivElement>(null)

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

  function handleMarkPaid() {
    if (!selectedInvoice) return
    const now = new Date().toISOString()
    handleChange({ ...selectedInvoice, status: 'paid', paidDate: now, updatedAt: now })
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
    handleChange({
      ...selectedInvoice,
      sentHistory: [...(selectedInvoice.sentHistory || []), { date: now, method: type }],
    })
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
    handleChange({
      ...selectedInvoice,
      sentHistory: [...(selectedInvoice.sentHistory || []), { date: now, method: 'pdf' }],
    })
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
    if (section === 'settings') return wrap(<Settings data={data} onChange={next => { setData(next); saveAppData(next) }} onSave={handleSave} />)
    if (section === 'clients') return wrap(<Clients data={data} onChange={next => { setData(next); saveAppData(next) }} onSave={handleSave} />)
    if (section === 'templates') return wrap(<Templates data={data} onChange={next => { setData(next); saveAppData(next) }} onSave={handleSave} />)
    if (section === 'payments') return wrap(<PaymentMethods data={data} onChange={next => { setData(next); saveAppData(next) }} onSave={handleSave} />)
    if (section === 'recurring') return wrap(<Recurring data={data} onChange={next => { setData(next); saveAppData(next); cacheRecurringSchedule(next.recurringInvoices.filter(r => r.enabled).map(r => ({ name: r.name, nextDate: r.nextDate }))) }} onSave={handleSave} />)
    if (!selectedInvoice) {
      return wrap(
        <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
          <p className="text-sm">No invoice selected</p>
          <p className="text-xs">Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one</p>
        </div>
      )
    }
    return wrap(
      <InvoiceEditor
        invoice={selectedInvoice}
        data={data}
        onChange={handleChange}
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onShare={handleShare}
        onStatusChange={handleStatusChange}
        onDuplicate={() => selectedId && handleDuplicate(selectedId)}
        onMarkPaid={handleMarkPaid}
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
              onSelect={handleSelectInvoice}
              onDelete={handleDeleteInvoice}
              onDuplicate={handleDuplicate}
            />
          </Sidebar>
        }
        main={renderMain()}
      />
    </>
  )
}
