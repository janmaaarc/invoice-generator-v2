export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  address: string;
}

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
  bankDetails?: BankDetails;
  paymentQrImage?: string;
  notes: string;
  currency: string;

  status: InvoiceStatus;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;

  taxRate?: number;
  discountPercent?: number;
  sentHistory?: Array<{ date: string; method: 'email' | 'whatsapp' | 'pdf' }>;
  payments?: Array<{ id: string; date: string; amount: number; note: string }>;
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

export interface SavedPaymentMethod {
  id: string;
  name: string;
  details: string;
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

export interface RecurringTemplate {
  fromName: string;
  fromEmail: string;
  fromAddress: string;
  toName: string;
  toEmail: string;
  toAddress: string;
  lineItems: LineItem[];
  paymentMethod: string;
  paymentDetails: string;
  notes: string;
  currency: string;
  dueDatePreset: string;
  taxRate?: number;
  discountPercent?: number;
}

export interface RecurringInvoice {
  id: string;
  name: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  nextDate: string;
  enabled: boolean;
  template: RecurringTemplate;
  createdAt: string;
  lastGeneratedAt?: string;
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
  pdfFilenameTemplate?: string;
}

export interface AppData {
  invoices: InvoiceData[];
  clients: SavedClient[];
  lineItemTemplates: SavedLineItem[];
  paymentMethods: SavedPaymentMethod[];
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

export function getInvoiceSubtotal(invoice: InvoiceData): number {
  return invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function getInvoiceTotal(invoice: InvoiceData): number {
  const subtotal = getInvoiceSubtotal(invoice);
  const discount = subtotal * ((invoice.discountPercent || 0) / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * ((invoice.taxRate || 0) / 100);
  return afterDiscount + tax;
}

export function getInvoicePaidAmount(invoice: InvoiceData): number {
  return (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

export function getInvoiceBalance(invoice: InvoiceData): number {
  return getInvoiceTotal(invoice) - getInvoicePaidAmount(invoice);
}

export function buildPdfFilename(invoice: InvoiceData, template?: string): string {
  const tmpl = template || '{number}-{client}';
  return sanitizeFilename(
    tmpl
      .replace('{number}', invoice.invoiceNumber)
      .replace('{client}', invoice.toName || 'invoice')
      .replace('{date}', invoice.invoiceDate)
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
    const parsed = JSON.parse(json);
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof parsed.id !== 'string' ||
      typeof parsed.invoiceNumber !== 'string' ||
      typeof parsed.fromName !== 'string' ||
      typeof parsed.toName !== 'string' ||
      !Array.isArray(parsed.lineItems)
    ) return null;
    return parsed as InvoiceData;
  } catch {
    return null;
  }
}

export function hasBankDetails(d: BankDetails | undefined): d is BankDetails {
  return !!d && Object.values(d).some(v => v.trim() !== '');
}

function formatBankDetailsText(details?: BankDetails): string {
  if (!hasBankDetails(details)) return '';
  const lines: string[] = [
    details.bankName && `Bank: ${details.bankName}`,
    details.accountName && `Account Name: ${details.accountName}`,
    details.accountNumber && `Account No.: ${details.accountNumber}`,
    details.swiftCode && `SWIFT/BIC: ${details.swiftCode}`,
    details.address && `Address: ${details.address}`,
  ].filter(Boolean) as string[];
  return lines.length ? `\n${lines.join('\n')}` : '';
}

export function generateEmailShareLink(invoice: InvoiceData): string {
  if (!isValidEmail(invoice.toEmail)) return '';
  const total = getInvoiceTotal(invoice);
  const currency = CURRENCIES.find(c => c.code === invoice.currency) || CURRENCIES[0];
  const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
  const body = encodeURIComponent(
    `Hi ${invoice.toName},\n\n` +
    `Please find invoice ${invoice.invoiceNumber} for ${currency.symbol}${total.toFixed(2)}.\n\n` +
    `Due Date: ${invoice.dueDate}\n` +
    `Payment Method: ${invoice.paymentMethod}\n` +
    (hasBankDetails(invoice.bankDetails) ? formatBankDetailsText(invoice.bankDetails) + '\n' : invoice.paymentDetails ? `Payment Details: ${invoice.paymentDetails}\n` : '') +
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
    (hasBankDetails(invoice.bankDetails) ? formatBankDetailsText(invoice.bankDetails) : invoice.paymentDetails ? `\n${invoice.paymentDetails}` : '') +
    `\n\nThank you!`
  );
  return `https://wa.me/?text=${message}`;
}
