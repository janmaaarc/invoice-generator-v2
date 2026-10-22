import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { toLocalDate } from '../../types'

interface DatePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  buttonClassName?: string
}

function parseLocal(str: string): Date | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

export function DatePicker({ label, value, onChange, buttonClassName }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseLocal(value)

  // listen only while open, so Escape elsewhere never pulls focus onto a closed picker
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const display = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">{label}</label>}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            // flip to whichever side has room so the calendar is not cut off by the screen or scroll area
            const rect = buttonRef.current?.getBoundingClientRect()
            if (rect) {
              const below = window.innerHeight - rect.bottom
              setOpenUp(below < 320 && rect.top > below)
              setAlignRight(rect.left + 260 > window.innerWidth)
            }
            setOpen(o => !o)
          }}
          className={buttonClassName ?? 'w-full flex items-center justify-between px-0 py-1.5 text-sm bg-transparent border-0 border-b border-[var(--border)] text-[var(--text)] hover:border-[var(--muted)] focus:outline-none focus:border-[var(--text)] transition-colors'}
        >
          <span className={display ? 'text-[var(--text)]' : 'text-[var(--muted)]'}>
            {display || 'Pick a date'}
          </span>
          <CalendarDays size={13} className="text-[var(--muted)] flex-shrink-0" />
        </button>

        {open && (
          <div className={`absolute ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'} ${alignRight ? 'right-0' : 'left-0'} z-50 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-[0_8px_24px_0_rgb(0,0,0,0.12)] p-3 select-none animate-dropdown`}>
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected ?? new Date()}
              onSelect={day => {
                if (day) { onChange(toLocalDate(day)); setOpen(false) }
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === 'left'
                    ? <ChevronLeft size={14} />
                    : <ChevronRight size={14} />,
              }}
              classNames={{
                root: 'w-[224px]',
                months: '',
                month: '',
                month_caption: 'flex items-center justify-between mb-3 px-1',
                caption_label: 'text-sm font-medium text-[var(--text)]',
                nav: 'flex items-center gap-1',
                button_previous: 'p-1 rounded hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] transition-colors',
                button_next: 'p-1 rounded hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] transition-colors',
                weekdays: 'grid grid-cols-7 mb-1',
                weekday: 'text-[10px] text-[var(--muted)] text-center font-normal py-1',
                weeks: 'space-y-0.5',
                week: 'grid grid-cols-7',
                day: 'flex items-center justify-center',
                day_button: 'w-8 h-8 text-xs rounded-md text-[var(--text)] hover:bg-[var(--surface)] transition-colors',
                selected: 'bg-[var(--text)] rounded-md [&>button]:text-[var(--bg)] [&>button]:hover:bg-transparent',
                today: '[&>button]:font-bold',
                outside: '[&>button]:text-[var(--muted)] [&>button]:opacity-30',
                disabled: '[&>button]:opacity-20 [&>button]:pointer-events-none',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
