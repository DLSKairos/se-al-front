import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

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
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${sizeClasses[size]} glass-card p-6 animate-[slideUp_0.2s_ease] max-h-[90vh] overflow-y-auto focus:outline-none`}
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <Dialog.Title className="font-['Syne'] font-semibold text-[var(--off-white)] text-lg">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-[var(--muted)] mt-1 font-['DM_Sans']">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="text-[var(--muted)] hover:text-[var(--off-white)] transition-colors p-1 rounded-md hover:bg-[var(--signal-dim)] shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
