# Invoice Generator Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all UI in `invoice-generator-v2` (cloned from `janmaaarc/invoice-generator`) with a minimalistic OpenAI/Claude-style design — sidebar + main panel, zinc palette, system light/dark toggle. Zero changes to `types.ts`, `storage.ts`, `html2pdf.d.ts`, or `main.tsx`.

**Architecture:** Fixed 260px sidebar holds the invoice list and bottom nav; the main panel shows the editor or print preview. All state stays in `App.tsx`. Only UI layer changes — logic and data are untouched.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4 (already installed), Lucide React (to add), html2pdf.js (keep as-is)

## Global Constraints

- Tailwind v4 via `@tailwindcss/vite` — no config file
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *))` in CSS; `.dark` class on `<html>`
- Zinc scale palette only — `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent` CSS vars
- No shadows, no gradients, no decorative elements
- Lucide React for all icons
- **Never modify:** `src/types.ts`, `src/storage.ts`, `src/html2pdf.d.ts`, `src/main.tsx`
- Font: Inter via Google Fonts in `index.html`, fallback `system-ui`
- All old component files (`InvoiceForm.tsx`, `Modal.tsx`, old `InvoiceList.tsx`, old `InvoicePreview.tsx`, old `Settings.tsx`) are **deleted** and replaced with new structure

## File Map

```
src/
├── components/
│   ├── layout/
│   │   ├── Shell.tsx          NEW — two-column layout wrapper
│   │   └── Sidebar.tsx        NEW — fixed sidebar with nav + invoice list slot
│   ├── invoice/
│   │   ├── InvoiceList.tsx    REPLACE old InvoiceList.tsx
│   │   ├── InvoiceEditor.tsx  REPLACE old InvoiceForm.tsx
│   │   └── InvoicePreview.tsx REPLACE old InvoicePreview.tsx
│   ├── settings/
│   │   └── Settings.tsx       REPLACE old Settings.tsx
│   ├── clients/
│   │   └── Clients.tsx        NEW
│   ├── templates/
│   │   └── Templates.tsx      NEW
│   └── ui/
│       ├── Button.tsx         NEW
│       ├── Input.tsx          NEW
│       └── Badge.tsx          NEW
├── hooks/
│   └── useTheme.ts            NEW
├── styles/
│   └── tokens.css             NEW
├── App.tsx                    REPLACE
├── index.css                  REPLACE
├── index.html                 MODIFY (add Inter font)
```

---

### Task 1: Dependencies + Design Tokens + useTheme

**Files:**
- Modify: `package.json` (add lucide-react)
- Modify: `index.html` (add Inter font link)
- Replace: `src/index.css`
- Create: `src/styles/tokens.css`
- Create: `src/hooks/useTheme.ts`

**Interfaces:**
- Produces: `useTheme(): { theme: 'light' | 'dark', toggle: () => void }`
- Produces: CSS vars `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`, `--accent-fg` available globally
- Produces: `dark:` Tailwind prefix works when `.dark` is on `<html>`

- [ ] **Step 1: Install lucide-react**

```bash
cd /Users/janmarccoloma/Documents/invoice-generator-v2
npm install lucide-react
```

Expected: `lucide-react` appears in `node_modules`

- [ ] **Step 2: Add Inter font to index.html**

In `index.html`, add to `<head>` before the closing tag:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

Also update `<title>Invoice</title>`.

- [ ] **Step 3: Create src/styles/tokens.css**

Create `src/styles/tokens.css`:
```css
:root {
  --bg: #ffffff;
  --surface: #f4f4f5;
  --border: #e4e4e7;
  --text: #09090b;
  --muted: #71717a;
  --accent: #18181b;
  --accent-fg: #fafafa;

  --badge-draft-bg: #f4f4f5;
  --badge-draft-text: #71717a;
  --badge-sent-bg: #eff6ff;
  --badge-sent-text: #1d4ed8;
  --badge-paid-bg: #f0fdf4;
  --badge-paid-text: #15803d;
}

.dark {
  --bg: #09090b;
  --surface: #18181b;
  --border: #27272a;
  --text: #fafafa;
  --muted: #a1a1aa;
  --accent: #fafafa;
  --accent-fg: #09090b;

  --badge-draft-bg: #27272a;
  --badge-draft-text: #a1a1aa;
  --badge-sent-bg: #1e3a5f;
  --badge-sent-text: #93c5fd;
  --badge-paid-bg: #14532d;
  --badge-paid-text: #86efac;
}
```

- [ ] **Step 4: Replace src/index.css**

```css
@import "tailwindcss";
@import "./styles/tokens.css";

