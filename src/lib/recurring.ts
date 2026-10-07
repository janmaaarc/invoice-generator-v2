import type { RecurringInvoice, RecurringFrequency, InvoiceData, AppData, AppSettings } from '../types'
import { calculateDueDate, toLocalDate, parseLocalDate } from '../types'

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
      // move to the 1st first so Jan 31 + 1 month lands in Feb, not overflowing into Mar
      d.setDate(1)
      d.setMonth(d.getMonth() + 1)
      d.setDate(Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())))
      break
    }
    case 'quarterly': {
      d.setDate(1)
      d.setMonth(d.getMonth() + 3)
      d.setDate(Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())))
      break
    }
    case 'yearly': {
      d.setDate(1)
      d.setFullYear(d.getFullYear() + 1)
      d.setDate(Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth())))
      break
    }
  }
  return toLocalDate(d)
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
  return toLocalDate(d)
}

export function generateInvoiceFromRecurring(
  recurring: RecurringInvoice,
  settings: AppSettings
): InvoiceData {
  const nextNumber = settings.lastInvoiceNumber + 1
  const prefix = settings.invoiceNumberPrefix || 'INV'
  const now = new Date().toISOString()
  const invoiceDate = toLocalDate()

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
  const today = toLocalDate()
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
      nextDate: computeNextDate(r.frequency, r.dayOfMonth, parseLocalDate(r.nextDate)),
      lastGeneratedAt: new Date().toISOString(),
    }
  })
  return {
    data: { ...data, invoices, recurringInvoices, settings },
    generated,
  }
}
