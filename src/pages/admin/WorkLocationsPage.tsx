import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { WorkLocation, Department } from '@/types'
import {
  Button,
  Badge,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'

interface WorkLocationForm {
  name: string
  contractor: string
  lat: string
  lng: string
  department_id: string
}

const emptyForm: WorkLocationForm = {
  name: '',
  contractor: '',
  lat: '',
  lng: '',
  department_id: '',
}

export default function WorkLocationsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkLocation | null>(null)
  const [form, setForm] = useState<WorkLocationForm>(emptyForm)
  const [toggleTarget, setToggleTarget] = useState<WorkLocation | null>(null)

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: QK.workLocations(true),
    queryFn: () =>
      api.get<WorkLocation[]>('/work-locations/all').then((r) => r.data),
  })

  const { data: departments = [] } = useQuery({
    queryKey: QK.departments(),
    queryFn: () => api.get<Department[]>('/departments').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) =>
      api.post('/work-locations', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.workLocations() })
      queryClient.invalidateQueries({ queryKey: QK.workLocations(true) })
      toast.success('Obra creada correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al crear la obra'),
  })

  const editMutation = useMutation({
    mutationFn: (data: object) =>
      api.patch(`/work-locations/${editing!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.workLocations() })
      queryClient.invalidateQueries({ queryKey: QK.workLocations(true) })
      toast.success('Obra actualizada correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al actualizar la obra'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/work-locations/${id}/toggle`).then((r) => r.data),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QK.workLocations() })
      queryClient.invalidateQueries({ queryKey: QK.workLocations(true) })
      const loc = locations.find((l) => l.id === id)
      toast.success(
        loc?.is_active
          ? 'Obra desactivada correctamente'
          : 'Obra activada correctamente'
      )
      setToggleTarget(null)
    },
    onError: () => toast.error('Error al cambiar el estado de la obra'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(loc: WorkLocation) {
    setEditing(loc)
    setForm({
      name: loc.name,
      contractor: loc.contractor,
      lat: String(loc.lat),
      lng: String(loc.lng),
      department_id: loc.department_id ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (isNaN(lat)) {
      toast.error('La latitud debe ser un número válido')
      return
    }
    if (isNaN(lng)) {
      toast.error('La longitud debe ser un número válido')
      return
    }
    const payload = {
      name: form.name,
      contractor: form.contractor,
      lat,
      lng,
      ...(form.department_id ? { department_id: form.department_id } : {}),
    }
    if (editing) {
      editMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || editMutation.isPending

  if (isLoading) return <LoadingSpinner label="Cargando obras..." />
  if (error) return <ErrorMessage message="Error al cargar las obras" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Obras y ubicaciones
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Gestiona las obras donde opera tu organización
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva obra
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead>
              <tr className="border-b border-white/5">
                {['Nombre', 'Contratista', 'Departamento', 'Coordenadas', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-4 px-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map((loc, i) => {
                const dept = departments.find((d) => d.id === loc.department_id)
                return (
                  <tr
                    key={loc.id}
                    className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                      i % 2 === 1 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-[var(--off-white)] font-medium">
                      {loc.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)]">
                      {loc.contractor || '—'}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)]">
                      {dept?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] font-mono text-xs">
                      {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                    </td>
                    <td className="py-3 px-4">
                      {loc.is_active ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="draft">Inactiva</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(loc)}
                          aria-label={`Editar ${loc.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant={loc.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => setToggleTarget(loc)}
                          aria-label={loc.is_active ? `Desactivar ${loc.name}` : `Activar ${loc.name}`}
                        >
                          {loc.is_active ? (
                            <ToggleRight className="w-3.5 h-3.5" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5" />
                          )}
                          {loc.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {locations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-[var(--muted)] text-sm"
                  >
                    No hay obras registradas
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
        title={editing ? 'Editar obra' : 'Nueva obra'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Edificio Central"
                required
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
                Contratista
              </label>
              <input
                type="text"
                value={form.contractor}
                onChange={(e) => setForm((f) => ({ ...f, contractor: e.target.value }))}
                placeholder="Ej: Constructora ABC"
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
                Latitud <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="4.710989"
                required
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
                Longitud <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="-74.072092"
                required
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Departamento (opcional)
            </label>
            <select
              value={form.department_id}
              onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            >
              <option value="">Sin departamento</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear obra'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm toggle */}
      <ConfirmModal
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null) }}
        title={toggleTarget?.is_active ? 'Desactivar obra' : 'Activar obra'}
        description={
          toggleTarget?.is_active
            ? `¿Deseas desactivar "${toggleTarget?.name}"? Los operarios no podrán seleccionarla.`
            : `¿Deseas activar "${toggleTarget?.name}"? Quedará disponible para los operarios.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.is_active ? 'danger' : 'warning'}
        loading={toggleMutation.isPending}
        onConfirm={() => toggleTarget && toggleMutation.mutate(toggleTarget.id)}
      />
    </div>
  )
}