@custom-variant dark (&:where(.dark, .dark *));

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
```

- [ ] **Step 5: Create src/hooks/useTheme.ts**

```ts
import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts at `http://localhost:5173` (page may look broken — that's OK, App.tsx hasn't changed yet)

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens.css src/index.css src/hooks/useTheme.ts index.html package.json package-lock.json
git commit -m "feat: add lucide-react, design tokens, dark mode CSS vars, useTheme hook"
```

---

### Task 2: UI Primitives

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/index.ts`

**Interfaces:**
- `Button({ variant?: 'default'|'ghost'|'outline', size?: 'sm'|'md', ...ButtonHTMLAttributes })`
- `Input({ label?: string, ...InputHTMLAttributes })`
- `Badge({ status: 'draft'|'sent'|'paid' })`

- [ ] **Step 1: Create src/components/ui/Button.tsx**

```tsx
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center gap-1.5 font-medium transition-colors rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
    const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3 py-2 text-sm' }
    const variants = {
      default: 'bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90',
      ghost: 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
      outline: 'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]',
    }
    return (
      <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Create src/components/ui/Input.tsx**

```tsx
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors ${className}`}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'
```

- [ ] **Step 3: Create src/components/ui/Badge.tsx**

```tsx
import type { InvoiceStatus } from '../../types'

const labels: Record<InvoiceStatus, string> = { draft: 'Draft', sent: 'Sent', paid: 'Paid' }

export function Badge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `var(--badge-${status}-bg)`, color: `var(--badge-${status}-text)` }}
    >
      {labels[status]}
    </span>
  )
}
```

- [ ] **Step 4: Create src/components/ui/index.ts**

```ts
export { Button } from './Button'
export { Input } from './Input'
export { Badge } from './Badge'
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: Button, Input, Badge UI primitives"
```

---

### Task 3: Shell + Sidebar Layout

**Files:**
- Create: `src/components/layout/Shell.tsx`
- Create: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- `Shell({ sidebar: ReactNode, main: ReactNode })`
- `type Section = 'invoices' | 'clients' | 'templates' | 'settings'` (export from Sidebar)
- `Sidebar({ section, onSectionChange, onNewInvoice, theme, onThemeToggle, children })`
  - `children` renders into the scrollable invoice list area

- [ ] **Step 1: Create src/components/layout/Shell.tsx**

```tsx
interface ShellProps {
  sidebar: React.ReactNode
  main: React.ReactNode
}

export function Shell({ sidebar, main }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <aside className="w-64 flex-shrink-0 border-r border-[var(--border)] flex flex-col overflow-hidden">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-auto">
        {main}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/layout/Sidebar.tsx**

```tsx
import { Plus, Users, FileText, Settings, Sun, Moon } from 'lucide-react'
import { Button } from '../ui'

export type Section = 'invoices' | 'clients' | 'templates' | 'settings'

interface SidebarProps {
  section: Section
  onSectionChange: (s: Section) => void
  onNewInvoice: () => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  children: React.ReactNode
}

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? 'bg-[var(--surface)] text-[var(--text)] font-medium'
          : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

