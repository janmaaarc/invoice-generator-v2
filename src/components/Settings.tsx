import { useRef, useState } from 'react';
import type { AppSettings, SavedClient, SavedLineItem } from '../types';
import { ACCENT_COLORS, DUE_DATE_PRESETS } from '../types';
import { Modal, ConfirmModal } from './Modal';

interface SettingsProps {
  settings: AppSettings;
  clients: SavedClient[];
  lineItemTemplates: SavedLineItem[];
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  onSaveClient: (client: SavedClient) => void;
  onDeleteClient: (clientId: string) => void;
  onSaveLineItemTemplate: (template: SavedLineItem) => void;
  onDeleteLineItemTemplate: (templateId: string) => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
}

export function Settings({
  settings,
  clients,
  lineItemTemplates,
  onSettingsChange,
  onSaveClient,
  onDeleteClient,
  onSaveLineItemTemplate,
  onDeleteLineItemTemplate,
  onExportData,
  onImportData,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [pendingImportData, setPendingImportData] = useState<string | null>(null);

  // Form states
  const [clientForm, setClientForm] = useState({ name: '', email: '', address: '' });
  const [templateForm, setTemplateForm] = useState({ description: '', rate: '' });

  const inputClass =
    'w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all duration-200';
  const labelClass = 'block text-sm text-neutral-500 dark:text-neutral-400 mb-1.5';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      alert('Logo must be less than 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onSettingsChange({ logo: result });
    };
    reader.readAsDataURL(file);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPendingImportData(result);
      setIsImportConfirmOpen(true);
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (pendingImportData) {
      onImportData(pendingImportData);
      setPendingImportData(null);
    }
  };

  const handleSaveClient = () => {
    if (!clientForm.name.trim()) return;

    onSaveClient({
      id: crypto.randomUUID(),
      name: clientForm.name.trim(),
      email: clientForm.email.trim(),
      address: clientForm.address.trim(),
    });

    setClientForm({ name: '', email: '', address: '' });
    setIsClientModalOpen(false);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.description.trim()) return;

    onSaveLineItemTemplate({
      id: crypto.randomUUID(),
      description: templateForm.description.trim(),
      rate: parseFloat(templateForm.rate) || 0,
    });

    setTemplateForm({ description: '', rate: '' });
    setIsTemplateModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Branding */}
        <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Branding</h3>

          {/* Logo */}
          <div className="mb-5">
            <label className={labelClass}>Company Logo</label>
            <div className="flex items-center gap-4">
              {settings.logo ? (
                <div className="relative group">
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="w-16 h-16 object-contain rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white"
                  />
                  <button
                    onClick={() => onSettingsChange({ logo: undefined })}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex items-center justify-center text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              {settings.logo && (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  Change
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-2">PNG or JPG, max 500KB</p>
          </div>

          {/* Accent Color */}
          <div>
            <label className={labelClass}>Accent Color</label>
            <div className="flex gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onSettingsChange({ accentColor: color.value })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    settings.accentColor === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ring-neutral-900 dark:ring-white scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Invoice Settings */}
        <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Invoice Settings</h3>
          <p className="text-xs text-neutral-400 mb-4">Customize invoice numbering and defaults</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Invoice Number Prefix</label>
              <input
                type="text"
                className={inputClass}
                value={settings.invoiceNumberPrefix || 'INV'}
                onChange={(e) => onSettingsChange({ invoiceNumberPrefix: e.target.value })}
                placeholder="INV"
              />
              <p className="text-xs text-neutral-400 mt-1">e.g., INV-2024-001</p>
            </div>
            <div>
              <label className={labelClass}>Default Due Date</label>
              <select
                className={inputClass}
                value={settings.defaultDueDate || 'Upon receipt'}
                onChange={(e) => onSettingsChange({ defaultDueDate: e.target.value })}
              >
                {DUE_DATE_PRESETS.filter(p => p.value !== 'custom').map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showQrCode || false}
                  onChange={(e) => onSettingsChange({ showQrCode: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white focus:ring-neutral-900 dark:focus:ring-white"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Show QR code for payment details</span>
              </label>
              <p className="text-xs text-neutral-400 mt-1 ml-7">Displays a QR code of your payment details on the invoice</p>
            </div>
          </div>
        </section>

        {/* Default Info */}
        <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Default Info</h3>
          <p className="text-xs text-neutral-400 mb-4">Pre-fill these on new invoices</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Your Name</label>
              <input
                type="text"
                className={inputClass}
                value={settings.defaultFromName}
                onChange={(e) => onSettingsChange({ defaultFromName: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className={labelClass}>Your Email</label>
              <input
                type="email"
                className={inputClass}
                value={settings.defaultFromEmail}
                onChange={(e) => onSettingsChange({ defaultFromEmail: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Your Address</label>
              <input
                type="text"
                className={inputClass}
                value={settings.defaultFromAddress}
                onChange={(e) => onSettingsChange({ defaultFromAddress: e.target.value })}
                placeholder="Your address"
              />
            </div>
            <div>
              <label className={labelClass}>Payment Method</label>
              <input
                type="text"
                className={inputClass}
                value={settings.defaultPaymentMethod}
                onChange={(e) => onSettingsChange({ defaultPaymentMethod: e.target.value })}
                placeholder="PayPal, Bank Transfer..."
              />
            </div>
            <div>
              <label className={labelClass}>Payment Details</label>
              <input
                type="text"
                className={inputClass}
                value={settings.defaultPaymentDetails}
                onChange={(e) => onSettingsChange({ defaultPaymentDetails: e.target.value })}
                placeholder="Account or email"
              />
            </div>
          </div>
        </section>

        {/* Saved Clients */}
        <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Saved Clients</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Quick-fill client info</p>
            </div>
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              + Add
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-400">No saved clients</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">{client.name}</div>
                    {client.email && (
                      <div className="text-xs text-neutral-500 truncate">{client.email}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteClientId(client.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Line Item Templates */}
        <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Item Templates</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Common services or products</p>
            </div>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              + Add
            </button>
          </div>

          {lineItemTemplates.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-neutral-400">No saved templates</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lineItemTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">{template.description}</div>
                    <div className="text-xs text-neutral-500">${template.rate.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => setDeleteTemplateId(template.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Data Management */}
        <section className="p-5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Data</h3>
          <p className="text-xs text-neutral-400 mb-4">Export or import all your data</p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onExportData}
              className="px-4 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </section>
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setClientForm({ name: '', email: '', address: '' });
        }}
        title="Add Client"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveClient();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Client Name *</label>
              <input
                type="text"
                className={inputClass}
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="Client or company name"
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="client@company.com"
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                className={inputClass}
                value={clientForm.address}
                onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                placeholder="Client address"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button
              type="button"
              onClick={() => {
                setIsClientModalOpen(false);
                setClientForm({ name: '', email: '', address: '' });
              }}
              className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!clientForm.name.trim()}
              className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              Save Client
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setTemplateForm({ description: '', rate: '' });
        }}
        title="Add Item Template"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTemplate();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Description *</label>
              <input
                type="text"
                className={inputClass}
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Service or product name"
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Default Rate</label>
              <input
                type="text"
                inputMode="decimal"
                className={inputClass}
                value={templateForm.rate}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setTemplateForm({ ...templateForm, rate: val });
                }}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button
              type="button"
              onClick={() => {
                setIsTemplateModalOpen(false);
                setTemplateForm({ description: '', rate: '' });
              }}
              className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!templateForm.description.trim()}
              className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              Save Template
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Client Confirmation */}
      <ConfirmModal
        isOpen={!!deleteClientId}
        onClose={() => setDeleteClientId(null)}
        onConfirm={() => {
          if (deleteClientId) {
            onDeleteClient(deleteClientId);
          }
        }}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Delete Template Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTemplateId}
        onClose={() => setDeleteTemplateId(null)}
        onConfirm={() => {
          if (deleteTemplateId) {
            onDeleteLineItemTemplate(deleteTemplateId);
          }
        }}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Import Confirmation */}
      <ConfirmModal
        isOpen={isImportConfirmOpen}
        onClose={() => {
          setIsImportConfirmOpen(false);
          setPendingImportData(null);
        }}
        onConfirm={handleConfirmImport}
        title="Import Data"
        message="This will replace all existing invoices, clients, and settings. Are you sure you want to continue?"
        confirmText="Import"
      />
    </>
  );
}
