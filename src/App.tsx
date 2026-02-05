import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceList } from './components/InvoiceList';
import { Settings } from './components/Settings';
import {
  createNewInvoice,
  sanitizeFilename,
  formatCurrency,
  getInvoiceTotal,
  generateEmailShareLink,
  generateWhatsAppShareLink,
  encodeInvoiceForUrl,
} from './types';
import type { InvoiceData, AppData } from './types';
import {
  loadAppData,
  saveInvoice,
  deleteInvoice,
  duplicateInvoice,
  saveClient,
  deleteClient,
  saveLineItemTemplate,
  deleteLineItemTemplate,
  saveInvoiceTemplate,
  deleteInvoiceTemplate,
  saveTermsTemplate,
  deleteTermsTemplate,
  updateSettings,
  exportDataAsJson,
  importDataFromJson,
  saveAppData,
} from './storage';

type View = 'editor' | 'list' | 'settings';

function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData>(() => {
    const data = loadAppData();
    const invoice = createNewInvoice(data.settings);
    // Always set invoice date to today when opening app
    return { ...invoice, invoiceDate: new Date().toISOString().split('T')[0] };
  });
  const [view, setView] = useState<View>('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = e.metaKey || e.ctrlKey;

      if (!modifier) return;

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handleSaveInvoice();
          break;
        case 'p':
          if (view === 'editor') {
            e.preventDefault();
            downloadPdf();
          }
          break;
        case 'n':
          e.preventDefault();
          handleNewInvoice();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleInvoiceChange = (invoice: InvoiceData) => {
    const updated = { ...invoice, updatedAt: new Date().toISOString() };
    setCurrentInvoice(updated);
  };

  const handleSaveInvoice = () => {
    let newData = saveInvoice(appData, currentInvoice);

    // Auto-save client info if client name is filled and not already saved
    if (currentInvoice.toName.trim()) {
      const existingClient = newData.clients.find(
        (c) =>
          c.name.toLowerCase() === currentInvoice.toName.trim().toLowerCase() &&
          c.email.toLowerCase() === (currentInvoice.toEmail?.trim() || '').toLowerCase()
      );

      if (!existingClient) {
        newData = saveClient(newData, {
          id: crypto.randomUUID(),
          name: currentInvoice.toName.trim(),
          email: currentInvoice.toEmail?.trim() || '',
          address: currentInvoice.toAddress?.trim() || '',
        });
      }
    }

    setAppData(newData);
  };

  const handleNewInvoice = () => {
    handleSaveInvoice();
    const newInvoice = createNewInvoice(appData.settings);
    setCurrentInvoice(newInvoice);
    setView('editor');
  };

  const handleSelectInvoice = (invoice: InvoiceData) => {
    handleSaveInvoice();
    setCurrentInvoice(invoice);
    setView('editor');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const newData = deleteInvoice(appData, invoiceId);
    setAppData(newData);
    if (currentInvoice.id === invoiceId) {
      setCurrentInvoice(createNewInvoice(appData.settings));
    }
  };

  const handleDuplicateInvoice = (invoice: InvoiceData) => {
    const { data, newInvoice } = duplicateInvoice(appData, invoice);
    setAppData(data);
    setCurrentInvoice(newInvoice);
    setView('editor');
  };

  const handleStatusChange = (invoiceId: string, status: InvoiceData['status']) => {
    const invoice = appData.invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const updated: InvoiceData = {
      ...invoice,
      status,
      paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
      updatedAt: new Date().toISOString(),
    };

    const newData = saveInvoice(appData, updated);
    setAppData(newData);

    if (currentInvoice.id === invoiceId) {
      setCurrentInvoice(updated);
    }
  };

  const handleExportData = () => {
    handleSaveInvoice();
    const json = exportDataAsJson(appData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    const imported = importDataFromJson(jsonString);
    if (!imported) {
      alert('Invalid data file');
      return;
    }

    if (confirm('This will replace all existing data. Continue?')) {
      saveAppData(imported);
      setAppData(imported);
      if (imported.invoices.length > 0) {
        setCurrentInvoice(imported.invoices[0]);
      } else {
        setCurrentInvoice(createNewInvoice(imported.settings));
      }
    }
  };

  const downloadImage = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;

    handleSaveInvoice();
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${sanitizeFilename(currentInvoice.invoiceNumber)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;

    handleSaveInvoice();
    setIsGenerating(true);

    const safeFilename = sanitizeFilename(currentInvoice.invoiceNumber);
    const options = {
      margin: 0,
      filename: `${safeFilename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };

    try {
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printInvoice = () => {
    handleSaveInvoice();
    window.print();
  };

  const shareViaEmail = () => {
    handleSaveInvoice();
    const link = generateEmailShareLink(currentInvoice);
    window.open(link, '_blank');
  };

  const shareViaWhatsApp = () => {
    handleSaveInvoice();
    const link = generateWhatsAppShareLink(currentInvoice);
    window.open(link, '_blank');
  };

  const copyShareableLink = async () => {
    handleSaveInvoice();
    const encoded = encodeInvoiceForUrl(currentInvoice);
    const url = `${window.location.origin}${window.location.pathname}?invoice=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch {
      alert('Failed to copy link');
    }
  };

  const total = getInvoiceTotal(currentInvoice);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 no-print sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Logo & Nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-neutral-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-white hidden sm:inline">Invoices</span>
              </div>

              {/* Nav */}
              <nav className="flex gap-1">
                <button
                  onClick={() => { handleSaveInvoice(); setView('editor'); }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    view === 'editor'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => { handleSaveInvoice(); setView('list'); }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    view === 'list'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  History
                  {appData.invoices.length > 0 && (
                    <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                      {appData.invoices.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { handleSaveInvoice(); setView('settings'); }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    view === 'settings'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Actions */}
            <div className="flex gap-2 items-center">
              {view === 'editor' && (
                <>
                  <span className="hidden sm:inline text-sm text-neutral-400 mr-2">
                    {formatCurrency(total, currentInvoice.currency)}
                  </span>
                  <button
                    onClick={handleNewInvoice}
                    className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="New Invoice"
                  >
                    <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Toggle theme"
              >
                {isDark ? (
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {view === 'editor' && (
                <>
                  <div className="hidden sm:flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-2 ml-1">
                    <button
                      onClick={shareViaEmail}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Email"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={shareViaWhatsApp}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </button>
                    <button
                      onClick={copyShareableLink}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Copy Link"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                    <button
                      onClick={downloadImage}
                      disabled={isGenerating}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                      title="Save as Image"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={printInvoice}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Print"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={downloadPdf}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="no-print order-2 lg:order-1">
              <InvoiceForm
                invoice={currentInvoice}
                onChange={handleInvoiceChange}
                clients={appData.clients}
              />
            </div>
            <div className="lg:sticky lg:top-20 h-fit order-1 lg:order-2">
              <div className="mb-2 no-print flex items-center justify-between">
                <span className="text-xs text-neutral-400">Preview</span>
                <div className="flex items-center gap-2">
                  <select
                    value={currentInvoice.status}
                    onChange={(e) => {
                      const status = e.target.value as InvoiceData['status'];
                      handleInvoiceChange({
                        ...currentInvoice,
                        status,
                        paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
                      });
                    }}
                    className="text-xs px-2 py-1 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded text-neutral-600 dark:text-neutral-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div className="overflow-auto max-h-[60vh] lg:max-h-[calc(100vh-10rem)] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white">
                <InvoicePreview
                  ref={previewRef}
                  invoice={currentInvoice}
                  logo={appData.settings.logo}
                  accentColor={appData.settings.accentColor}
                  showQrCode={appData.settings.showQrCode}
                />
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">Invoice History</h2>
              <button
                onClick={handleNewInvoice}
                className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                + New Invoice
              </button>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <InvoiceList
                invoices={appData.invoices}
                currentInvoiceId={currentInvoice.id}
                onSelect={handleSelectInvoice}
                onDelete={handleDeleteInvoice}
                onDuplicate={handleDuplicateInvoice}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Settings</h2>
            <Settings
              settings={appData.settings}
              clients={appData.clients}
              lineItemTemplates={appData.lineItemTemplates}
              invoiceTemplates={appData.invoiceTemplates}
              termsTemplates={appData.termsTemplates}
              onSettingsChange={(settings) => {
                const newData = updateSettings(appData, settings);
                setAppData(newData);
              }}
              onSaveClient={(client) => {
                const newData = saveClient(appData, client);
                setAppData(newData);
              }}
              onDeleteClient={(clientId) => {
                const newData = deleteClient(appData, clientId);
                setAppData(newData);
              }}
              onSaveLineItemTemplate={(template) => {
                const newData = saveLineItemTemplate(appData, template);
                setAppData(newData);
              }}
              onDeleteLineItemTemplate={(templateId) => {
                const newData = deleteLineItemTemplate(appData, templateId);
                setAppData(newData);
              }}
              onSaveInvoiceTemplate={(template) => {
                const newData = saveInvoiceTemplate(appData, template);
                setAppData(newData);
              }}
              onDeleteInvoiceTemplate={(templateId) => {
                const newData = deleteInvoiceTemplate(appData, templateId);
                setAppData(newData);
              }}
              onSaveTermsTemplate={(template) => {
                const newData = saveTermsTemplate(appData, template);
                setAppData(newData);
              }}
              onDeleteTermsTemplate={(templateId) => {
                const newData = deleteTermsTemplate(appData, templateId);
                setAppData(newData);
              }}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
