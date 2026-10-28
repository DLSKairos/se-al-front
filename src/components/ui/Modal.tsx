import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
}

/**
 * Hoja de vidrio líquido. En móvil sube desde abajo (alcance del pulgar);
 * desde `sm` es un diálogo centrado.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="modal-overlay"
          className="fixed inset-0 bg-[rgba(23,22,15,0.5)] z-40 animate-[fadeIn_0.2s_ease]"
        />
        <Dialog.Content
          data-testid="modal-content"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={`liquid fixed z-50 w-full inset-x-0 bottom-0 rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] animate-[sheetUp_0.32s_var(--ease-out)] max-h-[92vh] overflow-y-auto focus:outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:pb-6 sm:animate-[slideUp_0.24s_var(--ease-out)] ${sizeClasses[size]}`}
        >
          <div className="sm:hidden mx-auto -mt-2 mb-4 h-1.5 w-11 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
          <div className="mb-5">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="font-display font-bold text-[var(--fg)] text-2xl leading-tight">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  data-testid="modal-close"
                  aria-label="Cerrar"
                  className="shrink-0 w-11 h-11 -mr-2 -mt-1 grid place-items-center rounded-full text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--wash)] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </Dialog.Close>
            </div>
            {description && (
              <Dialog.Description className="text-base text-[var(--fg-muted)] mt-1 font-body">
                {description}
              </Dialog.Description>
            )}
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