export function Sidebar({ section, onSectionChange, onNewInvoice, theme, onThemeToggle, children }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
        <span className="text-sm font-semibold tracking-tight">Invoice</span>
        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className="px-3 pt-3 pb-2">
        <Button variant="outline" className="w-full justify-start" onClick={onNewInvoice}>
          <Plus size={14} />
          New Invoice
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {children}
      </div>

      <div className="border-t border-[var(--border)] px-3 py-3 space-y-0.5">
        <NavItem icon={Users} label="Clients" active={section === 'clients'} onClick={() => onSectionChange('clients')} />
        <NavItem icon={FileText} label="Templates" active={section === 'templates'} onClick={() => onSectionChange('templates')} />
        <NavItem icon={Settings} label="Settings" active={section === 'settings'} onClick={() => onSectionChange('settings')} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: Shell and Sidebar layout components"
```

---

### Task 4: InvoiceList + New App.tsx Skeleton

**Files:**
- Create: `src/components/invoice/InvoiceList.tsx`
- Replace: `src/App.tsx`
- Delete: `src/components/InvoiceList.tsx` (old file)
- Delete: `src/components/InvoiceForm.tsx`
- Delete: `src/components/Modal.tsx`
- Delete: `src/components/InvoicePreview.tsx`
- Delete: `src/components/Settings.tsx`

**Interfaces:**
- `InvoiceList({ invoices: InvoiceData[], selectedId: string|null, onSelect: (id:string)=>void })`
- App.tsx wires Shell + Sidebar + InvoiceList with real data from `loadData()`

- [ ] **Step 1: Delete old components**

```bash
rm src/components/InvoiceForm.tsx
rm src/components/InvoiceList.tsx
rm src/components/InvoicePreview.tsx
rm src/components/Modal.tsx
rm src/components/Settings.tsx
```

- [ ] **Step 2: Create src/components/invoice/InvoiceList.tsx**

```tsx
import { formatCurrency, getInvoiceTotal } from '../../types'
import type { InvoiceData } from '../../types'
import { Badge } from '../ui'

interface InvoiceListProps {
  invoices: InvoiceData[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function InvoiceList({ invoices, selectedId, onSelect }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-[var(--muted)]">
        No invoices yet.
        <br />
        Press{' '}
        <kbd className="px-1 py-0.5 text-[10px] border border-[var(--border)] rounded">N</kbd>
        {' '}to create one.
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {invoices.map(invoice => (
        <button
          key={invoice.id}
          onClick={() => onSelect(invoice.id)}
          className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
            selectedId === invoice.id ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-xs font-mono text-[var(--muted)] truncate">{invoice.invoiceNumber}</span>
            <Badge status={invoice.status} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-[var(--text)] truncate">
              {invoice.toName || <span className="text-[var(--muted)] italic">No client</span>}
            </span>
            <span className="text-sm font-medium text-[var(--text)] flex-shrink-0">
              {formatCurrency(getInvoiceTotal(invoice), invoice.currency)}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Replace src/App.tsx with skeleton**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { Shell } from './components/layout/Shell'
import { Sidebar, type Section } from './components/layout/Sidebar'
import { InvoiceList } from './components/invoice/InvoiceList'
import { useTheme } from './hooks/useTheme'
import { loadData, saveData } from './storage'
import { createNewInvoice } from './types'
import type { AppData, InvoiceData, InvoiceStatus } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState<Section>('invoices')
  const [data, setData] = useState<AppData>(() => loadData())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedInvoice = data.invoices.find(inv => inv.id === selectedId) ?? null

  function handleNewInvoice() {
    const invoice = createNewInvoice(data.settings)
    const nextData: AppData = {
      ...data,
      invoices: [invoice, ...data.invoices],
      settings: { ...data.settings, lastInvoiceNumber: data.settings.lastInvoiceNumber + 1 },
    }
    setData(nextData)
    saveData(nextData)
    setSelectedId(invoice.id)
    setSection('invoices')
  }

  function handleChange(invoice: InvoiceData) {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === invoice.id ? invoice : inv),
    }))
  }

  function handleSave() {
    saveData(data)
  }

  function handleStatusChange(status: InvoiceStatus) {
    if (!selectedInvoice) return
    handleChange({
      ...selectedInvoice,
      status,
      paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : selectedInvoice.paidDate,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if (!isInput && e.key === 'n') { e.preventDefault(); handleNewInvoice() }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
  }, [data])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Shell
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
            onSelect={id => { setSelectedId(id); setSection('invoices') }}
          />
        </Sidebar>
      }
      main={
        <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
          <p className="text-sm">No invoice selected</p>
          <p className="text-xs">
            Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one
          </p>
        </div>
      }
    />
  )
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```
Verify:
- Sidebar renders with "Invoice" header, theme toggle, "+ New Invoice" button, bottom nav
- Press `N` → new invoice appears in sidebar list with number, "No client", $0.00, Draft badge
- Click sidebar row → row highlights (no editor yet — main shows placeholder)
- Theme toggle → all CSS vars update correctly

- [ ] **Step 5: Commit**

```bash
git add src/components/invoice/ src/App.tsx
git commit -m "feat: InvoiceList sidebar rows, App.tsx skeleton with data wiring"
```

---

### Task 5: InvoiceEditor

**Files:**
- Create: `src/components/invoice/InvoiceEditor.tsx`
- Modify: `src/App.tsx` (wire InvoiceEditor into main panel)

**Interfaces:**
- Consumes: `InvoiceData`, `AppData`, `CURRENCIES`, `DUE_DATE_PRESETS`, `calculateDueDate`, `formatCurrency`, `getInvoiceTotal` from `types.ts`
- `InvoiceEditor({ invoice, data, onChange, onSave, onDownloadPdf, onShare, onStatusChange, view, onViewChange })`
  - `view: 'editor' | 'preview'`
  - `onViewChange: (v: 'editor' | 'preview') => void`
  - `onDownloadPdf: () => void`
  - `onShare: (type: 'email' | 'whatsapp') => void`

- [ ] **Step 1: Create src/components/invoice/InvoiceEditor.tsx**

```tsx
import { useState } from 'react'
import { Download, Share2, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import { Button, Input, Badge } from '../ui'
import {
  CURRENCIES, DUE_DATE_PRESETS, calculateDueDate,
  formatCurrency, getInvoiceTotal,
} from '../../types'
import type { InvoiceData, AppData, InvoiceStatus, LineItem } from '../../types'

interface InvoiceEditorProps {
  invoice: InvoiceData
  data: AppData
  onChange: (invoice: InvoiceData) => void
  onSave: () => void
  onDownloadPdf: () => void
  onShare: (type: 'email' | 'whatsapp') => void
  onStatusChange: (status: InvoiceStatus) => void
  view: 'editor' | 'preview'
  onViewChange: (v: 'editor' | 'preview') => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">
      {children}
    </p>
  )
}

export function InvoiceEditor({
  invoice, data, onChange, onSave, onDownloadPdf, onShare, onStatusChange, view, onViewChange,
}: InvoiceEditorProps) {
  const [shareOpen, setShareOpen] = useState(false)

  function set<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) {
    onChange({ ...invoice, [key]: value, updatedAt: new Date().toISOString() })
  }

  function setLineItem(id: string, field: keyof LineItem, value: string | number) {
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  function addLineItem() {
    onChange({
      ...invoice,
      lineItems: [...invoice.lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }],
      updatedAt: new Date().toISOString(),
    })
  }

  function removeLineItem(id: string) {
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.filter(item => item.id !== id),
      updatedAt: new Date().toISOString(),
    })
  }

  const total = getInvoiceTotal(invoice)
  const currency = CURRENCIES.find(c => c.code === invoice.currency) ?? CURRENCIES[0]
  const selectCls = 'px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]'
  const inputCls = 'px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]'

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted)]">{invoice.invoiceNumber}</span>
          <select
            value={invoice.status}
            onChange={e => onStatusChange(e.target.value as InvoiceStatus)}
            className="text-xs bg-transparent border-none outline-none text-[var(--muted)] cursor-pointer"
          >
            {(['draft', 'sent', 'paid'] as InvoiceStatus[]).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <Badge status={invoice.status} />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-[var(--surface)] rounded-md p-0.5">
          {(['editor', 'preview'] as const).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                view === v
                  ? 'bg-[var(--bg)] text-[var(--text)] font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onSave}>Save</Button>
          <Button variant="ghost" size="sm" onClick={onDownloadPdf}>
            <Download size={13} /> PDF
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShareOpen(o => !o)}>
              <Share2 size={13} /> Share <ChevronDown size={11} />
            </Button>
            {shareOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-md z-10 min-w-36 py-1">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                  onClick={() => { onShare('email'); setShareOpen(false) }}
                >
                  <Mail size={13} /> Email
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                  onClick={() => { onShare('whatsapp'); setShareOpen(false) }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-2xl">

        {/* Dates + Currency */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Invoice Date"
            type="date"
            value={invoice.invoiceDate}
            onChange={e => set('invoiceDate', e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Due Date</label>
            <select
              value={invoice.dueDate}
              onChange={e => set('dueDate', calculateDueDate(e.target.value, invoice.invoiceDate))}
              className={selectCls}
            >
              {DUE_DATE_PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Currency</label>
            <select value={invoice.currency} onChange={e => set('currency', e.target.value)} className={selectCls}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* From */}
        <div>
          <SectionLabel>From</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={invoice.fromName} onChange={e => set('fromName', e.target.value)} placeholder="Your name or company" />
            <Input label="Email" type="email" value={invoice.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="you@example.com" />
            <div className="col-span-2">
              <Input label="Address" value={invoice.fromAddress} onChange={e => set('fromAddress', e.target.value)} placeholder="Street, City, Country" />
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div>
          <SectionLabel>Bill To</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Client Name</label>
              <input
                className={inputCls}
                value={invoice.toName}
                onChange={e => {
                  set('toName', e.target.value)
                  const client = data.clients.find(c => c.name === e.target.value)
                  if (client) {
                    onChange({
                      ...invoice,
                      toName: client.name,
                      toEmail: client.email,
                      toAddress: client.address,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                }}
                placeholder="Client or company"
                list="saved-clients"
              />
              <datalist id="saved-clients">
                {data.clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <Input label="Client Email" type="email" value={invoice.toEmail} onChange={e => set('toEmail', e.target.value)} placeholder="client@example.com" />
            <div className="col-span-2">
              <Input label="Client Address" value={invoice.toAddress} onChange={e => set('toAddress', e.target.value)} placeholder="Street, City, Country" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <SectionLabel>Line Items</SectionLabel>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_72px_96px_24px] gap-2 text-[10px] text-[var(--muted)] uppercase tracking-wide px-1">
              <span>Description</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span />
            </div>
            {invoice.lineItems.map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_72px_96px_24px] gap-2 items-center">
                <input
                  className={inputCls}
                  value={item.description}
                  onChange={e => setLineItem(item.id, 'description', e.target.value)}
                  placeholder="Service or product"
                  list="line-item-templates"
                />
                <datalist id="line-item-templates">
                  {data.lineItemTemplates.map(t => <option key={t.id} value={t.description} />)}
                </datalist>
                <input
                  type="number" min={0} step={1}
                  className={`${inputCls} text-right`}
                  value={item.quantity}
                  onChange={e => setLineItem(item.id, 'quantity', Number(e.target.value))}
                />
                <input
                  type="number" min={0} step={0.01}
                  className={`${inputCls} text-right`}
                  value={item.rate}
                  onChange={e => setLineItem(item.id, 'rate', Number(e.target.value))}
                />
                <button
                  onClick={() => removeLineItem(item.id)}
                  className="text-[var(--muted)] hover:text-[var(--text)] text-lg leading-none transition-colors"
                  aria-label="Remove"
                >×</button>
              </div>
            ))}
            <button onClick={addLineItem} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-1">
              + Add item
            </button>
            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <div className="text-right">
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-semibold">{formatCurrency(total, invoice.currency)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div>
          <SectionLabel>Payment</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Method" value={invoice.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} placeholder="PayPal, Bank Transfer…" />
            <Input label="Details" value={invoice.paymentDetails} onChange={e => set('paymentDetails', e.target.value)} placeholder="Account number, email…" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <SectionLabel>Notes</SectionLabel>
          <textarea
            className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
            rows={3}
            value={invoice.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Payment terms, thank you note…"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire InvoiceEditor into App.tsx**

Add imports to App.tsx:
```tsx
import { InvoiceEditor } from './components/invoice/InvoiceEditor'
import { generateEmailShareLink, generateWhatsAppShareLink } from './types'
```

Add state:
```tsx
const [view, setView] = useState<'editor' | 'preview'>('editor')
```

Add keyboard shortcut for `⌘P` inside `handleKeyDown`:
```tsx
if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setView(v => v === 'editor' ? 'preview' : 'editor') }
```

Add share + PDF handlers:
```tsx
function handleShare(type: 'email' | 'whatsapp') {
  if (!selectedInvoice) return
  const link = type === 'email'
    ? generateEmailShareLink(selectedInvoice)
    : generateWhatsAppShareLink(selectedInvoice)
  window.open(link, '_blank')
}

async function handleDownloadPdf() {
  // implemented in Task 6
  alert('PDF coming in Task 6')
}
```

Replace the `main` prop in `<Shell>`:
```tsx
main={
  !selectedInvoice || section !== 'invoices'
    ? (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
        <p className="text-sm">No invoice selected</p>
        <p className="text-xs">Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one</p>
      </div>
    )
    : (
      <InvoiceEditor
        invoice={selectedInvoice}
        data={data}
        onChange={handleChange}
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onShare={handleShare}
        onStatusChange={handleStatusChange}
        view={view}
        onViewChange={setView}
      />
    )
}
```

- [ ] **Step 3: Verify in browser**

- Press `N` → editor opens in main panel
- Fill From/To/Line Items → total updates in real time
- Add/remove line items
- Status dropdown → badge updates
- View toggle → switches between Editor/Preview tabs (Preview shows placeholder for now)
- `⌘S` saves → check localStorage in DevTools
- Share → opens email/WhatsApp link

- [ ] **Step 4: Commit**

```bash
git add src/components/invoice/InvoiceEditor.tsx src/App.tsx
git commit -m "feat: InvoiceEditor with all form sections and view toggle"
```

---

### Task 6: InvoicePreview + PDF Export

**Files:**
- Create: `src/components/invoice/InvoicePreview.tsx`
- Modify: `src/App.tsx` (replace PDF stub, add hidden preview ref)

**Interfaces:**
- `InvoicePreview` is a `forwardRef` component: `({ invoice: InvoiceData, settings: AppSettings }, ref: Ref<HTMLDivElement>)`
- A hidden instance lives in App.tsx DOM (off-screen) for html2pdf rendering
- The visible instance renders inside InvoiceEditor when `view === 'preview'`

- [ ] **Step 1: Create src/components/invoice/InvoicePreview.tsx**

```tsx
import { forwardRef } from 'react'
import { formatCurrency, getInvoiceTotal, CURRENCIES } from '../../types'
import type { InvoiceData, AppSettings } from '../../types'

interface InvoicePreviewProps {
  invoice: InvoiceData
  settings: AppSettings
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, settings }, ref) => {
    const total = getInvoiceTotal(invoice)
    const currency = CURRENCIES.find(c => c.code === invoice.currency) ?? CURRENCIES[0]

    return (
      <div
        ref={ref}
        style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#09090b', background: '#ffffff' }}
        className="w-[794px] min-h-[1123px] p-16 mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-10 mb-3 object-contain" />}
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>INVOICE</h1>
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            <p style={{ color: '#71717a', margin: 0 }}>Date</p>
            <p style={{ fontWeight: 500, margin: '2px 0 8px' }}>{invoice.invoiceDate}</p>
            <p style={{ color: '#71717a', margin: 0 }}>Due</p>
            <p style={{ fontWeight: 500, margin: '2px 0 0' }}>{invoice.dueDate}</p>
          </div>
        </div>

        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
          {[
            { label: 'From', name: invoice.fromName, email: invoice.fromEmail, address: invoice.fromAddress },
            { label: 'Bill To', name: invoice.toName, email: invoice.toEmail, address: invoice.toAddress },
          ].map(({ label, name, email, address }) => (
            <div key={label}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>{label}</p>
              {name && <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{name}</p>}
              {email && <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 2px' }}>{email}</p>}
              {address && <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{address}</p>}
            </div>
          ))}
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e4e4e7' }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  paddingBottom: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#a1a1aa',
                  width: i === 0 ? 'auto' : i === 1 ? 60 : 90,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '10px 0' }}>{item.description}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: '#71717a' }}>{item.quantity}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: '#71717a' }}>{currency.symbol}{item.rate.toFixed(2)}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500 }}>{currency.symbol}{(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 48 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 4px' }}>Total</p>
            <p style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{formatCurrency(total, invoice.currency)}</p>
          </div>
        </div>

        {/* Payment */}
        {(invoice.paymentMethod || invoice.paymentDetails) && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>Payment</p>
            {invoice.paymentMethod && <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{invoice.paymentMethod}</p>}
            {invoice.paymentDetails && <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{invoice.paymentDetails}</p>}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: '0 0 8px' }}>Notes</p>
            <p style={{ fontSize: 13, color: '#71717a', margin: 0, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    )
  }
)
InvoicePreview.displayName = 'InvoicePreview'
```

- [ ] **Step 2: Wire preview into InvoiceEditor**

In `InvoiceEditor.tsx`, import and render preview when `view === 'preview'`:

Add import:
```tsx
import { InvoicePreview } from './InvoicePreview'
```

Replace the form `<div className="flex-1 overflow-y-auto ...">` with a conditional:
```tsx
{view === 'preview' ? (
  <div className="flex-1 overflow-auto bg-[var(--surface)] py-8">
    <InvoicePreview invoice={invoice} settings={data.settings} />
  </div>
) : (
  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-2xl">
    {/* ...existing form content stays here... */}
  </div>
)}
```

- [ ] **Step 3: Wire PDF export into App.tsx**

Add imports:
```tsx
import { useRef } from 'react'
import { InvoicePreview } from './components/invoice/InvoicePreview'
import { sanitizeFilename } from './types'
```

Add ref inside App component:
```tsx
const previewRef = useRef<HTMLDivElement>(null)
```

Replace `handleDownloadPdf` stub:
```tsx
async function handleDownloadPdf() {
  if (!selectedInvoice || !previewRef.current) return
  const html2pdf = (await import('html2pdf.js')).default
  const filename = sanitizeFilename(`${selectedInvoice.invoiceNumber}-${selectedInvoice.toName || 'invoice'}`)
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
}
```

Add hidden preview render in App.tsx JSX (before the `<Shell>` return, inside a fragment):
```tsx
return (
  <>
    {selectedInvoice && (
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <InvoicePreview ref={previewRef} invoice={selectedInvoice} settings={data.settings} />
      </div>
    )}
    <Shell sidebar={...} main={...} />
  </>
)
```

- [ ] **Step 4: Verify**

- Click Preview tab → clean white invoice renders
- Click PDF → file downloads with correct layout
- Dark mode does not bleed into the PDF (PDF always uses light/white styles via inline `style` props, not CSS vars)

- [ ] **Step 5: Commit**

```bash
git add src/components/invoice/InvoicePreview.tsx src/App.tsx src/components/invoice/InvoiceEditor.tsx
git commit -m "feat: InvoicePreview component, PDF export, preview tab"
```

---

### Task 7: Settings, Clients, Templates + Full App Wiring

**Files:**
- Create: `src/components/settings/Settings.tsx`
- Create: `src/components/clients/Clients.tsx`
- Create: `src/components/templates/Templates.tsx`
- Modify: `src/App.tsx` (wire all three views into renderMain)

**Interfaces:**
- All three share the same prop shape: `{ data: AppData, onChange: (d: AppData) => void, onSave: () => void }`

- [ ] **Step 1: Create src/components/settings/Settings.tsx**

```tsx
import { Input, Button } from '../ui'
import { DEFAULT_SETTINGS } from '../../types'
import type { AppData } from '../../types'

interface SettingsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">{children}</p>
}

export function Settings({ data, onChange, onSave }: SettingsProps) {
  const s = data.settings
  function set<K extends keyof typeof s>(key: K, value: typeof s[K]) {
    onChange({ ...data, settings: { ...s, [key]: value } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Settings</h2>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-lg">

        <div>
          <SectionLabel>Your Info</SectionLabel>
          <div className="space-y-3">
            <Input label="Name" value={s.defaultFromName} onChange={e => set('defaultFromName', e.target.value)} placeholder="Your name or company" />
            <Input label="Email" type="email" value={s.defaultFromEmail} onChange={e => set('defaultFromEmail', e.target.value)} placeholder="you@example.com" />
            <Input label="Address" value={s.defaultFromAddress} onChange={e => set('defaultFromAddress', e.target.value)} placeholder="Street, City, Country" />
          </div>
        </div>

        <div>
          <SectionLabel>Invoice Numbers</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prefix" value={s.invoiceNumberPrefix} onChange={e => set('invoiceNumberPrefix', e.target.value)} placeholder="INV" />
            <Input label="Last Number" type="number" value={String(s.lastInvoiceNumber)} onChange={e => set('lastInvoiceNumber', Number(e.target.value))} />
          </div>
        </div>

        <div>
          <SectionLabel>Default Payment</SectionLabel>
          <div className="space-y-3">
            <Input label="Method" value={s.defaultPaymentMethod} onChange={e => set('defaultPaymentMethod', e.target.value)} placeholder="PayPal, Bank Transfer…" />
            <Input label="Details" value={s.defaultPaymentDetails} onChange={e => set('defaultPaymentDetails', e.target.value)} placeholder="Account or email" />
          </div>
        </div>

        <div>
          <SectionLabel>Logo</SectionLabel>
          <input
            type="file"
            accept="image/*"
            className="text-sm text-[var(--muted)]"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => set('logo', ev.target?.result as string)
              reader.readAsDataURL(file)
            }}
          />
          {s.logo && <img src={s.logo} alt="Logo preview" className="mt-3 h-10 object-contain" />}
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: '#ef4444' }}
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) {
                onChange({ ...data, settings: { ...DEFAULT_SETTINGS } })
              }
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/clients/Clients.tsx**

```tsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Button } from '../ui'
import type { AppData, SavedClient } from '../../types'

interface ClientsProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

const emptyClient = (): SavedClient => ({ id: crypto.randomUUID(), name: '', email: '', address: '' })

export function Clients({ data, onChange, onSave }: ClientsProps) {
  const [draft, setDraft] = useState<SavedClient>(emptyClient())

  function addClient() {
    if (!draft.name.trim()) return
    onChange({ ...data, clients: [...data.clients, draft] })
    setDraft(emptyClient())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Clients</h2>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Add Client</p>
          <Input label="Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Client name" />
          <Input label="Email" type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} placeholder="client@example.com" />
          <Input label="Address" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} placeholder="Street, City, Country" />
          <Button size="sm" variant="outline" onClick={addClient}>
            <Plus size={13} /> Add Client
          </Button>
        </div>

        {data.clients.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Saved Clients</p>
            <div className="space-y-2">
              {data.clients.map(client => (
                <div key={client.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[var(--surface)] group">
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
                    {client.email && <p className="text-xs text-[var(--muted)]">{client.email}</p>}
                  </div>
                  <button
                    onClick={() => onChange({ ...data, clients: data.clients.filter(c => c.id !== client.id) })}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/templates/Templates.tsx**

```tsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Button } from '../ui'
import type { AppData, SavedLineItem } from '../../types'

interface TemplatesProps {
  data: AppData
  onChange: (data: AppData) => void
  onSave: () => void
}

export function Templates({ data, onChange, onSave }: TemplatesProps) {
  const [desc, setDesc] = useState('')
  const [rate, setRate] = useState('')

  function addTemplate() {
    if (!desc.trim()) return
    const item: SavedLineItem = { id: crypto.randomUUID(), description: desc.trim(), rate: Number(rate) || 0 }
    onChange({ ...data, lineItemTemplates: [...data.lineItemTemplates, item] })
    setDesc('')
    setRate('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Templates</h2>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Line Item Templates</p>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Design consultation" />
              <Input label="Rate" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="100" />
            </div>
            <Button size="sm" variant="outline" onClick={addTemplate}>
              <Plus size={13} /> Add Template
            </Button>
          </div>
          {data.lineItemTemplates.length > 0 && (
            <div className="space-y-2 mt-4">
              {data.lineItemTemplates.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[var(--surface)] group">
                  <div>
                    <p className="text-sm">{t.description}</p>
                    <p className="text-xs text-[var(--muted)]">${t.rate.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => onChange({ ...data, lineItemTemplates: data.lineItemTemplates.filter(i => i.id !== t.id) })}
                    className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire all views into App.tsx**

Add imports:
```tsx
import { Settings } from './components/settings/Settings'
import { Clients } from './components/clients/Clients'
import { Templates } from './components/templates/Templates'
```

Replace the `main` prop in `<Shell>` with a `renderMain()` function:
```tsx
function renderMain() {
  if (section === 'settings') return <Settings data={data} onChange={setData} onSave={handleSave} />
  if (section === 'clients') return <Clients data={data} onChange={setData} onSave={handleSave} />
  if (section === 'templates') return <Templates data={data} onChange={setData} onSave={handleSave} />
  if (!selectedInvoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted)]">
        <p className="text-sm">No invoice selected</p>
        <p className="text-xs">Press <kbd className="px-1.5 py-0.5 text-[10px] border border-[var(--border)] rounded font-mono">N</kbd> to create one</p>
      </div>
    )
  }
  return (
    <InvoiceEditor
      invoice={selectedInvoice}
      data={data}
      onChange={handleChange}
      onSave={handleSave}
      onDownloadPdf={handleDownloadPdf}
      onShare={handleShare}
      onStatusChange={handleStatusChange}
      view={view}
      onViewChange={setView}
    />
  )
}
```

Use it: `main={renderMain()}`

- [ ] **Step 5: Verify full flow**

- N → new invoice, editor opens
- Fill form, ⌘S → data persists in localStorage
- Preview tab → white invoice renders
- PDF button → file downloads
- Share → email/WhatsApp links open
- Settings → configure defaults, save persists
- Clients → add client → name autocompletes in invoice editor
- Templates → add line item template → autocompletes in line items
- Theme toggle → light ↔ dark

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/ src/components/clients/ src/components/templates/ src/App.tsx
git commit -m "feat: Settings, Clients, Templates views — full app wired"
```

---

### Task 8: Build Verification + Visual Core View Check

**Files:**
- No new files — verify existing, fix any type errors

- [ ] **Step 1: Type check**

```bash
npm run build
```
Expected: zero TypeScript errors, zero build errors

- [ ] **Step 2: Fix any type errors**

If TS errors appear, fix them. Common causes:
- Missing type imports from `../../types`
- Incorrect prop types in new components
- Ref type mismatch on InvoicePreview

- [ ] **Step 3: Verify no stale imports**

```bash
grep -r "InvoiceForm\|Modal\.tsx\|components/InvoiceList\|components/InvoicePreview\|components/Settings" src/
```
Expected: no results (all old paths removed)

- [ ] **Step 4: Start dev server and screenshot all core views with Playwright**

Start dev server in background:
```bash
npm run dev &
sleep 3
```

Use Playwright MCP tools to:

1. Navigate to `http://localhost:5173` — screenshot **light mode empty state** (sidebar + "No invoice selected")
2. Press `N` keyboard shortcut — screenshot **invoice editor** (editor tab open, form visible)
3. Fill in "From Name" with "Jan Marc" and add a line item "Web Design" qty 1 rate 500 — screenshot **editor with data**
4. Click "Preview" tab — screenshot **invoice preview** (white PDF-style view)
5. Click Settings in bottom nav — screenshot **Settings view**
6. Click Clients in bottom nav — screenshot **Clients view**
7. Click Templates in bottom nav — screenshot **Templates view**
8. Click theme toggle — screenshot **dark mode** (invoice editor or list)

For each screenshot verify:
- Sidebar is visible and correctly structured (260px, zinc border)
- No hardcoded colors bleeding through (everything uses CSS vars)
- No layout breakage (overflow, clipped text, missing elements)
- Dark mode: all surfaces update (no white flash, no stuck colors)

- [ ] **Step 5: Kill dev server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 6: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 7: Commit if any fixes were made**

```bash
git add -A
git commit -m "chore: build verification, fix type errors" 2>/dev/null || echo "nothing to commit"
git push origin main
```
