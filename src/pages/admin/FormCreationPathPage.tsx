import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Library,
  Sparkles,
  FileText,
  Loader2,
  AlertTriangle,
  Columns2,
  Columns3,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BlueprintLibraryModal } from './BlueprintLibraryModal'
import { formAiApi } from '@/lib/api'
import { useFormEditorStore } from '@/stores/formEditorStore'
import type { EditorSection } from '@/types'

type PathOption = 'upload' | 'blueprint' | 'ai' | null

interface Toast {
  type: 'warning' | 'error'
  message: string
}

// ─── Helpers visuales ─────────────────────────────────────

const PATH_OPTIONS = [
  {
    id: 'upload' as const,
    icon: Upload,
    title: 'Subir documento',
    description: 'Tienes el permiso en Word, Excel o PDF',
  },
  {
    id: 'blueprint' as const,
    icon: Library,
    title: 'Usar template',
    description: 'Parte de uno de tus templates o los de SEÑAL',
  },
  {
    id: 'ai' as const,
    icon: Sparkles,
    title: 'Crear con IA',
    description: 'Descríbelo y SEÑAL IA lo construye desde cero',
  },
]

const COLUMN_OPTIONS: { value: 1 | 2 | 3; icon: typeof Square; label: string }[] = [
  { value: 1, icon: Square, label: '1 col' },
  { value: 2, icon: Columns2, label: '2 col' },
  { value: 3, icon: Columns3, label: '3 col' },
]

// ─── Animación compartida ─────────────────────────────────

const expandVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: 24 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
}

// ─── Componente principal ─────────────────────────────────

