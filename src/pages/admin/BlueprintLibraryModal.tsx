import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, LayoutTemplate, Loader2, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { blueprintsApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useFormEditorStore } from '@/stores/formEditorStore'
import type { EditorSection, FormBlueprint } from '@/types'

// ─── Categorías disponibles ───────────────────────────────

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'permisos', label: 'Permisos de trabajo' },
  { value: 'inspecciones', label: 'Inspecciones' },
  { value: 'reportes', label: 'Reportes' },
]

// ─── Props ────────────────────────────────────────────────

interface BlueprintLibraryModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Componente ───────────────────────────────────────────

export function BlueprintLibraryModal({ isOpen, onClose }: BlueprintLibraryModalProps) {
  const navigate = useNavigate()
  const { setInitialState } = useFormEditorStore()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [useError, setUseError] = useState<string | null>(null)

  // Filtros activos para la query (se usa valor vacío para "todos")
  const filters = {
    ...(category ? { category } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const { data: blueprints, isLoading, isError } = useQuery({
    queryKey: QK.blueprints.list(filters),
    queryFn: () => blueprintsApi.list(filters).then((r) => r.data),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
  })

  // ─── Usar un blueprint ─────────────────────────────────

  async function handleUseBlueprint(blueprint: FormBlueprint) {
    setLoadingId(blueprint.id)
    setUseError(null)

    try {
      const response = await blueprintsApi.use(blueprint.id)
      const template = response.data

      // Convertir los campos del blueprint a una sección del editor
      const section: EditorSection = {
        id: crypto.randomUUID(),
        name: 'General',
        hasObservations: false,
        fields: blueprint.fields ?? [],
      }

      setInitialState({
        templateId: template?.id,
        name: template?.name ?? blueprint.name,
        sections: [section],
        blueprintId: blueprint.id,
      })

      onClose()
      navigate('/admin/formularios/editor')
    } catch {
      setUseError('No se pudo cargar el template. Intenta de nuevo.')
    } finally {
      setLoadingId(null)
    }
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Biblioteca de templates"
      description="Selecciona un template como punto de partida para tu formulario"
      size="xl"
    >
      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar template por nombre..."
          className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(0,212,255,0.15)] rounded-lg pl-9 pr-4 py-2.5 font-['DM_Sans'] text-sm text-[var(--off-white)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[rgba(0,212,255,0.5)] transition-colors"
        />
      </div>

      {/* Filtros de categoría */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`
              px-3 py-1 rounded-full text-xs font-['DM_Sans'] border transition-all duration-150 cursor-pointer
              ${
                category === value
                  ? 'border-[var(--signal)] text-[var(--signal)] bg-[rgba(0,212,255,0.1)]'
                  : 'border-[rgba(0,212,255,0.15)] text-[var(--muted)] hover:border-[rgba(0,212,255,0.35)] hover:text-[var(--off-white)]'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error al usar blueprint */}
      {useError && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-red-500/30">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="font-['DM_Sans'] text-sm text-red-400">{useError}</p>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-7 h-7 text-[var(--signal)] animate-spin" />
          <p className="font-['DM_Sans'] text-sm text-[var(--muted)]">Cargando templates...</p>
        </div>
      )}

      {/* Error de query */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle className="w-7 h-7 text-[var(--amber)]" />
          <p className="font-['DM_Sans'] text-sm text-[var(--muted)]">
            No se pudieron cargar los templates.
          </p>
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && !isError && blueprints?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <LayoutTemplate className="w-8 h-8 text-[var(--muted)]" />
          <p className="font-['DM_Sans'] text-sm text-[var(--muted)]">
            No hay templates disponibles con ese filtro.
          </p>
        </div>
      )}

      {/* Grid de blueprints */}
      {!isLoading && !isError && blueprints && blueprints.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {blueprints.map((blueprint) => (
            <BlueprintCard
              key={blueprint.id}
              blueprint={blueprint}
              isLoading={loadingId === blueprint.id}
              onUse={() => handleUseBlueprint(blueprint)}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}

// ─── Tarjeta de blueprint ─────────────────────────────────

interface BlueprintCardProps {
  blueprint: FormBlueprint
  isLoading: boolean
  onUse: () => void
}

function BlueprintCard({ blueprint, isLoading, onUse }: BlueprintCardProps) {
  const fieldCount = blueprint.fields?.length ?? 0

  return (
    <div className="bg-[rgba(22,34,56,0.6)] border border-[rgba(0,212,255,0.12)] rounded-xl p-4 flex flex-col gap-3 hover:border-[rgba(0,212,255,0.35)] transition-all duration-200">
      {/* Encabezado de la tarjeta */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-['Syne'] font-semibold text-[var(--off-white)] text-sm truncate">
              {blueprint.name}
            </h4>
            {blueprint.is_global && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-['DM_Sans'] font-semibold bg-[rgba(0,212,255,0.15)] text-[var(--signal)] border border-[rgba(0,212,255,0.3)]">
                SEÑAL
              </span>
            )}
          </div>
          {blueprint.description && (
            <p className="font-['DM_Sans'] text-xs text-[var(--muted)] mt-1 line-clamp-2">
              {blueprint.description}
            </p>
          )}
        </div>
      </div>

      {/* Pie de la tarjeta */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="font-['DM_Sans'] text-xs text-[var(--muted)]">
          {fieldCount} {fieldCount === 1 ? 'campo' : 'campos'}
        </span>
        <Button
          variant="secondary"
          size="sm"
          loading={isLoading}
          onClick={onUse}
        >
          {!isLoading && 'Usar template'}
          {isLoading && 'Cargando...'}
        </Button>
      </div>
    </div>
  )
}
