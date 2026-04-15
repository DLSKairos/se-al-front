import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Zap, Copy, Check } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { WebhookEndpoint } from '@/types'
import {
  Button,
  Badge,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'

const EVENT_TYPES = ['ON_SUBMIT', 'ON_APPROVE', 'ON_REJECT', 'SCHEDULED'] as const
type EventType = (typeof EVENT_TYPES)[number]

const EVENT_LABELS: Record<EventType, string> = {
  ON_SUBMIT: 'Al enviar',
  ON_APPROVE: 'Al aprobar',
  ON_REJECT: 'Al rechazar',
  SCHEDULED: 'Programado',
}

interface WebhookForm {
  url: string
  event_types: EventType[]
  is_active: boolean
}

const emptyForm: WebhookForm = {
  url: '',
  event_types: [],
  is_active: true,
}

function SecretModal({
  open,
  secret,
  onClose,
}: {
  open: boolean
  secret: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      toast.success('Secreto copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      title="Webhook creado — guarda el secreto"
      description="Este es el único momento en que podrás ver el secreto. Cópialo ahora antes de cerrar."
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300 font-['DM_Sans']">
          Una vez que cierres este modal el secreto no podrá recuperarse. Guárdalo en un lugar seguro.
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={secret}
            aria-label="Secreto del webhook"
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-mono flex-1 outline-none select-all"
          />
          <Button variant="secondary" onClick={copySecret} aria-label="Copiar secreto">
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Entendido, lo guardé</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function WebhooksPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookEndpoint | null>(null)
  const [form, setForm] = useState<WebhookForm>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<WebhookEndpoint | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const { data: webhooks = [], isLoading, error } = useQuery({
    queryKey: QK.webhooks(),
    queryFn: () =>
      api.get<WebhookEndpoint[]>('/webhooks').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: WebhookForm) =>
      api.post<WebhookEndpoint>('/webhooks', data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QK.webhooks() })
      toast.success('Webhook creado correctamente')
      closeModal()
      if (data.secret) setNewSecret(data.secret)
    },
    onError: () => toast.error('Error al crear el webhook'),
  })

  const editMutation = useMutation({
    mutationFn: (data: Pick<WebhookForm, 'url' | 'event_types'>) =>
      api.patch(`/webhooks/${editing!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.webhooks() })
      toast.success('Webhook actualizado correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al actualizar el webhook'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/webhooks/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.webhooks() })
      toast.success('Webhook eliminado')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Error al eliminar el webhook'),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/webhooks/${id}/test`).then((r) => r.data),
    onSuccess: () => toast.success('Evento de prueba enviado correctamente'),
    onError: () => toast.error('Error al enviar el evento de prueba'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(wh: WebhookEndpoint) {
    setEditing(wh)
    setForm({
      url: wh.url,
      event_types: (wh.event_types ?? []) as EventType[],
      is_active: wh.is_active,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function toggleEvent(evt: EventType) {
    setForm((f) => ({
      ...f,
      event_types: f.event_types.includes(evt)
        ? f.event_types.filter((e) => e !== evt)
        : [...f.event_types, evt],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url.trim()) {
      toast.error('La URL es obligatoria')
      return
    }
    try {
      new URL(form.url)
    } catch {
      toast.error('La URL no tiene un formato válido')
      return
    }
    if (editing) {
      editMutation.mutate({ url: form.url, event_types: form.event_types })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || editMutation.isPending

  if (isLoading) return <LoadingSpinner label="Cargando webhooks..." />
  if (error) return <ErrorMessage message="Error al cargar los webhooks" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Webhooks
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Notifica a sistemas externos cuando ocurren eventos en SEÑAL
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nuevo webhook
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead>
              <tr className="border-b border-white/5">
                {['URL', 'Eventos', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs text-[var(--muted)] font-medium pb-3 pt-4 px-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh, i) => (
                <tr
                  key={wh.id}
                  className={`border-b border-white/5 hover:bg-[var(--signal-dim)] transition-colors ${
                    i % 2 === 1 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-[var(--off-white)] font-mono text-xs max-w-xs truncate">
                    {wh.url}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {wh.event_types && wh.event_types.length > 0 ? (
                        wh.event_types.map((evt) => (
                          <Badge key={evt} variant="info">
                            {EVENT_LABELS[evt as EventType] ?? evt}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="draft">Todos</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {wh.is_active ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="draft">Inactivo</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(wh)}
                        aria-label="Editar webhook"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={testMutation.isPending && testMutation.variables === wh.id}
                        onClick={() => testMutation.mutate(wh.id)}
                        aria-label="Probar webhook"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Probar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(wh)}
                        aria-label="Eliminar webhook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {webhooks.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-[var(--muted)] text-sm"
                  >
                    No hay webhooks configurados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        onOpenChange={(open) => { if (!open) closeModal() }}
        title={editing ? 'Editar webhook' : 'Nuevo webhook'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              URL del endpoint <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://mi-sistema.com/webhook"
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Eventos (vacío = todos)
            </span>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((evt) => (
                <button
                  key={evt}
                  type="button"
                  onClick={() => toggleEvent(evt)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-['DM_Sans'] transition-colors ${
                    form.event_types.includes(evt)
                      ? 'bg-[var(--signal)] text-[var(--navy)] border-[var(--signal)] font-semibold'
                      : 'bg-white/5 text-[var(--muted)] border-white/10 hover:border-[var(--signal)]'
                  }`}
                >
                  {EVENT_LABELS[evt]}
                </button>
              ))}
            </div>
          </div>

          {!editing && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-[var(--signal)] transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 pointer-events-none" />
              </div>
              <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
                Activar al crear
              </span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear webhook'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal secreto — solo una vez */}
      {newSecret && (
        <SecretModal
          open={!!newSecret}
          secret={newSecret}
          onClose={() => setNewSecret(null)}
        />
      )}

      {/* Confirm eliminar */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Eliminar webhook"
        description={`¿Estás seguro de que deseas eliminar el webhook "${deleteTarget?.url}"? Dejará de recibir eventos.`}
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  )
}
