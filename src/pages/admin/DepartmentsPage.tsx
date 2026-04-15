import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Department } from '@/types'
import {
  Button,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'

interface DepartmentForm {
  name: string
  email: string
}

const emptyForm: DepartmentForm = { name: '', email: '' }

export default function DepartmentsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState<DepartmentForm>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)

  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: QK.departments(),
    queryFn: () => api.get<Department[]>('/departments').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: DepartmentForm) =>
      api.post('/departments', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.departments() })
      toast.success('Departamento creado correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al crear el departamento'),
  })

  const editMutation = useMutation({
    mutationFn: (data: DepartmentForm) =>
      api.patch(`/departments/${editing!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.departments() })
      toast.success('Departamento actualizado correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al actualizar el departamento'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/departments/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.departments() })
      toast.success('Departamento eliminado')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Error al eliminar el departamento'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(dept: Department) {
    setEditing(dept)
    setForm({ name: dept.name, email: dept.email })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (editing) {
      editMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || editMutation.isPending

  if (isLoading) return <LoadingSpinner label="Cargando departamentos..." />
  if (error) return <ErrorMessage message="Error al cargar los departamentos" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Departamentos
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Gestiona los departamentos de tu organización
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nuevo departamento
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead>
              <tr className="border-b border-white/5">
                {['Nombre', 'Email', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-4 px-5 first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, i) => (
                <tr
                  key={dept.id}
                  className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                    i % 2 === 1 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-3 px-5 text-[var(--off-white)] font-medium">
                    {dept.name}
                  </td>
                  <td className="py-3 px-5 text-[var(--muted)]">{dept.email}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(dept)}
                        aria-label={`Editar ${dept.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(dept)}
                        aria-label={`Eliminar ${dept.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-10 text-center text-[var(--muted)] text-sm"
                  >
                    No hay departamentos registrados
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
        title={editing ? 'Editar departamento' : 'Nuevo departamento'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Seguridad y Salud en el Trabajo"
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="departamento@empresa.com"
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear departamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm eliminar */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Eliminar departamento"
        description={`¿Estás seguro de que deseas eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  )
}
