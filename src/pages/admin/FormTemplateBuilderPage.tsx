import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Bell,
  Layers,
  Settings,
  X,
} from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  Modal,
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import {
  FormTemplate,
  FormField,
  FormCategory,
  FormNotification,
  FieldType,
  NotificationTrigger,
} from '@/types'
import { slugify, formatDate } from '@/lib/utils'

// ── Constantes ──────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: 'NONE',      label: 'Sin límite' },
  { value: 'DAILY',     label: 'Una vez al día' },
  { value: 'WEEKLY',    label: 'Una vez a la semana' },
  { value: 'MONTHLY',   label: 'Una vez al mes' },
  { value: 'ONCE',      label: 'Solo una vez' },
  { value: 'PER_EVENT', label: 'Por evento' },
]

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'TEXT',        label: 'Texto libre' },
  { value: 'NUMBER',      label: 'Número' },
  { value: 'DATE',        label: 'Fecha' },
  { value: 'DATETIME',    label: 'Fecha y hora' },
  { value: 'SELECT',      label: 'Selección única' },
  { value: 'MULTISELECT', label: 'Selección múltiple' },
  { value: 'BOOLEAN',     label: 'Sí / No' },
  { value: 'SIGNATURE',   label: 'Firma' },
  { value: 'PHOTO',       label: 'Foto' },
  { value: 'GEOLOCATION', label: 'Ubicación GPS' },
  { value: 'FILE',        label: 'Archivo' },
]

const TRIGGER_OPTIONS: { value: NotificationTrigger; label: string }[] = [
  { value: 'ON_SUBMIT',  label: 'Al enviar' },
  { value: 'ON_APPROVE', label: 'Al aprobar' },
  { value: 'ON_REJECT',  label: 'Al rechazar' },
  { value: 'SCHEDULED',  label: 'Programado' },
]

const STEPS = [
  { id: 1, label: 'Configuración', icon: Settings },
  { id: 2, label: 'Campos',        icon: Layers },
  { id: 3, label: 'Notificaciones', icon: Bell },
]

// ── Clases reutilizables ────────────────────────────────────────────────────

const INPUT_CLASS =
  'bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all w-full'

const LABEL_CLASS = 'text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-1.5 font-dm block'

// ── Tipos locales ──────────────────────────────────────────────────────────

interface FieldDraft {
  id?: string
  label: string
  key: string
  type: FieldType
  required: boolean
  options: Array<{ label: string; value: string }>
}

interface NotificationDraft {
  trigger: NotificationTrigger
  subject: string
  body: string
  channels: string[]
  recipients: Array<{ type: 'role' | 'email' | 'department'; value: string }>
}

// ── Componente campo sortable ──────────────────────────────────────────────

interface SortableFieldProps {
  field: FormField
  onEdit: (field: FormField) => void
  onDelete: (fieldId: string) => void
}

