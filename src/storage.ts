import type { AppData, InvoiceData, SavedClient, SavedLineItem, AppSettings, InvoiceTemplate, TermsTemplate, RecurringInvoice } from './types';
import { DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'invoice-generator-data';

function getDefaultAppData(): AppData {
  return {
    invoices: [],
    clients: [],
    lineItemTemplates: [],
    paymentMethods: [],
    invoiceTemplates: [],
    termsTemplates: [],
    recurringInvoices: [],
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
      paymentMethods: parsed.paymentMethods || [],
      invoiceTemplates: parsed.invoiceTemplates || [],
      termsTemplates: parsed.termsTemplates || [],
      recurringInvoices: parsed.recurringInvoices || [],
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

export function saveInvoiceTemplate(data: AppData, template: InvoiceTemplate): AppData {
  const existingIndex = data.invoiceTemplates.findIndex(t => t.id === template.id);

  const invoiceTemplates = existingIndex >= 0
    ? data.invoiceTemplates.map((t, i) => i === existingIndex ? template : t)
    : [...data.invoiceTemplates, template];

  const newData = { ...data, invoiceTemplates };
  saveAppData(newData);
  return newData;
}

export function deleteInvoiceTemplate(data: AppData, templateId: string): AppData {
  const newData = {
    ...data,
    invoiceTemplates: data.invoiceTemplates.filter(t => t.id !== templateId),
  };

  saveAppData(newData);
  return newData;
}

export function saveTermsTemplate(data: AppData, template: TermsTemplate): AppData {
  const existingIndex = data.termsTemplates.findIndex(t => t.id === template.id);

  const termsTemplates = existingIndex >= 0
    ? data.termsTemplates.map((t, i) => i === existingIndex ? template : t)
    : [...data.termsTemplates, template];

  const newData = { ...data, termsTemplates };
  saveAppData(newData);
  return newData;
}

export function deleteTermsTemplate(data: AppData, templateId: string): AppData {
  const newData = {
    ...data,
    termsTemplates: data.termsTemplates.filter(t => t.id !== templateId),
  };

  saveAppData(newData);
  return newData;
}

export function saveRecurringInvoice(data: AppData, recurring: RecurringInvoice): AppData {
  const existingIndex = data.recurringInvoices.findIndex(r => r.id === recurring.id);

  const recurringInvoices = existingIndex >= 0
    ? data.recurringInvoices.map((r, i) => i === existingIndex ? recurring : r)
    : [...data.recurringInvoices, recurring];

  const newData = { ...data, recurringInvoices };
  saveAppData(newData);
  return newData;
}

export function deleteRecurringInvoice(data: AppData, recurringId: string): AppData {
  const newData = {
    ...data,
    recurringInvoices: data.recurringInvoices.filter(r => r.id !== recurringId),
  };

  saveAppData(newData);
  return newData;
}

export function exportDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importDataFromJson(jsonString: string): AppData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const isArray = (v: unknown) => Array.isArray(v);
    const isObj = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);

    if (!isArray(parsed.invoices) && !isArray(parsed.clients) && !isObj(parsed.settings)) {
      return null;
    }

    return {
      invoices: isArray(parsed.invoices) ? parsed.invoices : [],
      clients: isArray(parsed.clients) ? parsed.clients : [],
      lineItemTemplates: isArray(parsed.lineItemTemplates) ? parsed.lineItemTemplates : [],
      paymentMethods: isArray(parsed.paymentMethods) ? parsed.paymentMethods : [],
      invoiceTemplates: isArray(parsed.invoiceTemplates) ? parsed.invoiceTemplates : [],
      termsTemplates: isArray(parsed.termsTemplates) ? parsed.termsTemplates : [],
      recurringInvoices: isArray(parsed.recurringInvoices) ? parsed.recurringInvoices : [],
      settings: { ...DEFAULT_SETTINGS, ...(isObj(parsed.settings) ? parsed.settings : {}) },
    };
  } catch {
    return null;
  }
}

export function exportInvoiceAsJson(invoice: InvoiceData): string {
  return JSON.stringify(invoice, null, 2);
}
