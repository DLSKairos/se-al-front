import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { FormNotification, NotificationTrigger } from '@/types'

// ── Constantes ─────────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--signal)] transition-all w-full font-["DM_Sans"]'

const LABEL_CLASS =
  'text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-1.5 font-["DM_Sans"] block'

const TRIGGER_OPTIONS: { value: NotificationTrigger; label: string }[] = [
  { value: 'ON_SUBMIT',  label: 'Al enviar' },
  { value: 'ON_APPROVE', label: 'Al aprobar' },
  { value: 'ON_REJECT',  label: 'Al rechazar' },
  { value: 'SCHEDULED',  label: 'Programado' },
]

const TRIGGER_LABEL = Object.fromEntries(
  TRIGGER_OPTIONS.map((o) => [o.value, o.label])
)

// ── Draft local ────────────────────────────────────────────────────────────────

interface NotificationDraft {
  trigger: NotificationTrigger
  subject: string
  body: string
  channels: string[]
  recipients: Array<{ type: 'role' | 'email' | 'department'; value: string }>
}

const EMPTY_DRAFT: NotificationDraft = {
  trigger:    'ON_SUBMIT',
  subject:    '',
  body:       '',
  channels:   ['EMAIL'],
  recipients: [],
}

// ── NotificationsDrawer ────────────────────────────────────────────────────────

interface NotificationsDrawerProps {
  templateId?: string
  isOpen: boolean
  onClose: () => void
}

export function NotificationsDrawer({
  templateId,
  isOpen,
  onClose,
}: NotificationsDrawerProps) {
  const toast = useToast()
  const qc = useQueryClient()
  const [draft, setDraft] = useState<NotificationDraft>(EMPTY_DRAFT)
  const [recipientInput, setRecipientInput] = useState('')

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: QK.notifications(templateId ?? ''),
    queryFn: () =>
      api
        .get<FormNotification[]>(`/form-notifications/template/${templateId}`)
        .then((r) => r.data),
    enabled: !!templateId && isOpen,
  })

  const createNotification = useMutation({
    mutationFn: () =>
      api
        .post('/form-notifications', { ...draft, template_id: templateId })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.notifications(templateId ?? '') })
      toast.success('Notificación creada')
      setDraft(EMPTY_DRAFT)
      setRecipientInput('')
    },
    onError: () => toast.error('Error al crear la notificación'),
  })

  const deleteNotification = useMutation({
    mutationFn: (id: string) => api.delete(`/form-notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.notifications(templateId ?? '') })
      toast.success('Notificación eliminada')
    },
    onError: () => toast.error('Error al eliminar la notificación'),
  })

  function addRecipient() {
    const v = recipientInput.trim()
    if (!v) return
    setDraft((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { type: 'email', value: v }],
    }))
    setRecipientInput('')
  }

  function removeRecipient(index: number) {
    setDraft((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="notif-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            key="notif-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--navy-mid)] border-l border-[rgba(0,212,255,0.15)] z-50 flex flex-col overflow-hidden"
            aria-label="Panel de notificaciones"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(0,212,255,0.12)] shrink-0">
              <Bell size={16} className="text-[var(--signal)]" />
              <span className="flex-1 text-sm font-semibold text-[var(--off-white)] font-['Syne']">
                Notificaciones
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] transition-colors"
                aria-label="Cerrar panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
              {/* Sin templateId */}
              {!templateId && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                  <Bell size={32} className="text-[var(--muted)]" />
                  <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
                    Guarda el formulario primero para configurar notificaciones.
                  </p>
                </div>
              )}

              {/* Con templateId */}
              {templateId && (
                <>
                  {/* Lista existente */}
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)] font-['DM_Sans']">
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Cargando notificaciones...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <p className={LABEL_CLASS}>Notificaciones activas</p>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[var(--navy)] border border-white/5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']">
                              {TRIGGER_LABEL[n.trigger] ?? n.trigger}
                            </p>
                            {n.subject && (
                              <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5 truncate">
                                {n.subject}
                              </p>
                            )}
                            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
                              {n.recipients.length} destinatario
                              {n.recipients.length !== 1 ? 's' : ''} · {n.channels.join(', ')}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteNotification.mutate(n.id)}
                            disabled={deleteNotification.isPending}
                            className="p-1.5 text-[var(--muted)] hover:text-red-400 transition-colors shrink-0"
                            aria-label="Eliminar notificación"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
                      No hay notificaciones configuradas.
                    </p>
                  )}

                  {/* Formulario nueva notificación */}
                  <div className="bg-[var(--navy)] border border-[rgba(0,212,255,0.12)] rounded-xl p-4 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-[var(--off-white)] font-['Syne']">
                      Nueva notificación
                    </h3>

                    <div>
                      <label className={LABEL_CLASS}>Evento disparador</label>
                      <select
                        value={draft.trigger}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            trigger: e.target.value as NotificationTrigger,
                          }))
                        }
                        className={INPUT_CLASS}
                      >
                        {TRIGGER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Asunto del correo</label>
                      <input
                        type="text"
                        value={draft.subject}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, subject: e.target.value }))
                        }
                        placeholder="Ej: Nuevo formulario enviado"
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Mensaje</label>
                      <textarea
                        value={draft.body}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, body: e.target.value }))
                        }
                        placeholder="Contenido del mensaje..."
                        rows={3}
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Destinatarios</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={recipientInput}
                          onChange={(e) => setRecipientInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                          placeholder="correo@ejemplo.com"
                          className={INPUT_CLASS}
                        />
                        <Button variant="secondary" size="sm" onClick={addRecipient}>
                          <Plus size={12} />
                          Agregar
                        </Button>
                      </div>
                      {draft.recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {draft.recipients.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--signal-dim)] border border-[var(--signal)]/20 text-xs text-[var(--signal)] font-['DM_Sans']"
                            >
                              {r.value}
                              <button
                                onClick={() => removeRecipient(i)}
                                className="hover:text-white transition-colors"
                                aria-label={`Quitar ${r.value}`}
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-white/5">
                      <Button
                        variant="primary"
                        onClick={() => createNotification.mutate()}
                        loading={createNotification.isPending}
                        disabled={draft.recipients.length === 0}
                        size="sm"
                      >
                        <Plus size={13} />
                        Crear notificación
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
