import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Bell, Save, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { QK } from '@/lib/queryKeys'
import api from '@/lib/api'
import { EditorSection } from '@/types'
import { EditorCanvas } from '@/components/form-editor/EditorCanvas'
import { AIAssistPanel } from '@/components/form-editor/AIAssistPanel'
import { NotificationsDrawer } from '@/components/form-editor/NotificationsDrawer'
import { SaveFormDrawer } from '@/components/form-editor/SaveFormDrawer'

export default function FormEditorPage() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()

  const { state, setInitialState, setName, setColumns } = useFormEditorStore()

  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  // Cargar template existente si hay :id en la URL
  const { data: existingTemplate } = useQuery({
    queryKey: QK.templates.detail(templateId!),
    queryFn: () => api.get(`/form-templates/${templateId}`).then((r) => r.data),
    enabled: !!templateId,
  })

  // Inicializar store según origen
  useEffect(() => {
    const locationState = location.state as Partial<{
      sections: EditorSection[]
      name: string
      sourceFileUrl: string
      blueprintId: string
    }> | null

    if (locationState?.sections) {
      // Camino 1, 2 o 3 — viene con datos del flujo de creación
      setInitialState({
        sections: locationState.sections,
        name: locationState.name ?? '',
        sourceFileUrl: locationState.sourceFileUrl,
        blueprintId: locationState.blueprintId,
      })
    } else if (existingTemplate) {
      // Edición de template existente
      const tpl = existingTemplate as any
      let sections: EditorSection[]

      if (tpl.sections && Array.isArray(tpl.sections) && tpl.sections.length > 0) {
        // Template con secciones (nuevo flujo)
        sections = (tpl.sections as any[]).map((sec: any) => ({
          id: sec.id ?? crypto.randomUUID(),
          name: sec.name,
          hasObservations: sec.hasObservations ?? false,
          fields: (tpl.fields ?? [])
            .filter((f: any) => f.section === sec.name)
            .map((f: any) => ({
              id: f.id,
              label: f.label,
              key: f.key,
              type: f.type,
              required: f.required,
              options: Array.isArray(f.options) ? f.options : undefined,
              placeholder: f.placeholder ?? undefined,
              helpText: f.help_text ?? undefined,
            })),
        }))
      } else {
        // Template sin secciones (flujo anterior) — agrupar en "General"
        sections = [
          {
            id: crypto.randomUUID(),
            name: 'General',
            hasObservations: false,
            fields: (tpl.fields ?? []).map((f: any) => ({
              id: f.id,
              label: f.label,
              key: f.key,
              type: f.type,
              required: f.required,
              options: Array.isArray(f.options) ? f.options : undefined,
              placeholder: f.placeholder ?? undefined,
              helpText: f.help_text ?? undefined,
            })),
          },
        ]
      }

      setInitialState({
        templateId: tpl.id,
        name: tpl.name,
        categoryId: tpl.category_id,
        columns: tpl.columns ?? 1,
        sections,
        status: tpl.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
      })
    }
  }, [existingTemplate, location.state])

  function handleBack() {
    if (state.isDirty) {
      const ok = window.confirm('¿Salir sin guardar? Los cambios se perderán.')
      if (!ok) return
    }
    navigate('/admin/formularios')
  }

  const totalFields = state.sections.reduce((n, s) => n + s.fields.length, 0)

  return (
    <div className="flex flex-col h-screen bg-[var(--navy)] overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(0,212,255,0.1)] bg-[var(--navy-mid)] shrink-0">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(255,255,255,0.05)] transition-all"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Nombre editable */}
        <input
          value={state.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del formulario"
          className="flex-1 bg-transparent border-none outline-none text-base font-semibold text-[var(--off-white)] font-['Syne'] placeholder:text-[var(--muted)] min-w-0"
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Contador de campos */}
          <span className="hidden sm:block text-xs text-[var(--muted)] px-2">
            {totalFields} campo{totalFields !== 1 ? 's' : ''}
          </span>

          {/* Notificaciones */}
          <button
            onClick={() => setNotifOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(0,212,255,0.1)] transition-all"
          >
            <Bell size={14} />
            <span className="hidden sm:block">Notificaciones</span>
          </button>

          {/* Guardar */}
          <button
            onClick={() => setSaveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--signal)] text-[var(--navy)] hover:bg-[var(--signal)]/90 transition-all"
          >
            <Save size={14} />
            Guardar
          </button>
        </div>
      </header>

      {/* ── Cuerpo: canvas + panel IA ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <EditorCanvas />
          </div>
        </main>

        {/* Panel SEÑALIA */}
        {aiPanelOpen && (
          <AIAssistPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-4 py-2.5 border-t border-[rgba(0,212,255,0.1)] bg-[var(--navy-mid)] shrink-0">
        {/* Selector de columnas */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--muted)] mr-2 uppercase tracking-wider">
            Columnas
          </span>
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              onClick={() => setColumns(n)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                state.columns === n
                  ? 'bg-[rgba(0,212,255,0.15)] text-[var(--signal)] border border-[var(--signal)]'
                  : 'text-[var(--muted)] hover:text-[var(--off-white)] border border-transparent hover:border-[rgba(0,212,255,0.2)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Centro: SEÑALIA toggle */}
        <button
          onClick={() => setAiPanelOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            aiPanelOpen
              ? 'bg-[rgba(0,212,255,0.12)] text-[var(--signal)] border border-[var(--signal)]'
              : 'text-[var(--muted)] hover:text-[var(--signal)] border border-transparent hover:border-[rgba(0,212,255,0.2)]'
          }`}
        >
          <Sparkles size={13} />
          SEÑALIA
        </button>

        {/* Estado del formulario */}
        <div
          className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
            state.status === 'ACTIVE'
              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
              : 'text-amber-400 border-amber-400/30 bg-amber-400/10'
          }`}
        >
          {state.status === 'ACTIVE' ? 'Activo' : 'Borrador'}
        </div>
      </footer>

      {/* ── Drawers / Modals ───────────────────────────────────── */}
      <NotificationsDrawer
        templateId={templateId}
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
      <SaveFormDrawer
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        templateId={templateId}
      />
    </div>
  )
}
