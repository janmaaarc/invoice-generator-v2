import type { AppData, InvoiceData, SavedClient, SavedLineItem, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'invoice-generator-data';

function getDefaultAppData(): AppData {
  return {
    invoices: [],
    clients: [],
    lineItemTemplates: [],
    settings: DEFAULT_SETTINGS,
  };
}

export function loadAppData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultAppData();
    }

    const parsed = JSON.parse(stored) as Partial<AppData>;

    return {
      invoices: parsed.invoices || [],
      clients: parsed.clients || [],
      lineItemTemplates: parsed.lineItemTemplates || [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return getDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}

export function saveInvoice(data: AppData, invoice: InvoiceData): AppData {
  const now = new Date().toISOString();
  const updatedInvoice = { ...invoice, updatedAt: now };

  const existingIndex = data.invoices.findIndex(inv => inv.id === invoice.id);

  const invoices = existingIndex >= 0
    ? data.invoices.map((inv, i) => i === existingIndex ? updatedInvoice : inv)
    : [...data.invoices, updatedInvoice];

  const invoiceNum = parseInt(invoice.invoiceNumber.split('-').pop() || '0', 10);
  const lastInvoiceNumber = Math.max(data.settings.lastInvoiceNumber, invoiceNum);

  const newData = {
    ...data,
    invoices,
    settings: { ...data.settings, lastInvoiceNumber },
  };

  saveAppData(newData);
  return newData;
}

export function deleteInvoice(data: AppData, invoiceId: string): AppData {
  const newData = {
    ...data,
    invoices: data.invoices.filter(inv => inv.id !== invoiceId),
  };

  saveAppData(newData);
  return newData;
}

export function duplicateInvoice(data: AppData, invoice: InvoiceData): { data: AppData; newInvoice: InvoiceData } {
  const now = new Date().toISOString();
  const nextNumber = data.settings.lastInvoiceNumber + 1;

  const newInvoice: InvoiceData = {
    ...invoice,
    id: crypto.randomUUID(),
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
    invoiceDate: now.split('T')[0],
    status: 'draft',
    paidDate: undefined,
    createdAt: now,
    updatedAt: now,
    lineItems: invoice.lineItems.map(item => ({ ...item, id: crypto.randomUUID() })),
  };

  const newData = {
    ...data,
    invoices: [...data.invoices, newInvoice],
    settings: { ...data.settings, lastInvoiceNumber: nextNumber },
  };

  saveAppData(newData);
  return { data: newData, newInvoice };
}

export function saveClient(data: AppData, client: SavedClient): AppData {
  const existingIndex = data.clients.findIndex(c => c.id === client.id);

  const clients = existingIndex >= 0
    ? data.clients.map((c, i) => i === existingIndex ? client : c)
    : [...data.clients, client];

  const newData = { ...data, clients };
  saveAppData(newData);
  return newData;
}

export function deleteClient(data: AppData, clientId: string): AppData {
  const newData = {
    ...data,
    clients: data.clients.filter(c => c.id !== clientId),
  };

  saveAppData(newData);
  return newData;
}

export function saveLineItemTemplate(data: AppData, template: SavedLineItem): AppData {
  const existingIndex = data.lineItemTemplates.findIndex(t => t.id === template.id);

  const lineItemTemplates = existingIndex >= 0
    ? data.lineItemTemplates.map((t, i) => i === existingIndex ? template : t)
    : [...data.lineItemTemplates, template];

  const newData = { ...data, lineItemTemplates };
  saveAppData(newData);
  return newData;
}

export function deleteLineItemTemplate(data: AppData, templateId: string): AppData {
  const newData = {
    ...data,
    lineItemTemplates: data.lineItemTemplates.filter(t => t.id !== templateId),
  };

  saveAppData(newData);
  return newData;
}

export function updateSettings(data: AppData, settings: Partial<AppSettings>): AppData {
  const newData = {
    ...data,
    settings: { ...data.settings, ...settings },
  };

  saveAppData(newData);
  return newData;
}

export function exportDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importDataFromJson(jsonString: string): AppData | null {
  try {
    const parsed = JSON.parse(jsonString) as Partial<AppData>;

    if (!parsed.invoices && !parsed.clients && !parsed.settings) {
      return null;
    }

    return {
      invoices: parsed.invoices || [],
      clients: parsed.clients || [],
      lineItemTemplates: parsed.lineItemTemplates || [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return null;
  }
}

export function exportInvoiceAsJson(invoice: InvoiceData): string {
  return JSON.stringify(invoice, null, 2);
}
