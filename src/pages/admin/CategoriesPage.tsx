import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { FormCategory } from '@/types'
import {
  Button,
  Badge,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'

interface CategoryForm {
  name: string
  is_sst: boolean
}

const emptyForm: CategoryForm = { name: '', is_sst: false }

export default function CategoriesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FormCategory | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<FormCategory | null>(null)

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: QK.categories(),
    queryFn: () => api.get<FormCategory[]>('/form-categories').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryForm) =>
      api.post('/form-categories', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.categories() })
      toast.success('Categoría creada correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al crear la categoría'),
  })

  const editMutation = useMutation({
    mutationFn: (data: CategoryForm) =>
      api.patch(`/form-categories/${editing!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.categories() })
      toast.success('Categoría actualizada correctamente')
      closeModal()
    },
    onError: () => toast.error('Error al actualizar la categoría'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/form-categories/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.categories() })
      toast.success('Categoría eliminada')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Error al eliminar la categoría'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(cat: FormCategory) {
    setEditing(cat)
    setForm({ name: cat.name, is_sst: cat.is_sst })
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

  if (isLoading) return <LoadingSpinner label="Cargando categorías..." />
  if (error) return <ErrorMessage message="Error al cargar las categorías" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Categorías de formularios
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Organiza tus formularios por categorías
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead>
              <tr className="border-b border-white/5">
                {['Nombre', 'SST', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-4 px-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                    i % 2 === 1 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-3 px-5 text-[var(--off-white)] font-medium">
                    {cat.name}
                  </td>
                  <td className="py-3 px-5">
                    {cat.is_sst ? (
                      <Badge variant="warning">SST</Badge>
                    ) : (
                      <Badge variant="draft">No</Badge>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cat)}
                        aria-label={`Editar ${cat.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(cat)}
                        aria-label={`Eliminar ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-10 text-center text-[var(--muted)] text-sm"
                  >
                    No hay categorías registradas
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
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
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
              placeholder="Ej: Seguridad Industrial"
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.is_sst}
                onChange={(e) => setForm((f) => ({ ...f, is_sst: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-[var(--signal)] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
              Es categoría SST (Seguridad y Salud en el Trabajo)
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm eliminar */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Eliminar categoría"
        description={`¿Estás seguro de que deseas eliminar "${deleteTarget?.name}"? Los formularios asociados perderán esta categoría.`}
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  )
}
