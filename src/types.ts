export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;

  fromName: string;
  fromEmail: string;
  fromAddress: string;

  toName: string;
  toEmail: string;
  toAddress: string;

  lineItems: LineItem[];

  paymentMethod: string;
  paymentDetails: string;
  paymentQrImage?: string;
  notes: string;
  currency: string;

  status: InvoiceStatus;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedClient {
  id: string;
  name: string;
  email: string;
  address: string;
}

export interface SavedLineItem {
  id: string;
  description: string;
  rate: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  lineItems: Omit<LineItem, 'id'>[];
  notes: string;
  currency: string;
}

export interface TermsTemplate {
  id: string;
  name: string;
  content: string;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringInvoice {
  id: string;
  templateId: string;
  clientId: string;
  frequency: RecurringFrequency;
  nextDate: string;
  enabled: boolean;
}

export interface AppSettings {
  logo?: string;
  accentColor: string;
  template: 'minimal' | 'classic' | 'modern';
  defaultFromName: string;
  defaultFromEmail: string;
  defaultFromAddress: string;
  defaultPaymentMethod: string;
  defaultPaymentDetails: string;
  lastInvoiceNumber: number;
  invoiceNumberPrefix: string;
  defaultDueDate: string;
  showQrCode: boolean;
}

export interface AppData {
  invoices: InvoiceData[];
  clients: SavedClient[];
  lineItemTemplates: SavedLineItem[];
  invoiceTemplates: InvoiceTemplate[];
  termsTemplates: TermsTemplate[];
  recurringInvoices: RecurringInvoice[];
  settings: AppSettings;
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const;

export const DUE_DATE_PRESETS = [
  { label: 'Upon receipt', value: 'Upon receipt' },
  { label: 'Net 7', value: 'net7' },
  { label: 'Net 15', value: 'net15' },
  { label: 'Net 30', value: 'net30' },
  { label: 'Net 60', value: 'net60' },
  { label: 'Custom', value: 'custom' },
] as const;

export const ACCENT_COLORS = [
  { name: 'Neutral', value: '#171717' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  accentColor: '#171717',
  template: 'minimal',
  defaultFromName: '',
  defaultFromEmail: '',
  defaultFromAddress: '',
  defaultPaymentMethod: 'PayPal',
  defaultPaymentDetails: '',
  lastInvoiceNumber: 0,
  invoiceNumberPrefix: 'INV',
  defaultDueDate: 'Upon receipt',
  showQrCode: false,
};

export function createNewInvoice(settings: AppSettings): InvoiceData {
  const nextNumber = settings.lastInvoiceNumber + 1;
  const now = new Date().toISOString();
  const prefix = settings.invoiceNumberPrefix || 'INV';
  const invoiceDate = now.split('T')[0];
  const dueDate = calculateDueDate(settings.defaultDueDate || 'Upon receipt', invoiceDate);

  return {
    id: crypto.randomUUID(),
    invoiceNumber: `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
    invoiceDate,
    dueDate,

    fromName: settings.defaultFromName,
    fromEmail: settings.defaultFromEmail,
    fromAddress: settings.defaultFromAddress,

    toName: '',
    toEmail: '',
    toAddress: '',

    lineItems: [
      { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }
    ],

    paymentMethod: settings.defaultPaymentMethod,
    paymentDetails: settings.defaultPaymentDetails,
    notes: '',
    currency: 'USD',

    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export function calculateDueDate(preset: string, fromDate: string): string {
  if (preset === 'Upon receipt' || preset === 'custom') {
    return preset === 'Upon receipt' ? 'Upon receipt' : fromDate;
  }

  const days = parseInt(preset.replace('net', ''), 10);
  const date = new Date(fromDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') {
    return 'invoice';
  }

  return input
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .trim()
    .slice(0, 200) || 'invoice';
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateInvoice(invoice: InvoiceData): ValidationResult {
  const errors: string[] = [];

  if (!invoice.invoiceNumber.trim()) {
    errors.push('Invoice number is required');
  }

  if (!invoice.fromName.trim()) {
    errors.push('Your name is required');
  }

  if (invoice.fromEmail && !isValidEmail(invoice.fromEmail)) {
    errors.push('Your email format is invalid');
  }

  if (!invoice.toName.trim()) {
    errors.push('Client name is required');
  }

  if (invoice.toEmail && !isValidEmail(invoice.toEmail)) {
    errors.push('Client email format is invalid');
  }

  if (invoice.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }

  const hasValidItem = invoice.lineItems.some(
    item => item.description.trim() && item.quantity > 0 && item.rate >= 0
  );

  if (!hasValidItem) {
    errors.push('At least one complete line item is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getInvoiceTotal(invoice: InvoiceData): number {
  return invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  return `${currency.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function encodeInvoiceForUrl(invoice: InvoiceData): string {
  try {
    const json = JSON.stringify(invoice);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

export function decodeInvoiceFromUrl(encoded: string): InvoiceData | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as InvoiceData;
  } catch {
    return null;
  }
}

export function generateEmailShareLink(invoice: InvoiceData): string {
  const total = getInvoiceTotal(invoice);
  const currency = CURRENCIES.find(c => c.code === invoice.currency) || CURRENCIES[0];
  const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
  const body = encodeURIComponent(
    `Hi ${invoice.toName},\n\n` +
    `Please find invoice ${invoice.invoiceNumber} for ${currency.symbol}${total.toFixed(2)}.\n\n` +
    `Due Date: ${invoice.dueDate}\n` +
    `Payment Method: ${invoice.paymentMethod}\n` +
    (invoice.paymentDetails ? `Payment Details: ${invoice.paymentDetails}\n` : '') +
    `\nThank you for your business!\n\n` +
    `${invoice.fromName}`
  );
  return `mailto:${invoice.toEmail}?subject=${subject}&body=${body}`;
}

export function generateWhatsAppShareLink(invoice: InvoiceData): string {
  const total = getInvoiceTotal(invoice);
  const currency = CURRENCIES.find(c => c.code === invoice.currency) || CURRENCIES[0];
  const message = encodeURIComponent(
    `Hi ${invoice.toName},\n\n` +
    `Invoice: ${invoice.invoiceNumber}\n` +
    `Amount: ${currency.symbol}${total.toFixed(2)}\n` +
    `Due: ${invoice.dueDate}\n\n` +
    `Payment: ${invoice.paymentMethod}` +
    (invoice.paymentDetails ? `\n${invoice.paymentDetails}` : '') +
    `\n\nThank you!`
  );
  return `https://wa.me/?text=${message}`;
}
