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
