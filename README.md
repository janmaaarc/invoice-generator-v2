# Invoix

Create, send, and track professional invoices right in your browser. No account. No subscription. No data leaves your device.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## What can it do?

### Create invoices in seconds
Fill in your client's name, add what you're charging for, and your invoice is ready. You see the final result as you type with no surprises when you download it.

### Send your way
- **Email** — opens your mail app with the invoice details already written
- **WhatsApp** — sends a pre-filled message to your client
- **PDF** — download a professional PDF to send however you like
- **Image** — save as a PNG if you need to attach it somewhere

### Get paid faster
Add your payment details (PayPal, GCash, bank account, etc.) once, then pick it with one click on every invoice. You can even add a QR code so clients can scan and pay instantly.

### Save your regulars
Save your frequent clients so you don't retype their details every time. Same for your common services. Save them as templates and drop them into any invoice.

### Set and forget with recurring invoices
Have a client you bill every month? Set up a recurring invoice once, pick the day, the amount, the payment terms, and the app creates a new draft invoice automatically when it's due. You'll get a notification so nothing slips through.

### Track what's paid
Mark invoices as Draft, Sent, or Paid. Record partial payments if a client pays in installments. See exactly how much is still owed.

### Your brand, your style
Add your logo, pick an accent color, and choose between three invoice layouts. Light and dark mode both available.

### Your data stays with you
Everything is saved in your browser. Nothing is sent to any server. Export a backup anytime from Settings and import it on any other device.

---

## How to use it

### First time setup (takes 2 minutes)
1. Open the app and go to **Settings**
2. Enter your name/business name, email, and address. These fill in automatically on every invoice.
3. Go to **Payments** and add your payment info (PayPal email, bank account, etc.)
4. Optionally add your logo

### Creating an invoice
1. Click **New Invoice**
2. Type your client's name (or pick a saved one from Clients)
3. Add what you're charging for: description, price, quantity
4. Pick your payment method
5. Hit **Download PDF** or share via email/WhatsApp

### Recurring invoices (auto-billing)
1. Go to **Recurring** in the sidebar
2. Click **New**, give it a name (e.g. "Monthly retainer for Acme Corp")
3. Fill in the client, services, and how often to bill
4. The app creates a draft invoice automatically on the scheduled date

---

## Keyboard shortcuts

| Action | Mac | Windows / Linux |
|--------|-----|-----------------|
| New invoice | ⌘N | Ctrl+N |
| Save | ⌘S | Ctrl+S |
| Download PDF | ⌘P | Ctrl+P |

---

## Everything it includes

| Feature | What it does |
|---------|--------------|
| Invoice editor | Fill in client, services, tax, discount, notes |
| Live preview | See the final invoice as you type |
| 3 templates | Minimal, Classic, Modern layouts |
| Clients | Save client details for quick reuse |
| Templates | Save common service packages |
| Payment methods | Save PayPal/GCash/bank info, pick per invoice |
| Recurring invoices | Auto-generate invoices on a schedule |
| Partial payments | Record installments, track remaining balance |
| QR code | Optional payment QR on the invoice |
| PDF / PNG export | High-quality downloads |
| Email / WhatsApp share | Pre-filled messages ready to send |
| Dark mode | Light and dark themes |
| Data export/import | Backup and restore your invoices |
| Offline | Works without internet, everything stays local |

---

## For developers

**Stack:** React 19 · TypeScript · Tailwind CSS v4 · Vite · html2pdf.js · html2canvas · qrcode.react

**Architecture:**
- Pure client-side SPA — no backend, no auth, no network calls
- All state persisted to `localStorage` via `src/storage.ts`
- Recurring invoice schedules mirrored to Cache API for service worker access
- Service worker (`public/sw.js`) handles Periodic Background Sync + push notifications (Chrome Android only)

**Key files:**
```
src/
├── types.ts              — All data types + pure utility functions
├── storage.ts            — localStorage load/save/export/import
├── App.tsx               — Root state, section routing
├── lib/
│   ├── recurring.ts      — Schedule computation, invoice generation
│   └── notifications.ts  — SW registration, notification permission
├── components/
│   ├── invoice/          — Editor + list + preview
│   ├── recurring/        — Recurring CRUD UI
│   ├── payments/         — Payment methods CRUD
│   ├── clients/          — Saved clients
│   ├── templates/        — Line item templates
│   └── settings/         — App settings
└── index.css             — CSS custom properties (design tokens)
```

**Get started:**
```bash
git clone https://github.com/janmaaarc/invoice-generator.git
cd invoice-generator-v2
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
```

**Data model:** `AppData` in `src/types.ts` covers invoices, clients, templates, payment methods, recurring invoices, and settings. All serialized to one localStorage key.

---

## License

MIT
