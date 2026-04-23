import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Save, BookMarked } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { QK } from '@/lib/queryKeys'
import api from '@/lib/api'
import { toSnakeCase } from '@/utils/fieldType.utils'

interface SaveFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  templateId?: string
}

export function SaveFormDrawer({ isOpen, onClose, templateId }: SaveFormDrawerProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { state } = useFormEditorStore()

  const [name, setName] = useState(state.name || '')
  const [categoryId, setCategoryId] = useState(state.categoryId || '')
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>(state.status || 'DRAFT')
  const [saveAsBlueprint, setSaveAsBlueprint] = useState(false)
  const [blueprintName, setBlueprintName] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: QK.categories(),
    queryFn: () => api.get('/form-categories').then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (body: object) =>
      templateId
        ? api.patch(`/form-templates/${templateId}`, body).then((r) => r.data)
        : api.post('/form-templates', body).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QK.templates.admin() })
      if (templateId) queryClient.invalidateQueries({ queryKey: QK.templates.detail(templateId) })
      navigate('/admin/formularios')
    },
  })

  function buildPayload() {
    const fields = state.sections.flatMap((section) =>
      section.fields.map((f) => ({
        ...f,
        section: section.name,
        key: f.key || toSnakeCase(f.label),
      }))
    )

    const sections = state.sections.map(({ id, name: n, hasObservations }) => ({
      id,
      name: n,
      hasObservations,
    }))

    return {
      name,
      category_id: categoryId,
      columns: state.columns,
      sections,
      fields,
      ...(state.sourceFileUrl ? { source_file_url: state.sourceFileUrl } : {}),
      save_as_blueprint: saveAsBlueprint,
      blueprint_name: saveAsBlueprint ? blueprintName : undefined,
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--navy-mid)] border border-[rgba(0,212,255,0.15)] rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--off-white)] font-['Syne']">
            Guardar formulario
          </h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--off-white)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-1">
              Nombre *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-lg px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--signal)]"
              placeholder="Nombre del formulario"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-1">
              Categoría *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-lg px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--signal)]"
            >
              <option value="">Selecciona categoría</option>
              {(categories as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-2">
              Estado
            </label>
            <div className="flex gap-3">
              {(['DRAFT', 'ACTIVE'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    status === s
                      ? 'bg-[rgba(0,212,255,0.12)] border-[var(--signal)] text-[var(--signal)]'
                      : 'bg-transparent border-[rgba(0,212,255,0.1)] text-[var(--muted)] hover:border-[rgba(0,212,255,0.3)]'
                  }`}
                >
                  {s === 'DRAFT' ? 'Borrador' : 'Activo'}
                </button>
              ))}
            </div>
          </div>

          {/* Guardar como template */}
          <div className="border border-[rgba(0,212,255,0.1)] rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsBlueprint}
                onChange={(e) => setSaveAsBlueprint(e.target.checked)}
                className="accent-[var(--signal)]"
              />
              <div className="flex items-center gap-1.5 text-sm text-[var(--off-white)]">
                <BookMarked size={14} className="text-[var(--signal)]" />
                Guardar en mi biblioteca de templates
              </div>
            </label>
            {saveAsBlueprint && (
              <input
                value={blueprintName}
                onChange={(e) => setBlueprintName(e.target.value)}
                placeholder="Nombre del template"
                className="mt-2 w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-lg px-3 py-2 text-sm text-[var(--off-white)] outline-none focus:border-[var(--signal)]"
              />
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[rgba(0,212,255,0.15)] text-[var(--muted)] hover:text-[var(--off-white)] hover:border-[rgba(0,212,255,0.3)] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate(buildPayload())}
            disabled={!name || !categoryId || saveMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-[var(--signal)] text-[var(--navy)] hover:bg-[var(--signal)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Save size={15} />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar formulario'}
          </button>
        </div>

        {saveMutation.isError && (
          <p className="mt-3 text-xs text-red-400 text-center">
            Error al guardar. Intenta de nuevo.
          </p>
        )}
      </div>
    </div>
  )
}