function SortableField({ field, onEdit, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  // Excepción documentada: @dnd-kit requiere style inline para el transform
  const style = { transform: CSS.Transform.toString(transform), transition }

  const typeLabel =
    FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)?.label ?? field.type

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isDragging
          ? 'bg-[var(--navy-mid)] border-[var(--signal)] opacity-80 z-50'
          : 'bg-[var(--navy)] border-white/5 hover:border-white/10'
      }`}
    >
      {/* Grip handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-[var(--muted)] hover:text-[var(--off-white)] cursor-grab active:cursor-grabbing p-1 shrink-0"
        aria-label="Reordenar campo"
        tabIndex={0}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans'] truncate">
          {field.label}
        </p>
        <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
          <code className="font-mono">{field.key}</code>
        </p>
      </div>

      {/* Tipo */}
      <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-[var(--signal-dim)] text-[var(--signal)] font-['DM_Sans'] shrink-0">
        {typeLabel}
      </span>

      {/* Requerido */}
      <span
        className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full shrink-0 ${
          field.required
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-white/5 text-[var(--muted)]'
        }`}
      >
        {field.required ? 'Requerido' : 'Opcional'}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(field)}
          className="p-1.5 text-[var(--muted)] hover:text-[var(--signal)] hover:bg-[var(--signal-dim)] rounded-md transition-colors"
          aria-label={`Editar campo ${field.label}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(field.id)}
          className="p-1.5 text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          aria-label={`Eliminar campo ${field.label}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Modal de campo ──────────────────────────────────────────────────────────

interface FieldModalProps {
  open: boolean
  onClose: () => void
  onSave: (draft: FieldDraft) => void
  initial?: FieldDraft | null
  loading?: boolean
}

const EMPTY_FIELD: FieldDraft = {
  label:    '',
  key:      '',
  type:     'TEXT',
  required: false,
  options:  [],
}

function FieldModal({ open, onClose, onSave, initial, loading }: FieldModalProps) {
  const [draft, setDraft] = useState<FieldDraft>(initial ?? EMPTY_FIELD)
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false)

  // Resetear cuando cambia initial
  useEffect(() => {
    setDraft(initial ?? EMPTY_FIELD)
    setKeyManuallyEdited(!!initial?.id)
  }, [initial, open])

  function handleLabelChange(label: string) {
    setDraft((prev) => ({
      ...prev,
      label,
      key: keyManuallyEdited ? prev.key : slugify(label),
    }))
  }

  function handleKeyChange(key: string) {
    setKeyManuallyEdited(true)
    setDraft((prev) => ({ ...prev, key: slugify(key) }))
  }

  function addOption() {
    setDraft((prev) => ({
      ...prev,
      options: [...prev.options, { label: '', value: '' }],
    }))
  }

  function updateOption(index: number, field: 'label' | 'value', value: string) {
    setDraft((prev) => {
      const opts = [...prev.options]
      opts[index] = { ...opts[index], [field]: value }
      // Auto-generar value desde label si aún no se editó
      if (field === 'label') {
        opts[index].value = slugify(value)
      }
      return { ...prev, options: opts }
    })
  }

  function removeOption(index: number) {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const hasOptions = draft.type === 'SELECT' || draft.type === 'MULTISELECT'
  const canSave    = draft.label.trim() !== '' && draft.key.trim() !== ''

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={initial?.id ? 'Editar campo' : 'Agregar campo'}
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Label */}
        <div>
          <label className={LABEL_CLASS}>
            Etiqueta <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={draft.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Ej: Nombre completo"
            className={INPUT_CLASS}
            autoFocus
          />
        </div>

        {/* Key */}
        <div>
          <label className={LABEL_CLASS}>
            Clave (key) <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={draft.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="nombre_completo"
            className={`${INPUT_CLASS} font-mono`}
          />
          <p className="text-xs text-[var(--muted)] mt-1 font-['DM_Sans']">
            Identificador único del campo. Se auto-genera desde la etiqueta.
          </p>
        </div>

        {/* Tipo */}
        <div>
          <label className={LABEL_CLASS}>
            Tipo de campo <span className="text-red-400">*</span>
          </label>
          <select
            value={draft.type}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                type:    e.target.value as FieldType,
                options: [],
              }))
            }
            className={INPUT_CLASS}
          >
            {FIELD_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Requerido */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() =>
              setDraft((prev) => ({ ...prev, required: !prev.required }))
            }
            role="checkbox"
            aria-checked={draft.required}
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === ' ' &&
              setDraft((prev) => ({ ...prev, required: !prev.required }))
            }
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[var(--signal)] ${
              draft.required ? 'bg-[var(--signal)]' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                draft.required ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
            Campo requerido
          </span>
        </label>

        {/* Opciones para SELECT / MULTISELECT */}
        {hasOptions && (
          <div>
            <label className={LABEL_CLASS}>Opciones</label>
            <div className="flex flex-col gap-2">
              {draft.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => updateOption(i, 'label', e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    className="bg-[var(--navy)] border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--off-white)] font-['DM_Sans'] outline-none focus:border-[var(--signal)] transition-colors flex-1"
                  />
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) => updateOption(i, 'value', e.target.value)}
                    placeholder="valor"
                    className="bg-[var(--navy)] border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--muted)] font-mono outline-none focus:border-[var(--signal)] transition-colors w-28"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    className="p-1.5 text-[var(--muted)] hover:text-red-400 transition-colors shrink-0"
                    aria-label={`Eliminar opción ${i + 1}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addOption}>
                <Plus className="w-3 h-3" />
                Agregar opción
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(draft)}
            disabled={!canSave}
            loading={loading}
          >
            {initial?.id ? 'Guardar cambios' : 'Agregar campo'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Paso 1: Configuración ──────────────────────────────────────────────────

interface Step1Props {
  templateId?: string
  onSaved: (id: string) => void
}

function Step1Config({ templateId, onSaved }: Step1Props) {
  const toast = useToast()
  const qc    = useQueryClient()

  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: QK.templates.detail(templateId ?? ''),
    queryFn: () =>
      api
        .get<FormTemplate>(`/form-templates/${templateId}`)
        .then((r) => r.data),
    enabled: !!templateId,
  })

  const { data: categories = [] } = useQuery({
    queryKey: QK.categories(),
    queryFn: () =>
      api.get<FormCategory[]>('/form-categories').then((r) => r.data),
  })

  const [form, setForm] = useState({
    name:                '',
    description:         '',
    category_id:         '',
    data_frequency:      'NONE',
    signature_frequency: 'NONE',
    export_pdf:          false,
    export_excel:        false,
    target_job_titles:   [] as string[],
  })
  const [jobTitleInput, setJobTitleInput] = useState('')

  // Poblar formulario cuando carga el template existente
  useEffect(() => {
    if (!template) return
    setForm({
      name:                template.name,
      description:         template.description ?? '',
      category_id:         template.category_id,
      data_frequency:      template.data_frequency,
      signature_frequency: template.signature_frequency,
      export_pdf:          template.export_pdf,
      export_excel:        template.export_excel,
      target_job_titles:   template.target_job_titles ?? [],
    })
  }, [template])

  const saveTemplate = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        description: form.description || null,
      }
      if (templateId) {
        return api
          .patch<FormTemplate>(`/form-templates/${templateId}`, body)
          .then((r) => r.data)
      }
      return api
        .post<FormTemplate>('/form-templates', body)
        .then((r) => r.data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QK.templates.admin() })
      toast.success(templateId ? 'Template actualizado' : 'Template creado')
      onSaved(data.id)
    },
    onError: () =>
      toast.error('Error al guardar el template'),
  })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addJobTitle() {
    const t = jobTitleInput.trim()
    if (!t || form.target_job_titles.includes(t)) return
    set('target_job_titles', [...form.target_job_titles, t])
    setJobTitleInput('')
  }

  function removeJobTitle(title: string) {
    set(
      'target_job_titles',
      form.target_job_titles.filter((j) => j !== title),
    )
  }

  if (loadingTemplate) return <LoadingSpinner label="Cargando template..." />

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Nombre */}
      <div>
        <label className={LABEL_CLASS}>
          Nombre del formulario <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ej: Permiso de trabajo en altura"
          className={INPUT_CLASS}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className={LABEL_CLASS}>Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Descripción breve del formulario…"
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      {/* Categoría */}
      <div>
        <label className={LABEL_CLASS}>Categoría</label>
        <select
          value={form.category_id}
          onChange={(e) => set('category_id', e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Frecuencias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Frecuencia de datos</label>
          <select
            value={form.data_frequency}
            onChange={(e) => set('data_frequency', e.target.value)}
            className={INPUT_CLASS}
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Frecuencia de firma</label>
          <select
            value={form.signature_frequency}
            onChange={(e) => set('signature_frequency', e.target.value)}
            className={INPUT_CLASS}
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exportaciones */}
      <div className="flex flex-col gap-3">
        <p className={LABEL_CLASS}>Opciones de exportación</p>
        <Toggle
          label="Exportar PDF"
          checked={form.export_pdf}
          onChange={(v) => set('export_pdf', v)}
        />
        <Toggle
          label="Exportar Excel"
          checked={form.export_excel}
          onChange={(v) => set('export_excel', v)}
        />
      </div>

      {/* Cargos habilitados */}
      <div>
        <label className={LABEL_CLASS}>
          Cargos habilitados{' '}
          <span className="text-[var(--muted)]">(vacío = todos)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={jobTitleInput}
            onChange={(e) => setJobTitleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addJobTitle()}
            placeholder="Ej: Supervisor"
            className="bg-[var(--navy)] border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--off-white)] font-['DM_Sans'] outline-none focus:border-[var(--signal)] transition-colors flex-1"
          />
          <Button variant="secondary" size="sm" onClick={addJobTitle}>
            <Plus className="w-3 h-3" />
            Agregar
          </Button>
        </div>
        {form.target_job_titles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.target_job_titles.map((title) => (
              <span
                key={title}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--signal-dim)] border border-[var(--signal)]/20 text-xs text-[var(--signal)] font-['DM_Sans']"
              >
                {title}
                <button
                  onClick={() => removeJobTitle(title)}
                  className="hover:text-white transition-colors"
                  aria-label={`Quitar cargo ${title}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Acción */}
      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          onClick={() => saveTemplate.mutate()}
          loading={saveTemplate.isPending}
          disabled={!form.name.trim()}
        >
          {templateId ? 'Guardar cambios' : 'Crear y continuar'}
          {!templateId && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}

// ── Paso 2: Campos ──────────────────────────────────────────────────────────

interface Step2Props {
  templateId: string
}

function Step2Fields({ templateId }: Step2Props) {
  const toast = useToast()
  const qc    = useQueryClient()

  const [fields, setFields] = useState<FormField[]>([])
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingField, setEditingField] = useState<FieldDraft | null>(null)

  const { data: remoteFields = [], isLoading } = useQuery({
    queryKey: QK.templates.fields(templateId),
    queryFn: () =>
      api
        .get<FormField[]>(`/form-templates/${templateId}/fields`)
        .then((r) => r.data),
  })

  // Sincronizar estado local con datos remotos
  useEffect(() => {
    setFields(remoteFields)
  }, [remoteFields])

  const addField = useMutation({
    mutationFn: (draft: FieldDraft) =>
      api
        .post<FormField>(`/form-templates/${templateId}/fields`, {
          label:    draft.label,
          key:      draft.key,
          type:     draft.type,
          required: draft.required,
          options:  draft.options.length > 0 ? draft.options : null,
          order:    fields.length,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.templates.fields(templateId) })
      toast.success('Campo agregado')
      setModalOpen(false)
      setEditingField(null)
    },
    onError: () => toast.error('Error al agregar el campo'),
  })

  const updateField = useMutation({
    mutationFn: (draft: FieldDraft) =>
      api
        .patch(`/form-templates/${templateId}/fields/${draft.id}`, {
          label:    draft.label,
          key:      draft.key,
          type:     draft.type,
          required: draft.required,
          options:  draft.options.length > 0 ? draft.options : null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.templates.fields(templateId) })
      toast.success('Campo actualizado')
      setModalOpen(false)
      setEditingField(null)
    },
    onError: () => toast.error('Error al actualizar el campo'),
  })

  const deleteField = useMutation({
    mutationFn: (fieldId: string) =>
      api.delete(`/form-templates/${templateId}/fields/${fieldId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.templates.fields(templateId) })
      toast.success('Campo eliminado')
    },
    onError: () => toast.error('Error al eliminar el campo'),
  })

  const reorderFields = useMutation({
    mutationFn: (ordered: Array<{ id: string; order: number }>) =>
      api.post(`/form-templates/${templateId}/fields/reorder`, {
        order: ordered,
      }),
    onError: () => {
      // Revertir al estado remoto si falla
      setFields(remoteFields)
      toast.error('Error al reordenar los campos')
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id)
      const newIndex = prev.findIndex((f) => f.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)

      reorderFields.mutate(
        reordered.map((f, i) => ({ id: f.id, order: i })),
      )

      return reordered
    })
  }

  function openAddModal() {
    setEditingField(null)
    setModalOpen(true)
  }

  function openEditModal(field: FormField) {
    setEditingField({
      id:       field.id,
      label:    field.label,
      key:      field.key,
      type:     field.type,
      required: field.required,
      options:  field.options ?? [],
    })
    setModalOpen(true)
  }

  function handleSave(draft: FieldDraft) {
    if (draft.id) {
      updateField.mutate(draft)
    } else {
      addField.mutate(draft)
    }
  }

  if (isLoading) return <LoadingSpinner label="Cargando campos..." />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          {fields.length} campo{fields.length !== 1 ? 's' : ''}. Arrastra para reordenar.
        </p>
        <Button variant="primary" size="sm" onClick={openAddModal}>
          <Plus className="w-4 h-4" />
          Agregar campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-[var(--muted)] text-sm font-['DM_Sans'] mb-4">
            Este formulario no tiene campos todavía.
          </p>
          <Button variant="secondary" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            Agregar primer campo
          </Button>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={openEditModal}
                  onDelete={(id) => deleteField.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FieldModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingField(null)
        }}
        onSave={handleSave}
        initial={editingField}
        loading={addField.isPending || updateField.isPending}
      />
    </div>
  )
}

// ── Paso 3: Notificaciones ─────────────────────────────────────────────────

interface Step3Props {
  templateId: string
}

const EMPTY_NOTIFICATION: NotificationDraft = {
  trigger:    'ON_SUBMIT',
  subject:    '',
  body:       '',
  channels:   ['EMAIL'],
  recipients: [],
}

function Step3Notifications({ templateId }: Step3Props) {
  const toast = useToast()
  const qc    = useQueryClient()
  const [recipientInput, setRecipientInput] = useState('')
  const [draft, setDraft] = useState<NotificationDraft>(EMPTY_NOTIFICATION)

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: QK.notifications(templateId),
    queryFn: () =>
      api
        .get<FormNotification[]>(`/form-notifications/template/${templateId}`)
        .then((r) => r.data),
  })

  const createNotification = useMutation({
    mutationFn: () =>
      api
        .post('/form-notifications', { ...draft, template_id: templateId })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.notifications(templateId) })
      toast.success('Notificación creada')
      setDraft(EMPTY_NOTIFICATION)
      setRecipientInput('')
    },
    onError: () => toast.error('Error al crear la notificación'),
  })

  const deleteNotification = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/form-notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.notifications(templateId) })
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

  if (isLoading) return <LoadingSpinner label="Cargando notificaciones..." />

  const triggerLabel = Object.fromEntries(
    TRIGGER_OPTIONS.map((o) => [o.value, o.label]),
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Lista de notificaciones existentes */}
      {notifications.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={LABEL_CLASS}>Notificaciones activas</p>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[var(--navy)] border border-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']">
                  {triggerLabel[n.trigger] ?? n.trigger}
                </p>
                {n.subject && (
                  <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5 truncate">
                    {n.subject}
                  </p>
                )}
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
                  {n.recipients.length} destinatario
                  {n.recipients.length !== 1 ? 's' : ''} ·{' '}
                  {n.channels.join(', ')}
                </p>
              </div>
              <button
                onClick={() => deleteNotification.mutate(n.id)}
                className="p-1.5 text-[var(--muted)] hover:text-red-400 transition-colors shrink-0"
                aria-label="Eliminar notificación"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nueva notificación */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[var(--off-white)] font-['Syne']">
          Nueva notificación
        </h3>

        {/* Trigger */}
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

        {/* Asunto */}
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

        {/* Cuerpo */}
        <div>
          <label className={LABEL_CLASS}>Mensaje</label>
          <textarea
            value={draft.body}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, body: e.target.value }))
            }
            placeholder="Contenido del mensaje…"
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>

        {/* Destinatarios */}
        <div>
          <label className={LABEL_CLASS}>Destinatarios</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="correo@ejemplo.com"
              className="bg-[var(--navy)] border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--off-white)] font-['DM_Sans'] outline-none focus:border-[var(--signal)] transition-colors flex-1"
            />
            <Button variant="secondary" size="sm" onClick={addRecipient}>
              <Plus className="w-3 h-3" />
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
                    <X className="w-3 h-3" />
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
          >
            <Plus className="w-4 h-4" />
            Crear notificación
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Toggle helper ──────────────────────────────────────────────────────────

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => e.key === ' ' && onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[var(--signal)] ${
          checked ? 'bg-[var(--signal)]' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
        {label}
      </span>
    </label>
  )
}

// ── Página principal ────────────────────────────────────────────────────────

export default function FormTemplateBuilderPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  // Si hay id en la URL es edición; de lo contrario creación
  const [templateId, setTemplateId] = useState<string | undefined>(id)
  const [activeStep, setActiveStep] = useState(1)

  function handleStep1Saved(savedId: string) {
    setTemplateId(savedId)
    // En creación nueva, avanzar al paso 2 automáticamente
    if (!id) setActiveStep(2)
  }

  const isEditing = !!id

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
          {isEditing ? 'Editar formulario' : 'Nuevo formulario'}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
          {isEditing
            ? 'Modifica la configuración, campos y notificaciones.'
            : 'Configura el template en tres pasos.'}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const Icon       = step.icon
          const isActive   = activeStep === step.id
          const isComplete = activeStep > step.id || (isEditing && templateId)
          const isDisabled = !templateId && step.id > 1

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => !isDisabled && setActiveStep(step.id)}
                disabled={!!isDisabled}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-['DM_Sans'] transition-colors ${
                  isActive
                    ? 'bg-[var(--signal-dim)] text-[var(--signal)] border border-[var(--signal)]/30'
                    : isDisabled
                      ? 'text-[var(--muted)] opacity-40 cursor-not-allowed'
                      : 'text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{step.label}</span>
                {isComplete && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-white/20 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Contenido del paso activo */}
      <div className="glass-card p-6 min-w-0">
        {activeStep === 1 && (
          <Step1Config
            templateId={templateId}
            onSaved={handleStep1Saved}
          />
        )}

        {activeStep === 2 && templateId && (
          <Step2Fields templateId={templateId} />
        )}

        {activeStep === 3 && templateId && (
          <Step3Notifications templateId={templateId} />
        )}
      </div>

      {/* Navegación inferior */}
      {templateId && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/formularios')}
          >
            Volver a la lista
          </Button>

          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <Button
                variant="secondary"
                onClick={() => setActiveStep((s) => s - 1)}
              >
                Anterior
              </Button>
            )}
            {activeStep < STEPS.length && (
              <Button
                variant="primary"
                onClick={() => setActiveStep((s) => s + 1)}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {activeStep === STEPS.length && (
              <Button
                variant="primary"
                onClick={() => navigate('/admin/formularios')}
              >
                Finalizar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
