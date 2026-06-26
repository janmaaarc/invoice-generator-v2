import type { RecurringInvoice, RecurringFrequency, InvoiceData, AppData, AppSettings } from '../types'
import { calculateDueDate } from '../types'

export function computeNextDate(frequency: RecurringFrequency, dayOfMonth: number, from: Date = new Date()): string {
  const d = new Date(from)
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'biweekly':
      d.setDate(d.getDate() + 14)
      break
    case 'monthly': {
      d.setMonth(d.getMonth() + 1)
      d.setDate(Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())))
      break
    }
    case 'quarterly': {
      d.setMonth(d.getMonth() + 3)
      d.setDate(Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())))
      break
    }
    case 'yearly': {
      d.setFullYear(d.getFullYear() + 1)
      d.setDate(Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())))
      break
    }
  }
  return d.toISOString().split('T')[0]
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function initialNextDate(frequency: RecurringFrequency, dayOfMonth: number): string {
  if (frequency === 'weekly' || frequency === 'biweekly') {
    return computeNextDate(frequency, dayOfMonth, new Date())
  }
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), Math.min(dayOfMonth, daysInMonth(now.getFullYear(), now.getMonth())))
  if (d <= now) return computeNextDate(frequency, dayOfMonth, now)
  return d.toISOString().split('T')[0]
}

export function generateInvoiceFromRecurring(
  recurring: RecurringInvoice,
  settings: AppSettings
): InvoiceData {
  const nextNumber = settings.lastInvoiceNumber + 1
  const prefix = settings.invoiceNumberPrefix || 'INV'
  const now = new Date().toISOString()
  const invoiceDate = now.split('T')[0]

  return {
    id: crypto.randomUUID(),
    invoiceNumber: `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
    invoiceDate,
    dueDate: calculateDueDate(recurring.template.dueDatePreset || 'Upon receipt', invoiceDate),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...recurring.template,
    lineItems: recurring.template.lineItems.map(item => ({ ...item, id: crypto.randomUUID() })),
  }
}

export function checkAndGenerateDue(data: AppData): { data: AppData; generated: string[] } {
  const today = new Date().toISOString().split('T')[0]
  const generated: string[] = []
  let { settings } = data
  let invoices = [...data.invoices]
  const recurringInvoices = data.recurringInvoices.map(r => {
    if (!r.enabled || r.nextDate > today) return r
    const invoice = generateInvoiceFromRecurring(r, settings)
    invoices = [invoice, ...invoices]
    settings = { ...settings, lastInvoiceNumber: settings.lastInvoiceNumber + 1 }
    generated.push(r.name)
    return {
      ...r,
      nextDate: computeNextDate(r.frequency, r.dayOfMonth, new Date(r.nextDate)),
      lastGeneratedAt: new Date().toISOString(),
    }
  })
  return {
    data: { ...data, invoices, recurringInvoices, settings },
    generated,
  }
}
