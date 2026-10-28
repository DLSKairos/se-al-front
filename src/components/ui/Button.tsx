import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
  testId?: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--brand)] text-[var(--on-brand)] font-bold hover:bg-[var(--brand-press)] ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(23,22,15,0.3),0_8px_18px_-8px_rgba(168,127,0,0.7)]',
  secondary:
    'bg-[var(--surface)] text-[var(--fg)] font-semibold border-[1.5px] border-[color:var(--line-strong)] ' +
    'hover:bg-[var(--wash)] shadow-[var(--shadow-1)]',
  danger:
    'bg-[var(--danger)] text-[var(--on-danger)] font-bold hover:brightness-95 ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(23,22,15,0.3)]',
  ghost:
    'text-[var(--fg-muted)] font-semibold hover:text-[var(--fg)] hover:bg-[var(--wash)]',
}

// Mínimos táctiles pensados para guantes: 44 / 52 / 60 px
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-[44px] px-4 text-[15px] rounded-[var(--radius-btn)]',
  md: 'min-h-[52px] px-5 text-base rounded-[var(--radius-btn)]',
  lg: 'min-h-[60px] px-7 text-lg rounded-[14px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  testId,
  ...props
}: ButtonProps) {
  return (
    <button
      data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 font-body tracking-[0.01em] select-none transition-[transform,background-color,box-shadow,filter] duration-150 ease-[var(--ease-out)] active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
