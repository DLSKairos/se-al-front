import { useState, useId } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { approvalApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Button, Modal, useToast } from '@/components/ui'

export interface RejectSubmissionModalProps {
  submissionId: string
  open: boolean
  onClose: () => void
  onRejected?: () => void
}

const MIN_CHARS = 10
const MAX_CHARS = 500

export default function RejectSubmissionModal({
  submissionId,
  open,
  onClose,
  onRejected,
}: RejectSubmissionModalProps) {
  const toast       = useToast()
  const queryClient = useQueryClient()
  const reasonId    = useId()
  const errorId     = useId()

  const [reason, setReason]     = useState('')
  const [touched, setTouched]   = useState(false)

  const charCount   = reason.length
  const isValid     = charCount >= MIN_CHARS
  const showError   = touched && !isValid

  const { mutate, isPending } = useMutation({
    mutationFn: () => approvalApi.rejectSubmission(submissionId, reason.trim()),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con submissions
      queryClient.invalidateQueries({ queryKey: QK.adminSubmissions() })
      queryClient.invalidateQueries({ queryKey: QK.submissions.all() })
      queryClient.invalidateQueries({ queryKey: QK.submissions.detail(submissionId) })

      toast.success('Formulario rechazado correctamente')
      handleClose()
      onRejected?.()
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'No se pudo rechazar el formulario'
      toast.error(message)
    },
  })

  function handleClose() {
    if (isPending) return
    setReason('')
    setTouched(false)
    onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    mutate()
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}
      title="Rechazar formulario"
      description="Esta acción notificará al operario con el motivo indicado."
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Aviso visual */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-300 font-['DM_Sans']">
            El formulario pasará al estado <strong>Rechazado</strong>. El operario recibirá
            una notificación con el motivo que escribas.
          </p>
        </div>

        {/* Textarea de motivo */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={reasonId}
            className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']"
          >
            Motivo del rechazo
            <span className="text-red-400 ml-1" aria-hidden="true">*</span>
          </label>

          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => {
              const val = e.target.value.slice(0, MAX_CHARS)
              setReason(val)
              if (touched) setTouched(true)
            }}
            onBlur={() => setTouched(true)}
            placeholder="Describe brevemente el motivo del rechazo (mínimo 10 caracteres)..."
            rows={4}
            maxLength={MAX_CHARS}
            disabled={isPending}
            aria-required="true"
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
            className="w-full resize-none bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] placeholder-[var(--muted)] font-['DM_Sans'] outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all disabled:opacity-50 aria-[invalid=true]:border-red-500/50 aria-[invalid=true]:focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]"
          />

          {/* Contador + error */}
          <div className="flex items-center justify-between">
            {showError ? (
              <p
                id={errorId}
                role="alert"
                className="text-xs text-red-400 font-['DM_Sans']"
              >
                El motivo debe tener al menos {MIN_CHARS} caracteres
              </p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs font-['DM_Sans'] tabular-nums ${
                charCount < MIN_CHARS ? 'text-[var(--muted)]' : 'text-emerald-400'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            loading={isPending}
            disabled={isPending || !isValid}
          >
            {isPending ? 'Rechazando...' : 'Rechazar formulario'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
