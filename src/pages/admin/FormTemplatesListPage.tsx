import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Archive, RotateCcw, Eye } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  TemplateStatusBadge,
  ConfirmModal,
  LoadingSpinner,
  ErrorMessage,
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { FormTemplate } from '@/types'
import { formatDate } from '@/lib/utils'

type ConfirmAction = 'delete' | 'archive' | 'activate'

interface ConfirmState {
  open: boolean
  action: ConfirmAction
  templateId: string
  templateName: string
}

const FREQUENCY_LABEL: Record<string, string> = {
  ONCE:      'Una vez',
  DAILY:     'Diario',
  WEEKLY:    'Semanal',
  MONTHLY:   'Mensual',
  NONE:      'Sin límite',
  INHERIT:   'Heredado',
  PER_EVENT: 'Por evento',
}

export default function FormTemplatesListPage() {
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const toast      = useToast()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: QK.templates.admin(),
    queryFn: () =>
      api.get<FormTemplate[]>('/form-templates/admin').then((r) => r.data),
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/form-templates/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.templates.admin() })
      qc.invalidateQueries({ queryKey: QK.templates.active() })
      toast.success('Estado actualizado correctamente')
      setConfirmState(null)
    },
    onError: () => toast.error('Error al cambiar el estado'),
  })

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/form-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.templates.admin() })
      toast.success('Formulario eliminado')
      setConfirmState(null)
    },
    onError: () => toast.error('Error al eliminar el formulario'),
  })

  if (isLoading) return <LoadingSpinner label="Cargando formularios..." />
  if (error)     return <ErrorMessage message="Error al cargar los formularios" />

  function openConfirm(action: ConfirmAction, t: FormTemplate) {
    setConfirmState({ open: true, action, templateId: t.id, templateName: t.name })
  }

  function handleConfirm() {
    if (!confirmState) return
    if (confirmState.action === 'delete') {
      deleteTemplate.mutate(confirmState.templateId)
    } else {
      changeStatus.mutate({
        id:     confirmState.templateId,
        status: confirmState.action === 'activate' ? 'ACTIVE' : 'ARCHIVED',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Formularios
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            {templates.length} formulario{templates.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button onClick={() => navigate('/admin/formularios/nuevo')}>
          <Plus className="w-4 h-4" />
          Crear formulario
        </Button>
      </div>

      {/* Tabla */}
      <div className="glass-card overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead className="border-b border-white/5">
              <tr>
                {['Nombre', 'Estado', 'Frecuencia', 'Creado', 'Acciones'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider p-4"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {templates.map((t, i) => (
                <tr
                  key={t.id}
                  className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                    i % 2 === 1 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  {/* Nombre */}
                  <td className="p-4">
                    <p className="font-medium text-[var(--off-white)]">
                      {t.name}
                    </p>
                    {t.description && (
                      <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="p-4">
                    <TemplateStatusBadge status={t.status} />
                  </td>

                  {/* Frecuencia */}
                  <td className="p-4 text-[var(--muted)]">
                    {FREQUENCY_LABEL[t.data_frequency] ?? t.data_frequency}
                  </td>

                  {/* Creado */}
                  <td className="p-4 text-[var(--muted)] whitespace-nowrap">
                    {formatDate(t.created_at)}
                  </td>

                  {/* Acciones */}
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {t.status === 'DRAFT' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              navigate(`/admin/formularios/${t.id}/editar`)
                            }
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openConfirm('activate', t)}
                          >
                            Publicar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openConfirm('delete', t)}
                            aria-label={`Eliminar ${t.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}

                      {t.status === 'ACTIVE' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              navigate(
                                `/admin/formularios/${t.id}/submissions`,
                              )
                            }
                          >
                            <Eye className="w-3 h-3" />
                            Submissions
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openConfirm('archive', t)}
                          >
                            <Archive className="w-3 h-3" />
                            Archivar
                          </Button>
                        </>
                      )}

                      {t.status === 'ARCHIVED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openConfirm('activate', t)}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {templates.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-[var(--muted)] text-sm"
                  >
                    No hay formularios.{' '}
                    <button
                      onClick={() => navigate('/admin/formularios/nuevo')}
                      className="text-[var(--signal)] hover:underline"
                    >
                      Crea el primero
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmState && (
        <ConfirmModal
          open={confirmState.open}
          onOpenChange={(open) => !open && setConfirmState(null)}
          title={
            confirmState.action === 'delete'
              ? 'Eliminar formulario'
              : confirmState.action === 'archive'
                ? 'Archivar formulario'
                : 'Publicar formulario'
          }
          description={
            confirmState.action === 'delete'
              ? `¿Eliminar "${confirmState.templateName}"? Esta acción no se puede deshacer.`
              : confirmState.action === 'archive'
                ? `¿Archivar "${confirmState.templateName}"? Los operarios dejarán de verlo.`
                : `¿Publicar "${confirmState.templateName}"? Los operarios podrán verlo y llenarlo.`
          }
          variant={
            confirmState.action === 'delete' ||
            confirmState.action === 'archive'
              ? 'danger'
              : 'warning'
          }
          confirmLabel={
            confirmState.action === 'delete'
              ? 'Eliminar'
              : confirmState.action === 'archive'
                ? 'Archivar'
                : 'Publicar'
          }
          loading={changeStatus.isPending || deleteTemplate.isPending}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