export default function FormCreationPathPage() {
  const navigate = useNavigate()
  const { setInitialState } = useFormEditorStore()

  const [selectedPath, setSelectedPath] = useState<PathOption>(null)
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // Estado camino 1 — Subir documento
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado camino 3 — IA desde descripción
  const [description, setDescription] = useState('')
  const [aiColumns, setAiColumns] = useState<1 | 2 | 3>(1)
  const [observationsPerSection, setObservationsPerSection] = useState(false)

  // ─── Handlers de path ─────────────────────────────────

  function handleSelectPath(path: PathOption) {
    if (path === 'blueprint') {
      setSelectedPath(null)
      setIsBlueprintOpen(true)
      return
    }
    setSelectedPath((prev) => (prev === path ? null : path))
    setToast(null)
  }

  // ─── Camino 1: Subir documento ────────────────────────

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return
      setIsLoading(true)
      setToast(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        console.log('[Upload] Enviando archivo:', file.name, file.type, file.size)
        const response = await formAiApi.extractFromFile(formData)
        const result = response.data
        console.log('[Upload] Respuesta del servidor:', result)

        if (result.aiError) {
          setToast({
            type: 'warning',
            message:
              'La IA no pudo interpretar el documento completamente. Puedes continuar y completar los campos manualmente.',
          })
        }

        const section: EditorSection = {
          id: crypto.randomUUID(),
          name: 'General',
          hasObservations: false,
          fields: result.fields ?? [],
        }

        setInitialState({
          sections: [section],
          sourceFileUrl: result.source_file_url,
        })

        // Navegar siempre, incluso con aiError
        navigate('/admin/formularios/editor')
      } catch (err: unknown) {
        console.error('[Upload] Error al subir archivo:', err)
        setToast({
          type: 'error',
          message: 'No se pudo procesar el archivo. Verifica que sea PDF, DOCX o XLSX.',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [navigate, setInitialState]
  )

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  function handleDragLeave() {
    setIsDraggingOver(false)
  }

  // ─── Camino 3: Generar con IA ─────────────────────────

  async function handleGenerateWithAI() {
    if (!description.trim()) return
    setIsLoading(true)
    setToast(null)

    try {
      const response = await formAiApi.generateFromDescription({
        description: description.trim(),
        columns: aiColumns,
        observationsPerSection,
      })
      const result = response.data

      if (result.aiError) {
        setToast({
          type: 'warning',
          message:
            'La IA generó una estructura parcial. Puedes continuar y ajustar los campos manualmente.',
        })
      }

      setInitialState({
        name: result.name ?? '',
        columns: aiColumns,
        sections: result.sections ?? [],
      })

      navigate('/admin/formularios/editor')
    } catch {
      setToast({
        type: 'error',
        message: 'No se pudo generar el formulario. Intenta con una descripción más detallada.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--navy)] px-4 py-12 flex flex-col items-center">
      {/* Encabezado */}
      <div className="text-center mb-10 max-w-xl">
        <h1 className="font-['Syne'] font-bold text-3xl text-[var(--off-white)] mb-2">
          ¿Cómo quieres crear este formulario?
        </h1>
        <p className="font-['DM_Sans'] text-[var(--muted)] text-base">
          Elige el punto de partida
        </p>
      </div>

      {/* Tarjetas de selección */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {PATH_OPTIONS.map(({ id, icon: Icon, title, description: desc }) => {
          const isSelected = selectedPath === id
          return (
            <button
              key={id}
              onClick={() => handleSelectPath(id)}
              className={`
                text-left rounded-xl p-6 transition-all duration-200 cursor-pointer
                bg-[rgba(22,34,56,0.75)] border
                ${
                  isSelected
                    ? 'border-[var(--signal)] shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                    : 'border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.5)] hover:shadow-[0_0_12px_rgba(0,212,255,0.1)]'
                }
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors
                  ${isSelected ? 'bg-[rgba(0,212,255,0.2)]' : 'bg-[rgba(0,212,255,0.08)]'}
                `}
              >
                <Icon
                  className={`w-5 h-5 ${isSelected ? 'text-[var(--signal)]' : 'text-[var(--muted)]'}`}
                />
              </div>
              <h3 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base mb-1">
                {title}
              </h3>
              <p className="font-['DM_Sans'] text-[var(--muted)] text-sm leading-relaxed">
                {desc}
              </p>
            </button>
          )
        })}
      </div>

      {/* Toast de advertencia / error */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`
              mt-6 w-full max-w-3xl flex items-start gap-3 rounded-xl px-4 py-3 border
              ${
                toast.type === 'warning'
                  ? 'bg-[rgba(245,166,35,0.1)] border-[rgba(245,166,35,0.3)] text-[var(--amber)]'
                  : 'bg-[rgba(239,68,68,0.1)] border-red-500/30 text-red-400'
              }
            `}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="font-['DM_Sans'] text-sm">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel expandible: Subir documento ── */}
      <AnimatePresence>
        {selectedPath === 'upload' && (
          <motion.div
            key="upload-panel"
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full max-w-3xl overflow-hidden"
          >
            <div className="bg-[rgba(22,34,56,0.75)] border border-[rgba(0,212,255,0.15)] rounded-xl p-6">
              {isLoading ? (
                /* Estado de carga */
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 text-[var(--signal)] animate-spin" />
                  <p className="font-['DM_Sans'] text-[var(--muted)] text-sm">
                    SEÑAL IA está leyendo tu documento...
                  </p>
                </div>
              ) : (
                /* Dropzone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3
                    cursor-pointer transition-all duration-200
                    ${
                      isDraggingOver
                        ? 'border-[var(--signal)] bg-[rgba(0,212,255,0.08)]'
                        : 'border-[rgba(0,212,255,0.25)] hover:border-[rgba(0,212,255,0.5)] hover:bg-[rgba(0,212,255,0.04)]'
                    }
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label="Zona de carga de archivo"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                  }}
                >
                  <FileText className="w-10 h-10 text-[var(--muted)]" />
                  <p className="font-['DM_Sans'] text-[var(--off-white)] text-sm text-center">
                    Arrastra tu archivo aquí o{' '}
                    <span className="text-[var(--signal)] underline underline-offset-2">
                      haz clic para seleccionar
                    </span>
                  </p>
                  <p className="font-['DM_Sans'] text-[var(--muted)] text-xs">
                    PDF, DOCX o XLSX — máx. 20 MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx"
                className="hidden"
                onChange={handleFileInputChange}
                aria-hidden="true"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel expandible: Crear con IA ── */}
      <AnimatePresence>
        {selectedPath === 'ai' && (
          <motion.div
            key="ai-panel"
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full max-w-3xl overflow-hidden"
          >
            <div className="bg-[rgba(22,34,56,0.75)] border border-[rgba(0,212,255,0.15)] rounded-xl p-6 flex flex-col gap-5">
              {/* Textarea de descripción */}
              <div>
                <label
                  htmlFor="ai-description"
                  className="block font-['DM_Sans'] text-sm text-[var(--muted)] mb-2"
                >
                  Describe el formulario que necesitas
                </label>
                <textarea
                  id="ai-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ej: Permiso de trabajo en alturas para contratistas externos, con verificación de EPP por sección, geolocalización de la obra y firmas del trabajador y supervisor"
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(0,212,255,0.15)] rounded-lg px-4 py-3 font-['DM_Sans'] text-sm text-[var(--off-white)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[rgba(0,212,255,0.5)] resize-none transition-colors"
                />
              </div>

              {/* Opciones: columnas y observaciones */}
              <div className="flex flex-wrap gap-6 items-center">
                {/* Selector de columnas */}
                <div>
                  <p className="font-['DM_Sans'] text-xs text-[var(--muted)] mb-2">
                    Columnas por sección
                  </p>
                  <div className="flex gap-2">
                    {COLUMN_OPTIONS.map(({ value, icon: ColIcon, label }) => (
                      <button
                        key={value}
                        onClick={() => setAiColumns(value)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-['DM_Sans'] transition-all duration-150 cursor-pointer
                          ${
                            aiColumns === value
                              ? 'border-[var(--signal)] text-[var(--signal)] bg-[rgba(0,212,255,0.1)]'
                              : 'border-[rgba(0,212,255,0.15)] text-[var(--muted)] hover:border-[rgba(0,212,255,0.35)]'
                          }
                        `}
                      >
                        <ColIcon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle observaciones */}
                <div className="flex items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={observationsPerSection}
                    onClick={() => setObservationsPerSection((v) => !v)}
                    className={`
                      relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)]
                      ${observationsPerSection ? 'bg-[var(--signal)]' : 'bg-[rgba(255,255,255,0.12)]'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                        ${observationsPerSection ? 'translate-x-4' : 'translate-x-0'}
                      `}
                    />
                  </button>
                  <span className="font-['DM_Sans'] text-sm text-[var(--muted)]">
                    Observaciones por sección
                  </span>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  disabled={!description.trim() || isLoading}
                  onClick={handleGenerateWithAI}
                >
                  {!isLoading && <Sparkles className="w-4 h-4" />}
                  {isLoading ? 'SEÑAL IA está diseñando tu formulario...' : 'Generar formulario'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de biblioteca de blueprints */}
      <BlueprintLibraryModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />
    </div>
  )
}
