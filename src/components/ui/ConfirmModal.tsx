import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md glass-card p-6 animate-[slideUp_0.2s_ease] focus:outline-none">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : 'text-amber-400'}`}
                />
              </div>
              <Dialog.Title className="font-['Syne'] font-semibold text-[var(--off-white)] text-lg">
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Description className="text-sm text-[var(--muted)] font-['DM_Sans'] leading-relaxed">
              {description}
            </Dialog.Description>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                loading={loading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
