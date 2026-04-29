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
  primary:   'text-[var(--navy)] font-semibold disabled:opacity-50 active:scale-[0.97]',
  secondary: 'bg-[rgba(22,34,56,0.5)] text-[var(--off-white)] border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.4)] disabled:opacity-50 active:scale-[0.97]',
  danger:    'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 active:scale-[0.97]',
  ghost:     'text-[var(--muted)] hover:text-[var(--signal)] hover:bg-[rgba(0,212,255,0.08)] disabled:opacity-50 active:scale-[0.97]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-btn)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-btn)]',
  lg: 'px-6 py-2.5 text-base rounded-[var(--radius-btn)]',
}

const primaryStyle = {
  background: 'linear-gradient(135deg, #00D4FF, #0096b3)',
  boxShadow: '0 0 24px rgba(0,212,255,0.4)',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  style,
  testId = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 font-['DM_Sans'] transition-all duration-150 cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      style={variant === 'primary' ? { ...primaryStyle, ...style } : style}
      {...props}
    >
      {loading && (
        <span
          className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
